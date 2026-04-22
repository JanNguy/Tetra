import { LogEntry } from "../types";
import { colors, getLogColor } from "../constants/theme";

interface LogsPanelProps {
    logs: LogEntry[];
    setLogs: (logs: LogEntry[]) => void;
}

export default function LogsPanel({ logs, setLogs }: LogsPanelProps) {
    return (
        <div
            className="h-48 border-t flex flex-col"
            style={{ backgroundColor: colors.primary, borderColor: colors.border }}
        >
            <div
                className="flex items-center justify-between px-4 py-2 border-b"
                style={{ borderColor: colors.border }}
            >
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Logs</span>
                    <div className="flex gap-2">
                        <button
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ backgroundColor: colors.surface }}
                        >
                            All
                        </button>
                        <button
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ color: colors.textMuted }}
                        >
                            Errors
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLogs([])}
                        className="px-2 py-1 rounded text-xs hover:bg-slate-700 transition-colors"
                        style={{ color: colors.textMuted }}
                    >
                        Clear
                    </button>
                    <button
                        className="px-2 py-1 rounded text-xs hover:bg-slate-700 transition-colors"
                        style={{ color: colors.textMuted }}
                    >
                        Export
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 py-1">
                        <span style={{ color: colors.textMuted }}>{log.timestamp}</span>
                        <span style={{ color: getLogColor(log.type) }}>
                            [{log.type.toUpperCase()}]
                        </span>
                        <span style={{ color: colors.textSecondary }}>{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
