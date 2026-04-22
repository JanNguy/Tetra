import { colors } from "../constants/theme";
import { ServerSettings } from "../types";

interface HeaderProps {
    serverStatus: "stopped" | "running";
    serverSettings: ServerSettings;
    onStartServer: () => void;
    onStopServer: () => void;
    isPortAvailable?: boolean | null;
}

export default function Header({ serverStatus, serverSettings, onStartServer, onStopServer, isPortAvailable }: HeaderProps) {
    return (
        <header className="h-14 flex items-center justify-between px-6 border-b" style={{ backgroundColor: colors.primary, borderColor: colors.border }}>
            <div className="flex items-center gap-6">
                <h1 className="text-xl font-bold tracking-tight" style={{ color: colors.accent }}>Tetra</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>Project:</span>
                    <select className="bg-transparent border border-slate-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:border-blue-500" style={{ backgroundColor: colors.surface }}>
                        <option>Default Project</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.surface }}>
                    <span className={`w-2 h-2 rounded-full ${serverStatus === "running" ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                        {serverStatus === "running" ? `${serverSettings.name} :${serverSettings.port}` : "Stopped"}
                    </span>
                </div>

                {serverStatus === "running" ? (
                    <button
                        onClick={onStopServer}
                        className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                        style={{ backgroundColor: colors.error, color: "white" }}
                    >
                        Stop
                    </button>
                ) : (
                    <button
                        onClick={onStartServer}
                        disabled={isPortAvailable === false}
                        className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: colors.success, color: "white" }}
                    >
                        Start
                    </button>
                )}
            </div>
        </header>
    );
}
