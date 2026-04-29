import { useMemo, useState } from "react";
import { LogEntry } from "../types";
import { colors } from "../constants/theme";

interface LogsPanelProps {
    logs: LogEntry[];
    setLogs: (logs: LogEntry[]) => void;
    variant?: "docked" | "full";
}

const toneByType: Record<LogEntry["type"], { label: string; color: string; background: string }> = {
    request: { label: "Request", color: colors.info, background: "rgba(90, 200, 250, 0.12)" },
    response: { label: "Response", color: colors.success, background: "rgba(52, 199, 89, 0.12)" },
    error: { label: "Error", color: colors.error, background: "rgba(255, 59, 48, 0.12)" },
    info: { label: "Info", color: colors.accent, background: "rgba(0, 122, 255, 0.1)" },
};

export default function LogsPanel({
    logs,
    setLogs,
    variant = "docked",
}: LogsPanelProps) {
    const [filter, setFilter] = useState<"all" | LogEntry["type"]>("all");
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

    const filteredLogs = useMemo(() => (
        filter === "all" ? logs : logs.filter(log => log.type === filter)
    ), [filter, logs]);

    const selectedLog = filteredLogs.find(log => log.id === selectedLogId) || filteredLogs[0];
    const isFull = variant === "full";

    return (
        <div
            className={`${isFull ? "subtle-grid flex-1 overflow-hidden p-6" : "border-t"}`}
            style={{
                backgroundColor: isFull ? "transparent" : "rgba(255, 255, 255, 0.86)",
                borderColor: colors.border,
            }}
        >
            <div className={`${isFull ? "h-full" : "max-h-[270px]"} ${isFull ? "" : "px-5 py-4"}`}>
                <div className={`${isFull ? "mb-5" : "mb-3"} flex items-center justify-between`}>
                    <div>
                        {isFull && (
                            <>
                                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em]" style={{ color: colors.textPrimary }}>
                                    Inspect request activity in real time
                                </h2>
                            </>
                        )}
                        {!isFull && (
                            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                Logs
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {(["all", "request", "response", "error", "info"] as const).map(item => (
                            <button
                                key={item}
                                onClick={() => setFilter(item)}
                                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                                style={{
                                    borderColor: filter === item ? "rgba(0, 122, 255, 0.18)" : colors.border,
                                    backgroundColor: filter === item ? "rgba(0, 122, 255, 0.08)" : colors.surface,
                                    color: filter === item ? colors.accent : colors.textMuted,
                                }}
                            >
                                {item === "all" ? "All" : toneByType[item].label}
                            </button>
                        ))}

                        <button
                            onClick={() => setLogs([])}
                            className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                            style={{ borderColor: colors.border, color: colors.textMuted }}
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div className={`${isFull ? "grid h-[calc(100%-104px)] grid-cols-[minmax(0,1.1fr)_360px] gap-6" : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]"}`}>
                    <div
                        className={`${isFull ? "soft-card rounded-[28px] p-4" : "rounded-[24px] border p-3"} overflow-y-auto`}
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                        {filteredLogs.length === 0 && (
                            <div className="flex h-full items-center justify-center rounded-[20px] border border-dashed" style={{ borderColor: colors.borderStrong }}>
                                <p className="text-sm" style={{ color: colors.textMuted }}>
                                    No log activity yet
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {filteredLogs.map(log => {
                                const tone = toneByType[log.type];
                                const isSelected = selectedLog?.id === log.id;

                                return (
                                    <button
                                        key={log.id}
                                        onClick={() => setSelectedLogId(log.id)}
                                        className="w-full rounded-[20px] border p-4 text-left transition-colors"
                                        style={{
                                            backgroundColor: isSelected ? "rgba(0, 122, 255, 0.06)" : colors.panel,
                                            borderColor: isSelected ? "rgba(0, 122, 255, 0.22)" : colors.border,
                                        }}
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span
                                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                                                style={{ backgroundColor: tone.background, color: tone.color }}
                                            >
                                                {tone.label}
                                            </span>
                                            <span className="text-xs" style={{ color: colors.textSoft }}>
                                                {log.timestamp}
                                            </span>
                                        </div>
                                        <p className="line-clamp-2 text-sm font-medium" style={{ color: colors.textPrimary }}>
                                            {log.message}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`${isFull ? "soft-card rounded-[28px] p-5" : "rounded-[24px] border p-4"} overflow-y-auto`} style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.textSoft }}>
                            Inspector
                        </p>
                        {selectedLog ? (
                            <>
                                <div className="mt-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: toneByType[selectedLog.type].background, color: toneByType[selectedLog.type].color }}>
                                    {toneByType[selectedLog.type].label}
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                            Timestamp
                                        </p>
                                        <p className="mt-1 text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                            {selectedLog.timestamp}
                                        </p>
                                    </div>
                                    <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                            Detail
                                        </p>
                                        <pre
                                            className="mt-2 whitespace-pre-wrap break-words text-sm leading-6"
                                            style={{ color: colors.textSecondary, margin: 0, fontFamily: '"SFMono-Regular", "Menlo", monospace' }}
                                        >
                                            {selectedLog.message}
                                        </pre>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="mt-4 text-sm" style={{ color: colors.textMuted }}>
                                Select a log entry to inspect the full payload text.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
