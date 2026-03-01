import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    ClipboardList,
    Database,
    Shield,
    TrendingDown,
    TrendingUp
} from "lucide-react";

export default function ScoreDashboardPage() {
    const card = "rounded-xl bg-[#111A2E] ring-1 ring-white/5 shadow-[0_6px_20px_rgba(0,0,0,0.35)]";
    const cardHover = "transition duration-200 ease-out hover:bg-[#16223B]";
    const cardPad = "p-6";

    const pageHeader = "flex items-end justify-between gap-3";
    const sectionBlock = "space-y-8";
    const sectionHeader = "flex items-end justify-between gap-3";
    const sectionHeaderStyle = { marginBottom: "2.5rem" as const };
    const panelBlock = "space-y-6";
    const panelHeader = "flex items-center justify-between gap-3";
    const sectionInfo = "space-y-1";
    const sectionTitle = "text-sm font-semibold text-[#F1F5F9]";
    const sectionHint = "text-xs text-[#94A3B8]";
    const sectionAction = "text-xs text-[#3B82F6] hover:text-[#60A5FA] transition";

    const statCardWrap = `${card} ${cardHover} ${cardPad} flex items-center gap-4 min-h-[140px]`;
    const statIconWrap = "h-11 w-11 rounded-lg bg-[rgba(59,130,246,0.12)] ring-1 ring-[rgba(59,130,246,0.15)] flex items-center justify-center";
    const statIcon = "h-5 w-5 text-[#3B82F6]";
    const statLabel = "text-[11px] uppercase tracking-[0.08em] text-[#94A3B8]";
    const statValue = "text-2xl font-semibold text-[#F1F5F9] tabular-nums";
    const statMeta = "text-xs text-[#64748B]";

    const heroWrap = `${card} ${cardPad} grid grid-cols-12 gap-5`;
    const heroLeft = "col-span-12 lg:col-span-7";
    const heroRight = "col-span-12 lg:col-span-5 flex items-center justify-end";
    const heroEyebrow = "text-[11px] uppercase tracking-[0.08em] text-[#94A3B8]";
    const heroTitle = "mt-1 text-xl font-semibold text-[#F1F5F9]";
    const heroSubtitle = "mt-1 text-sm text-[#94A3B8] leading-relaxed";
    const scoreLabel = "text-[11px] uppercase tracking-[0.08em] text-[#94A3B8] text-right";
    const scoreValueBase = "mt-1 text-6xl font-bold tabular-nums text-right drop-shadow-[0_0_12px_rgba(59,130,246,0.15)]";
    const scoreSuccess = "text-[#10B981]";
    const scoreWarning = "text-[#F59E0B]";
    const scoreDanger = "text-[#EF4444]";
    const scoreCritical = "text-[#DC2626]";
    const scorePill = "mt-3 inline-flex items-center gap-2 rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-1 text-xs text-[#F1F5F9]";

    const trendWrap = `${card} ${cardPad} min-h-[220px]`;
    const trendHeader = "flex items-center justify-between";
    const trendTitle = "text-sm font-semibold text-[#F1F5F9]";
    const trendMeta = "text-xs text-[#94A3B8] tabular-nums";
    const trendCanvas = "mt-4 h-[140px] rounded-lg bg-[#0B1220] ring-1 ring-white/5";

    const tableWrap = `${card} overflow-hidden`;
    const tableHeader = "bg-[#16223B] px-5 py-4 flex items-center justify-between";
    const tableTitle = "text-sm font-semibold text-[#F1F5F9]";
    const tableSub = "text-xs text-[#94A3B8]";
    const tableEl = "w-full text-sm";
    const thead = "bg-[#16223B] text-[11px] uppercase tracking-[0.08em] text-[#94A3B8]";
    const th = "px-5 py-3 text-left font-medium";
    const tbody = "divide-y divide-white/5";
    const tr = "bg-[#111A2E] hover:bg-[#16223B] transition";
    const td = "px-5 py-4 text-[#F1F5F9] align-middle";
    const tdMuted = "text-[#94A3B8]";
    const rowCritical = "bg-[rgba(239,68,68,0.08)] hover:bg-[rgba(239,68,68,0.12)]";
    const rowWarning = "bg-[rgba(245,158,11,0.08)] hover:bg-[rgba(245,158,11,0.12)]";

    const badgeBase = "inline-flex items-center rounded-md px-2 py-1 text-[12px] font-medium ring-1 ring-inset";
    const badgeActive = `${badgeBase} bg-[rgba(16,185,129,0.12)] text-[#10B981] ring-[rgba(16,185,129,0.25)]`;
    const badgeInProgress = `${badgeBase} bg-[rgba(59,130,246,0.12)] text-[#3B82F6] ring-[rgba(59,130,246,0.25)]`;
    const badgeWarning = `${badgeBase} bg-[rgba(245,158,11,0.12)] text-[#F59E0B] ring-[rgba(245,158,11,0.25)]`;
    const badgeDanger = `${badgeBase} bg-[rgba(239,68,68,0.12)] text-[#EF4444] ring-[rgba(239,68,68,0.25)]`;

    const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B82F6] transition ring-1 ring-inset ring-white/10";
    const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-[#F1F5F9] hover:bg-white/10 transition ring-1 ring-inset ring-white/10";

    const pageWrap = "min-h-screen bg-[#0B1220]";
    const pageContainer = "mx-auto w-full max-w-[1400px] px-6 py-16";
    const pageTitle = "text-3xl font-semibold text-[#F1F5F9]";
    const pageSubtitle = "mt-2 max-w-3xl text-sm text-[#94A3B8] leading-relaxed";
    const pageSections = "mt-24 space-y-24";
    const topGrid = "mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6";
    const midGrid = "mt-10 grid grid-cols-1 gap-6";
    const insightGrid = "mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
    const heroCol = "col-span-1";
    const trendCol = "col-span-1";
    const bottomGrid = "mt-10 grid grid-cols-1 xl:grid-cols-12 gap-6";
    const auditsCol = "xl:col-span-7";
    const findingsCol = "xl:col-span-5";
    const alertsRow = "mt-20";

    const kpiItems = [
        { label: "Dominios", value: "12", meta: "Activos en score", icon: Shield },
        { label: "Obligaciones", value: "86", meta: "Pendientes de evidencia", icon: ClipboardList },
        { label: "Riesgos", value: "24", meta: "Severidad media", icon: AlertTriangle },
        { label: "Controles", value: "41", meta: "Efectivos", icon: CheckCircle2 }
    ];

    const audits = [
        { id: "AUD-2041", entity: "Banco Caribe", status: "Activa", owner: "Equipo AML", updated: "2026-02-27" },
        { id: "AUD-2040", entity: "Seguros Delta", status: "En progreso", owner: "Mesa Riesgo", updated: "2026-02-23" },
        { id: "AUD-2038", entity: "Finanzas Quisqueya", status: "Activa", owner: "Equipo AML", updated: "2026-02-15" },
        { id: "AUD-2036", entity: "Casa de Bolsa Caribe", status: "Cerrada", owner: "Compliance", updated: "2026-02-10" }
    ];

    const findings = [
        { id: "H-889", title: "Evidencia KYC vencida", severity: "Critico", area: "Onboarding", updated: "2026-02-28" },
        { id: "H-874", title: "Parametros sin version aprobada", severity: "Alto", area: "Motor", updated: "2026-02-22" },
        { id: "H-861", title: "Alertas sin cierre formal", severity: "Medio", area: "Monitoreo", updated: "2026-02-18" }
    ];

    const alerts = [
        { title: "Score bajo en Monitoreo", detail: "3 dominios con caida > 6% en los ultimos 30 dias", trend: "down" },
        { title: "ParametroSet pendiente", detail: "Version v2.4 esperando aprobacion de comite", trend: "flat" },
        { title: "Cobertura de evidencia", detail: "Se requiere evidencia adicional en 2 unidades", trend: "up" }
    ];

    const miniTrends = [
        { title: "Cobertura de evidencia", meta: "Semanal", min: "61%", max: "92%", delta: "+3.1%" },
        { title: "Riesgos criticos", meta: "Ultimos 30 dias", min: "4", max: "12", delta: "-2" },
        { title: "Controles efectivos", meta: "Trimestre", min: "72%", max: "88%", delta: "+1.4%" }
    ];

    const scoreValue = 84.5;
    const scoreColor =
        scoreValue >= 90 ? scoreSuccess :
            scoreValue >= 80 ? scoreWarning :
                scoreValue >= 70 ? scoreDanger : scoreCritical;

    return (
        <div className={pageWrap}>
            <div className={pageContainer}>
                <div className={pageHeader} style={{ marginBottom: "3rem" }}>
                    <div>
                        <h1 className={pageTitle}>Dashboard Score</h1>
                        <p className={pageSubtitle}>
                            Vista ejecutiva de ejecuciones, evidencia y control operativo para el score institucional.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className={btnGhost}>Exportar</button>
                        <button className={btnPrimary}>Nueva corrida</button>
                    </div>
                </div>

                <div className={pageSections}>
                    <section className={sectionBlock}>
                        <div className={sectionHeader} style={sectionHeaderStyle}>
                            <div className={sectionInfo}>
                                <div className={sectionTitle}>Indicadores clave</div>
                                <div className={sectionHint}>Vision rapida del estado operativo</div>
                            </div>
                            <button className={sectionAction}>Ver detalle</button>
                        </div>
                        <div className={topGrid}>
                            {kpiItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.label} className={statCardWrap}>
                                        <div className={statIconWrap}>
                                            <Icon className={statIcon} />
                                        </div>
                                        <div>
                                            <div className={statLabel}>{item.label}</div>
                                            <div className={statValue}>{item.value}</div>
                                            <div className={statMeta}>{item.meta}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <section className={sectionBlock}>
                        <div className={sectionHeader} style={sectionHeaderStyle}>
                            <div className={sectionInfo}>
                                <div className={sectionTitle}>Resumen ejecutivo</div>
                                <div className={sectionHint}>Ejecuciones, evidencia y tendencia</div>
                            </div>
                            <button className={sectionAction}>Explorar</button>
                        </div>
                        <div className={midGrid}>
                            <div className={heroCol}>
                                <div className={heroWrap}>
                                    <div className={heroLeft}>
                                        <div className={heroEyebrow}>Ultimo score calificado</div>
                                        <div className={heroTitle}>Integridad AML - Corte 2026 Q1</div>
                                        <div className={heroSubtitle}>
                                            El motor ejecuto la corrida mas reciente con evidencia completa y ParameterSet
                                            aprobado por gobernanza. Revision de variaciones criticas en curso.
                                        </div>
                                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#94A3B8]">
                                            <span className="inline-flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-[#3B82F6]" /> Motor v2.4 Stable
                                            </span>
                                            <span className="inline-flex items-center gap-2">
                                                <Database className="h-4 w-4 text-[#3B82F6]" /> 148 evidencias validadas
                                            </span>
                                        </div>
                                    </div>
                                    <div className={heroRight}>
                                        <div>
                                            <div className={scoreLabel}>Score ejecutivo</div>
                                            <div className={`${scoreValueBase} ${scoreColor}`}>{scoreValue.toFixed(1)}%</div>
                                            <div className={scorePill}>
                                                <BarChart3 className="h-4 w-4 text-[#3B82F6]" />
                                                Variacion +1.3% vs trimestre anterior
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={trendCol}>
                                <div className={trendWrap}>
                                    <div className={trendHeader}>
                                        <div>
                                            <div className={trendTitle}>Tendencia 90 dias</div>
                                            <div className={sectionHint}>Ejecuciones de score</div>
                                        </div>
                                        <div className={trendMeta}>+4.2%</div>
                                    </div>
                                    <div className={trendCanvas} />
                                    <div className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
                                        <span>Min 78.1</span>
                                        <span>Max 86.9</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={sectionBlock}>
                        <div className={sectionHeader} style={sectionHeaderStyle}>
                            <div className={sectionInfo}>
                                <div className={sectionTitle}>Insights operativos</div>
                                <div className={sectionHint}>Lecturas rapidas para seguimiento diario</div>
                            </div>
                            <button className={sectionAction}>Ver tendencias</button>
                        </div>
                        <div className={insightGrid}>
                            {miniTrends.map((trend) => (
                                <div key={trend.title} className={trendWrap}>
                                    <div className={trendHeader}>
                                        <div>
                                            <div className={trendTitle}>{trend.title}</div>
                                            <div className={sectionHint}>{trend.meta}</div>
                                        </div>
                                        <div className={trendMeta}>{trend.delta}</div>
                                    </div>
                                    <div className={trendCanvas} />
                                    <div className="mt-3 flex items-center justify-between text-xs text-[#94A3B8]">
                                        <span>Min {trend.min}</span>
                                        <span>Max {trend.max}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={sectionBlock}>
                        <div className={sectionHeader} style={sectionHeaderStyle}>
                            <div className={sectionInfo}>
                                <div className={sectionTitle}>Auditorias y hallazgos</div>
                                <div className={sectionHint}>Seguimiento del ciclo de validacion</div>
                            </div>
                            <button className={sectionAction}>Ver reportes</button>
                        </div>
                        <div className={bottomGrid}>
                            <div className={auditsCol}>
                                <div className={tableWrap}>
                                    <div className={tableHeader}>
                                        <div>
                                            <div className={tableTitle}>Auditorias recientes</div>
                                            <div className={tableSub}>Ultimas actualizaciones del ciclo</div>
                                        </div>
                                        <button className={sectionAction}>Ver todo</button>
                                    </div>
                                    <table className={tableEl}>
                                        <thead className={thead}>
                                            <tr>
                                                <th className={th}>ID</th>
                                                <th className={th}>Entidad</th>
                                                <th className={th}>Estado</th>
                                                <th className={th}>Responsable</th>
                                                <th className={th}>Actualizado</th>
                                            </tr>
                                        </thead>
                                        <tbody className={tbody}>
                                            {audits.map((audit) => (
                                                <tr key={audit.id} className={tr}>
                                                    <td className={td}>{audit.id}</td>
                                                    <td className={td}>{audit.entity}</td>
                                                    <td className={td}>
                                                        <span
                                                            className={
                                                                audit.status === "Activa"
                                                                    ? badgeActive
                                                                    : audit.status === "En progreso"
                                                                        ? badgeInProgress
                                                                        : badgeWarning
                                                            }
                                                        >
                                                            {audit.status}
                                                        </span>
                                                    </td>
                                                    <td className={`${td} ${tdMuted}`}>{audit.owner}</td>
                                                    <td className={`${td} ${tdMuted}`}>{audit.updated}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className={findingsCol}>
                                <div className={tableWrap}>
                                    <div className={tableHeader}>
                                        <div>
                                            <div className={tableTitle}>Hallazgos prioritarios</div>
                                            <div className={tableSub}>Seguimiento de severidad</div>
                                        </div>
                                        <button className={sectionAction}>Ir a hallazgos</button>
                                    </div>
                                    <table className={tableEl}>
                                        <thead className={thead}>
                                            <tr>
                                                <th className={th}>ID</th>
                                                <th className={th}>Hallazgo</th>
                                                <th className={th}>Severidad</th>
                                                <th className={th}>Actualizado</th>
                                            </tr>
                                        </thead>
                                        <tbody className={tbody}>
                                            {findings.map((finding) => (
                                                <tr
                                                    key={finding.id}
                                                    className={`${tr} ${finding.severity === "Critico" ? rowCritical : finding.severity === "Alto" ? rowWarning : ""}`}
                                                >
                                                    <td className={td}>{finding.id}</td>
                                                    <td className={td}>
                                                        <div className="font-semibold">{finding.title}</div>
                                                        <div className={`${tdMuted} text-xs`}>{finding.area}</div>
                                                    </td>
                                                    <td className={td}>
                                                        <span
                                                            className={
                                                                finding.severity === "Critico"
                                                                    ? badgeDanger
                                                                    : finding.severity === "Alto"
                                                                        ? badgeWarning
                                                                        : badgeInProgress
                                                            }
                                                        >
                                                            {finding.severity}
                                                        </span>
                                                    </td>
                                                    <td className={`${td} ${tdMuted}`}>{finding.updated}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className={alertsRow}>
                    <div className={`${card} ${cardPad} ${panelBlock}`}>
                        <div className={panelHeader}>
                            <div className={sectionInfo}>
                                <div className={sectionTitle}>Alertas operativas</div>
                                <div className={sectionHint}>Monitoreo de cambios y variaciones</div>
                            </div>
                            <button className={sectionAction}>Configurar</button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {alerts.map((alert) => (
                                <div key={alert.title} className={`${card} ${cardPad} flex items-start gap-3`}>
                                    <div className={statIconWrap}>
                                        {alert.trend === "down" && <TrendingDown className={statIcon} />}
                                        {alert.trend === "up" && <TrendingUp className={statIcon} />}
                                        {alert.trend === "flat" && <Activity className={statIcon} />}
                                    </div>
                                    <div>
                                        <div className={sectionTitle}>{alert.title}</div>
                                        <div className={`${sectionHint} mt-1`}>{alert.detail}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
