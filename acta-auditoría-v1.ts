import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  PageNumber,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  ShadingType,
  convertInchesToTwip,
} from 'docx';

export type ActaInicioPayload = {
  entidad_nombre?: string;
  codigo_auditoria?: string;
  periodo_inicio?: string;
  periodo_fin?: string;
  objetivo?: string;
  alcance?: string;
  marco_normativo?: string;
  metodologia?: string;
  lider_equipo?: string;
  auditores?: string;
  cronograma?: { hito: string; fecha: string }[];
};

export async function buildActaInicioDoc(payload: ActaInicioPayload) {
  const {
    entidad_nombre,
    codigo_auditoria,
    periodo_inicio,
    periodo_fin,
    objetivo,
    alcance,
    marco_normativo,
    metodologia,
    lider_equipo,
    auditores,
    cronograma,
  } = payload ?? {};

  const resolvedCodigo =
    codigo_auditoria ||
    `AUD-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;

  const sectionTitle = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({ text, bold: true, size: 24, font: 'Calibri', color: '1B4332' }),
      ],
      spacing: { before: 400, after: 120 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '2D6A4F' },
      },
    });

  const bodyText = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: text || '—', size: 22, font: 'Calibri', color: '333333' }),
      ],
      spacing: { after: 100 },
      alignment: AlignmentType.JUSTIFIED,
    });

  const labelValue = (label: string, value: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 22, font: 'Calibri', color: '1B4332' }),
        new TextRun({ text: value || '—', size: 22, font: 'Calibri', color: '333333' }),
      ],
      spacing: { after: 60 },
    });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const cronogramaRows = (cronograma || []).map((item) =>
    new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: item.hito, size: 20, font: 'Calibri', bold: true }),
              ],
            }),
          ],
          width: { size: 60, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: formatDate(item.fecha), size: 20, font: 'Calibri' }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: 40, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
        }),
      ],
    })
  );

  const cronogramaTable = new Table({
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'HITO', bold: true, size: 18, font: 'Calibri', color: 'FFFFFF' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 60, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: '2D6A4F' },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'FECHA', bold: true, size: 18, font: 'Calibri', color: 'FFFFFF' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 40, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: '2D6A4F' },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
          }),
        ],
      }),
      ...cronogramaRows,
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1.2),
            },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `CRE — ${entidad_nombre || 'Entidad'}`,
                    size: 16,
                    font: 'Calibri',
                    color: '999999',
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Documento generado por CRE — ',
                    size: 14,
                    font: 'Calibri',
                    color: '999999',
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, font: 'Calibri', color: '999999' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'ACTA DE INICIO', bold: true, size: 36, font: 'Calibri', color: '1B4332' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'AUDITORÍA DE CUMPLIMIENTO AML/CFT',
                bold: true,
                size: 24,
                font: 'Calibri',
                color: '2D6A4F',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Ref: ${resolvedCodigo}`, size: 20, font: 'Calibri', color: '666666' }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          sectionTitle('1. INFORMACIÓN GENERAL'),
          labelValue('Entidad Auditada', entidad_nombre || '—'),
          labelValue('Código de Auditoría', resolvedCodigo),
          labelValue('Periodo de Auditoría', `${formatDate(periodo_inicio)} — ${formatDate(periodo_fin)}`),
          labelValue('Fecha de Emisión', formatDate(new Date().toISOString().split('T')[0])),

          sectionTitle('2. OBJETIVO GENERAL'),
          bodyText(objetivo || ''),

          sectionTitle('3. ALCANCE DE LA AUDITORÍA'),
          bodyText(alcance || ''),

          sectionTitle('4. MARCO NORMATIVO APLICABLE'),
          bodyText(marco_normativo || ''),

          sectionTitle('5. METODOLOGÍA DE TRABAJO'),
          bodyText(metodologia || ''),

          sectionTitle('6. EQUIPO AUDITOR'),
          labelValue('Líder de Proyecto', lider_equipo || '—'),
          labelValue('Auditores Asignados', auditores || '—'),

          sectionTitle('7. CRONOGRAMA ESTIMADO'),
          new Paragraph({ spacing: { after: 80 } }),
          cronogramaTable,

          new Paragraph({ spacing: { before: 600 } }),
          sectionTitle('8. FIRMAS DE CONFORMIDAD'),
          new Paragraph({ spacing: { after: 300 } }),

          new Paragraph({
            children: [new TextRun({ text: '___________________________________', size: 22, font: 'Calibri' })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: lider_equipo || 'Líder de Auditoría', bold: true, size: 22, font: 'Calibri' }),
            ],
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Auditor Líder / Responsable de la Auditoría',
                size: 18,
                font: 'Calibri',
                color: '666666',
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [new TextRun({ text: '___________________________________', size: 22, font: 'Calibri' })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Representante de la Entidad', bold: true, size: 22, font: 'Calibri' }),
            ],
            spacing: { after: 20 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${entidad_nombre || 'Entidad Auditada'}`, size: 18, font: 'Calibri', color: '666666' }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const filename = `Acta_Inicio_${String(resolvedCodigo).replace(/[^a-zA-Z0-9-_]/g, '_')}.docx`;

  return { buffer, filename };
}
