import { useEffect, useMemo, useRef, useState } from "react";
import { colors } from "../constants/theme";
import { ServerSettings } from "../types";

interface HeaderProps {
    serverStatus: "stopped" | "running";
    serverSettings: ServerSettings;
    onStartServer: () => void;
    onStopServer: () => void;
    isPortAvailable?: boolean | null;
    serverTransition: "idle" | "starting" | "stopping" | "restarting";
    projects: Array<{ id: string; name: string }>;
    activeProjectId: string;
    onSelectProject: (projectId: string) => void;
    onAddProject: (name: string) => void;
}

export default function Header({
    serverStatus,
    serverSettings,
    onStartServer,
    onStopServer,
    isPortAvailable,
    serverTransition,
    projects,
    activeProjectId,
    onSelectProject,
    onAddProject,
}: HeaderProps) {
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
    const [projectInputValue, setProjectInputValue] = useState("");
    const projectMenuRef = useRef<HTMLDivElement | null>(null);
    const newProjectInputRef = useRef<HTMLInputElement | null>(null);

    const activeProject = useMemo(
        () => projects.find(project => project.id === activeProjectId) || projects[0],
        [projects, activeProjectId]
    );

    useEffect(() => {
        const onDocumentClick = (event: MouseEvent) => {
            if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
                setIsProjectMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onDocumentClick);
        return () => document.removeEventListener("mousedown", onDocumentClick);
    }, []);

    const isTransitioning = serverTransition !== "idle";
    const runtimeLabel = serverSettings.runtime === "podman" ? "Podman" : "Node.js";
    const runtimeStateLabel =
        serverTransition === "starting"
            ? "Starting"
            : serverTransition === "stopping"
              ? "Stopping"
              : serverTransition === "restarting"
                ? "Restarting"
                : serverStatus === "running"
                  ? "Running"
                  : "Stopped";

    return (
        <header
            className="relative z-30 mb-3 flex min-h-14 items-center justify-between rounded-[16px] border px-4 py-2.5"
            style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                boxShadow: "0 4px 14px rgba(16, 24, 40, 0.04)",
            }}
        >
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                    <img src="./logo.png" alt="Tetra logo" className="h-7 w-7 rounded-md object-contain" />
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                            Tetra
                        </h1>
                        <span className="text-xs" style={{ color: colors.textMuted }}>
                            Mock API
                        </span>
                    </div>
                </div>

                <div className="relative z-40" ref={projectMenuRef}>
                    <button
                        onClick={() => {
                            setIsProjectMenuOpen(open => !open);
                            if (!isProjectMenuOpen) {
                                setTimeout(() => newProjectInputRef.current?.focus(), 50);
                            }
                        }}
                        className="flex min-w-64 items-center justify-between rounded-[10px] border px-3 py-2 text-left"
                        style={{ borderColor: colors.border, backgroundColor: "#FAFAFA", color: colors.textPrimary }}
                    >
                        <div>
                            <p className="text-sm font-medium">{activeProject?.name || "Workspace"}</p>
                            <p className="text-xs" style={{ color: colors.textMuted }}>
                                Current collection
                            </p>
                        </div>
                        <svg className={`h-4 w-4 transition-transform ${isProjectMenuOpen ? "rotate-180" : ""}`} fill="none" stroke={colors.textMuted} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isProjectMenuOpen && (
                        <div
                            className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-[12px] border p-2 shadow-xl"
                            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                        >
                            <div className="max-h-60 overflow-y-auto">
                                {projects.map(project => (
                                    <button
                                        key={project.id}
                                        onMouseDown={(event) => {
                                            event.preventDefault();
                                            onSelectProject(project.id);
                                            setIsProjectMenuOpen(false);
                                        }}
                                        className="mb-1 flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left hover:bg-slate-50"
                                    >
                                        <span style={{ color: project.id === activeProjectId ? colors.accent : colors.textPrimary }} className="text-sm">
                                            {project.name}
                                        </span>
                                        {project.id === activeProjectId && (
                                            <span className="text-xs" style={{ color: colors.accent }}>
                                                Active
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-2 border-t pt-2" style={{ borderColor: colors.border }}>
                                <input
                                    ref={newProjectInputRef}
                                    type="text"
                                    value={projectInputValue}
                                    onChange={(event) => setProjectInputValue(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" && projectInputValue.trim()) {
                                            onAddProject(projectInputValue.trim());
                                            setProjectInputValue("");
                                            setIsProjectMenuOpen(false);
                                        } else if (event.key === "Escape") {
                                            setProjectInputValue("");
                                            setIsProjectMenuOpen(false);
                                        }
                                    }}
                                    placeholder="New collection"
                                    className="focus-ring w-full rounded-[10px] border px-3 py-2 text-sm"
                                    style={{ borderColor: colors.border, backgroundColor: "#FAFAFA", color: colors.textPrimary }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div
                    className="flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm"
                    style={{ borderColor: colors.border, backgroundColor: "#FAFAFA", color: colors.textSecondary }}
                >
                    <span
                        className={`h-2 w-2 rounded-full ${serverStatus === "running" ? "animate-pulse" : ""}`}
                        style={{ backgroundColor: serverStatus === "running" ? colors.success : colors.textSoft }}
                    />
                    <span>{runtimeLabel}</span>
                    <span style={{ color: colors.textMuted }}>·</span>
                    <span>{runtimeStateLabel}</span>
                    <span style={{ color: colors.textMuted }}>· {serverSettings.port || "No port"}</span>
                </div>

                <button
                    onClick={serverStatus === "running" ? onStopServer : onStartServer}
                    disabled={isTransitioning || (serverStatus === "stopped" && isPortAvailable === false)}
                    className="rounded-[10px] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: serverStatus === "running" ? colors.error : colors.accent }}
                >
                    {isTransitioning ? runtimeStateLabel : serverStatus === "running" ? "Stop" : "Start"}
                </button>
            </div>
        </header>
    );
}
