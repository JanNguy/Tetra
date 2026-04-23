import { Route } from "../../types";
import { colors, getMethodColor, getStatusColor } from "../../constants/theme";

interface RoutesTabProps {
    selectedRoute: Route | undefined;
    updateRoute: (id: string, field: keyof Route, value: any) => void;
    deleteRoute: (id: string) => void;
}

export default function RoutesTab({
    selectedRoute,
    updateRoute,
    deleteRoute,
}: RoutesTabProps) {
    const requestConfig = selectedRoute?.request || {
        query: "",
        headers: "",
        body: "",
    };

    if (!selectedRoute) {
        return (
            <div className="flex-1 overflow-y-auto p-6">
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <div
                            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ backgroundColor: colors.surface }}
                        >
                            <svg
                                className="w-8 h-8"
                                fill="none"
                                stroke={colors.textMuted}
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                        </div>
                        <p
                            className="text-lg font-medium"
                            style={{ color: colors.textSecondary }}
                        >
                            Select a route
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: colors.textMuted }}
                        >
                            Choose a route from the sidebar to view details
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div
                    className="rounded-xl p-6 border"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                    <div className="flex items-center gap-4 mb-4">
                        <select
                            value={selectedRoute.method}
                            onChange={(e) =>
                                updateRoute(selectedRoute.id, 'method', e.target.value)
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-bold appearance-none cursor-pointer focus:outline-none ${getMethodColor(
                                selectedRoute.method
                            )}`}
                            style={{ color: 'white' }}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                        </select>
                        <input
                            type="text"
                            value={selectedRoute.path}
                            onChange={(e) =>
                                updateRoute(selectedRoute.id, 'path', e.target.value)
                            }
                            className="flex-1 bg-transparent text-xl font-mono focus:outline-none border-b border-transparent hover:border-slate-600 focus:border-blue-500 transition-colors"
                            style={{ color: colors.textPrimary }}
                        />
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedRoute.status}
                                onChange={(e) =>
                                    updateRoute(
                                        selectedRoute.id,
                                        'status',
                                        e.target.value
                                    )
                                }
                                className="bg-transparent text-sm capitalize cursor-pointer focus:outline-none border border-slate-700 rounded px-2 py-1"
                                style={{
                                    color: getStatusColor(selectedRoute.status),
                                }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                        <button
                            onClick={() => deleteRoute(selectedRoute.id)}
                            className="p-2 rounded hover:bg-red-900/30 text-red-500 transition-colors"
                            title="Delete Route"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    </div>
                    <input
                        type="text"
                        value={selectedRoute.description}
                        onChange={(e) =>
                            updateRoute(selectedRoute.id, 'description', e.target.value)
                        }
                        placeholder="Route description..."
                        className="w-full text-sm bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:outline-none transition-colors pb-1"
                        style={{ color: colors.textSecondary }}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div
                        className="rounded-xl p-5 border"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                        <h3
                            className="text-xs font-medium uppercase tracking-wide mb-3"
                            style={{ color: colors.textMuted }}
                        >
                            Status Code
                        </h3>
                        <input
                            type="number"
                            value={selectedRoute.statusCode}
                            onChange={(e) =>
                                updateRoute(
                                    selectedRoute.id,
                                    'statusCode',
                                    parseInt(e.target.value) || 200
                                )
                            }
                            className="w-full text-3xl font-bold font-mono bg-transparent focus:outline-none border-b border-transparent hover:border-slate-600 focus:border-blue-500 pb-1"
                            style={{
                                color:
                                    selectedRoute.statusCode >= 200 &&
                                    selectedRoute.statusCode < 300
                                        ? colors.success
                                        : selectedRoute.statusCode >= 400
                                          ? colors.error
                                          : colors.warning,
                            }}
                        />
                    </div>

                    <div
                        className="rounded-xl p-5 border"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                        <h3
                            className="text-xs font-medium uppercase tracking-wide mb-3"
                            style={{ color: colors.textMuted }}
                        >
                            Delay (ms)
                        </h3>
                        <input
                            type="number"
                            min="0"
                            value={selectedRoute.delay || 0}
                            onChange={(e) =>
                                updateRoute(
                                    selectedRoute.id,
                                    'delay',
                                    parseInt(e.target.value) || 0
                                )
                            }
                            className="w-full text-3xl font-bold font-mono bg-transparent focus:outline-none border-b border-transparent hover:border-slate-600 focus:border-blue-500 pb-1"
                            style={{ color: colors.textPrimary }}
                        />
                    </div>

                    <div
                        className="col-span-2 rounded-xl p-5 border"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                        <h3
                            className="text-xs font-medium uppercase tracking-wide mb-3"
                            style={{ color: colors.textMuted }}
                        >
                            Response Headers
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(selectedRoute.headers).map(
                                ([key, value]) => (
                                    <div key={key} className="flex gap-4 font-mono text-sm">
                                        <span style={{ color: colors.accent }}>
                                            {key}:
                                        </span>
                                        <span
                                            style={{ color: colors.textSecondary }}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                )
                            )}
                            {Object.keys(selectedRoute.headers).length === 0 && (
                                <span
                                    className="text-sm italic"
                                    style={{ color: colors.textMuted }}
                                >
                                    No headers configured
                                </span>
                            )}
                        </div>
                    </div>

                    <div
                        className="col-span-2 rounded-xl p-5 border flex flex-col"
                        style={{ backgroundColor: colors.primary, borderColor: colors.border }}
                    >
                        <h3
                            className="text-xs font-medium uppercase tracking-wide mb-3"
                            style={{ color: colors.textMuted }}
                        >
                            Response Body
                        </h3>
                        <textarea
                            value={selectedRoute.body || ''}
                            onChange={(e) =>
                                updateRoute(selectedRoute.id, 'body', e.target.value)
                            }
                            className="w-full flex-1 min-h-[150px] font-mono text-sm p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            style={{
                                backgroundColor: colors.background,
                                color: colors.textPrimary,
                                resize: 'vertical',
                            }}
                        />
                    </div>

                    <div
                        className="col-span-2 rounded-xl p-5 border"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                        <div className="mb-4">
                            <h3
                                className="text-xs font-medium uppercase tracking-wide mb-2"
                                style={{ color: colors.textMuted }}
                            >
                                Request
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: colors.textSecondary }}
                            >
                                Define the variables expected from query params, headers and body. Use them in the response with <span className="font-mono">$name</span>, <span className="font-mono">$body.email</span> or <span className="font-mono">$headers.authorization</span>.
                            </p>
                        </div>

                        <div
                            className="flex items-center justify-between rounded-lg p-4 mb-4"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <div>
                                <p style={{ color: colors.textPrimary }}>
                                    Error If Missing Variable
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: colors.textMuted }}
                                >
                                    Return `400` if a configured field or a `$variable` used in the response is missing in the real request.
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    updateRoute(
                                        selectedRoute.id,
                                        "errorOnMissingVariables",
                                        !selectedRoute.errorOnMissingVariables
                                    )
                                }
                                className="relative w-14 h-7 rounded-full transition-colors"
                                style={{
                                    backgroundColor: selectedRoute.errorOnMissingVariables
                                        ? colors.accent
                                        : colors.border,
                                }}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                        selectedRoute.errorOnMissingVariables
                                            ? "translate-x-7"
                                            : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <p
                                    className="text-xs uppercase tracking-wide mb-2"
                                    style={{ color: colors.textMuted }}
                                >
                                    Query Example
                                </p>
                                <textarea
                                    value={requestConfig.query}
                                    onChange={(e) =>
                                        updateRoute(selectedRoute.id, "request", {
                                            ...requestConfig,
                                            query: e.target.value,
                                        })
                                    }
                                    placeholder={'{\n  "search": "",\n  "page": ""\n}'}
                                    className="w-full min-h-[92px] font-mono text-sm p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: colors.background,
                                        color: colors.textPrimary,
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            <div>
                                <p
                                    className="text-xs uppercase tracking-wide mb-2"
                                    style={{ color: colors.textMuted }}
                                >
                                    Headers Example
                                </p>
                                <textarea
                                    value={requestConfig.headers}
                                    onChange={(e) =>
                                        updateRoute(selectedRoute.id, "request", {
                                            ...requestConfig,
                                            headers: e.target.value,
                                        })
                                    }
                                    placeholder={'{\n  "authorization": "",\n  "x-api-key": ""\n}'}
                                    className="w-full min-h-[92px] font-mono text-sm p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: colors.background,
                                        color: colors.textPrimary,
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            <div>
                                <p
                                    className="text-xs uppercase tracking-wide mb-2"
                                    style={{ color: colors.textMuted }}
                                >
                                    Body Example
                                </p>
                                <textarea
                                    value={requestConfig.body}
                                    onChange={(e) =>
                                        updateRoute(selectedRoute.id, "request", {
                                            ...requestConfig,
                                            body: e.target.value,
                                        })
                                    }
                                    placeholder={'{\n  "name": "",\n  "email": ""\n}'}
                                    className="w-full min-h-[92px] font-mono text-sm p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    style={{
                                        backgroundColor: colors.background,
                                        color: colors.textPrimary,
                                        resize: "vertical",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
