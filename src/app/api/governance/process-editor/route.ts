
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    const items = companyId
      ? await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT
            d.id,
            d.process_id AS "processId",
            d.code,
            d.name,
            d.description,
            NULL::text AS "categoryId",
            d.lider_id AS "ownerId",
            (d.status = 'active') AS "isActive",
            d.company_id AS "companyId",
            d.created_at AS "createdAt",
            d.updated_at AS "updatedAt"
          FROM core.domain d
          WHERE d.company_id = ${companyId}::uuid
          ORDER BY d.created_at DESC
        `)
      : await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT
            d.id,
            d.process_id AS "processId",
            d.code,
            d.name,
            d.description,
            NULL::text AS "categoryId",
            d.lider_id AS "ownerId",
            (d.status = 'active') AS "isActive",
            d.company_id AS "companyId",
            d.created_at AS "createdAt",
            d.updated_at AS "updatedAt"
          FROM core.domain d
          ORDER BY d.created_at DESC
        `);
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading processes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, ownerId, companyId, isActive, createdAt, updatedAt } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'companyId es obligatorio' }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'lider_id (ownerId) es obligatorio' }, { status: 400 });
    }

    const [frameworkVersion] = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT id
        FROM core.framework_version
        WHERE status = 'active'
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 1
      `
    );
    if (!frameworkVersion?.id) {
      return NextResponse.json({ error: 'No existe framework_version activo en core.framework_version' }, { status: 400 });
    }

    const code = name.trim().toLowerCase().replace(/\s+/g, '_');

    const [item] = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        INSERT INTO core.domain (
          code,
          name,
          description,
          framework_version_id,
          status,
          company_id,
          lider_id,
          process_id,
          created_at,
          updated_at
        )
        VALUES (
          ${code},
          ${name.trim()},
          ${description?.trim() || null},
          ${frameworkVersion.id}::uuid,
          ${isActive !== false ? 'active' : 'inactive'},
          ${companyId}::uuid,
          ${ownerId ? ownerId : null}::uuid,
          gen_random_uuid(),
          ${createdAt ? new Date(createdAt) : new Date()},
          ${updatedAt ? new Date(updatedAt) : new Date()}
        )
        RETURNING id, process_id as "processId"
      `
    );

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Error creating process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, ownerId, companyId, isActive, createdAt, updatedAt } = body;

    if (!id) throw new Error('ID is required');
    if (!companyId) {
      return NextResponse.json({ error: 'companyId es obligatorio' }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'lider_id (ownerId) es obligatorio' }, { status: 400 });
    }

    const code = name.trim().toLowerCase().replace(/\s+/g, '_');

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE core.domain
        SET 
          code = ${code},
          name = ${name.trim()},
          description = ${description?.trim() || null},
          company_id = ${companyId}::uuid,
          lider_id = ${ownerId}::uuid,
          status = ${isActive !== false ? 'active' : 'inactive'},
          created_at = ${createdAt ? new Date(createdAt) : new Date()},
          updated_at = ${updatedAt ? new Date(updatedAt) : new Date()}
        WHERE id = ${id}::uuid
      `
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) throw new Error('ID is required');

    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM core.domain WHERE id = ${id}::uuid`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
