
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET() {
  try {
    const items = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT 
          process_id as id,
          process_code as code,
          process_name as name,
          process_description as description,
          category_id as "categoryId",
          process_owner_user_id as "ownerId",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM core.process
        ORDER BY created_at DESC
      `
    );
    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error loading processes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, categoryId, ownerId, isActive, createdAt, updatedAt } = body;

    const code = name.trim().toLowerCase().replace(/\s+/g, '_');

    const [item] = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        INSERT INTO core.process (
          process_name, 
          process_description, 
          process_code, 
          category_id,
          process_owner_user_id,
          is_active, 
          created_at, 
          updated_at
        )
        VALUES (
          ${name.trim()}, 
          ${description?.trim() || null}, 
          ${code}, 
          ${categoryId ? BigInt(categoryId) : null},
          ${ownerId ? ownerId : null}::uuid,
          ${isActive !== false},
          ${createdAt ? new Date(createdAt) : new Date()},
          ${updatedAt ? new Date(updatedAt) : new Date()}
        )
        RETURNING process_id as id
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
    const { id, name, description, categoryId, ownerId, isActive, createdAt, updatedAt } = body;

    if (!id) throw new Error('ID is required');

    const code = name.trim().toLowerCase().replace(/\s+/g, '_');

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE core.process
        SET 
          process_name = ${name.trim()},
          process_description = ${description?.trim() || null},
          process_code = ${code},
          category_id = ${categoryId ? BigInt(categoryId) : null},
          process_owner_user_id = ${ownerId ? ownerId : null}::uuid,
          is_active = ${isActive !== false},
          created_at = ${createdAt ? new Date(createdAt) : new Date()},
          updated_at = ${updatedAt ? new Date(updatedAt) : new Date()}
        WHERE process_id = ${id}::uuid
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
      Prisma.sql`DELETE FROM core.process WHERE process_id = ${id}::uuid`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting process:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
