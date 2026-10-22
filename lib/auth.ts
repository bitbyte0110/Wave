/**
 * Helper utilities for managing in-memory authentication tokens, user sessions,
 * and API calls routed through Spring Cloud Gateway (port 8080)
 * with HttpOnly Refresh Cookie support & automatic service fallback.
 */

export const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";
export const AUTH_SERVICE_DIRECT_URL = "http://localhost:8082";

export interface UserSession {
  token: string;
  userId: number;
  username: string;
  email: string;
}

// In-Memory Storage for Short-Lived Access Token (Never written to localStorage)
let inMemoryToken: string | null = null;
let inMemoryUser: UserSession | null = null;

export const setMemoryAuth = (session: UserSession | null) => {
  if (!session) {
    inMemoryToken = null;
    inMemoryUser = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("isLoggedIn");
      document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.dispatchEvent(new Event("auth-change"));
    }
    return;
  }

  inMemoryToken = session.token;
  inMemoryUser = session;

  if (typeof window !== "undefined") {
    sessionStorage.setItem("isLoggedIn", "true");
    document.cookie = "isLoggedIn=true; path=/; max-age=604800";
    window.dispatchEvent(new Event("auth-change"));
  }
};

export const getMemoryToken = (): string | null => {
  return inMemoryToken;
};

export const getMemoryUser = (): UserSession | null => {
  return inMemoryUser;
};

export const getAuthToken = (): string | null => {
  return getMemoryToken();
};

export const getAuthUser = (): UserSession | null => {
  return getMemoryUser();
};

export const setAuthSession = (session: UserSession) => {
  setMemoryAuth(session);
};

export const clearAuthSession = () => {
  setMemoryAuth(null);
};

/**
 * Checks if a user is currently authenticated in memory.
 */
export const isAuthenticated = (): boolean => {
  return inMemoryToken !== null;
};

/**
 * Posts authentication payloads with HttpOnly cookies & automatic fallback:
 * 1. Tries Edge API Gateway (http://localhost:8080/api/v1/auth/...)
 * 2. If Gateway fails, falls back directly to Auth-Service (http://localhost:8082/api/v1/auth/...)
 */
export const postAuthApi = async (endpoint: string, payload?: any): Promise<Response> => {
  const gatewayUrl = endpoint.startsWith("http") ? endpoint : `${GATEWAY_URL}${endpoint}`;
  const options: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  };

  try {
    return await fetch(gatewayUrl, options);
  } catch (err: any) {
    const directUrl = `${AUTH_SERVICE_DIRECT_URL}${endpoint}`;
    console.warn(`Gateway connection failed. Falling back to direct Auth-Service at ${directUrl}`);
    return fetch(directUrl, options);
  }
};

export const putAuthApi = async (endpoint: string, payload: any): Promise<Response> => {
  const gatewayUrl = endpoint.startsWith("http") ? endpoint : `${GATEWAY_URL}${endpoint}`;
  const headers = new Headers({ "Content-Type": "application/json" });
  if (inMemoryToken) {
    headers.set("Authorization", `Bearer ${inMemoryToken}`);
  }

  const options: RequestInit = {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  };

  try {
    return await fetch(gatewayUrl, options);
  } catch (err: any) {
    const directUrl = `${AUTH_SERVICE_DIRECT_URL}${endpoint}`;
    console.warn(`Gateway connection failed. Falling back to direct Auth-Service at ${directUrl}`);
    return fetch(directUrl, options);
  }
};

/**
 * Wrapper around fetch that automatically appends the in-memory Bearer token
 * and credentials: 'include' for HttpOnly cookie authentication.
 */
export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = getMemoryToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const url = endpoint.startsWith("http") ? endpoint : `${GATEWAY_URL}${endpoint}`;
  return fetch(url, { ...options, headers, credentials: "include" });
};
