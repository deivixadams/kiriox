import { Prisma } from '@prisma/client';
import styles from './page.module.css';

type Row = Record<string, any>;

function formatValue(value: any) {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2);
  }
  return String(value);
}

function safeNumber(value: any) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function findKey(columns: string[], candidates: string[]) {
  const lower = columns.map((c) => c.toLowerCase());
  for (const candidate of candidates) {
    const idx = lower.findIndex((c) => c === candidate.toLowerCase());
    if (idx >= 0) return columns[idx];
  }
  for (const candidate of candidates) {
    const idx = lower.findIndex((c) => c.includes(candidate.toLowerCase()));
    if (idx >= 0) return columns[idx];
  }
  return '';
}

function buildColumns(rows: Row[]) {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}

async function loadDashboardRows() {
  const prisma = (await import('@/lib/prisma')).default;
  try {
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT * FROM "views-schema".dashboard_top_control
    `);
    return { rows, source: '"views-schema".dashboard_top_control' };
  } catch {
    try {
      const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
        SELECT * FROM corpus.dashboard_top_control
      `);
      return { rows, source: 'corpus.dashboard_top_control' };
    } catch {
      const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
        SELECT * FROM dashboard_top_control
      `);
      return { rows, source: 'dashboard_top_control' };
    }
  }
}

export default async function ScoreDashboardPage() {
  let rows: Row[] = [];
  let source = 'dashboard_top_control';

  try {
    const result = await loadDashboardRows();
    rows = result.rows || [];
    source = result.source;
  } catch {
    rows = [];
  }

  const columns = buildColumns(rows);
  const keyMap = {
    controlCode: findKey(columns, ['control_code', 'code']),
    controlName: findKey(columns, ['control_name', 'control_title', 'name']),
    controlType: findKey(columns, ['control_type', 'type']),
    domainName: findKey(columns, ['domain_name', 'domain']),
    obligations: findKey(columns, ['obligations_supported', 'obligations', 'obligation_count']),
    risks: findKey(columns, ['risks_mitigated', 'risks', 'risk_count']),
    structuralScore: findKey(columns, ['structural_score', 'structural']),
    fragilityScore: findKey(columns, ['fragility_score', 'fragility']),
    systemicScore: findKey(columns, ['systemic_impact_score', 'systemic']),
    rank: findKey(columns, ['final_weighted_rank', 'rank']),
    status: findKey(columns, ['status']),
    description: findKey(columns, ['description']),
    objective: findKey(columns, ['control_objective', 'objective']),
    failure: findKey(columns, ['failure_mode', 'failure']),
    designIntent: findKey(columns, ['design_intent']),
  };

  const totalRows = rows.length;
  const systemicValues = keyMap.systemicScore
    ? rows.map((row) => safeNumber(row[keyMap.systemicScore])).filter((v) => v !== null) as number[]
    : [];
  const fragilityValues = keyMap.fragilityScore
    ? rows.map((row) => safeNumber(row[keyMap.fragilityScore])).filter((v) => v !== null) as number[]
    : [];
  const structuralValues = keyMap.structuralScore
    ? rows.map((row) => safeNumber(row[keyMap.structuralScore])).filter((v) => v !== null) as number[]
    : [];

  const avgSystemic = systemicValues.length
    ? systemicValues.reduce((acc, val) => acc + val, 0) / systemicValues.length
    : null;
  const avgFragility = fragilityValues.length
    ? fragilityValues.reduce((acc, val) => acc + val, 0) / fragilityValues.length
    : null;
  const avgStructural = structuralValues.length
    ? structuralValues.reduce((acc, val) => acc + val, 0) / structuralValues.length
    : null;

  const topControls = [...rows]
    .sort((a, b) => {
      const aVal = safeNumber(a[keyMap.systemicScore]) ?? safeNumber(a[keyMap.structuralScore]) ?? 0;
      const bVal = safeNumber(b[keyMap.systemicScore]) ?? safeNumber(b[keyMap.structuralScore]) ?? 0;
      return bVal - aVal;
    })
    .slice(0, 6);

  const maxSystemic = systemicValues.length ? Math.max(...systemicValues) : 1;

  const domainSummary = rows.reduce((acc: Record<string, { count: number; impact: number }>, row) => {
    const name = keyMap.domainName ? String(row[keyMap.domainName] ?? 'Sin dominio') : 'Sin dominio';
    const impact = safeNumber(row[keyMap.systemicScore]) ?? 0;
    if (!acc[name]) acc[name] = { count: 0, impact: 0 };
    acc[name].count += 1;
    acc[name].impact += impact;
    return acc;
  }, {});

  const domainCards = Object.entries(domainSummary)
    .map(([name, values]) => ({
      name,
      count: values.count,
      avgImpact: values.count ? values.impact / values.count : 0,
    }))
    .sort((a, b) => b.avgImpact - a.avgImpact)
    .slice(0, 6);

  const tableColumns = [
    keyMap.controlCode,
    keyMap.controlName,
    keyMap.controlType,
    keyMap.domainName,
    keyMap.obligations,
    keyMap.risks,
    keyMap.structuralScore,
    keyMap.fragilityScore,
    keyMap.systemicScore,
    keyMap.rank,
  ].filter(Boolean) as string[];

  const displayColumns = tableColumns.length ? tableColumns : columns;

  const maxStructural = structuralValues.length ? Math.max(...structuralValues) : 1;
  const maxFragility = fragilityValues.length ? Math.max(...fragilityValues) : 1;
  const canEnhancedTable =
    Boolean(keyMap.controlCode || keyMap.controlName) &&
    Boolean(keyMap.systemicScore || keyMap.structuralScore || keyMap.fragilityScore);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>
              compliance risk engine
            </div>
            <h1 className={styles.title}>Dashboard Score</h1>
            <p className={styles.subtitle}>
              Vista ejecutiva construida desde <span className={styles.subtitleStrong}>{source}</span>. Los controles
              críticos se ordenan por impacto sistémico, fragilidad y severidad estructural.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.metaPill}>
              {totalRows} controles críticos
            </span>
            {avgSystemic !== null && (
              <span className={styles.metaPill}>
                Prom. impacto sistémico {avgSystemic.toFixed(2)}
              </span>
            )}
            {avgFragility !== null && (
              <span className={styles.metaPill}>
                Prom. fragilidad {avgFragility.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <section className={styles.heroGrid}>
          <div className={styles.heroCard}>
            <div className={styles.cardEyebrow}>Score ejecutivo</div>
            <div className={styles.heroRow}>
              <div>
                <div className={styles.heroValue}>
                  {avgSystemic !== null ? avgSystemic.toFixed(2) : '—'}
                </div>
                <div className={styles.heroHint}>
                  Impacto sistémico promedio de la vista
                </div>
              </div>
              <div className={styles.heroOrb}>
                <div className={styles.heroOrbInner} />
              </div>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStatCard}>
                <div className={styles.heroStatLabel}>Fragilidad</div>
                <div className={styles.heroStatValue}>
                  {avgFragility !== null ? avgFragility.toFixed(2) : '—'}
                </div>
              </div>
              <div className={styles.heroStatCard}>
                <div className={styles.heroStatLabel}>Score estructural</div>
                <div className={styles.heroStatValue}>
                  {avgStructural !== null ? avgStructural.toFixed(2) : '—'}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardEyebrow}>Dominio líder</div>
            <div className={styles.metricValue}>
              {domainCards[0]?.name || '—'}
            </div>
            <div className={styles.metricHint}>
              {domainCards[0] ? `${domainCards[0].count} controles` : 'Sin datos'}
            </div>
            <div className={styles.metricBarTrack}>
              <div
                className={styles.metricBarFill}
                style={{ width: domainCards[0] ? `${Math.min(100, domainCards[0].avgImpact * 100)}%` : '0%' }}
              />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardEyebrow}>Observación</div>
            <div className={styles.metricTitle}>Señal estructural dominante</div>
            <div className={styles.metricHint}>
              {keyMap.systemicScore ? 'Impacto sistémico' : 'Score estructural'} concentra la selección crítica.
            </div>
            <div className={styles.metricFooter}>
              Fuente: {source}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Top controles críticos</div>
              <div className={styles.sectionSubtitle}>Ranking de impacto y fragilidad por control.</div>
            </div>
            <div className={styles.sectionMeta}>Actualizado en tiempo real</div>
          </div>
          <div className={styles.cardGrid}>
            {topControls.map((row, idx) => {
              const impact = safeNumber(row[keyMap.systemicScore]) ?? 0;
              const width = maxSystemic > 0 ? (impact / maxSystemic) * 100 : 0;
              return (
                <div key={idx} className={styles.rankCard}>
                  <div className={styles.rankHeader}>
                    <div>
                      <div className={styles.rankEyebrow}>
                        {row[keyMap.controlType] || 'Control'}
                      </div>
                      <div className={styles.rankTitle}>
                        {row[keyMap.controlName] || row[keyMap.controlCode] || '—'}
                      </div>
                      <div className={styles.rankMeta}>
                        {row[keyMap.controlCode] || 'Sin código'} · {row[keyMap.domainName] || 'Sin dominio'}
                      </div>
                    </div>
                    <div className={styles.rankBadge}>
                      #{safeNumber(row[keyMap.rank]) ?? idx + 1}
                    </div>
                  </div>
                  <div className={styles.rankMetricRow}>
                    <span>Impacto sistémico</span>
                    <span className={styles.rankMetricValue}>{impact ? impact.toFixed(2) : '—'}</span>
                  </div>
                  <div className={styles.rankBarTrack}>
                    <div
                      className={styles.rankBarFill}
                      style={{ width: `${Math.max(6, Math.min(100, width))}%` }}
                    />
                  </div>
                  <div className={styles.rankMetaGrid}>
                    <div className={styles.rankMetaCard}>
                      Obligaciones: {formatValue(row[keyMap.obligations])}
                    </div>
                    <div className={styles.rankMetaCard}>
                      Riesgos: {formatValue(row[keyMap.risks])}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Mapa por dominio</div>
              <div className={styles.sectionSubtitle}>Dónde se concentra el riesgo estructural.</div>
            </div>
          </div>
          <div className={styles.cardGrid}>
            {domainCards.map((domain) => (
              <div key={domain.name} className={styles.rankCard}>
                <div className={styles.rankEyebrow}>Dominio</div>
                <div className={styles.rankTitle}>{domain.name}</div>
                <div className={styles.rankMeta}>{domain.count} controles críticos</div>
                <div className={styles.rankBarTrack}>
                  <div
                    className={styles.domainBarFill}
                    style={{ width: `${Math.min(100, domain.avgImpact * 100)}%` }}
                  />
                </div>
                <div className={styles.rankMeta}>
                  Impacto promedio {domain.avgImpact.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>Detalle completo</div>
              <div className={styles.sectionSubtitle}>Listado total de la vista operativa.</div>
            </div>
          </div>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <div className={styles.tableTitle}>Controles estructurales</div>
                <div className={styles.tableSubtitle}>Fuente {source}</div>
              </div>
            </div>
            <div className={styles.tableWrap}>
              {canEnhancedTable ? (
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      <th className={styles.th}>Control</th>
                      <th className={styles.th}>Dominio</th>
                      <th className={styles.th}>Cobertura</th>
                      <th className={styles.th}>Score</th>
                      <th className={styles.th}>Impacto</th>
                      <th className={styles.th}>Rank</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className={styles.emptyCell}>
                          No hay datos en la vista {source}.
                        </td>
                      </tr>
                    )}
                    {rows.map((row, idx) => {
                      const controlName = keyMap.controlName ? row[keyMap.controlName] : row[keyMap.controlCode];
                      const controlCode = keyMap.controlCode ? row[keyMap.controlCode] : '—';
                      const controlType = keyMap.controlType ? row[keyMap.controlType] : null;
                      const domainName = keyMap.domainName ? row[keyMap.domainName] : '—';
                      const obligations = keyMap.obligations ? row[keyMap.obligations] : null;
                      const risks = keyMap.risks ? row[keyMap.risks] : null;
                      const structural = keyMap.structuralScore ? safeNumber(row[keyMap.structuralScore]) : null;
                      const fragility = keyMap.fragilityScore ? safeNumber(row[keyMap.fragilityScore]) : null;
                      const systemic = keyMap.systemicScore ? safeNumber(row[keyMap.systemicScore]) : null;
                      const rank = keyMap.rank ? row[keyMap.rank] : idx + 1;

                      const structuralWidth = structural !== null && maxStructural > 0
                        ? (structural / maxStructural) * 100
                        : 0;
                      const fragilityWidth = fragility !== null && maxFragility > 0
                        ? (fragility / maxFragility) * 100
                        : 0;
                      const systemicWidth = systemic !== null && maxSystemic > 0
                        ? (systemic / maxSystemic) * 100
                        : 0;

                      return (
                        <tr key={idx} className={styles.tr}>
                          <td className={styles.td}>
                            <div className={styles.controlCell}>
                              <div className={styles.controlName}>{controlName || '—'}</div>
                              <div className={styles.controlMeta}>
                                <span className={styles.controlCode}>{controlCode}</span>
                                {controlType && <span className={styles.controlType}>{controlType}</span>}
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.domainCell}>{formatValue(domainName)}</div>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.coverageCell}>
                              <span className={styles.coveragePill}>Obligaciones: {formatValue(obligations)}</span>
                              <span className={styles.coveragePill}>Riesgos: {formatValue(risks)}</span>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.metricStack}>
                              <div className={styles.metricRow}>
                                <span>Structural</span>
                                <span>{structural !== null ? structural.toFixed(2) : '—'}</span>
                              </div>
                              <div className={styles.metricBarTrackSmall}>
                                <div className={styles.metricBarFillSmall} style={{ width: `${Math.max(4, Math.min(100, structuralWidth))}%` }} />
                              </div>
                              <div className={styles.metricRow}>
                                <span>Fragility</span>
                                <span>{fragility !== null ? fragility.toFixed(2) : '—'}</span>
                              </div>
                              <div className={styles.metricBarTrackSmall}>
                                <div className={styles.metricBarAltSmall} style={{ width: `${Math.max(4, Math.min(100, fragilityWidth))}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.metricStack}>
                              <div className={styles.metricRow}>
                                <span>Impacto</span>
                                <span>{systemic !== null ? systemic.toFixed(2) : '—'}</span>
                              </div>
                              <div className={styles.metricBarTrackSmall}>
                                <div className={styles.metricBarImpactSmall} style={{ width: `${Math.max(6, Math.min(100, systemicWidth))}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.rankPill}>#{formatValue(rank)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className={styles.table}>
                  <thead className={styles.thead}>
                    <tr>
                      {displayColumns.map((column) => (
                        <th key={column} className={styles.th}>
                          {column.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={displayColumns.length || 1} className={styles.emptyCell}>
                          No hay datos en la vista {source}.
                        </td>
                      </tr>
                    )}
                    {rows.map((row, idx) => (
                      <tr key={idx} className={styles.tr}>
                        {displayColumns.map((column) => (
                          <td key={column} className={styles.td}>
                            {formatValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
