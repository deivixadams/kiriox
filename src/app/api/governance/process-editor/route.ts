
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? 'Error desconocido');
}

async function validateCategory(categoryId: unknown) {
  const normalizedCategoryId = Number.isFinite(Number(categoryId)) ? Number(categoryId) : null;
  if (!normalizedCategoryId) {
    return { ok: false as const, normalizedCategoryId: null, message: 'Selecciona una categoría de proceso válida.' };
  }

  const categoryRows = await prisma.$queryRaw<Array<{ ok: number }>>(Prisma.sql`
    SELECT 1 AS ok
    FROM core.domain_category dc
    WHERE dc.id = ${normalizedCategoryId}
      AND COALESCE(dc.is_active, true) = true
    LIMIT 1
  `);

  if (!categoryRows[0]) {
    return { ok: false as const, normalizedCategoryId: null, message: 'La categoría seleccionada no existe o está inactiva.' };
  }

  return { ok: true as const, normalizedCategoryId };
}

function mapProcessEditorDbError(error: unknown): string {
  const message = getErrorMessage(error);
  if (message.includes('fk_core_domain_domain_category')) {
    return 'La categoría seleccionada no es válida para guardar el proceso.';
  }
  if (message.includes('23503')) {
    return 'No se pudo guardar por una relación inválida. Verifica categoría y líder del proceso.';
  }
  return message;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const realmId = searchParams.get('realmId');

    const items = companyId && realmId
      ? await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT DISTINCT
            d.id,
            d.process_id AS "processId",
            d.code,
            d.name,
            d.description,
            d.domain_category::text AS "categoryId",
            d.lider_id AS "ownerId",
            (d.status = 'active') AS "isActive",
            ${companyId}::text AS "companyId",
            d.created_at AS "createdAt",
            d.updated_at AS "updatedAt"
          FROM core.domain d
          JOIN core.map_reino_domain mrd
            ON mrd.domain_id = d.id
          JOIN core.map_company_x_reino mcr
            ON mcr.reino_id = mrd.reino_id
           AND mcr.company_id = ${companyId}::uuid
           AND COALESCE(mcr.is_active, true) = true
          WHERE mrd.reino_id = ${realmId}::uuid
          ORDER BY d.created_at DESC
        `)
      : companyId
      ? await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT DISTINCT
            d.id,
            d.process_id AS "processId",
            d.code,
            d.name,
            d.description,
            d.domain_category::text AS "categoryId",
            d.lider_id AS "ownerId",
            (d.status = 'active') AS "isActive",
            ${companyId}::text AS "companyId",
            d.created_at AS "createdAt",
            d.updated_at AS "updatedAt"
          FROM core.domain d
          JOIN core.map_reino_domain mrd
            ON mrd.domain_id = d.id
          JOIN core.map_company_x_reino mcr
            ON mcr.reino_id = mrd.reino_id
           AND mcr.company_id = ${companyId}::uuid
           AND COALESCE(mcr.is_active, true) = true
          ORDER BY d.created_at DESC
        `)
      : await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT
            d.id,
            d.process_id AS "processId",
            d.code,
            d.name,
            d.description,
            d.domain_category::text AS "categoryId",
            d.lider_id AS "ownerId",
            (d.status = 'active') AS "isActive",
            NULL::text AS "companyId",
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
    const { name, description, ownerId, companyId, realmId, categoryId, isActive, createdAt, updatedAt } = body;
    const categoryValidation = await validateCategory(categoryId);

    if (!companyId) {
      return NextResponse.json({ error: 'companyId es obligatorio' }, { status: 400 });
    }
    if (!realmId) {
      return NextResponse.json({ error: 'realmId es obligatorio' }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'lider_id (ownerId) es obligatorio' }, { status: 400 });
    }
    if (!String(name ?? '').trim()) {
      return NextResponse.json({ error: 'El nombre del proceso es obligatorio.' }, { status: 400 });
    }
    if (!String(description ?? '').trim()) {
      return NextResponse.json({ error: 'La descripción del proceso es obligatoria.' }, { status: 400 });
    }
    if (!categoryValidation.ok) {
      return NextResponse.json({ error: categoryValidation.message }, { status: 400 });
    }
    const mappingRows = await prisma.$queryRaw<Array<{ ok: number }>>(Prisma.sql`
      SELECT 1 AS ok
      FROM core.map_company_x_reino m
      WHERE m.company_id = ${companyId}::uuid
        AND m.reino_id = ${realmId}::uuid
        AND COALESCE(m.is_active, true) = true
      LIMIT 1
    `);
    if (!mappingRows[0]) {
      return NextResponse.json({ error: 'La empresa no tiene mapeado el macroproceso seleccionado.' }, { status: 400 });
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
          lider_id,
          domain_category,
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
          ${ownerId ? ownerId : null}::uuid,
          ${categoryValidation.normalizedCategoryId},
          gen_random_uuid(),
          ${createdAt ? new Date(createdAt) : new Date()},
          ${updatedAt ? new Date(updatedAt) : new Date()}
        )
        RETURNING id, process_id as "processId"
      `
    );

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM core.map_reino_domain
      WHERE domain_id = ${item.id}::uuid
    `);

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO core.map_reino_domain (
        id,
        map_code,
        reino_id,
        domain_id,
        link_strength,
        rationale,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${`RMD-AUTO-${String(item.id).slice(0, 8)}`},
        ${realmId}::uuid,
        ${item.id}::uuid,
        1.0,
        jsonb_build_object('source', 'process-editor'),
        NOW(),
        NOW()
      )
    `);

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Error creating process:', error);
    return NextResponse.json({ error: mapProcessEditorDbError(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, ownerId, companyId, realmId, categoryId, isActive, createdAt, updatedAt } = body;
    const categoryValidation = await validateCategory(categoryId);

    if (!id) throw new Error('ID is required');
    if (!companyId) {
      return NextResponse.json({ error: 'companyId es obligatorio' }, { status: 400 });
    }
    if (!realmId) {
      return NextResponse.json({ error: 'realmId es obligatorio' }, { status: 400 });
    }
    if (!ownerId) {
      return NextResponse.json({ error: 'lider_id (ownerId) es obligatorio' }, { status: 400 });
    }
    if (!String(name ?? '').trim()) {
      return NextResponse.json({ error: 'El nombre del proceso es obligatorio.' }, { status: 400 });
    }
    if (!String(description ?? '').trim()) {
      return NextResponse.json({ error: 'La descripción del proceso es obligatoria.' }, { status: 400 });
    }
    if (!categoryValidation.ok) {
      return NextResponse.json({ error: categoryValidation.message }, { status: 400 });
    }
    const mappingRows = await prisma.$queryRaw<Array<{ ok: number }>>(Prisma.sql`
      SELECT 1 AS ok
      FROM core.map_company_x_reino m
      WHERE m.company_id = ${companyId}::uuid
        AND m.reino_id = ${realmId}::uuid
        AND COALESCE(m.is_active, true) = true
      LIMIT 1
    `);
    if (!mappingRows[0]) {
      return NextResponse.json({ error: 'La empresa no tiene mapeado el macroproceso seleccionado.' }, { status: 400 });
    }

    const code = name.trim().toLowerCase().replace(/\s+/g, '_');

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE core.domain
        SET 
          code = ${code},
          name = ${name.trim()},
          description = ${description?.trim() || null},
          lider_id = ${ownerId}::uuid,
          domain_category = ${categoryValidation.normalizedCategoryId},
          status = ${isActive !== false ? 'active' : 'inactive'},
          created_at = ${createdAt ? new Date(createdAt) : new Date()},
          updated_at = ${updatedAt ? new Date(updatedAt) : new Date()}
        WHERE id = ${id}::uuid
      `
    );

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM core.map_reino_domain
      WHERE domain_id = ${id}::uuid
    `);

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO core.map_reino_domain (
        id,
        map_code,
        reino_id,
        domain_id,
        link_strength,
        rationale,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        ${`RMD-AUTO-${String(id).slice(0, 8)}`},
        ${realmId}::uuid,
        ${id}::uuid,
        1.0,
        jsonb_build_object('source', 'process-editor'),
        NOW(),
        NOW()
      )
    `);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating process:', error);
    return NextResponse.json({ error: mapProcessEditorDbError(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) throw new Error('ID is required');

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE core.domain
        SET status = 'inactive',
            updated_at = NOW()
        WHERE id = ${id}::uuid
      `
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
