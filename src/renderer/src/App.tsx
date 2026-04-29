import { useEffect, useRef, useState } from "react";
import { Route, LogEntry, Tab, ServerSettings, RouteDefaults } from "./types";
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

const ROUTE_FIELDS_REQUIRING_RESTART: Array<keyof Route> = [
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

const createDefaultRouteRequest = () => ({
    query: "",
    headers: "",
    body: "",
});

const normalizeImportedJsonField = (
    value: unknown,
    fallback: string
): string => {
    if (typeof value === "string") {
        return value;
    }

    if (value && typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }

    return fallback;
};

const createDefaultRouteDefaults = (): RouteDefaults => ({
    method: "GET",
    path: "/api/new-endpoint",
    description: "New Route",
    statusCode: 200,
    headers: '{\n  "Content-Type": "application/json"\n}',
    body: '{\n  "message": "Hello World"\n}',
    delay: 0,
    request: createDefaultRouteRequest(),
    errorOnMissingVariables: false,
});

const normalizeRouteDefaults = (value: any): RouteDefaults => ({
    ...createDefaultRouteDefaults(),
    ...(value || {}),
    method: ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(value?.method)
        ? value.method
        : "GET",
    path: typeof value?.path === "string" && value.path
        ? value.path
        : "/api/new-endpoint",
    description: typeof value?.description === "string"
        ? value.description
        : "New Route",
    statusCode: typeof value?.statusCode === "number" ? value.statusCode : 200,
    headers: normalizeImportedJsonField(
        value?.headers,
        '{\n  "Content-Type": "application/json"\n}'
    ),
    body: normalizeImportedJsonField(
        value?.body,
        '{\n  "message": "Hello World"\n}'
    ),
    request: {
        ...createDefaultRouteRequest(),
        ...(value && typeof value.request === "object" ? value.request : {}),
    },
    errorOnMissingVariables: Boolean(value?.errorOnMissingVariables),
});

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
    routeDefaults: createDefaultRouteDefaults(),
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
    routeDefaults: normalizeRouteDefaults(value?.routeDefaults),
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


const insertMissingJsonCommas = (rawValue: string): string => {
    let result = "";
    let inString = false;
    let escaped = false;

    for (let index = 0; index < rawValue.length; index += 1) {
        const currentChar = rawValue[index];

        if (escaped) {
            result += currentChar;
            escaped = false;
            continue;
        }

        if (currentChar === "\\") {
            result += currentChar;
            if (inString) {
                escaped = true;
            }
            continue;
        }

        if (currentChar === "\"") {
            inString = !inString;
            result += currentChar;
            continue;
        }

        if (!inString && (currentChar === "{" || currentChar === "[")) {
            let previousIndex = result.length - 1;
            while (previousIndex >= 0 && /\s/.test(result[previousIndex])) {
                previousIndex -= 1;
            }

            const previousChar = previousIndex >= 0 ? result[previousIndex] : "";
            if (previousChar === "}" || previousChar === "]" || previousChar === "\"") {
                result += ",";
            }
        }

        result += currentChar;
    }

    return result;
};

const convertSingleQuotedStrings = (rawValue: string): string => {
    let result = "";
    let inDoubleString = false;
    let inSingleString = false;
    let escaped = false;

    for (let index = 0; index < rawValue.length; index += 1) {
        const currentChar = rawValue[index];

        if (escaped) {
            result += currentChar;
            escaped = false;
            continue;
        }

        if (currentChar === "\\") {
            result += currentChar;
            escaped = true;
            continue;
        }

        if (currentChar === "\"" && !inSingleString) {
            inDoubleString = !inDoubleString;
            result += currentChar;
            continue;
        }

        if (currentChar === "'" && !inDoubleString) {
            inSingleString = !inSingleString;
            result += "\"";
            continue;
        }

        result += currentChar;
    }

    return result;
};

const quoteUnquotedKeys = (rawValue: string): string => {
    return rawValue.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)(\s*:)/g, '$1"$2"$3');
};

const removeTrailingJsonCommas = (rawValue: string): string => {
    return rawValue.replace(/,\s*([}\]])/g, '$1');
};

const normalizeRelaxedJson = (rawValue: string): string => {
    return removeTrailingJsonCommas(
        quoteUnquotedKeys(
            convertSingleQuotedStrings(
                insertMissingJsonCommas(rawValue)
            )
        )
    );
};

const parseJsonObjectString = (rawValue: string, fallback: Record<string, string>) => {
    try {
        const parsedValue = JSON.parse(rawValue);
        if (parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)) {
            return parsedValue;
        }
    } catch (err) {
        try {
            const parsedValue = JSON.parse(normalizeRelaxedJson(rawValue));
            if (parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)) {
                return parsedValue;
            }
        } catch (nestedErr) {
            return fallback;
        }
    }

    return fallback;
};

const validateImportedRoute = (route: any, index: number) => {
    const missingFields: string[] = [];
    const invalidFields: string[] = [];

    if (!route || typeof route !== "object" || Array.isArray(route)) {
        throw new Error(`Route ${index + 1} must be an object`);
    }

    if (typeof route.method !== "string" || !route.method.trim()) {
        missingFields.push("method");
    }

    if (typeof route.path !== "string" || !route.path.trim()) {
        missingFields.push("path");
    }

    if (typeof route.statusCode !== "number") {
        missingFields.push("statusCode");
    } else if (!Number.isFinite(route.statusCode)) {
        invalidFields.push("statusCode");
    }

    if (typeof route.body === "undefined") {
        missingFields.push("body");
    } else if (route.body === null) {
        invalidFields.push("body");
    }

    if (missingFields.length > 0) {
        throw new Error(`Route ${index + 1} is missing required fields: ${missingFields.join(", ")}`);
    }

    if (invalidFields.length > 0) {
        throw new Error(`Route ${index + 1} has invalid fields: ${invalidFields.join(", ")}`);
    }
};

const normalizeRouteIdentity = (method: string, path: string) =>
    `${String(method || "").trim().toUpperCase()} ${String(path || "").trim()}`;

const hasRouteConflict = (routes: Route[], method: string, path: string, excludedRouteId?: string) => {
    const candidateIdentity = normalizeRouteIdentity(method, path);
    return routes.some((route) => (
        route.id !== excludedRouteId &&
        normalizeRouteIdentity(route.method, route.path) === candidateIdentity
    ));
};

const createUniqueRoutePath = (routes: Route[], method: string, basePath: string) => {
    const trimmedBasePath = basePath.trim() || "/api/new-endpoint";
    if (!hasRouteConflict(routes, method, trimmedBasePath)) {
        return trimmedBasePath;
    }

    let suffix = 2;
    while (hasRouteConflict(routes, method, `${trimmedBasePath}-${suffix}`)) {
        suffix += 1;
    }

    return `${trimmedBasePath}-${suffix}`;
};

const normalizeImportedRoute = (route: any, index: number): Route => ({
    ...normalizeRoute(route),
    id: route?.id || `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    path: typeof route?.path === "string" && route.path ? route.path : `/api/imported-${index + 1}`,
    method: ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(route?.method)
        ? route.method
        : "GET",
    status: ["active", "inactive", "error"].includes(route?.status)
        ? route.status
        : "active",
    description: typeof route?.description === "string" ? route.description : "Imported Route",
    responseTime: typeof route?.responseTime === "string" ? route.responseTime : "-",
    statusCode: typeof route?.statusCode === "number" ? route.statusCode : 200,
    headers: route?.headers && typeof route.headers === "object"
        ? route.headers
        : { "Content-Type": "application/json" },
    body: normalizeImportedJsonField(route?.body, '{\n  "message": "Hello World"\n}'),
    request: {
        query: normalizeImportedJsonField(route?.request?.query, ""),
        headers: normalizeImportedJsonField(route?.request?.headers, ""),
        body: normalizeImportedJsonField(route?.request?.body, ""),
    },
    delay: typeof route?.delay === "number" ? route.delay : 0,
});

export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>("routes");
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([]);
    const [isRouteSelectionMode, setIsRouteSelectionMode] = useState(false);
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

    const pushUiLog = (type: LogEntry["type"], message: string) => {
        const projectPrefix = activeProject?.id || activeProjectId || "default";
        setLogs(prev => [{
            id: Date.now().toString() + Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            type,
            message: `[${projectPrefix}] ${message}`,
        }, ...prev]);
    };

    const updateProject = (projectId: string, updater: (project: ProjectState) => ProjectState) => {
        setProjects(prev => prev.map(project => (
            project.id === projectId ? updater(project) : project
        )));
    };

    const applyRoutesUpdate = (projectId: string, nextRoutes: Route[], restartDelayMs?: number) => {
        updateProject(projectId, project => ({
            ...project,
            routes: nextRoutes,
        }));

        setSelectedRouteIds((prev) => prev.filter((routeId) => nextRoutes.some((route) => route.id === routeId)));

        if (selectedRouteId && !nextRoutes.some((route) => route.id === selectedRouteId)) {
            setSelectedRouteId(null);
        }

        if (
            restartDelayMs !== undefined &&
            activeProject &&
            activeProject.id === projectId &&
            activeServerStatus === "running" &&
            window.electronAPI
        ) {
            scheduleProjectRestart(projectId, activeServerSettings, nextRoutes, restartDelayMs);
        }
    };

    const toggleRouteSelection = (routeId: string) => {
        setSelectedRouteIds((prev) => (
            prev.includes(routeId)
                ? prev.filter((id) => id !== routeId)
                : [...prev, routeId]
        ));
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
        setSelectedRouteIds([]);
        setIsRouteSelectionMode(false);
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

        const routeDefaults = normalizeRouteDefaults(activeProject.serverSettings.routeDefaults);
        const nextPath = createUniqueRoutePath(
            activeProject.routes,
            routeDefaults.method,
            routeDefaults.path
        );
        const newRoute: Route = {
            id: Date.now().toString(),
            path: nextPath,
            method: routeDefaults.method,
            status: 'active',
            description: routeDefaults.description,
            responseTime: '-',
            statusCode: routeDefaults.statusCode,
            headers: parseJsonObjectString(routeDefaults.headers, { 'Content-Type': 'application/json' }),
            body: routeDefaults.body,
            delay: routeDefaults.delay,
            request: {
                ...createDefaultRouteRequest(),
                ...routeDefaults.request,
            },
            errorOnMissingVariables: routeDefaults.errorOnMissingVariables,
        };

        if (nextPath !== routeDefaults.path.trim()) {
            pushUiLog(
                "info",
                `Route ${routeDefaults.method} ${routeDefaults.path} already exists. New route created as ${routeDefaults.method} ${nextPath}.`
            );
        }

        const updatedRoutes = [...activeProject.routes, newRoute];
        setSelectedRouteId(newRoute.id);
        setSelectedRouteIds([]);
        setIsRouteSelectionMode(false);
        setActiveTab('routes');
        applyRoutesUpdate(activeProject.id, updatedRoutes, 0);
    };

    const updateRoute = async (id: string, field: keyof Route, value: any) => {
        if (!activeProject) {
            return;
        }

        const currentRoute = activeProject.routes.find(route => route.id === id);
        if (!currentRoute) {
            return;
        }

        const nextMethod = field === "method" ? value : currentRoute.method;
        const nextPath = field === "path" ? value : currentRoute.path;

        if (
            (field === "method" || field === "path") &&
            hasRouteConflict(activeProject.routes, nextMethod, nextPath, id)
        ) {
            pushUiLog("error", `Duplicate route blocked: ${String(nextMethod).toUpperCase()} ${String(nextPath).trim()}`);
            return;
        }

        const updatedRoutes = activeProject.routes.map(r => (
            r.id === id ? { ...r, [field]: value } : r
        ));

        if (
            activeServerStatus === 'running' &&
            ROUTE_FIELDS_REQUIRING_RESTART.includes(field)
        ) {
            applyRoutesUpdate(activeProject.id, updatedRoutes, 250);
            return;
        }

        applyRoutesUpdate(activeProject.id, updatedRoutes);
    };

    const deleteRoute = async (id: string) => {
        if (!activeProject) {
            return;
        }

        const filteredRoutes = activeProject.routes.filter(r => r.id !== id);
        applyRoutesUpdate(
            activeProject.id,
            filteredRoutes,
            activeServerStatus === "running" ? 0 : undefined
        );
    };

    const duplicateRoute = (id: string) => {
        if (!activeProject) {
            return;
        }

        const sourceRoute = activeProject.routes.find(route => route.id === id);
        if (!sourceRoute) {
            return;
        }

        const nextPath = createUniqueRoutePath(
            activeProject.routes,
            sourceRoute.method,
            sourceRoute.path
        );

        const duplicatedRoute: Route = {
            ...sourceRoute,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            path: nextPath,
            description: sourceRoute.description
                ? `${sourceRoute.description} Copy`
                : "Duplicated Route",
        };

        const updatedRoutes = [...activeProject.routes, duplicatedRoute];
        setSelectedRouteId(duplicatedRoute.id);
        setActiveTab("routes");
        applyRoutesUpdate(activeProject.id, updatedRoutes, activeServerStatus === "running" ? 0 : undefined);
    };

    const deleteSelectedRoutes = async () => {
        if (!activeProject || selectedRouteIds.length === 0) {
            return;
        }

        const selectedIds = new Set(selectedRouteIds);
        const filteredRoutes = activeProject.routes.filter((route) => !selectedIds.has(route.id));
        applyRoutesUpdate(
            activeProject.id,
            filteredRoutes,
            activeServerStatus === "running" ? 0 : undefined
        );
        setIsRouteSelectionMode(false);
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
        setSelectedRouteIds([]);
        setIsRouteSelectionMode(false);
    };

    const handleImportRoutes = async (rawValue: string) => {
        if (!activeProject) {
            return;
        }

        let parsedValue: any;
        try {
            parsedValue = JSON.parse(rawValue);
        } catch (err) {
            try {
                parsedValue = JSON.parse(normalizeRelaxedJson(rawValue));
            } catch (nestedErr) {
                throw new Error("Invalid JSON");
            }
        }

        const incomingRoutes = Array.isArray(parsedValue)
            ? parsedValue
            : Array.isArray(parsedValue?.routes)
                ? parsedValue.routes
                : null;

        if (!incomingRoutes || incomingRoutes.length === 0) {
            throw new Error("JSON must be an array of routes or an object with a routes array");
        }

        incomingRoutes.forEach((route, index) => {
            validateImportedRoute(route, index);
        });

        const importedIdentities = new Set<string>();
        incomingRoutes.forEach((route, index) => {
            const routeIdentity = normalizeRouteIdentity(route.method, route.path);
            if (importedIdentities.has(routeIdentity)) {
                throw new Error(`Imported routes contain a duplicate at route ${index + 1}: ${route.method} ${route.path}`);
            }
            importedIdentities.add(routeIdentity);

            if (hasRouteConflict(activeProject.routes, route.method, route.path)) {
                throw new Error(`Route already exists in this project: ${route.method} ${route.path}`);
            }
        });

        const normalizedRoutes = incomingRoutes.map((route, index) =>
            normalizeImportedRoute(route, index)
        );
        const updatedRoutes = [...activeProject.routes, ...normalizedRoutes];

        if (!selectedRouteId && normalizedRoutes[0]) {
            setSelectedRouteId(normalizedRoutes[0].id);
        }
        setSelectedRouteIds([]);
        setIsRouteSelectionMode(false);
        applyRoutesUpdate(activeProject.id, updatedRoutes, activeServerStatus === "running" ? 0 : undefined);
    };

    const selectedRoute = activeRoutes.find(r => r.id === selectedRouteId);

    if (!isDataLoaded) {
        return (
            <div
                className="h-screen flex items-center justify-center"
                style={{ backgroundColor: colors.background, color: colors.textPrimary }}
            >
                Loading...
            </div>
        );
    }

    return (
        <div
            className="app-shell h-screen flex flex-col p-4"
            style={{
                backgroundColor: colors.background,
                color: colors.textPrimary,
                fontFamily: '"Inter", "SF Pro Display", "Segoe UI Variable", sans-serif',
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

            <div
                className="glass-panel relative z-10 flex flex-1 overflow-hidden rounded-[28px] border"
                style={{ borderColor: colors.border, boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)" }}
            >
                <Sidebar
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    routes={activeRoutes}
                    selectedRouteId={selectedRouteId}
                    setSelectedRouteId={setSelectedRouteId}
                    selectedRouteIds={selectedRouteIds}
                    isRouteSelectionMode={isRouteSelectionMode}
                    setIsRouteSelectionMode={setIsRouteSelectionMode}
                    onToggleRouteSelection={toggleRouteSelection}
                    onDeleteSelectedRoutes={deleteSelectedRoutes}
                    onAddRoute={handleAddRoute}
                    methodFilter={methodFilter}
                    setMethodFilter={setMethodFilter}
                />

                <main className="flex-1 flex flex-col overflow-hidden bg-transparent">
                    {activeTab === 'routes' && (
                        <RoutesTab
                            selectedRoute={selectedRoute}
                            updateRoute={updateRoute}
                            deleteRoute={deleteRoute}
                            duplicateRoute={duplicateRoute}
                        />
                    )}

                    {activeTab === 'server' && (
                        <ServerTab
                            serverStatus={activeServerStatus}
                            serverSettings={activeServerSettings}
                            routes={activeRoutes}
                            onStartServer={handleRunServer}
                            onStopServer={handleStopServer}
                            onImportRoutes={handleImportRoutes}
                            isPortAvailable={isPortAvailable}
                            serverTransition={activeServerTransition}
                        />
                    )}

                    {activeTab === 'logs' && (
                        <LogsPanel logs={logs} setLogs={setLogs} variant="full" />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsTab
                            serverSettings={activeServerSettings}
                            handleSettingChange={handleSettingChange}
                            isPortAvailable={isPortAvailable}
                            serverStatus={activeServerStatus}
                        />
                    )}

                    {activeTab !== "logs" && (
                        <LogsPanel logs={logs} setLogs={setLogs} />
                    )}
                </main>
            </div>
        </div>
    );
}
