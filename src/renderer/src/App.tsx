import { useState, useEffect } from "react";
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

export default function App() {
    const [activeTab, setActiveTab] = useState<Tab>("routes");
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [serverStatus, setServerStatus] = useState<"stopped" | "running">("stopped");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [methodFilter, setMethodFilter] = useState<string | null>(null);

    const [routes, setRoutes] = useState<Route[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isPortAvailable, setIsPortAvailable] = useState<boolean | null>(null);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        if (window.electronAPI) {
            window.electronAPI.onServerLog((event: any, log: any) => {
                const newLog: LogEntry = {
                    id: Date.now().toString() + Math.random().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    type: log.type,
                    message: log.message
                };
                setLogs(prev => [newLog, ...prev]);
            });

            window.electronAPI.onServerError((event: any, log: any) => {
                const newLog: LogEntry = {
                    id: Date.now().toString() + Math.random().toString(),
                    timestamp: new Date().toLocaleTimeString(),
                    type: log.type,
                    message: log.message
                };
                setLogs(prev => [newLog, ...prev]);
                setServerStatus("stopped");
            });

            return () => {
                window.electronAPI?.removeAllListeners();
            };
        }
    }, []);

    const [serverSettings, setServerSettings] = useState<ServerSettings>({
        name: "My API Server",
        port: "3000",
        corsEnabled: true,
        corsOrigin: "*",
        delay: 0,
        logRequests: true,
        logResponses: true,
        autoStart: false,
    });

    useEffect(() => {
        const initData = async () => {
            if (window.electronAPI) {
                const data = await window.electronAPI.loadData();
                if (data) {
                    if (data.routes) setRoutes(data.routes);
                    if (data.serverSettings) setServerSettings(data.serverSettings);
                }
            }
            setIsDataLoaded(true);
        };
        initData();
    }, []);

    useEffect(() => {
        if (isDataLoaded && window.electronAPI) {
            window.electronAPI.saveData({ routes, serverSettings });
        }
    }, [routes, serverSettings, isDataLoaded]);

    useEffect(() => {
        const checkPort = async () => {
            if (window.electronAPI && serverSettings.port) {
                if (serverStatus === 'running') {
                    setIsPortAvailable(true);
                    return;
                }
                
                const portNum = parseInt(serverSettings.port);
                if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
                    setIsPortAvailable(false);
                    return;
                }

                try {
                    const available = await window.electronAPI.checkPort(serverSettings.port);
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
    }, [serverSettings.port, serverStatus]);

    const handleRunServer = async () => {
        if (serverSettings.name && serverSettings.port) {
            try {
                if (window.electronAPI) {
                    await window.electronAPI.startServer(serverSettings, routes);
                }
                setServerStatus("running");
            } catch (err) {
                console.error("Failed to start server:", err);
            }
        }
    };

    const handleStopServer = async () => {
        try {
            if (window.electronAPI) {
                await window.electronAPI.stopServer();
            }
            setServerStatus("stopped");
        } catch (err) {
            console.error("Failed to stop server:", err);
        }
    };

    const handleAddRoute = async () => {
        const newRoute: Route = {
            id: Date.now().toString(),
            path: "/api/new-endpoint",
            method: "GET",
            status: "active",
            description: "New Route",
            responseTime: "-",
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: "{\n  \"message\": \"Hello World\"\n}",
            delay: 0
        };
        const updatedRoutes = [...routes, newRoute];
        setRoutes(updatedRoutes);
        setSelectedRouteId(newRoute.id);
        setActiveTab("routes");
        
        if (serverStatus === "running" && window.electronAPI) {
            try {
                await window.electronAPI.restartServer(serverSettings, updatedRoutes);
            } catch (err) {
                console.error("Failed to restart server:", err);
            }
        }
    };

    const updateRoute = async (id: string, field: keyof Route, value: any) => {
        setRoutes(routes.map(r => r.id === id ? { ...r, [field]: value } : r));
        
        if (serverStatus === "running" && window.electronAPI) {
            const updatedRoutes = routes.map(r => r.id === id ? { ...r, [field]: value } : r);
            try {
                await window.electronAPI.restartServer(serverSettings, updatedRoutes);
            } catch (err) {
                console.error("Failed to restart server:", err);
            }
        }
    };

    const deleteRoute = async (id: string) => {
        const filteredRoutes = routes.filter(r => r.id !== id);
        setRoutes(filteredRoutes);
        if (selectedRouteId === id) setSelectedRouteId(null);
        
        if (serverStatus === "running" && window.electronAPI) {
            try {
                await window.electronAPI.restartServer(serverSettings, filteredRoutes);
            } catch (err) {
                console.error("Failed to restart server:", err);
            }
        }
    };

    const handleSettingChange = (key: keyof ServerSettings, value: string | number | boolean) => {
        setServerSettings(prev => ({ ...prev, [key]: value }));
    };

    const selectedRoute = routes.find(r => r.id === selectedRouteId);

    if (!isDataLoaded) {
        return <div className="h-screen flex items-center justify-center text-white" style={{ backgroundColor: colors.background }}>Loading...</div>;
    }

    return (
        <div className="h-screen flex flex-col" style={{ backgroundColor: colors.background, color: colors.textPrimary, fontFamily: "Inter, system-ui, sans-serif" }}>
            <Header 
                serverStatus={serverStatus} 
                serverSettings={serverSettings} 
                onStartServer={handleRunServer} 
                onStopServer={handleStopServer} 
                isPortAvailable={isPortAvailable}
            />

            <div className="flex-1 flex overflow-hidden">
                <Sidebar 
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    routes={routes}
                    selectedRouteId={selectedRouteId}
                    setSelectedRouteId={setSelectedRouteId}
                    onAddRoute={handleAddRoute}
                    methodFilter={methodFilter}
                />

                <main className="flex-1 flex flex-col overflow-hidden">
                    {activeTab === "routes" && (
                        <RoutesTab 
                            selectedRoute={selectedRoute} 
                            updateRoute={updateRoute} 
                            deleteRoute={deleteRoute} 
                        />
                    )}

                    {activeTab === "server" && (
                        <ServerTab 
                            serverStatus={serverStatus} 
                            serverSettings={serverSettings} 
                            routes={routes} 
                            onStartServer={handleRunServer} 
                            onStopServer={handleStopServer} 
                            isPortAvailable={isPortAvailable}
                        />
                    )}

                    {activeTab === "settings" && (
                        <SettingsTab 
                            serverSettings={serverSettings} 
                            handleSettingChange={handleSettingChange} 
                            isPortAvailable={isPortAvailable}
                            serverStatus={serverStatus}
                        />
                    )}

                    <LogsPanel logs={logs} setLogs={setLogs} />
                </main>
            </div>
        </div>
    );
}
