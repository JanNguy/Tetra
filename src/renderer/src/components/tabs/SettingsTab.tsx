import type { KeyboardEvent } from "react";
import { ServerSettings } from "../../types";
import { colors } from "../../constants/theme";

interface SettingsTabProps {
    serverSettings: ServerSettings;
    handleSettingChange: (key: keyof ServerSettings, value: ServerSettings[keyof ServerSettings]) => void;
    isPortAvailable: boolean | null;
    serverStatus: "stopped" | "running";
}

function Toggle({
    checked,
    onClick,
}: {
    checked: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="relative h-8 w-14 rounded-full transition-colors"
            style={{ backgroundColor: checked ? colors.accent : colors.borderStrong }}
        >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
        </button>
    );
}

export default function SettingsTab({
    serverSettings,
    handleSettingChange,
    isPortAvailable,
    serverStatus,
}: SettingsTabProps) {
    const routeDefaults = serverSettings.routeDefaults;

    const updateRouteDefaults = (
        key: keyof ServerSettings["routeDefaults"],
        value: ServerSettings["routeDefaults"][keyof ServerSettings["routeDefaults"]]
    ) => {
        handleSettingChange("routeDefaults", {
            ...routeDefaults,
            [key]: value,
        });
    };

    const handleEditorKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>,
        value: string,
        onValueChange: (nextValue: string) => void
    ) => {
        if (event.key !== "Tab") {
            return;
        }

        event.preventDefault();
        const { selectionStart, selectionEnd } = event.currentTarget;
        const nextValue = `${value.slice(0, selectionStart)}    ${value.slice(selectionEnd)}`;
        onValueChange(nextValue);

        requestAnimationFrame(() => {
            event.currentTarget.selectionStart = selectionStart + 4;
            event.currentTarget.selectionEnd = selectionStart + 4;
        });
    };

    return (
        <div className="subtle-grid flex-1 overflow-y-auto p-6">
            <div className="mb-5">
                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em]" style={{ color: colors.textPrimary }}>
                    Tune the runtime defaults
                </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
                <section className="space-y-6">
                    <div className="soft-card rounded-[24px] p-6">
                        <div className="mb-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.textSoft }}>
                                Server
                            </p>
                            <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
                                Name the workspace runtime, pick a port, and choose the active execution engine.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium" style={{ color: colors.textSecondary }}>
                                    Server Name
                                </label>
                                <input
                                    type="text"
                                    value={serverSettings.name}
                                    onChange={(event) => handleSettingChange("name", event.target.value)}
                                    className="focus-ring field-shell w-full rounded-[18px] px-4 py-3 text-sm"
                                    style={{ color: colors.textPrimary }}
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium" style={{ color: colors.textSecondary }}>
                                    Port
                                </label>
                                <input
                                    type="text"
                                    value={serverSettings.port}
                                    disabled={serverStatus === "running"}
                                    onChange={(event) => handleSettingChange("port", event.target.value)}
                                    className={`focus-ring field-shell w-full rounded-[18px] px-4 py-3 text-sm font-medium ${serverStatus === "running" ? "cursor-not-allowed opacity-60" : ""}`}
                                    style={{
                                        color: colors.textPrimary,
                                        borderColor: isPortAvailable === false ? "rgba(255, 59, 48, 0.35)" : colors.border,
                                    }}
                                />
                                <p className="mt-2 text-xs" style={{ color: isPortAvailable === false ? colors.error : colors.textMuted }}>
                                    {serverStatus === "running"
                                        ? "Port cannot change while the runtime is active."
                                        : isPortAvailable === false
                                          ? "This port is already in use."
                                          : "Available for launch."}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium" style={{ color: colors.textSecondary }}>
                                    Runtime
                                </label>
                                <select
                                    value={serverSettings.runtime}
                                    disabled={serverStatus === "running"}
                                    onChange={(event) => handleSettingChange("runtime", event.target.value as ServerSettings["runtime"])}
                                    className={`focus-ring field-shell w-full rounded-[18px] px-4 py-3 text-sm ${serverStatus === "running" ? "cursor-not-allowed opacity-60" : ""}`}
                                    style={{ color: colors.textPrimary }}
                                >
                                    <option value="local">Node.js</option>
                                    <option value="podman">Podman</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium" style={{ color: colors.textSecondary }}>
                                    Global Delay (ms)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={serverSettings.delay}
                                    onChange={(event) => handleSettingChange("delay", parseInt(event.target.value, 10) || 0)}
                                    className="focus-ring field-shell w-full rounded-[18px] px-4 py-3 text-sm"
                                    style={{ color: colors.textPrimary }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="soft-card rounded-[24px] p-6">
                        <div className="mb-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.textSoft }}>
                                Access & Logging
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-[20px] border px-4 py-4" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                        Enable CORS
                                    </p>
                                    <p className="text-xs" style={{ color: colors.textMuted }}>
                                        Allow browser clients to access the mock API.
                                    </p>
                                </div>
                                <Toggle checked={serverSettings.corsEnabled} onClick={() => handleSettingChange("corsEnabled", !serverSettings.corsEnabled)} />
                            </div>

                            {serverSettings.corsEnabled && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium" style={{ color: colors.textSecondary }}>
                                        Allowed Origin
                                    </label>
                                    <input
                                        type="text"
                                        value={serverSettings.corsOrigin}
                                        onChange={(event) => handleSettingChange("corsOrigin", event.target.value)}
                                        className="focus-ring field-shell w-full rounded-[18px] px-4 py-3 text-sm"
                                        style={{ color: colors.textPrimary }}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between rounded-[20px] border px-4 py-4" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                        Log Requests
                                    </p>
                                    <p className="text-xs" style={{ color: colors.textMuted }}>
                                        Keep inbound traffic visible in the stream.
                                    </p>
                                </div>
                                <Toggle checked={serverSettings.logRequests} onClick={() => handleSettingChange("logRequests", !serverSettings.logRequests)} />
                            </div>

                            <div className="flex items-center justify-between rounded-[20px] border px-4 py-4" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                        Log Responses
                                    </p>
                                    <p className="text-xs" style={{ color: colors.textMuted }}>
                                        Include response payload activity in the stream.
                                    </p>
                                </div>
                                <Toggle checked={serverSettings.logResponses} onClick={() => handleSettingChange("logResponses", !serverSettings.logResponses)} />
                            </div>
                        </div>
                    </div>

                    <div className="soft-card rounded-[24px] p-6">
                        <div className="mb-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.textSoft }}>
                                Route Defaults
                            </p>
                            <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
                                Preconfigure what a newly created route looks like so common mocks are faster to create.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <select
                                value={routeDefaults.method}
                                onChange={(event) => updateRouteDefaults("method", event.target.value as ServerSettings["routeDefaults"]["method"])}
                                className="focus-ring field-shell rounded-[18px] px-4 py-3 text-sm"
                                style={{ color: colors.textPrimary }}
                            >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
                            </select>

                            <input
                                type="text"
                                value={routeDefaults.path}
                                onChange={(event) => updateRouteDefaults("path", event.target.value)}
                                className="focus-ring field-shell rounded-[18px] px-4 py-3 text-sm"
                                style={{ color: colors.textPrimary }}
                            />

                            <input
                                type="text"
                                value={routeDefaults.description}
                                onChange={(event) => updateRouteDefaults("description", event.target.value)}
                                className="focus-ring field-shell rounded-[18px] px-4 py-3 text-sm"
                                style={{ color: colors.textPrimary }}
                            />

                            <input
                                type="number"
                                min="0"
                                value={routeDefaults.statusCode}
                                onChange={(event) => updateRouteDefaults("statusCode", parseInt(event.target.value, 10) || 200)}
                                className="focus-ring field-shell rounded-[18px] px-4 py-3 text-sm"
                                style={{ color: colors.textPrimary }}
                            />
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <textarea
                                value={routeDefaults.headers}
                                onChange={(event) => updateRouteDefaults("headers", event.target.value)}
                                onKeyDown={(event) => handleEditorKeyDown(event, routeDefaults.headers, (nextValue) => updateRouteDefaults("headers", nextValue))}
                                placeholder='{"Content-Type":"application/json"}'
                                className="focus-ring field-shell min-h-[180px] rounded-[20px] p-4 font-mono text-sm"
                                style={{ color: colors.textPrimary, resize: "vertical" }}
                            />
                            <textarea
                                value={routeDefaults.body}
                                onChange={(event) => updateRouteDefaults("body", event.target.value)}
                                onKeyDown={(event) => handleEditorKeyDown(event, routeDefaults.body, (nextValue) => updateRouteDefaults("body", nextValue))}
                                placeholder='{"message":"Hello World"}'
                                className="focus-ring field-shell min-h-[180px] rounded-[20px] p-4 font-mono text-sm"
                                style={{ color: colors.textPrimary, resize: "vertical" }}
                            />
                        </div>
                    </div>
                </section>

                <aside className="space-y-6">
                    <div className="soft-card rounded-[24px] p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.textSoft }}>
                            Active Summary
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                    Runtime
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                    {serverSettings.runtime === "podman" ? "Podman" : "Node.js"}
                                </p>
                            </div>
                            <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                    Port
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: isPortAvailable === false ? colors.error : colors.textPrimary }}>
                                    {serverSettings.port || "Unset"}
                                </p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
