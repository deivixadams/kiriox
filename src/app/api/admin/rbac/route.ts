import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

function isAdmin(roleCode: string) {
    const code = (roleCode || '').trim().toLowerCase();
    return code === 'admin' || code === 'super_admin';
}

// ────────────────────────────────────────────────────────────
// GET  /api/admin/rbac                → list roles
// GET  /api/admin/rbac?id=UUID        → single role + assigned users
// ────────────────────────────────────────────────────────────
export async function GET(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get('id');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    try {
        if (roleId) {
            const role = await prisma.security_rbac.findUnique({
                where: { id: roleId },
                include: {
                    company_user_roles: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    last_name: true,
                                    email: true
                                }
                            }
                        },
                        orderBy: {
                            user: { name: 'asc' }
                        }
                    }
                }
            });

            if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            // Map to the expected UI format
            const users = role.company_user_roles.map(cur => ({
                assignment_id: cur.id,
                user_id: cur.user_id,
                company_id: cur.company_id,
                is_active: cur.is_active,
                name: cur.user.name,
                last_name: cur.user.last_name,
                email: cur.user.email
            }));

            return NextResponse.json({
                ...role,
                users
            });
        }

        // List roles
        const where: any = {};
        if (!includeInactive) {
            where.is_active = true;
        }

        const roles = await prisma.security_rbac.findMany({
            where,
            include: {
                _count: {
                    select: { company_user_roles: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        // Map to include user counts for the dashboard
        const result = roles.map(r => ({
            ...r,
            userCount: r._count.company_user_roles
        }));

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error fetching roles:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
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

        const newRole = await prisma.security_rbac.create({
            data: {
                code: code.trim().toLowerCase().replace(/\s+/g, '_'),
                name: name.trim(),
                description: description?.trim() || null,
                is_active: isActive !== false
            }
        });

        return NextResponse.json({ id: newRole.id }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating role:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Ya existe un rol con ese código' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Error al crear rol', details: error.message }, { status: 500 });
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
        if (!id) return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 });

        const data: any = { updated_at: new Date() };
        if (code !== undefined) data.code = code.trim().toLowerCase().replace(/\s+/g, '_');
        if (name !== undefined) data.name = name.trim();
        if (description !== undefined) data.description = description?.trim() || null;
        if (isActive !== undefined) data.is_active = isActive;

        await prisma.security_rbac.update({
            where: { id },
            data
        });

        return NextResponse.json({ ok: true });

    } catch (error: any) {
        console.error('Error updating role:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
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
    const roleId = searchParams.get('id');
    const assignmentId = searchParams.get('assignment_id');

    try {
        if (assignmentId) {
            await prisma.security_company_user_role.delete({
                where: { id: assignmentId }
            });
            return NextResponse.json({ ok: true });
        }
        
        if (roleId) {
            // Soft delete: Strictly update is_active to false instead of deleting the record
            await prisma.security_rbac.update({
                where: { id: roleId },
                data: { 
                    is_active: false,
                    updated_at: new Date() 
                }
            });
            return NextResponse.json({ ok: true, message: 'Rol inactivado correctamente (Soft Delete)' });
        }
        
        return NextResponse.json({ error: 'Falta id o assignment_id' }, { status: 400 });

    } catch (error: any) {
        console.error('Error deleting:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
