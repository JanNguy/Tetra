import { useState, type KeyboardEvent } from "react";
import { Route } from "../../types";
import { colors, getMethodColor } from "../../constants/theme";

interface RoutesTabProps {
    selectedRoute: Route | undefined;
    updateRoute: (id: string, field: keyof Route, value: any) => void;
    deleteRoute: (id: string) => void;
    duplicateRoute: (id: string) => void;
}

type EditorTab = "params" | "headers" | "body" | "mock";

const editorTabs: Array<{ id: EditorTab; label: string }> = [
    { id: "params", label: "Params" },
    { id: "headers", label: "Headers" },
    { id: "body", label: "Body" },
    { id: "mock", label: "Mock" },
];

const responseTabs = ["Body", "Headers"];

const previewBody = (body: string) => {
    try {
        return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
        return body;
    }
};

export default function RoutesTab({
    selectedRoute,
    updateRoute,
    deleteRoute,
    duplicateRoute,
}: RoutesTabProps) {
    const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>("body");
    const [activeResponseTab, setActiveResponseTab] = useState<"Body" | "Headers">("Body");

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

    const requestConfig = selectedRoute?.request || {
        query: "",
        headers: "",
        body: "",
    };

    if (!selectedRoute) {
        return (
            <div className="flex flex-1 items-center justify-center p-8">
                <div
                    className="w-full max-w-md rounded-[18px] border px-8 py-10 text-center"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                    <p className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
                        Select a request
                    </p>
                    <p className="mt-2 text-sm" style={{ color: colors.textMuted }}>
                        Choose a route from the collection to edit its mock response.
                    </p>
                </div>
            </div>
        );
    }

    const exampleOutput = previewBody(selectedRoute.body || "");
    const formattedHeaders = JSON.stringify(selectedRoute.headers, null, 2);
    const statusTone =
        selectedRoute.statusCode >= 200 && selectedRoute.statusCode < 300
            ? colors.success
            : selectedRoute.statusCode >= 400
              ? colors.error
              : colors.warning;

    return (
        <div className="flex flex-1 flex-col overflow-hidden" style={{ backgroundColor: "#FCFCFD" }}>
            <div className="border-b px-5 py-3" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                <div className="mb-3 flex items-center gap-2">
                    <span
                        className="rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase"
                        style={{ backgroundColor: "#F2F4F7", color: colors.textMuted }}
                    >
                        {selectedRoute.description || "Untitled request"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedRoute.method}
                        onChange={(event) => updateRoute(selectedRoute.id, "method", event.target.value)}
                        className={`rounded-[10px] px-3 py-2 text-sm font-bold text-white ${getMethodColor(selectedRoute.method)}`}
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
                        onChange={(event) => updateRoute(selectedRoute.id, "path", event.target.value)}
                        className="focus-ring h-10 flex-1 rounded-[10px] border px-3 text-sm"
                        style={{
                            backgroundColor: colors.surface,
                            borderColor: colors.borderStrong,
                            color: colors.textPrimary,
                        }}
                    />

                    <button
                        className="rounded-[10px] px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: colors.accent }}
                    >
                        Preview
                    </button>

                    <button
                        onClick={() => duplicateRoute(selectedRoute.id)}
                        className="rounded-[10px] border px-3 py-2 text-sm font-medium"
                        style={{ borderColor: colors.border, color: colors.textSecondary }}
                    >
                        Duplicate
                    </button>

                    <button
                        onClick={() => deleteRoute(selectedRoute.id)}
                        className="rounded-[10px] border px-3 py-2 text-sm font-medium"
                        style={{ borderColor: "rgba(255, 59, 48, 0.2)", color: colors.error }}
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="flex h-full flex-col">
                    <div className="border-b px-5" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                        <div className="flex items-center gap-5">
                            {editorTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveEditorTab(tab.id)}
                                    className="relative py-3 text-sm font-medium transition-colors"
                                    style={{ color: activeEditorTab === tab.id ? colors.textPrimary : colors.textMuted }}
                                >
                                    {tab.label}
                                    {activeEditorTab === tab.id && (
                                        <span
                                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                            style={{ backgroundColor: colors.accent }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        {activeEditorTab === "params" && (
                            <div className="rounded-[14px] border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                                <div className="grid grid-cols-[180px_minmax(0,1fr)] border-b px-4 py-3 text-xs font-semibold uppercase" style={{ borderColor: colors.border, color: colors.textSoft }}>
                                    <span>Query Params</span>
                                    <span>Example JSON</span>
                                </div>
                                <textarea
                                    value={requestConfig.query}
                                    onChange={(event) =>
                                        updateRoute(selectedRoute.id, "request", { ...requestConfig, query: event.target.value })
                                    }
                                    onKeyDown={(event) =>
                                        handleEditorKeyDown(event, requestConfig.query, (nextValue) =>
                                            updateRoute(selectedRoute.id, "request", { ...requestConfig, query: nextValue })
                                        )
                                    }
                                    placeholder={'{\n  "search": "",\n  "page": ""\n}'}
                                    className="focus-ring min-h-[220px] w-full rounded-b-[14px] p-4 font-mono text-sm"
                                    style={{ color: colors.textPrimary, backgroundColor: colors.surface, resize: "vertical" }}
                                />
                            </div>
                        )}

                        {activeEditorTab === "headers" && (
                            <div className="rounded-[14px] border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                                <div className="grid grid-cols-2 border-b px-4 py-3 text-xs font-semibold uppercase" style={{ borderColor: colors.border, color: colors.textSoft }}>
                                    <span>Request Headers Example</span>
                                    <span>Response Headers</span>
                                </div>
                                <div className="grid grid-cols-2">
                                    <textarea
                                        value={requestConfig.headers}
                                        onChange={(event) =>
                                            updateRoute(selectedRoute.id, "request", { ...requestConfig, headers: event.target.value })
                                        }
                                        onKeyDown={(event) =>
                                            handleEditorKeyDown(event, requestConfig.headers, (nextValue) =>
                                                updateRoute(selectedRoute.id, "request", { ...requestConfig, headers: nextValue })
                                            )
                                        }
                                        placeholder={'{\n  "authorization": ""\n}'}
                                        className="focus-ring min-h-[260px] border-r p-4 font-mono text-sm"
                                        style={{ color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface, resize: "vertical" }}
                                    />
                                    <textarea
                                        value={formattedHeaders}
                                        readOnly
                                        className="min-h-[260px] p-4 font-mono text-sm"
                                        style={{ color: colors.textSecondary, backgroundColor: "#FAFAFA", resize: "vertical" }}
                                    />
                                </div>
                            </div>
                        )}

                        {activeEditorTab === "body" && (
                            <textarea
                                value={selectedRoute.body || ""}
                                onChange={(event) => updateRoute(selectedRoute.id, "body", event.target.value)}
                                onKeyDown={(event) =>
                                    handleEditorKeyDown(event, selectedRoute.body || "", (nextValue) =>
                                        updateRoute(selectedRoute.id, "body", nextValue)
                                    )
                                }
                                className="focus-ring min-h-[320px] w-full rounded-[14px] border p-4 font-mono text-sm"
                                style={{
                                    color: colors.textPrimary,
                                    backgroundColor: colors.surface,
                                    borderColor: colors.border,
                                    resize: "vertical",
                                }}
                            />
                        )}

                        {activeEditorTab === "mock" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-[minmax(0,1fr)_140px_140px] gap-3">
                                    <input
                                        type="text"
                                        value={selectedRoute.description}
                                        onChange={(event) => updateRoute(selectedRoute.id, "description", event.target.value)}
                                        placeholder="Request name"
                                        className="focus-ring h-10 rounded-[10px] border px-3 text-sm"
                                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                                    />
                                    <input
                                        type="number"
                                        value={selectedRoute.statusCode}
                                        onChange={(event) => updateRoute(selectedRoute.id, "statusCode", parseInt(event.target.value, 10) || 200)}
                                        className="focus-ring h-10 rounded-[10px] border px-3 text-sm font-semibold"
                                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: statusTone }}
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        value={selectedRoute.delay || 0}
                                        onChange={(event) => updateRoute(selectedRoute.id, "delay", parseInt(event.target.value, 10) || 0)}
                                        className="focus-ring h-10 rounded-[10px] border px-3 text-sm"
                                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-[14px] border px-4 py-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                                            Error on missing variables
                                        </p>
                                        <p className="text-xs" style={{ color: colors.textMuted }}>
                                            Return `400` when a referenced variable is absent.
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
                                        className="relative h-7 w-12 rounded-full"
                                        style={{ backgroundColor: selectedRoute.errorOnMissingVariables ? colors.accent : colors.borderStrong }}
                                    >
                                        <span
                                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                                                selectedRoute.errorOnMissingVariables ? "translate-x-6" : "translate-x-1"
                                            }`}
                                        />
                                    </button>
                                </div>

                                <textarea
                                    value={requestConfig.body}
                                    onChange={(event) =>
                                        updateRoute(selectedRoute.id, "request", { ...requestConfig, body: event.target.value })
                                    }
                                    onKeyDown={(event) =>
                                        handleEditorKeyDown(event, requestConfig.body, (nextValue) =>
                                            updateRoute(selectedRoute.id, "request", { ...requestConfig, body: nextValue })
                                        )
                                    }
                                    placeholder={'{\n  "email": "",\n  "name": ""\n}'}
                                    className="focus-ring min-h-[220px] w-full rounded-[14px] border p-4 font-mono text-sm"
                                    style={{ color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border, resize: "vertical" }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
                <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: colors.border }}>
                    <div className="flex items-center gap-5">
                        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                            Response
                        </p>
                        {responseTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveResponseTab(tab as "Body" | "Headers")}
                                className="text-sm font-medium"
                                style={{ color: activeResponseTab === tab ? colors.textPrimary : colors.textMuted }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium">
                        <span style={{ color: statusTone }}>Status: {selectedRoute.statusCode}</span>
                        <span style={{ color: colors.textMuted }}>Time: {selectedRoute.delay || 0} ms</span>
                        <span style={{ color: colors.textMuted }}>State: {selectedRoute.status}</span>
                    </div>
                </div>

                <div className="p-5">
                    {activeResponseTab === "Body" ? (
                        <pre
                            className="max-h-[220px] overflow-auto rounded-[14px] border p-4 text-sm leading-6"
                            style={{
                                margin: 0,
                                backgroundColor: "#FAFAFA",
                                borderColor: colors.border,
                                color: colors.textPrimary,
                                fontFamily: '"SFMono-Regular", "Menlo", monospace',
                            }}
                        >
                            {exampleOutput}
                        </pre>
                    ) : (
                        <pre
                            className="max-h-[220px] overflow-auto rounded-[14px] border p-4 text-sm leading-6"
                            style={{
                                margin: 0,
                                backgroundColor: "#FAFAFA",
                                borderColor: colors.border,
                                color: colors.textSecondary,
                                fontFamily: '"SFMono-Regular", "Menlo", monospace',
                            }}
                        >
                            {formattedHeaders}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}
