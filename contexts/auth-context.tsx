"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { UserSession, setMemoryAuth, getMemoryToken, getMemoryUser, postAuthApi } from "@/lib/auth";

interface AuthContextType {
  user: UserSession | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (session: UserSession) => void;
  logout: () => Promise<void>;
  silentRefresh: () => Promise<boolean>;
  updateUserSession: (updatedUser: Partial<UserSession>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    // Refresh access token every 13 minutes (access token expires in 15 minutes)
    refreshTimerRef.current = setInterval(() => {
      silentRefresh();
    }, 13 * 60 * 1000);
  }, []);

  const silentRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await postAuthApi("/api/v1/auth/refresh");
      if (res.ok) {
        const data: UserSession = await res.json();
        setMemoryAuth(data);
        setUser(data);
        setAccessToken(data.token);
        scheduleRefresh();
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.warn("Silent refresh failed:", err);
    }

    setMemoryAuth(null);
    setUser(null);
    setAccessToken(null);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    setIsLoading(false);
    return false;
  }, [scheduleRefresh]);

  useEffect(() => {
    silentRefresh();
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [silentRefresh]);

  const login = (session: UserSession) => {
    setMemoryAuth(session);
    setUser(session);
    setAccessToken(session.token);
    scheduleRefresh();
  };

  const logout = async () => {
    try {
      await postAuthApi("/api/v1/auth/logout");
    } catch (err) {
      console.warn("Logout API call failed:", err);
    } finally {
      setMemoryAuth(null);
      setUser(null);
      setAccessToken(null);
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    }
  };

  const updateUserSession = (updatedUser: Partial<UserSession>) => {
    if (!user) return;
    const newSession: UserSession = {
      ...user,
      ...updatedUser,
    };
    setMemoryAuth(newSession);
    setUser(newSession);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        logout,
        silentRefresh,
        updateUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
