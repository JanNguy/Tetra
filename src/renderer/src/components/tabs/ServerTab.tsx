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

        if (
            closingCharacters.has(key) &&
            selectionStart === selectionEnd &&
            nextCharacter === key
        ) {
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
        } catch (err) {
            setImportError(err instanceof Error ? err.message : "Failed to import routes");
        }
    };

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

                <div
                    className="rounded-xl p-6 border"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium mb-1">JSON Route Parser</h3>
                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                                Open the parser popup to paste a JSON array of routes or an object with a `routes` array.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setImportError(null);
                                setIsParserOpen(true);
                            }}
                            className="px-4 py-2 rounded-lg font-medium transition-all"
                            style={{ backgroundColor: colors.accent, color: "white" }}
                        >
                            Parser
                        </button>
                    </div>
                </div>
            </div>

            {isParserOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-6"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.72)" }}
                >
                    <div
                        className="w-full max-w-3xl rounded-2xl border shadow-2xl"
                        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                        <div
                            className="flex items-center justify-between px-6 py-4 border-b"
                            style={{ borderColor: colors.border }}
                        >
                            <div>
                                <h3 className="font-medium">Route Parser</h3>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>
                                    Paste your JSON here to create multiple routes at once.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsParserOpen(false)}
                                className="px-3 py-1 rounded-md text-sm transition-colors"
                                style={{ color: colors.textMuted }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm" style={{ color: colors.textSecondary }}>
                                    Supported formats:
                                </p>
                                <p className="text-xs font-mono mt-1" style={{ color: colors.textMuted }}>
                                    `[{'{'} ... {'}'}]` or `{`"routes": [{'{'} ... {'}'}]`}`
                                </p>
                            </div>

                            <textarea
                                value={importValue}
                                onChange={(e) => setImportValue(e.target.value)}
                                onKeyDown={(e) =>
                                    handleEditorKeyDown(e, importValue, setImportValue)
                                }
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
                                className="w-full min-h-[320px] font-mono text-sm p-4 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                style={{
                                    backgroundColor: colors.primary,
                                    color: colors.textPrimary,
                                    resize: "vertical",
                                }}
                            />

                            {importError && (
                                <p className="text-sm mt-3" style={{ color: colors.error }}>
                                    {importError}
                                </p>
                            )}

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsParserOpen(false)}
                                    className="px-4 py-2 rounded-lg font-medium transition-all"
                                    style={{ backgroundColor: colors.primary, color: colors.textPrimary }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={!importValue.trim() || isTransitioning}
                                    className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: colors.accent, color: "white" }}
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
