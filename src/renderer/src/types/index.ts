export interface RouteRequestConfig {
    query: string;
    headers: string;
    body: string;
}

export interface RouteDefaults {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    path: string;
    description: string;
    statusCode: number;
    headers: string;
    body: string;
    delay: number;
    request: RouteRequestConfig;
    errorOnMissingVariables: boolean;
}

export interface Route {
    id: string;
    path: string;
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    status: "active" | "inactive" | "error";
    description: string;
    responseTime: string;
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    delay?: number;
    request?: RouteRequestConfig;
    errorOnMissingVariables?: boolean;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    type: "request" | "response" | "error" | "info";
    message: string;
}

export type Tab = "routes" | "server" | "settings";

export type ServerRuntime = "local" | "podman";

export interface ServerSettings {
    name: string;
    port: string;
    runtime: ServerRuntime;
    corsEnabled: boolean;
    corsOrigin: string;
    delay: number;
    logRequests: boolean;
    logResponses: boolean;
    autoStart: boolean;
    routeDefaults: RouteDefaults;
}
