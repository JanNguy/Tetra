export const colors = {
    primary: "#0B1F3A",
    secondary: "#132F4C",
    accent: "#3A7BFF",
    background: "#0A0F1C",
    surface: "#111827",
    border: "#1F2A3A",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3A7BFF",
    textPrimary: "#E5E7EB",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
};

export const getMethodColor = (method: string) => {
    switch (method) {
        case "GET": return "bg-blue-600";
        case "POST": return "bg-green-600";
        case "PUT": return "bg-orange-600";
        case "DELETE": return "bg-red-600";
        case "PATCH": return "bg-yellow-600";
        default: return "bg-gray-600";
    }
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case "active": return colors.success;
        case "inactive": return colors.textMuted;
        case "error": return colors.error;
        default: return colors.textMuted;
    }
};

export const getLogColor = (type: string) => {
    switch (type) {
        case "request": return colors.info;
        case "response": return colors.success;
        case "error": return colors.error;
        case "info": return colors.textSecondary;
        default: return colors.textMuted;
    }
};
