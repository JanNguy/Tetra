import { useEffect, useRef, useState } from "react";
import { Route, LogEntry, Tab, ServerSettings } from "./types";
import { colors } from "./constants/theme";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import LogsPanel from "./components/LogsPanel";
import RoutesTab from "./components/tabs/RoutesTab";
import ServerTab from "./components/tabs/ServerTab";
import SettingsTab from "./components/tabs/SettingsTab";

declare global {
    interface Window {
        electronAPI?: any;
    }
}

type ServerTransition = "idle" | "starting" | "stopping" | "restarting";

interface ProjectState {
    id: string;
    name: string;
    routes: Route[];
    serverSettings: ServerSettings;
    serverStatus: "stopped" | "running";
    serverTransition: ServerTransition;
}

interface PendingRestart {
    routes: Route[];
    settings: ServerSettings;
}

const createDefaultServerSettings = (name = "My API Server"): ServerSettings => ({
    name,
    port: "3000",
    runtime: "local",
    corsEnabled: true,
    corsOrigin: "*",
    delay: 0,
    logRequests: true,
    logResponses: true,
    autoStart: false,
});

const createProject = (id: string, name: string): ProjectState => ({
    id,
    name,
    routes: [],
    serverSettings: createDefaultServerSettings(name),
    serverStatus: "stopped",
    serverTransition: "idle",
});

const normalizeServerSettings = (value: any, fallbackName: string): ServerSettings => ({
    ...createDefaultServerSettings(fallbackName),
    ...(value || {}),
    runtime: value && value.runtime === "podman" ? "podman" : "local",
});

const createDefaultRouteRequest = () => ({
    query: "",
    headers: "",
    body: "",
});

const normalizeRoute = (route: any): Route => ({
    ...route,
    headers: route && typeof route.headers === "object" && route.headers !== null
        ? route.headers
        : { "Content-Type": "application/json" },
    body: typeof route?.body === "string" ? route.body : '{\n  "message": "Hello World"\n}',
    request: {
        ...createDefaultRouteRequest(),
        ...(route && typeof route.request === "object" ? route.request : {}),
    },
    errorOnMissingVariables: Boolean(route?.errorOnMissingVariables),
});

export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>("routes");
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [methodFilter, setMethodFilter] = useState<string | null>(null);

    const [projects, setProjects] = useState<ProjectState[]>([
        createProject("default", "Default Project"),
    ]);
    const [activeProjectId, setActiveProjectId] = useState("default");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isPortAvailable, setIsPortAvailable] = useState<boolean | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const restartTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const pendingRestartsRef = useRef<Record<string, PendingRestart>>({});

    const activeProject =
        projects.find(project => project.id === activeProjectId) || projects[0];
    const activeRoutes = activeProject ? activeProject.routes : [];
    const activeServerSettings = activeProject
        ? activeProject.serverSettings
        : createDefaultServerSettings();
    const activeServerStatus = activeProject ? activeProject.serverStatus : "stopped";
    const activeServerTransition = activeProject
        ? activeProject.serverTransition
        : "idle";

    const updateProject = (projectId: string, updater: (project: ProjectState) => ProjectState) => {
        setProjects(prev => prev.map(project => (
            project.id === projectId ? updater(project) : project
        )));
    };

    const scheduleProjectRestart = (
        projectId: string,
        settings: ServerSettings,
        routes: Route[],
        delayMs = 250
    ) => {
        if (!window.electronAPI) {
            return;
        }

        pendingRestartsRef.current[projectId] = { settings, routes };

        const existingTimer = restartTimersRef.current[projectId];
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        updateProject(projectId, project => ({
            ...project,
            serverTransition: "restarting",
        }));

        restartTimersRef.current[projectId] = setTimeout(async () => {
            const pendingRestart = pendingRestartsRef.current[projectId];
            delete restartTimersRef.current[projectId];
            delete pendingRestartsRef.current[projectId];

            if (!pendingRestart) {
                updateProject(projectId, project => ({
                    ...project,
                    serverTransition: "idle",
                }));
                return;
            }

            try {
                await window.electronAPI.restartServer(
                    { ...pendingRestart.settings, projectId },
                    pendingRestart.routes
                );
            } catch (err) {
                console.error("Failed to restart server:", err);
            } finally {
                updateProject(projectId, project => ({
                    ...project,
                    serverTransition: "idle",
                }));
            }
        }, delayMs);
    };

    const cancelProjectRestart = (projectId: string) => {
        const existingTimer = restartTimersRef.current[projectId];
        if (existingTimer) {
            clearTimeout(existingTimer);
            delete restartTimersRef.current[projectId];
        }

        delete pendingRestartsRef.current[projectId];
    };

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onServerLog((event: any, log: any) => {
                const newLog: LogEntry = {
                    id: Date.now().toString() + Math.random().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    type: log.type,
                    message: `[${log.projectId || "default"}] ${log.message}`,
                };
                setLogs(prev => [newLog, ...prev]);
            });

            window.electronAPI.onServerError((event: any, log: any) => {
                const projectId = log.projectId || "default";
                const newLog: LogEntry = {
                    id: Date.now().toString() + Math.random().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    type: log.type,
                    message: `[${projectId}] ${log.message}`,
                };
                setLogs(prev => [newLog, ...prev]);
                updateProject(projectId, project => ({
                    ...project,
                    serverStatus: "stopped",
                    serverTransition: "idle",
                }));
            });

            return () => {
                window.electronAPI?.removeAllListeners();
            };
        }
    }, []);

    useEffect(() => {
        return () => {
            Object.values(restartTimersRef.current).forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        const initData = async () => {
            if (window.electronAPI) {
                const data = await window.electronAPI.loadData();
                if (data) {
                    if (Array.isArray(data.projects) && data.projects.length > 0) {
                        const loadedProjects = data.projects.map((project: any, index: number) => {
                            const id = project.id || `project-${index + 1}`;
                            const name = project.name || `Project ${index + 1}`;
                            return {
                                id,
                                name,
                                routes: Array.isArray(project.routes)
                                    ? project.routes.map(normalizeRoute)
                                    : [],
                                serverSettings: normalizeServerSettings(project.serverSettings, name),
                                serverStatus: "stopped" as const,
                                serverTransition: "idle" as const,
                            };
                        });

                        setProjects(loadedProjects);
                        const nextActive = data.activeProjectId || loadedProjects[0].id;
                        setActiveProjectId(nextActive);
                    } else {
                        const legacyProject = createProject("default", "Default Project");
                        legacyProject.routes = Array.isArray(data.routes)
                            ? data.routes.map(normalizeRoute)
                            : [];
                        legacyProject.serverSettings = normalizeServerSettings(
                            data.serverSettings,
                            legacyProject.name
                        );
                        setProjects([legacyProject]);
                        setActiveProjectId("default");
                    }
                }
            }
            setIsDataLoaded(true);
        };
        initData();
    }, []);

    useEffect(() => {
        if (isDataLoaded && window.electronAPI) {
            window.electronAPI.saveData({ projects, activeProjectId });
        }
    }, [projects, activeProjectId, isDataLoaded]);

    useEffect(() => {
        if (activeProjectId) {
            cancelProjectRestart(activeProjectId);
        }
        setSelectedRouteId(null);
    }, [activeProjectId]);

    useEffect(() => {
        const checkPort = async () => {
            if (!activeProject) {
                setIsPortAvailable(null);
                return;
            }

            if (window.electronAPI && activeServerSettings.port) {
                if (activeServerStatus === 'running') {
                    setIsPortAvailable(true);
                    return;
                }

                const portNum = parseInt(activeServerSettings.port);
                if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
                    setIsPortAvailable(false);
                    return;
                }

                try {
                    const available = await window.electronAPI.checkPort(activeServerSettings.port);
                    setIsPortAvailable(available);
                } catch (err) {
                    setIsPortAvailable(false);
                }
            } else {
                setIsPortAvailable(null);
            }
        };

        const timer = setTimeout(checkPort, 300);
        return () => clearTimeout(timer);
    }, [activeProjectId, activeServerSettings.port, activeServerStatus]);

    const handleRunServer = async () => {
        if (!activeProject || activeServerTransition !== "idle") {
            return;
        }

        if (activeServerSettings.name && activeServerSettings.port) {
            try {
                updateProject(activeProject.id, project => ({
                    ...project,
                    serverTransition: "starting",
                }));

                if (window.electronAPI) {
                    await window.electronAPI.startServer(
                        { ...activeServerSettings, projectId: activeProject.id },
                        activeRoutes
                    );
                }

                updateProject(activeProject.id, project => ({
                    ...project,
                    serverStatus: "running",
                }));
            } catch (err) {
                console.error("Failed to start server:", err);
            } finally {
                updateProject(activeProject.id, project => ({
                    ...project,
                    serverTransition: "idle",
                }));
            }
        }
    };

    const handleStopServer = async () => {
        if (!activeProject || activeServerTransition !== "idle") {
            return;
        }

        try {
            cancelProjectRestart(activeProject.id);
            updateProject(activeProject.id, project => ({
                ...project,
                serverTransition: "stopping",
            }));

            if (window.electronAPI) {
                await window.electronAPI.stopServer(activeProject.id);
            }

            updateProject(activeProject.id, project => ({
                ...project,
                serverStatus: "stopped",
            }));
        } catch (err) {
            console.error("Failed to stop server:", err);
        } finally {
            updateProject(activeProject.id, project => ({
                ...project,
                serverTransition: "idle",
            }));
        }
    };

    const handleAddRoute = async () => {
        if (!activeProject) {
            return;
        }

        const newRoute: Route = {
            id: Date.now().toString(),
            path: '/api/new-endpoint',
            method: 'GET',
            status: 'active',
            description: 'New Route',
            responseTime: '-',
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: '{\n  "message": "Hello World"\n}',
            delay: 0,
            request: createDefaultRouteRequest(),
            errorOnMissingVariables: false,
        };

        const updatedRoutes = [...activeProject.routes, newRoute];
        updateProject(activeProject.id, project => ({
            ...project,
            routes: updatedRoutes,
        }));

        setSelectedRouteId(newRoute.id);
        setActiveTab('routes');

        if (activeServerStatus === 'running' && window.electronAPI) {
            scheduleProjectRestart(activeProject.id, activeServerSettings, updatedRoutes, 0);
        }
    };

    const updateRoute = async (id: string, field: keyof Route, value: any) => {
        if (!activeProject) {
            return;
        }

        const updatedRoutes = activeProject.routes.map(r => (
            r.id === id ? { ...r, [field]: value } : r
        ));

        updateProject(activeProject.id, project => ({
            ...project,
            routes: updatedRoutes,
        }));

        const routeFieldsRequiringRestart: Array<keyof Route> = [
            "path",
            "method",
            "status",
            "statusCode",
            "headers",
            "body",
            "delay",
            "request",
            "errorOnMissingVariables",
        ];

        if (
            activeServerStatus === 'running' &&
            routeFieldsRequiringRestart.includes(field)
        ) {
            scheduleProjectRestart(activeProject.id, activeServerSettings, updatedRoutes);
        }
    };

    const deleteRoute = async (id: string) => {
        if (!activeProject) {
            return;
        }

        const filteredRoutes = activeProject.routes.filter(r => r.id !== id);
        updateProject(activeProject.id, project => ({
            ...project,
            routes: filteredRoutes,
        }));

        if (selectedRouteId === id) {
            setSelectedRouteId(null);
        }

        if (activeServerStatus === 'running' && window.electronAPI) {
            scheduleProjectRestart(activeProject.id, activeServerSettings, filteredRoutes, 0);
        }
    };

    const handleSettingChange = (key: keyof ServerSettings, value: ServerSettings[keyof ServerSettings]) => {
        if (!activeProject) {
            return;
        }

        const nextSettings = {
            ...activeProject.serverSettings,
            [key]: value,
        };

        updateProject(activeProject.id, project => {
            const nextSettings = { ...project.serverSettings, [key]: value };
            const nextName = key === "name" && typeof value === "string"
                ? value || project.name
                : project.name;

            return {
                ...project,
                name: nextName,
                serverSettings: nextSettings,
            };
        });

        const settingsRequiringRestart: Array<keyof ServerSettings> = [
            "runtime",
            "corsEnabled",
            "corsOrigin",
            "delay",
            "logRequests",
            "logResponses",
        ];

        if (
            activeServerStatus === "running" &&
            settingsRequiringRestart.includes(key)
        ) {
            scheduleProjectRestart(activeProject.id, nextSettings, activeRoutes);
        }
    };

    const handleAddProject = (name?: string) => {
        const newId = `project-${Date.now()}`;
        const newName = name || `Project ${projects.length + 1}`;
        const nextProject = createProject(newId, newName);
        setProjects(prev => [...prev, nextProject]);
        setActiveProjectId(newId);
        setSelectedRouteId(null);
    };

    const selectedRoute = activeRoutes.find(r => r.id === selectedRouteId);

    if (!isDataLoaded) {
        return (
            <div
                className="h-screen flex items-center justify-center text-white"
                style={{ backgroundColor: colors.background }}
            >
                Loading...
            </div>
        );
    }

    return (
        <div
            className="h-screen flex flex-col"
            style={{
                backgroundColor: colors.background,
                color: colors.textPrimary,
                fontFamily: 'Inter, system-ui, sans-serif',
            }}
        >
            <Header
                serverStatus={activeServerStatus}
                serverSettings={activeServerSettings}
                onStartServer={handleRunServer}
                onStopServer={handleStopServer}
                isPortAvailable={isPortAvailable}
                serverTransition={activeServerTransition}
                projects={projects.map(project => ({ id: project.id, name: project.name }))}
                activeProjectId={activeProject ? activeProject.id : "default"}
                onSelectProject={setActiveProjectId}
                onAddProject={handleAddProject}
            />

            <div className="flex-1 flex overflow-hidden">
                <Sidebar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    routes={activeRoutes}
                    selectedRouteId={selectedRouteId}
                    setSelectedRouteId={setSelectedRouteId}
                    onAddRoute={handleAddRoute}
                    methodFilter={methodFilter}
                />

                <main className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === 'routes' && (
                        <RoutesTab
                            selectedRoute={selectedRoute}
                            updateRoute={updateRoute}
                            deleteRoute={deleteRoute}
                        />
                    )}

                    {activeTab === 'server' && (
                        <ServerTab
                            serverStatus={activeServerStatus}
                            serverSettings={activeServerSettings}
                            routes={activeRoutes}
                            onStartServer={handleRunServer}
                            onStopServer={handleStopServer}
                            isPortAvailable={isPortAvailable}
                            serverTransition={activeServerTransition}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab
                            serverSettings={activeServerSettings}
                            handleSettingChange={handleSettingChange}
                            isPortAvailable={isPortAvailable}
                            serverStatus={activeServerStatus}
                        />
                    )}

                    <LogsPanel logs={logs} setLogs={setLogs} />
                </main>
            </div>
        </div>
    );
}
