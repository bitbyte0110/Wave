/**
 * Helper utilities for managing authentication tokens, user sessions,
 * and API calls routed through Spring Cloud Gateway (port 8080)
 * with automatic fallback to standalone microservice ports (e.g. 8082 for auth-service).
 */

export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";
export const AUTH_SERVICE_DIRECT_URL = "http://localhost:8082";

export interface UserSession {
  token: string;
  userId: number;
  username: string;
  email: string;
}

/**
 * Persists user auth state into localStorage and session cookies upon login/register.
 */
export const setAuthSession = (session: UserSession) => {
  if (typeof window === "undefined") return;

  localStorage.setItem("token", session.token);
  localStorage.setItem("userId", String(session.userId));
  localStorage.setItem("username", session.username);
  localStorage.setItem("email", session.email);

  sessionStorage.setItem("isLoggedIn", "true");
  document.cookie = `token=${session.token}; path=/; max-age=86400`;
  document.cookie = "isLoggedIn=true; path=/; max-age=86400";
};

/**
 * Clears all authentication state from storage and cookies on sign out.
 */
export const clearAuthSession = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("registeredEmail");

  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

/**
 * Retrieves the current JWT token from localStorage.
 */
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

/**
 * Retrieves the current authenticated user details from localStorage.
 */
export const getAuthUser = (): UserSession | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  const userIdStr = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("email");

  if (!token || !userIdStr) return null;

  return {
    token,
    userId: Number(userIdStr),
    username: username || "User",
    email: email || "",
  };
};

/**
 * Checks if a user is currently authenticated.
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

/**
 * Posts authentication payloads with automatic fallback:
 * 1. Tries Edge API Gateway (http://localhost:8080/api/v1/auth/...)
 * 2. If Gateway is not running, falls back directly to Auth-Service (http://localhost:8082/api/v1/auth/...)
 */
export const postAuthApi = async (endpoint: string, payload: any): Promise<Response> => {
  const gatewayUrl = endpoint.startsWith("http") ? endpoint : `${GATEWAY_URL}${endpoint}`;

  try {
    return await fetch(gatewayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    const directUrl = `${AUTH_SERVICE_DIRECT_URL}${endpoint}`;
    console.warn(`Gateway call to ${gatewayUrl} failed (${err.message}). Falling back to direct Auth-Service at ${directUrl}`);

    return fetch(directUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
};

/**
 * Wrapper around fetch that automatically appends the Bearer token
 * in the Authorization header when targeting Gateway endpoints.
 */
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${GATEWAY_URL}${endpoint}`;
  return fetch(url, { ...options, headers });
};
