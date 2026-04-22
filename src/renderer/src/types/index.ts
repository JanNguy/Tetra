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
}
