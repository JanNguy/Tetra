export const colors = {
    primary: "#007AFF",
    secondary: "#E9EEF7",
    accent: "#007AFF",
    background: "#F5F5F7",
    surface: "#FFFFFF",
    panel: "#FBFBFD",
    border: "#D8DCE4",
    borderStrong: "#C7CDD8",
    success: "#34C759",
    warning: "#FF9F0A",
    error: "#FF3B30",
    info: "#5AC8FA",
    textPrimary: "#101828",
    textSecondary: "#475467",
    textMuted: "#667085",
    textSoft: "#98A2B3",
};

export const getMethodColor = (method: string) => {
    switch (method) {
        case "GET": return "bg-emerald-500";
        case "POST": return "bg-sky-500";
        case "PUT": return "bg-amber-500";
        case "DELETE": return "bg-red-500";
        case "PATCH": return "bg-indigo-500";
        default: return "bg-slate-500";
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
