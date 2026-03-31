"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_SHORT_NAME } from "@/config/app";
import {
  Archive,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Cpu,
  FlaskConical,
  GitBranch,
  History,
  LayoutDashboard,
  ListChecks,
  Network,
  Scale,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Trophy,
  UserRoundCheck,
  Users,
} from "lucide-react";
import type { ResolvedNavigationItem } from "@/shared/navigation";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  Network,
  ClipboardCheck,
  Scale,
  SlidersHorizontal,
  GitBranch,
  Cpu,
  Bell,
  FlaskConical,
  Trophy,
  History,
  Archive,
  Clock3,
  BriefcaseBusiness,
  CalendarCheck2,
  Users,
  ListChecks,
  UserRoundCheck,
  CheckSquare,
};

function resolveIcon(iconName?: string) {
  if (!iconName) return Shield;
  return ICON_MAP[iconName] ?? Shield;
}

function isActivePath(pathname: string, href?: string) {
  if (!href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarProps = {
  items: ResolvedNavigationItem[];
  loading?: boolean;
};

export default function Sidebar({ items, loading = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = sessionStorage.getItem("sidebar_expanded");
    if (saved) setExpandedSections(JSON.parse(saved));
  }, []);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items]
  );

  const toggleSection = (id: string) => {
    const next = { ...expandedSections, [id]: !expandedSections[id] };
    setExpandedSections(next);
    sessionStorage.setItem("sidebar_expanded", JSON.stringify(next));
  };

  return (
    <aside
      className="glass-card"
      style={{
        width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 0.75rem",
        borderRadius: "0",
        border: "none",
        borderRight: "1px solid var(--glass-border)",
        transition: "width var(--transition-speed) ease",
        margin: 0,
        background: "rgba(0,0,0,0.2)",
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 0.75rem", marginBottom: "2rem" }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--primary-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={20} color="white" />
            </div>
            <h1 className="gradient-text" style={{ fontSize: "1.25rem", fontWeight: "bold", letterSpacing: "0.1rem" }}>
              {APP_SHORT_NAME}
            </h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{ background: "none", border: "none", color: "var(--foreground)", cursor: "pointer", padding: "0.5rem" }}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", overflowX: "hidden" }}>
        {loading && !collapsed && (
          <div style={{ color: "var(--muted)", fontSize: "0.8rem", padding: "0.75rem" }}>
            Cargando navegación...
          </div>
        )}

        {!loading &&
          sortedItems.map((item) => {
            const Icon = resolveIcon(item.icon);
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const sectionExpanded = expandedSections[item.key] ?? true;
            const parentActive = isActivePath(pathname, item.href) || Boolean(item.children?.some((c) => isActivePath(pathname, c.href)));
            const dividerStyle = hasChildren
              ? { borderBottom: "1px solid rgba(220, 220, 220, 0.22)", paddingBottom: "0.35rem", marginBottom: "0.35rem" }
              : undefined;

            if (!hasChildren) {
              return (
                <div key={item.key} style={dividerStyle}>
                  <Link
                    href={item.href || "#"}
                    className={`sidebar-link ${parentActive ? "active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.7rem 0.75rem",
                      borderRadius: "10px",
                      color: parentActive ? "white" : "var(--foreground)",
                      textDecoration: "none",
                      transition: "all 0.2s ease",
                      fontSize: "0.85rem",
                      background: parentActive ? "var(--primary-glow)" : "transparent",
                      position: "relative",
                    }}
                  >
                    <Icon size={18} color="var(--primary)" />
                    {!collapsed && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                        {item.label}
                        {item.badge && (
                          <span
                            style={{
                              borderRadius: "999px",
                              padding: "0.1rem 0.45rem",
                              fontSize: "0.62rem",
                              textTransform: "uppercase",
                              border: "1px solid var(--glass-border)",
                              color: "var(--primary)",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                </div>
              );
            }

            return (
              <div key={item.key} style={{ marginBottom: "0.25rem", ...dividerStyle }}>
                {!collapsed ? (
                  <button
                    onClick={() => toggleSection(item.key)}
                    style={{
                      width: "100%",
                      border: "none",
                      background: parentActive ? "rgba(255,255,255,0.06)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.8rem",
                      color: parentActive ? "var(--primary)" : "var(--muted)",
                      padding: "0.7rem 0.75rem",
                      cursor: "pointer",
                      borderRadius: "8px",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem", fontWeight: 600 }}>
                      <Icon size={16} color="var(--primary)" />
                      {item.label}
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: sectionExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>
                ) : (
                  <div style={{ padding: "0.7rem 0.75rem", borderTop: "1px solid var(--glass-border)", opacity: 0.3 }} />
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.2rem",
                    height: collapsed || sectionExpanded ? "auto" : "0",
                    overflow: "hidden",
                  }}
                >
                  {item.children?.map((child) => {
                    const ChildIcon = resolveIcon(child.icon);
                    const active = isActivePath(pathname, child.href);
                    return (
                      <Link
                        key={child.key}
                        href={child.href || "#"}
                        className={`sidebar-link ${active ? "active" : ""}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          padding: "0.65rem 0.75rem 0.65rem 1.15rem",
                          marginLeft: collapsed ? "0" : "0.8rem",
                          borderRadius: "10px",
                          color: active ? "white" : "var(--foreground)",
                          textDecoration: "none",
                          transition: "all 0.2s ease",
                          fontSize: "0.82rem",
                          background: active ? "var(--primary-glow)" : "transparent",
                        }}
                      >
                        <ChildIcon size={16} color="var(--primary)" />
                        {!collapsed && <span>{child.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </nav>
    </aside>
  );
}
