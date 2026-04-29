import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Route, ServerSettings } from "../../types";
import { colors } from "../../constants/theme";

interface ServerTabProps {
    serverStatus: "stopped" | "running";
    serverSettings: ServerSettings;
    routes: Route[];
    onStartServer: () => void;
    onStopServer: () => void;
    onImportRoutes: (rawValue: string) => Promise<void>;
    isPortAvailable?: boolean | null;
    serverTransition: "idle" | "starting" | "stopping" | "restarting";
}

export default function ServerTab({
    serverStatus,
    serverSettings,
    routes,
    onStartServer,
    onStopServer,
    onImportRoutes,
    isPortAvailable,
    serverTransition,
}: ServerTabProps) {
    const [importValue, setImportValue] = useState("");
    const [importError, setImportError] = useState<string | null>(null);
    const [isParserOpen, setIsParserOpen] = useState(false);

    const isTransitioning = serverTransition !== "idle";
    const transitionLabel =
        serverTransition === "starting"
            ? "Starting..."
            : serverTransition === "stopping"
              ? "Stopping..."
              : serverTransition === "restarting"
                ? "Restarting..."
                : null;

    const handleEditorKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>,
        value: string,
        onValueChange: (nextValue: string) => void
    ) => {
        const pairs: Record<string, string> = {
            "{": "}",
            "[": "]",
            "(": ")",
            "\"": "\"",
            "'": "'",
        };
        const closingCharacters = new Set(Object.values(pairs));
        const { key, currentTarget } = event;
        const selectionStart = currentTarget.selectionStart;
        const selectionEnd = currentTarget.selectionEnd;
        const selectedText = value.slice(selectionStart, selectionEnd);
        const nextCharacter = value[selectionStart];

        if (key === "Tab") {
            event.preventDefault();
            const indentation = "    ";
            const nextValue = `${value.slice(0, selectionStart)}${indentation}${value.slice(selectionEnd)}`;
            onValueChange(nextValue);

            requestAnimationFrame(() => {
                currentTarget.selectionStart = selectionStart + indentation.length;
                currentTarget.selectionEnd = selectionStart + indentation.length;
            });
            return;
        }

        if (Object.prototype.hasOwnProperty.call(pairs, key)) {
            event.preventDefault();
            const closingChar = pairs[key];
            const nextValue = `${value.slice(0, selectionStart)}${key}${selectedText}${closingChar}${value.slice(selectionEnd)}`;
            onValueChange(nextValue);

            requestAnimationFrame(() => {
                currentTarget.selectionStart = selectionStart + 1;
                currentTarget.selectionEnd = selectionStart + 1 + selectedText.length;
            });
            return;
        }

        if (closingCharacters.has(key) && selectionStart === selectionEnd && nextCharacter === key) {
            event.preventDefault();
            requestAnimationFrame(() => {
                currentTarget.selectionStart = selectionStart + 1;
                currentTarget.selectionEnd = selectionStart + 1;
            });
        }
    };

    const handleImport = async () => {
        try {
            setImportError(null);
            await onImportRoutes(importValue);
            setImportValue("");
            setIsParserOpen(false);
        } catch (error) {
            setImportError(error instanceof Error ? error.message : "Failed to import routes");
        }
    };

    const runtimeCards = [
        {
            key: "local",
            title: "Node.js Runtime",
            subtitle: "Fast local execution for iteration and debugging.",
            configured: serverSettings.runtime === "local",
        },
        {
            key: "podman",
            title: "Podman Runtime",
            subtitle: "Containerized execution for environment parity and isolation.",
            configured: serverSettings.runtime === "podman",
        },
    ];

    return (
        <div className="subtle-grid flex-1 overflow-y-auto p-6">
            <div className="mb-5">
                <h2 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em]" style={{ color: colors.textPrimary }}>
                    Launch and monitor mock runtimes
                </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px]">
                <section className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {runtimeCards.map(card => (
                            <div key={card.key} className="soft-card rounded-[24px] p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg font-semibold tracking-[-0.02em]" style={{ color: colors.textPrimary }}>
                                            {card.title}
                                        </p>
                                        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
                                            {card.subtitle}
                                        </p>
                                    </div>
                                    {card.configured && (
                                        <span
                                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                                            style={{ backgroundColor: "rgba(0, 122, 255, 0.08)", color: colors.accent }}
                                        >
                                            Active
                                        </span>
                                    )}
                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">
                                    <div className="rounded-[18px] border px-3 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                            Status
                                        </p>
                                        <p className="mt-1 text-sm font-semibold" style={{ color: card.configured && serverStatus === "running" ? colors.success : colors.textSecondary }}>
                                            {card.configured ? serverStatus : "stopped"}
                                        </p>
                                    </div>
                                    <div className="rounded-[18px] border px-3 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                            Port
                                        </p>
                                        <p className="mt-1 text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                            {card.configured ? serverSettings.port || "Unset" : "Inactive"}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center justify-between">
                                    <span className="text-xs" style={{ color: colors.textMuted }}>
                                        {card.configured
                                            ? "Configured runtime for this workspace"
                                            : "Switch in Settings to activate"}
                                    </span>
                                    {card.configured && (
                                        <button
                                            onClick={serverStatus === "running" ? onStopServer : onStartServer}
                                            disabled={isTransitioning || (serverStatus === "stopped" && isPortAvailable === false)}
                                            className="rounded-[16px] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                            style={{ backgroundColor: serverStatus === "running" ? colors.error : colors.accent }}
                                        >
                                            {transitionLabel || (serverStatus === "running" ? "Stop" : "Start")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="soft-card rounded-[24px] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                Total Routes
                            </p>
                            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]" style={{ color: colors.textPrimary }}>
                                {routes.length}
                            </p>
                        </div>
                        <div className="soft-card rounded-[24px] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                Enabled
                            </p>
                            <p className="mt-2 text-3xl font-semibold tracking-[-0.03em]" style={{ color: colors.success }}>
                                {routes.filter(route => route.status === "active").length}
                            </p>
                        </div>
                        <div className="soft-card rounded-[24px] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                Port Health
                            </p>
                            <p className="mt-2 text-lg font-semibold" style={{ color: isPortAvailable === false ? colors.error : colors.textPrimary }}>
                                {isPortAvailable === false ? "Conflict" : "Ready"}
                            </p>
                        </div>
                    </div>

                    <div className="soft-card rounded-[24px] p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                    Route Import
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setImportError(null);
                                    setIsParserOpen(true);
                                }}
                                className="rounded-[16px] px-4 py-2 text-sm font-semibold text-white"
                                style={{ backgroundColor: colors.accent }}
                            >
                                Open parser
                            </button>
                        </div>
                    </div>
                </section>

                <aside className="space-y-6">
                    <div className="soft-card rounded-[24px] p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.textSoft }}>
                            Current Runtime
                        </p>
                        <p className="mt-2 text-xl font-semibold tracking-[-0.02em]" style={{ color: colors.textPrimary }}>
                            {serverSettings.runtime === "podman" ? "Podman" : "Node.js"}
                        </p>
                        <div className="mt-4 space-y-3">
                            <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                    Status
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: serverStatus === "running" ? colors.success : colors.textPrimary }}>
                                    {transitionLabel || serverStatus}
                                </p>
                            </div>
                            <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                    Port
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                    {serverSettings.port || "Unset"}
                                </p>
                            </div>
                            <div className="rounded-[18px] border px-4 py-3" style={{ borderColor: colors.border, backgroundColor: colors.panel }}>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: colors.textSoft }}>
                                    Readiness
                                </p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: isPortAvailable === false ? colors.error : colors.textPrimary }}>
                                    {isPortAvailable === false ? "Port conflict detected" : "Ready to start"}
                                </p>
                            </div>
                        </div>
                    </div>

                </aside>
            </div>

            {isParserOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(15, 23, 42, 0.24)" }}>
                    <div className="w-full max-w-4xl rounded-[28px] border shadow-2xl" style={{ backgroundColor: colors.surface, borderColor: colors.borderStrong }}>
                        <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: colors.border }}>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: colors.textSoft }}>
                                    Route Parser
                                </p>
                                <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em]" style={{ color: colors.textPrimary }}>
                                    Import mock routes from JSON
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsParserOpen(false)}
                                className="rounded-[16px] border px-3 py-2 text-sm"
                                style={{ borderColor: colors.border, color: colors.textMuted }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="mb-3 text-sm" style={{ color: colors.textMuted }}>
                                Supported formats: an array of routes or an object with a `routes` array.
                            </p>
                            <textarea
                                value={importValue}
                                onChange={(event) => setImportValue(event.target.value)}
                                onKeyDown={(event) => handleEditorKeyDown(event, importValue, setImportValue)}
                                placeholder={`[
  {
    "method": "GET",
    "path": "/api/health",
    "statusCode": 200,
    "body": {
      "status": "ok"
    }
  }
]`}
                                className="focus-ring field-shell min-h-[340px] w-full rounded-[24px] p-4 font-mono text-sm"
                                style={{ color: colors.textPrimary, resize: "vertical" }}
                            />

                            {importError && (
                                <p className="mt-3 text-sm font-medium" style={{ color: colors.error }}>
                                    {importError}
                                </p>
                            )}

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsParserOpen(false)}
                                    className="rounded-[16px] border px-4 py-2 text-sm font-medium"
                                    style={{ borderColor: colors.border, color: colors.textSecondary }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!importValue.trim() || isTransitioning}
                                    className="rounded-[16px] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ backgroundColor: colors.accent }}
                                >
                                    Import Routes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
