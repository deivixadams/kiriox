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

    // KPI Card - Dark theme with new layout format
    const statCardWrap = "rounded-2xl p-8 flex flex-col relative overflow-hidden min-h-[220px] bg-[#111A2E] ring-1 ring-white/5 shadow-lg transition hover:bg-[#16223B]";
    const statIconWrap = "absolute top-6 right-6 h-12 w-12 flex items-center justify-center opacity-10";
    const statIcon = "h-10 w-10 text-[#3B82F6]";
    const statLabel = "text-[14px] font-bold uppercase tracking-[0.1em] text-[#3B82F6]";
    const statValue = "mt-4 text-[52px] font-bold text-[#F1F5F9] tabular-nums leading-none";
    const statMetaWrap = "mt-auto flex items-end justify-between w-full";
    const statTrend = "flex items-center gap-1.5 text-[14px] text-[#94A3B8] font-medium";
    const statTrendIcon = "h-4 w-4 text-[#10B981]";
    const statGraph = "w-24 h-10";

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

    const badgeBase = "inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset uppercase tracking-wider";
    const badgeActive = `${badgeBase} bg-[#f97316] text-white ring-[#fdba74]/30`;
    const badgeInProgress = `${badgeBase} bg-[#f97316] text-white ring-[#fdba74]/30`;
    const badgeWarning = `${badgeBase} bg-[rgba(245,158,11,0.12)] text-[#F59E0B] ring-[rgba(245,158,11,0.25)]`;
    const badgeDanger = `${badgeBase} bg-[rgba(239,68,68,0.12)] text-[#EF4444] ring-[rgba(239,68,68,0.25)]`;
    const badgeSuccess = `${badgeBase} bg-[#10b981] text-white ring-[#6ee7b7]/30`;

    const riskPill = "inline-flex items-center rounded-lg px-4 py-2 text-[12px] font-medium bg-[#10b981]/10 text-[#10b981] ring-1 ring-[#10b981]/20";
    const riskPillHigh = "inline-flex items-center rounded-lg px-4 py-2 text-[12px] font-medium bg-[#10b981]/10 text-[#10b981] ring-1 ring-[#10b981]/20";

    const auditorAvatar = "h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center";

    const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3B82F6] transition ring-1 ring-inset ring-white/10";
    const btnGhost = "inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-semibold text-[#F1F5F9] hover:bg-white/10 transition ring-1 ring-inset ring-white/10";

    const pageWrap = "min-h-screen bg-[#0B1220]";
    const pageContainer = "mx-auto w-full max-w-[1400px] px-6 py-16";
    const pageTitle = "text-3xl font-semibold text-[#F1F5F9]";
    const pageSubtitle = "mt-2 max-w-3xl text-sm text-[#94A3B8] leading-relaxed";
    const pageSections = "mt-32 flex flex-col gap-[6rem]";
    const topGrid = "mt-10 mb-16 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6";
    const midGrid = "mt-10 mb-16 grid grid-cols-1 gap-6";
    const insightGrid = "mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
    const heroCol = "col-span-1";
    const trendCol = "col-span-1";
    const bottomGrid = "mt-10 grid grid-cols-1 xl:grid-cols-12 gap-6";
    const auditsCol = "xl:col-span-7";
    const findingsCol = "xl:col-span-5";
    const alertsRow = "mt-20";

    const kpiItems = [
        { label: "Total Requerimientos", value: "102", meta: "+12.5% vs last month", icon: ClipboardList, trend: "up" },
        { label: "Dominios Activos", value: "12", meta: "+2 vs last period", icon: Shield, trend: "up" },
        { label: "Riesgos Críticos", value: "08", meta: "-15.2% vs last month", icon: AlertTriangle, trend: "down" },
        { label: "Controles Efectivos", value: "41", meta: "Stable", icon: CheckCircle2, trend: "up" }
    ];

    const audits = [
        {
            id: "AUD-2026-001",
            objective: "Evaluar controles operativos y tecnológicos críticos",
            auditor: "Laura Méndez",
            auditorRole: "AUDITOR PRINCIPAL",
            risk: "Riesgo medio por procesos manuales",
            status: "EN CURSO",
            date: "1/10/2026",
            dateLabel: "CALENDARIO"
        },
        {
            id: "AUD-2025-011",
            objective: "Revisar cumplimiento normativo y riesgos de fraude",
            auditor: "Carlos Ríos",
            auditorRole: "AUDITOR PRINCIPAL",
            risk: "Riesgo alto por crecimiento acelerado",
            status: "CERRADA",
            date: "11/5/2025",
            dateLabel: "CALENDARIO"
        }
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
                                        <div className={statLabel}>{item.label}</div>
                                        <div className={statValue}>{item.value}</div>

                                        <div className={statMetaWrap}>
                                            <div className={statTrend}>
                                                {item.trend === "up" ? (
                                                    <TrendingUp className={statTrendIcon} />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-[#EF4444]" />
                                                )}
                                                <span>{item.meta}</span>
                                            </div>
                                            <div className={statGraph}>
                                                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                                                    <path
                                                        d="M0 30 Q 25 35, 40 20 T 70 25 T 100 10"
                                                        fill="none"
                                                        stroke={item.trend === "up" ? "#3B82F6" : "#EF4444"}
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                            </div>
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
                                <div className={sectionTitle}>Hallazgos prioritarios</div>
                                <div className={sectionHint}>Seguimiento de severidad y criticidad</div>
                            </div>
                            <button className={sectionAction}>Ver todos los hallazgos</button>
                        </div>
                        <div className={tableWrap}>
                            <div className={tableHeader} style={{ background: "transparent", padding: "1.5rem" }}>
                                <div className="text-sm font-semibold text-[#F1F5F9]">Tabla de Hallazgos</div>
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
                    </section>

                    <section className={sectionBlock}>
                        <div className={sectionHeader} style={sectionHeaderStyle}>
                            <div className={sectionInfo}>
                                <div className={sectionTitle}>Análisis Comparativo</div>
                                <div className={sectionHint}>Evolución histórica de métricas de cumplimiento (Últimos 3 años)</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#8B5CF6]" /> Auditorías 2024</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#10B981]" /> Auditorías 2025</span>
                                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Auditorías 2026</span>
                                </div>
                                <button className="rounded bg-white/5 px-2 py-1 text-[10px] font-bold text-[#F1F5F9] uppercase tracking-widest">Vista Anual</button>
                            </div>
                        </div>
                        <div className={`${card} p-10 relative overflow-hidden bg-[#111A2E]/50`}>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/20">
                                    <TrendingUp className="h-5 w-5 text-[#3B82F6]" />
                                </div>
                                <div className="text-lg font-bold text-[#F1F5F9]">Análisis Comparativo de <span className="text-[#3B82F6] italic">Hallazgos</span></div>
                            </div>

                            <div className="relative h-[300px] w-full">
                                {/* Simple Grid */}
                                <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                                    {[0, 15, 30, 45, 60].reverse().map(val => (
                                        <div key={val} className="flex items-center gap-4 w-full">
                                            <span className="text-[10px] text-white w-4">{val}</span>
                                            <div className="h-px bg-white flex-1" />
                                        </div>
                                    ))}
                                </div>

                                {/* Chart SVG */}
                                <svg className="absolute inset-x-8 inset-y-0 h-full w-[calc(100%-4rem)] overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                    {/* Line 2024 (Purple) */}
                                    <path
                                        d="M0 250 Q 150 260, 300 240 T 600 200 T 900 180 T 1000 120"
                                        fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round"
                                    />
                                    {/* Line 2025 (Green) */}
                                    <path
                                        d="M0 200 Q 200 150, 400 180 T 700 150 T 1000 160"
                                        fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"
                                    />
                                    {/* Line 2026 (Orange) */}
                                    <path
                                        d="M0 280 Q 250 100, 500 150 T 800 120 T 1000 110"
                                        fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"
                                    />

                                    {/* Tooltip Point */}
                                    <circle cx="150" cy="180" r="5" fill="#F59E0B" />
                                </svg>

                                {/* Timeline selector mock */}
                                <div className="absolute -bottom-6 inset-x-8 h-4 rounded-full bg-white/5 border border-white/10 flex items-center px-2">
                                    <div className="h-2 w-2 rounded-full bg-white/20" />
                                    <div className="flex-1 h-px bg-white/10 mx-2" />
                                    <div className="h-2 w-2 rounded-full bg-white/20" />
                                </div>
                            </div>

                            <div className="mt-12 flex justify-between px-8 text-[10px] font-bold text-[#94A3B8] uppercase">
                                <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span>
                            </div>
                        </div>
                    </section>

                    <section className={sectionBlock}>
                        <div className={sectionHeader} style={sectionHeaderStyle}>
                            <div className={sectionInfo}>
                                <div className={sectionTitle}>Control de Auditoría</div>
                                <div className={sectionHint}>Vista global de ejecuciones reglamentarias</div>
                            </div>
                            <button className={sectionAction}>Descargar Reporte</button>
                        </div>
                        <div className={tableWrap}>
                            <div className={tableHeader} style={{ background: "transparent", padding: "2rem 1.5rem" }}>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/20">
                                        <Activity className="h-5 w-5 text-[#3B82F6]" />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-[#F1F5F9]">Auditorías <span className="text-[#3B82F6] italic">Realizadas</span></div>
                                        <div className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-bold">CONTROL DE EJECUCIÓN EN TIEMPO REAL</div>
                                    </div>
                                </div>
                            </div>
                            <table className={tableEl}>
                                <thead className="text-[10px] uppercase tracking-widest text-[#94A3B8]/60 font-bold">
                                    <tr>
                                        <th className="px-6 py-4 text-left">AUDITORÍA / OBJETIVO</th>
                                        <th className="px-6 py-4 text-left">AUDITOR LÍDER</th>
                                        <th className="px-6 py-4 text-center">NIVEL RIESGO</th>
                                        <th className="px-6 py-4 text-center">ESTADO</th>
                                        <th className="px-6 py-4 text-right">FECHA INICIO</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {audits.map((audit) => (
                                        <tr key={audit.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-6">
                                                <div className="font-bold text-[#F1F5F9] text-[15px]">{audit.id}</div>
                                                <div className="text-xs text-[#94A3B8] mt-1">{audit.objective}</div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={auditorAvatar}>
                                                        <Shield className="h-5 w-5 text-[#94A3B8]" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-[#F1F5F9] text-[14px]">{audit.auditor}</div>
                                                        <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{audit.auditorRole}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={audit.id === "AUD-2025-011" ? "inline-flex items-center rounded-lg px-4 py-2 text-[12px] font-medium bg-[#f97316]/10 text-[#f97316] ring-1 ring-[#f97316]/20" : riskPill}>
                                                    {audit.risk}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <span className={audit.status === "EN CURSO" ? badgeActive : badgeSuccess}>
                                                    {audit.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="font-bold text-[#F1F5F9] text-[15px]">{audit.date}</div>
                                                <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">{audit.dateLabel}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
