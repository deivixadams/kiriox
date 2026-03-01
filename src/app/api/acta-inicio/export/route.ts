import { NextRequest, NextResponse } from 'next/server';
import { buildActaInicioDoc } from '../../../../../acta-auditoría-v1';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buffer, filename } = await buildActaInicioDoc(body || {});

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating Acta de Inicio DOCX:', error);
    return NextResponse.json(
      { error: 'Error al generar el Acta de Inicio.', details: error.message },
      { status: 500 }
    );
  }
}
