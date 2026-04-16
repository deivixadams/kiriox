import { NextResponse } from 'next/server';
import { withModuleAccess } from '@/shared/http';
import prisma from '@/infrastructure/db/prisma/client';

export const GET = withModuleAccess('structural-risk', 'risk.structural.read', async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reinoCode = (searchParams.get('reino') || 'AML').toUpperCase();

    // ── 1. Reino ─────────────────────────────────────────────────────
    const reinoRows = await prisma.$queryRawUnsafe<{
      id: string; name: string; code: string;
    }[]>(
      `SELECT id, name, code FROM core.reino
       WHERE UPPER(code) = $1 OR UPPER(name) LIKE $2
       LIMIT 1`,
      reinoCode, `%${reinoCode}%`
    );

    if (!reinoRows.length) {
      return NextResponse.json({ error: `Reino "${reinoCode}" no encontrado` }, { status: 404 });
    }
    const reino = reinoRows[0];

    // ── 2. Dominios del reino ─────────────────────────────────────────
    const domainRows = await prisma.$queryRawUnsafe<{
      id: string; name: string; code: string;
    }[]>(
      `SELECT d.id, d.name, d.code
       FROM graph.domain d
       JOIN core.map_reino_domain mrd ON mrd.domain_id = d.id
       WHERE mrd.reino_id = $1::uuid
       ORDER BY d.code`,
      reino.id
    );

    // ── 3. Elementos de esos dominios ─────────────────────────────────
    const domainIds = domainRows.map((d) => d.id);
    let elementRows: { id: string; name: string; code: string; domain_id: string }[] = [];

    if (domainIds.length > 0) {
      elementRows = await prisma.$queryRawUnsafe<{
        id: string; name: string; code: string; domain_id: string;
      }[]>(
        `SELECT de.id,
                COALESCE(de.title, de.name, de.code) AS name,
                de.code,
                mde.domain_id
         FROM graph.domain_elements de
         JOIN graph.map_domain_element mde ON mde.element_id = de.id
         WHERE mde.domain_id = ANY($1::uuid[])
           AND COALESCE(de.is_active, true) = true
         ORDER BY de.code`,
        domainIds
      );
    }

    // ── 4. Construir nodos ────────────────────────────────────────────
    const nodes = [
      // Centro: reino
      {
        id:         reino.id,
        label:      reino.name,
        code:       reino.code,
        nodeLevel:  'REINO',
        parentId:   null,
      },
      // Dominios
      ...domainRows.map((d) => ({
        id:         d.id,
        label:      d.name,
        code:       d.code,
        nodeLevel:  'DOMAIN',
        parentId:   reino.id,
      })),
      // Elementos
      ...elementRows.map((e) => ({
        id:         e.id,
        label:      e.name,
        code:       e.code,
        nodeLevel:  'ELEMENT',
        parentId:   e.domain_id,
      })),
    ];

    // ── 5. Construir aristas ──────────────────────────────────────────
    const edges = [
      // Reino → Dominio
      ...domainRows.map((d) => ({
        id:     `${reino.id}__${d.id}`,
        source: reino.id,
        target: d.id,
        rel:    'HAS_DOMAIN',
      })),
      // Dominio → Elemento
      ...elementRows.map((e) => ({
        id:     `${e.domain_id}__${e.id}`,
        source: e.domain_id,
        target: e.id,
        rel:    'HAS_ELEMENT',
      })),
    ];

    return NextResponse.json({
      reino: { id: reino.id, name: reino.name, code: reino.code },
      nodes,
      edges,
      meta: {
        reino_count:   1,
        domain_count:  domainRows.length,
        element_count: elementRows.length,
        total_nodes:   nodes.length,
        total_edges:   edges.length,
      },
    });
  } catch (error: any) {
    console.error('Error realm-structure:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
