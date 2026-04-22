export interface Routes {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    path: string;
    status: number;
    response: unknown;
    headers?: Record<string, string>;
    delayMs?: number;
}