import { ServerSettings } from "../../types";
import { colors } from "../../constants/theme";

interface SettingsTabProps {
    serverSettings: ServerSettings;
    handleSettingChange: (key: keyof ServerSettings, value: ServerSettings[keyof ServerSettings]) => void;
    isPortAvailable: boolean | null;
    serverStatus: "stopped" | "running";
}

export default function SettingsTab({
    serverSettings,
    handleSettingChange,
    isPortAvailable,
    serverStatus,
}: SettingsTabProps) {
    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Settings</h2>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Configure your server and application preferences
                    </p>
                </div>

                {/* Server Settings */}
                <div className="rounded-xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: colors.border }}>
                        <h3 className="font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke={colors.accent} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                            </svg>
                            Server Configuration
                        </h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Server Name</label>
                            <input
                                type="text"
                                value={serverSettings.name}
                                onChange={(e) => handleSettingChange("name", e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-colors"
                                style={{ backgroundColor: colors.primary, borderColor: colors.border, color: colors.textPrimary }}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Port</label>
                            <input
                                type="text"
                                value={serverSettings.port}
                                disabled={serverStatus === "running"}
                                onChange={(e) => handleSettingChange("port", e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors font-mono ${isPortAvailable === false ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'} ${serverStatus === "running" ? "opacity-50 cursor-not-allowed" : ""}`}
                                style={{ backgroundColor: colors.primary, borderColor: isPortAvailable === false ? colors.error : colors.border, color: colors.textPrimary }}
                            />
                            {serverStatus === "running" && (
                                <p className="text-xs mt-2 font-medium flex items-center gap-1" style={{ color: colors.textMuted }}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Cannot change port while server is running
                                </p>
                            )}
                            {isPortAvailable === false && serverStatus === "stopped" && (
                                <p className="text-xs mt-2 font-medium flex items-center gap-1" style={{ color: colors.error }}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Port is already in use
                                </p>
                            )}
                            {isPortAvailable === true && serverSettings.port && serverStatus === "stopped" && (
                                <p className="text-xs mt-2 font-medium flex items-center gap-1" style={{ color: colors.success }}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Port is available
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Runtime</label>
                            <select
                                value={serverSettings.runtime}
                                disabled={serverStatus === "running"}
                                onChange={(e) => handleSettingChange("runtime", e.target.value as ServerSettings["runtime"])}
                                className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors ${serverStatus === "running" ? "opacity-50 cursor-not-allowed" : "focus:border-blue-500"}`}
                                style={{ backgroundColor: colors.primary, borderColor: colors.border, color: colors.textPrimary }}
                            >
                                <option value="local">Local Node.js</option>
                                <option value="podman">Podman Container</option>
                            </select>
                            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                Podman isolates the mock server in a container.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Response Delay (ms)</label>
                            <input
                                type="number"
                                min="0"
                                value={serverSettings.delay}
                                onChange={(e) => handleSettingChange("delay", parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                style={{ backgroundColor: colors.primary, borderColor: colors.border, color: colors.textPrimary }}
                            />
                            <p className="text-xs mt-1" style={{ color: colors.textMuted }}>Add a delay to all responses (in milliseconds)</p>
                        </div>
                    </div>
                </div>

                {/* CORS Settings */}
                <div className="rounded-xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: colors.border }}>
                        <h3 className="font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke={colors.accent} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            CORS Configuration
                        </h3>
                    </div>
                    <div className="p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Enable CORS</p>
                                <p className="text-xs" style={{ color: colors.textMuted }}>Allow cross-origin requests</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange("corsEnabled", !serverSettings.corsEnabled)}
                                className="relative w-14 h-7 rounded-full transition-colors"
                                style={{ backgroundColor: serverSettings.corsEnabled ? colors.accent : colors.border }}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${serverSettings.corsEnabled ? "translate-x-7" : "translate-x-0"}`}
                                />
                            </button>
                        </div>

                        {serverSettings.corsEnabled && (
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>Allowed Origin</label>
                                <input
                                    type="text"
                                    value={serverSettings.corsOrigin}
                                    onChange={(e) => handleSettingChange("corsOrigin", e.target.value)}
                                    placeholder="*"
                                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:border-blue-500 transition-colors font-mono"
                                    style={{ backgroundColor: colors.primary, borderColor: colors.border, color: colors.textPrimary }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Logging Settings */}
                <div className="rounded-xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: colors.border }}>
                        <h3 className="font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke={colors.accent} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Logging
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Log Requests</p>
                                <p className="text-xs" style={{ color: colors.textMuted }}>Show incoming requests in logs</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange("logRequests", !serverSettings.logRequests)}
                                className="relative w-14 h-7 rounded-full transition-colors"
                                style={{ backgroundColor: serverSettings.logRequests ? colors.accent : colors.border }}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${serverSettings.logRequests ? "translate-x-7" : "translate-x-0"}`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Log Responses</p>
                                <p className="text-xs" style={{ color: colors.textMuted }}>Show outgoing responses in logs</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange("logResponses", !serverSettings.logResponses)}
                                className="relative w-14 h-7 rounded-full transition-colors"
                                style={{ backgroundColor: serverSettings.logResponses ? colors.accent : colors.border }}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${serverSettings.logResponses ? "translate-x-7" : "translate-x-0"}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Startup Settings */}
                <div className="rounded-xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: colors.border }}>
                        <h3 className="font-medium flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke={colors.accent} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Startup
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Auto-start Server</p>
                                <p className="text-xs" style={{ color: colors.textMuted }}>Start server automatically when app opens</p>
                            </div>
                            <button
                                onClick={() => handleSettingChange("autoStart", !serverSettings.autoStart)}
                                className="relative w-14 h-7 rounded-full transition-colors"
                                style={{ backgroundColor: serverSettings.autoStart ? colors.accent : colors.border }}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${serverSettings.autoStart ? "translate-x-7" : "translate-x-0"}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    className="w-full py-3 rounded-lg font-semibold transition-all"
                    style={{ backgroundColor: colors.accent, color: "white" }}
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
}
