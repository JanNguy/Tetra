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

    const isTransitioning = serverTransition !== "idle";

    const activeProject = useMemo(
        () => projects.find(project => project.id === activeProjectId) || projects[0],
        [projects, activeProjectId]
    );

    useEffect(() => {
        const onDocumentClick = (event: MouseEvent) => {
            if (!projectMenuRef.current) {
                return;
            }

            if (!projectMenuRef.current.contains(event.target as Node)) {
                setIsProjectMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onDocumentClick);
        return () => document.removeEventListener("mousedown", onDocumentClick);
    }, []);

    const transitionLabel =
        serverTransition === "starting"
            ? "Starting..."
            : serverTransition === "stopping"
              ? "Stopping..."
              : serverTransition === "restarting"
                ? "Restarting..."
                : null;

    return (
        <header
            className="h-16 flex items-center justify-between px-6 border-b"
            style={{ backgroundColor: colors.primary, borderColor: colors.border }}
        >
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <img
                        src="./logo.png"
                        alt="Tetra logo"
                        className="w-12 h-12 object-contain"
                    />
                    <h1
                        className="text-xl font-bold tracking-tight"
                        style={{ color: colors.accent }}
                    >
                        Tetra
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                        Project:
                    </span>
                    <div className="relative" ref={projectMenuRef}>
                        <button
                            onClick={() => {
                                setIsProjectMenuOpen(open => !open);
                                if (!isProjectMenuOpen) {
                                    setTimeout(() => newProjectInputRef.current?.focus(), 50);
                                }
                            }}
                            className="flex items-center justify-between gap-2 border border-slate-600 rounded-md px-3 py-1 text-sm min-w-44 focus:outline-none"
                            style={{ backgroundColor: colors.surface, color: colors.textPrimary }}
                        >
                            <span className="truncate">{activeProject?.name || "Select project"}</span>
                            <svg
                                className={`w-4 h-4 transition-transform ${isProjectMenuOpen ? "rotate-180" : ""}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </button>

                        {isProjectMenuOpen && (
                            <div
                                className="absolute mt-2 w-64 rounded-lg border shadow-lg z-50 py-1"
                                style={{
                                    backgroundColor: colors.primary,
                                    borderColor: colors.border,
                                }}
                            >
                                {projects.map(project => (
                                    <div
                                        key={project.id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            onSelectProject(project.id);
                                            setIsProjectMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors cursor-pointer"
                                        style={{
                                            color: project.id === activeProjectId
                                                ? colors.accent
                                                : colors.textPrimary,
                                        }}
                                    >
                                        {project.name}
                                    </div>
                                ))}
                                <div
                                    className="my-1 border-t"
                                    style={{ borderColor: colors.border }}
                                />
                                <div className="px-3 py-2">
                                    <input
                                        ref={newProjectInputRef}
                                        type="text"
                                        value={projectInputValue}
                                        onChange={(e) => setProjectInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && projectInputValue.trim()) {
                                                onAddProject(projectInputValue.trim());
                                                setIsProjectMenuOpen(false);
                                                setProjectInputValue("");
                                            } else if (e.key === "Escape") {
                                                setIsProjectMenuOpen(false);
                                                setProjectInputValue("");
                                            }
                                        }}
                                        placeholder="New project name..."
                                        className="w-full bg-transparent text-sm border-b border-slate-600 focus:border-blue-500 focus:outline-none pb-1"
                                        style={{ color: colors.textPrimary }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: colors.surface }}>
                    <span
                        className={`w-2 h-2 rounded-full ${
                            serverStatus === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                        }`}
                    />
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
                        {transitionLabel || (serverStatus === 'running'
                            ? `${serverSettings.name} :${serverSettings.port}`
                            : 'Stopped')}
                    </span>
                </div>

                {serverStatus === 'running' ? (
                    <button
                        onClick={onStopServer}
                        disabled={isTransitioning}
                        className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: colors.error, color: 'white' }}
                    >
                        {transitionLabel || 'Stop'}
                    </button>
                ) : (
                    <button
                        onClick={onStartServer}
                        disabled={isPortAvailable === false || isTransitioning}
                        className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: colors.success, color: 'white' }}
                    >
                        {transitionLabel || 'Start'}
                    </button>
                )}
            </div>
        </header>
    );
}
