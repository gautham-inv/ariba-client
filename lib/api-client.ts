import { API_BASE } from "./api";

/**
 * Custom Fetch Wrapper (Interceptor)
 * Automatically handles:
 * 1. Base URL
 * 2. Absolute credentials (cookies)
 * 3. JSON unwrapping (data: ...)
 * 4. Error handling
 */

interface RequestOptions extends RequestInit {
    data?: any;
}

export const apiClient = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { data, ...customConfig } = options;

    const headers = {
        "Content-Type": "application/json",
        ...customConfig.headers,
    };

    const config: RequestInit = {
        ...customConfig,
        headers,
        credentials: "include", // Required for better-auth cookies
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    // Ensure endpoint doesn't start with double slash if API_BASE has trailing slash
    const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Something went wrong");
    }

    // If response is 204 No Content, return empty object
    if (response.status === 204) {
        return {} as T;
    }

    const result = await response.json();

    // Unwrap the "data" property if it exists (for TransformInterceptor)
    return result.data ?? result;
};

// Typed helpers
export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: "GET" }),

    post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: "POST", data }),

    put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: "PUT", data }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
        apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};
