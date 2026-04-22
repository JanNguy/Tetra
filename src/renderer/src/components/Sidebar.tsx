import { Route, Tab } from "../types";
import { colors, getMethodColor, getStatusColor } from "../constants/theme";

interface SidebarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    routes: Route[];
    selectedRouteId: string | null;
    setSelectedRouteId: (id: string) => void;
    onAddRoute: () => void;
    methodFilter: string | null;
}

export default function Sidebar({
    sidebarCollapsed,
    setSidebarCollapsed,
    activeTab,
    setActiveTab,
    routes,
    selectedRouteId,
    setSelectedRouteId,
    onAddRoute,
    methodFilter,
}: SidebarProps) {
    const filteredRoutes = methodFilter ? routes.filter(r => r.method === methodFilter) : routes;

    return (
        <aside
            className={`flex flex-col border-r transition-all duration-200 ${
                sidebarCollapsed ? 'w-16' : 'w-72'
            }`}
            style={{ backgroundColor: colors.secondary, borderColor: colors.border }}
        >
            <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                {!sidebarCollapsed && (
                    <div className="flex items-center justify-between mb-3">
                        <span
                            className="text-sm font-medium"
                            style={{ color: colors.textSecondary }}
                        >
                            Navigation
                        </span>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto p-2">
                <button
                    onClick={() => setActiveTab('routes')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                        activeTab === 'routes' ? '' : 'hover:bg-slate-700'
                    }`}
                    style={{
                        backgroundColor:
                            activeTab === 'routes' ? colors.surface : 'transparent',
                    }}
                >
                    <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        stroke={activeTab === 'routes' ? colors.accent : colors.textMuted}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                    {!sidebarCollapsed && (
                        <span
                            className="text-sm font-medium"
                            style={{
                                color:
                                    activeTab === 'routes'
                                        ? colors.textPrimary
                                        : colors.textSecondary,
                            }}
                        >
                            Routes
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('server')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                        activeTab === 'server' ? '' : 'hover:bg-slate-700'
                    }`}
                    style={{
                        backgroundColor:
                            activeTab === 'server' ? colors.surface : 'transparent',
                    }}
                >
                    <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        stroke={activeTab === 'server' ? colors.accent : colors.textMuted}
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                        />
                    </svg>
                    {!sidebarCollapsed && (
                        <span
                            className="text-sm font-medium"
                            style={{
                                color:
                                    activeTab === 'server'
                                        ? colors.textPrimary
                                        : colors.textSecondary,
                            }}
                        >
                            Server
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('settings')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                        activeTab === 'settings' ? '' : 'hover:bg-slate-700'
                    }`}
                    style={{
                        backgroundColor:
                            activeTab === 'settings'
                                ? colors.surface
                                : 'transparent',
                    }}
                >
                    <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        stroke={
                            activeTab === 'settings'
                                ? colors.accent
                                : colors.textMuted
                        }
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    {!sidebarCollapsed && (
                        <span
                            className="text-sm font-medium"
                            style={{
                                color:
                                    activeTab === 'settings'
                                        ? colors.textPrimary
                                        : colors.textSecondary,
                            }}
                        >
                            Settings
                        </span>
                    )}
                </button>

                <div className="border-t my-3" style={{ borderColor: colors.border }} />

                {!sidebarCollapsed && (
                    <div className="px-3 mb-2 flex items-center justify-between">
                        <span
                            className="text-xs font-medium uppercase tracking-wide"
                            style={{ color: colors.textMuted }}
                        >
                            Routes
                        </span>
                        <button
                            onClick={onAddRoute}
                            className="hover:text-white transition-colors"
                            title="Add Route"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                        </button>
                    </div>
                )}
                {filteredRoutes.map((route) => (
                    <button
                        key={route.id}
                        onClick={() => {
                            setSelectedRouteId(route.id);
                            setActiveTab('routes');
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                            selectedRouteId === route.id && activeTab === 'routes'
                                ? ''
                                : 'hover:bg-slate-700'
                        }`}
                        style={{
                            backgroundColor:
                                selectedRouteId === route.id && activeTab === 'routes'
                                    ? colors.surface
                                    : 'transparent',
                        }}
                    >
                        <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                                getMethodColor(route.method)
                            }`}
                        >
                            {route.method}
                        </span>
                        {!sidebarCollapsed && (
                            <span
                                className="flex-1 text-left text-sm font-mono truncate"
                                style={{ color: colors.textPrimary }}
                            >
                                {route.path}
                            </span>
                        )}
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                                backgroundColor: getStatusColor(route.status),
                            }}
                        />
                    </button>
                ))}
            </nav>

            <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-3 border-t hover:bg-slate-700 transition-colors flex justify-center"
                style={{ borderColor: colors.border }}
            >
                <svg
                    className={`w-4 h-4 transition-transform ${
                        sidebarCollapsed ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke={colors.textMuted}
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                </svg>
            </button>
        </aside>
    );
}
