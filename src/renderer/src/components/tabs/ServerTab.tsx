import { Route, ServerSettings } from "../../types";
import { colors } from "../../constants/theme";

interface ServerTabProps {
    serverStatus: "stopped" | "running";
    serverSettings: ServerSettings;
    routes: Route[];
    onStartServer: () => void;
    onStopServer: () => void;
    isPortAvailable?: boolean | null;
    serverTransition: "idle" | "starting" | "stopping" | "restarting";
}

export default function ServerTab({
    serverStatus,
    serverSettings,
    routes,
    onStartServer,
    onStopServer,
    isPortAvailable,
    serverTransition,
}: ServerTabProps) {
    const isTransitioning = serverTransition !== "idle";

    const transitionLabel =
        serverTransition === "starting"
            ? "Starting..."
            : serverTransition === "stopping"
              ? "Stopping..."
              : serverTransition === "restarting"
                ? "Restarting..."
                : null;

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Server Control</h2>
                    <p className="text-sm" style={{ color: colors.textSecondary }}>
                        Start or stop your mock API server
                    </p>
                </div>

                <div
                    className="rounded-xl p-6 border"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-medium mb-1">
                                {serverSettings.name || 'Unnamed Server'}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: colors.textSecondary }}
                            >
                                {serverStatus === 'running'
                                    ? `Running on port ${serverSettings.port}`
                                    : 'Not running'}
                            </p>
                            <p
                                className="text-xs mt-1 uppercase tracking-wide"
                                style={{ color: colors.textMuted }}
                            >
                                Runtime: {serverSettings.runtime === 'podman' ? 'Podman' : 'Local'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span
                                className={`w-3 h-3 rounded-full ${
                                    isTransitioning
                                        ? 'bg-yellow-500 animate-pulse'
                                        : serverStatus === 'running'
                                        ? 'bg-green-500'
                                        : 'bg-gray-500'
                                }`}
                            />
                            <span
                                className="text-sm capitalize"
                                style={{ color: colors.textSecondary }}
                            >
                                {transitionLabel || serverStatus}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={
                            serverStatus === 'running'
                                ? onStopServer
                                : onStartServer
                        }
                        disabled={
                            isTransitioning ||
                            !serverSettings.name ||
                            !serverSettings.port ||
                            (serverStatus === 'stopped' &&
                                isPortAvailable === false)
                        }
                        className="w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            backgroundColor:
                                serverStatus === 'running'
                                    ? colors.error
                                    : colors.success,
                            color: 'white',
                        }}
                    >
                        {transitionLabel || (serverStatus === 'running'
                            ? 'Stop Server'
                            : 'Start Server')}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div
                        className="rounded-xl p-4 border text-center"
                        style={{
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        }}
                    >
                        <p
                            className="text-2xl font-bold font-mono"
                            style={{ color: colors.accent }}
                        >
                            {routes.length}
                        </p>
                        <p className="text-xs" style={{ color: colors.textMuted }}>
                            Total Routes
                        </p>
                    </div>
                    <div
                        className="rounded-xl p-4 border text-center"
                        style={{
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        }}
                    >
                        <p
                            className="text-2xl font-bold font-mono"
                            style={{ color: colors.success }}
                        >
                            {routes.filter(r => r.status === 'active').length}
                        </p>
                        <p className="text-xs" style={{ color: colors.textMuted }}>
                            Active
                        </p>
                    </div>
                    <div
                        className="rounded-xl p-4 border text-center"
                        style={{
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        }}
                    >
                        <p
                            className="text-2xl font-bold font-mono"
                            style={{ color: colors.error }}
                        >
                            {routes.filter(r => r.status === 'error').length}
                        </p>
                        <p className="text-xs" style={{ color: colors.textMuted }}>
                            Errors
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
