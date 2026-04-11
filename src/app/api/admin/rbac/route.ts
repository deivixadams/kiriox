import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

function isAdmin(roleCode: string) { return roleCode === 'ADMIN'; }

// ────────────────────────────────────────────────────────────
// GET  /api/admin/rbac                → list all active roles
// GET  /api/admin/rbac?code=XXX       → role + permissions (UserWizard compat)
// GET  /api/admin/rbac?id=UUID        → single role + assigned users
// ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const roleCode = searchParams.get('role_code');
    const roleId   = searchParams.get('id');

    try {
        // ── Single role with assigned users ──
        if (roleId) {
            const roles = await prisma.$queryRaw<{
                id: string; code: string; name: string;
                description: string | null; is_active: boolean | null;
                created_at: Date; updated_at: Date | null;
            }[]>(
                Prisma.sql`
                    SELECT id, code, name, description, is_active, created_at, updated_at
                    FROM security.role
                    WHERE id = ${roleId}::uuid
                    LIMIT 1
                `
            );
            const role = roles[0];
            if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const users = await prisma.$queryRaw<{
                assignment_id: string; user_id: string; company_id: string;
                name: string | null; last_name: string | null; email: string;
                is_active: boolean;
            }[]>(
                Prisma.sql`
                    SELECT cur.id           AS assignment_id,
                           cur.user_id,
                           cur.company_id,
                           cur.is_active,
                           u.name,
                           u.last_name,
                           u.email
                    FROM security.company_user_role cur
                    JOIN security.security_users u ON u.id = cur.user_id
                    WHERE cur.role_id = ${roleId}::uuid
                    ORDER BY u.name ASC
                `
            );

            return NextResponse.json({ ...role, users });
        }

        // ── Compat: role by code (UserWizard permissions query) ──
        if (roleCode) {
            const rows = await prisma.$queryRaw<{ id: string; code: string; name: string }[]>(
                Prisma.sql`SELECT id, code, name FROM security.role WHERE code = ${roleCode} LIMIT 1`
            );
            return NextResponse.json({
                roleCode,
                permissions: rows[0] ? [rows[0].name || roleCode] : []
            });
        }

        // ── All active roles ──
        const roles = await prisma.$queryRaw<{
            id: string; code: string; name: string;
            description: string | null; is_active: boolean | null;
            created_at: Date; updated_at: Date | null;
        }[]>(
            Prisma.sql`
                SELECT id, code, name, description, is_active, created_at, updated_at
                FROM security.role
                WHERE COALESCE(is_active, true) = true
                ORDER BY name ASC
            `
        );
        return NextResponse.json(roles);

    } catch (error: any) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ────────────────────────────────────────────────────────────
// POST /api/admin/rbac  → create role
// ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { code, name, description, isActive } = await request.json();
        if (!code?.trim() || !name?.trim()) {
            return NextResponse.json({ error: 'code y name son obligatorios' }, { status: 400 });
        }

        const rows = await prisma.$queryRaw<{ id: string }[]>(
            Prisma.sql`
                INSERT INTO security.role (id, code, name, description, is_active)
                VALUES (gen_random_uuid(), ${code.trim()}, ${name.trim()}, 
                        ${description?.trim() || null}, ${isActive !== false})
                RETURNING id
            `
        );

        if (!rows || rows.length === 0) {
            throw new Error('No se pudo obtener el ID del rol creado');
        }

        return NextResponse.json({ id: rows[0].id }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating role:', error);
        const errorMsg = error?.message || 'Error desconocido';
        
        if (errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
            return NextResponse.json({ error: 'Ya existe un rol con ese código' }, { status: 409 });
        }
        return NextResponse.json({ error: `Error al crear rol: ${errorMsg}` }, { status: 500 });
    }
}

// ────────────────────────────────────────────────────────────
// PUT /api/admin/rbac  → update role
// ────────────────────────────────────────────────────────────
export async function PUT(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { id, code, name, description, isActive } = await request.json();
        if (!id || !code?.trim() || !name?.trim()) {
            return NextResponse.json({ error: 'id, code y name son obligatorios' }, { status: 400 });
        }

        await prisma.$executeRaw(
            Prisma.sql`
                UPDATE security.role
                SET code        = ${code.trim()},
                    name        = ${name.trim()},
                    description = ${description?.trim() || null},
                    is_active   = ${isActive !== false},
                    updated_at  = now()
                WHERE id = ${id}::uuid
            `
        );
        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error('Error updating role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ────────────────────────────────────────────────────────────
// DELETE /api/admin/rbac?id=UUID             → delete role
// DELETE /api/admin/rbac?assignment_id=UUID  → remove user assignment
// ────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const roleId       = searchParams.get('id');
    const assignmentId = searchParams.get('assignment_id');

    try {
        if (assignmentId) {
            await prisma.$executeRaw(
                Prisma.sql`DELETE FROM security.company_user_role WHERE id = ${assignmentId}::uuid`
            );
            return NextResponse.json({ ok: true });
        }
        if (roleId) {
            await prisma.$executeRaw(
                Prisma.sql`DELETE FROM security.role WHERE id = ${roleId}::uuid`
            );
            return NextResponse.json({ ok: true });
        }
        return NextResponse.json({ error: 'Falta id o assignment_id' }, { status: 400 });

    } catch (error: any) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
