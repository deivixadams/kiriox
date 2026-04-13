
import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import { Prisma } from '@prisma/client';

export async function GET() {
    try {
        const categories = await prisma.$queryRaw<{ id: string, name: string }[]>(
            Prisma.sql`
                SELECT id::text, name 
                FROM core.domain_category 
                WHERE is_active = true 
                ORDER BY name ASC
            `
        );
        return NextResponse.json({ items: categories });
    } catch (error: any) {
        console.error('Error loading process categories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
