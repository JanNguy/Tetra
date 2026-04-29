import type { ReactNode } from "react";
import { Route, Tab } from "../types";
import { colors, getMethodColor } from "../constants/theme";

interface SidebarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    routes: Route[];
    selectedRouteId: string | null;
    setSelectedRouteId: (id: string | null) => void;
    selectedRouteIds: string[];
    isRouteSelectionMode: boolean;
    setIsRouteSelectionMode: (enabled: boolean) => void;
    onToggleRouteSelection: (id: string) => void;
    onDeleteSelectedRoutes: () => void;
    onAddRoute: () => void;
    methodFilter: string | null;
    setMethodFilter: (value: string | null) => void;
}

const methodCounts = (routes: Route[]) => ([
    { label: "All", value: null, count: routes.length },
    { label: "GET", value: "GET", count: routes.filter(route => route.method === "GET").length },
    { label: "POST", value: "POST", count: routes.filter(route => route.method === "POST").length },
    { label: "PUT", value: "PUT", count: routes.filter(route => route.method === "PUT").length },
    { label: "DELETE", value: "DELETE", count: routes.filter(route => route.method === "DELETE").length },
]);

export default function Sidebar({
    sidebarCollapsed,
    setSidebarCollapsed,
    activeTab,
    setActiveTab,
    routes,
    selectedRouteId,
    setSelectedRouteId,
    selectedRouteIds,
    isRouteSelectionMode,
    setIsRouteSelectionMode,
    onToggleRouteSelection,
    onDeleteSelectedRoutes,
    onAddRoute,
    methodFilter,
    setMethodFilter,
}: SidebarProps) {
    const filteredRoutes = methodFilter ? routes.filter(route => route.method === methodFilter) : routes;

    const navItems: Array<{ id: Tab; label: string; icon: ReactNode }> = [
        {
            id: "routes",
            label: "Collections",
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10" />
                </svg>
            ),
        },
        {
            id: "server",
            label: "Runtimes",
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h14M5 12h14M5 17h14" />
                </svg>
            ),
        },
        {
            id: "logs",
            label: "Console",
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                </svg>
            ),
        },
        {
            id: "settings",
            label: "Settings",
            icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8a4 4 0 100 8 4 4 0 000-8zm8 4l-2.2.8a7.8 7.8 0 01-.4 1l1 2-2 2-2-.9a7.8 7.8 0 01-1 .4L12 20l-1.2-2.2a7.8 7.8 0 01-1-.4l-2 .9-2-2 1-2a7.8 7.8 0 01-.4-1L4 12l2.2-.8a7.8 7.8 0 01.4-1l-1-2 2-2 2 .9a7.8 7.8 0 011-.4L12 4l1.2 2.2a7.8 7.8 0 011 .4l2-.9 2 2-1 2c.2.3.3.7.4 1L20 12z" />
                </svg>
            ),
        },
    ];

    return (
        <aside
            className={`flex shrink-0 flex-col border-r ${sidebarCollapsed ? "w-[76px]" : "w-[300px]"}`}
            style={{ backgroundColor: "#F9FAFB", borderColor: colors.border }}
        >
            <div className="border-b px-3 py-3" style={{ borderColor: colors.border }}>
                <div className="mb-3 flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: colors.textSoft }}>
                            Workspace
                        </p>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="rounded-md border p-1.5"
                        style={{ borderColor: colors.border, color: colors.textMuted }}
                    >
                        <svg className={`h-4 w-4 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-1">
                    {navItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex w-full items-center rounded-[10px] px-3 py-2 text-sm ${sidebarCollapsed ? "justify-center" : "gap-2.5"}`}
                                style={{
                                    backgroundColor: isActive ? "#EAF2FF" : "transparent",
                                    color: isActive ? colors.accent : colors.textMuted,
                                }}
                            >
                                {item.icon}
                                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {!sidebarCollapsed && (
                <div className="border-b px-3 py-3" style={{ borderColor: colors.border }}>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: colors.textSoft }}>
                            Requests
                        </p>
                        <button
                            onClick={() => setIsRouteSelectionMode(!isRouteSelectionMode)}
                            className="text-xs"
                            style={{ color: isRouteSelectionMode ? colors.accent : colors.textMuted }}
                        >
                            {isRouteSelectionMode ? "Done" : "Select"}
                        </button>
                    </div>

                    <button
                        onClick={onAddRoute}
                        className="mb-3 w-full rounded-[10px] px-3 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: colors.accent }}
                    >
                        New Request
                    </button>

                    <div className="flex flex-wrap gap-2">
                        {methodCounts(routes).map(item => (
                            <button
                                key={item.label}
                                onClick={() => setMethodFilter(item.value)}
                                className="rounded-full border px-2 py-1 text-[11px] font-semibold"
                                style={{
                                    borderColor: item.value === methodFilter ? "#B2CCFF" : colors.border,
                                    backgroundColor: item.value === methodFilter ? "#EAF2FF" : colors.surface,
                                    color: item.value === methodFilter ? colors.accent : colors.textMuted,
                                }}
                            >
                                {item.label} {item.count}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
                {!sidebarCollapsed && (
                    <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: colors.textSoft }}>
                        Collection
                    </div>
                )}

                <div className="space-y-1">
                    {filteredRoutes.map(route => {
                        const isSelected = selectedRouteId === route.id && activeTab === "routes";

                        return (
                            <button
                                key={route.id}
                                onClick={() => {
                                    if (isRouteSelectionMode) {
                                        onToggleRouteSelection(route.id);
                                        return;
                                    }
                                    setSelectedRouteId(route.id);
                                    setActiveTab("routes");
                                }}
                                className={`w-full rounded-[10px] border px-3 py-2 text-left ${sidebarCollapsed ? "flex justify-center" : ""}`}
                                style={{
                                    backgroundColor: isSelected ? "#FFFFFF" : "transparent",
                                    borderColor: isSelected ? "#BFD3F2" : "transparent",
                                }}
                            >
                                {sidebarCollapsed ? (
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-bold text-white ${getMethodColor(route.method)}`}>
                                        {route.method.slice(0, 1)}
                                    </span>
                                ) : (
                                    <div className="flex items-start gap-2.5">
                                        {isRouteSelectionMode && (
                                            <input
                                                type="checkbox"
                                                checked={selectedRouteIds.includes(route.id)}
                                                onChange={() => onToggleRouteSelection(route.id)}
                                                onClick={(event) => event.stopPropagation()}
                                                className="mt-1"
                                            />
                                        )}
                                        <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${getMethodColor(route.method)}`}>
                                            {route.method}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium" style={{ color: colors.textPrimary }}>
                                                {route.path}
                                            </p>
                                            {route.description && (
                                                <p className="truncate text-xs" style={{ color: colors.textMuted }}>
                                                    {route.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {!sidebarCollapsed && isRouteSelectionMode && (
                    <div className="sticky bottom-0 mt-3 rounded-[10px] border px-3 py-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: colors.textMuted }}>
                                {selectedRouteIds.length} selected
                            </span>
                            <button
                                onClick={onDeleteSelectedRoutes}
                                disabled={selectedRouteIds.length === 0}
                                className="text-xs font-semibold disabled:opacity-40"
                                style={{ color: colors.error }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
