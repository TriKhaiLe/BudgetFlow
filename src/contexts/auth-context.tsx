"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ANONYMOUS_SESSION_ID_STORAGE_KEY,
  buildBudgetStateStorageKey,
} from "@/lib/constants";
import {
  isSupabaseConfigured,
  supabaseAuthService,
} from "@/services/supabase-auth-service";

type AuthContextValue = {
  isInitialized: boolean;
  isSupabaseConfigured: boolean;
  isAnonymous: boolean;
  userId: string | null;
  email: string | null;
  storageScope: string;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

type AuthState = {
  isInitialized: boolean;
  isAnonymous: boolean;
  userId: string | null;
  email: string | null;
  storageScope: string;
  session: Session | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function createAnonymousSessionId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function ensureAnonymousSessionId(): string {
  const existing = localStorage.getItem(ANONYMOUS_SESSION_ID_STORAGE_KEY);
  if (existing) return existing;

  const created = createAnonymousSessionId();
  localStorage.setItem(ANONYMOUS_SESSION_ID_STORAGE_KEY, created);
  return created;
}

function anonymousScope(anonymousSessionId: string): string {
  return `anon:${anonymousSessionId}`;
}

function userScope(userId: string): string {
  return `user:${userId}`;
}

function linkAnonymousDataToUser(anonymousSessionId: string, userId: string) {
  const sourceKey = buildBudgetStateStorageKey(
    anonymousScope(anonymousSessionId),
  );
  const targetKey = buildBudgetStateStorageKey(userScope(userId));

  const sourceData = localStorage.getItem(sourceKey);
  const targetData = localStorage.getItem(targetKey);

  if (sourceData && !targetData) {
    localStorage.setItem(targetKey, sourceData);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isInitialized: false,
    isAnonymous: true,
    userId: null,
    email: null,
    storageScope: anonymousScope("bootstrap"),
    session: null,
  });

  const setAnonymousState = useCallback((anonymousSessionId: string) => {
    setState({
      isInitialized: true,
      isAnonymous: true,
      userId: null,
      email: null,
      storageScope: anonymousScope(anonymousSessionId),
      session: null,
    });
  }, []);

  const initializeAuth = useCallback(async () => {
    if (typeof window === "undefined") return;

    const anonymousSessionId = ensureAnonymousSessionId();

    if (!isSupabaseConfigured) {
      setAnonymousState(anonymousSessionId);
      return;
    }

    const session = await supabaseAuthService.getCurrentSession();

    if (session?.user?.id) {
      linkAnonymousDataToUser(anonymousSessionId, session.user.id);
      setState({
        isInitialized: true,
        isAnonymous: false,
        userId: session.user.id,
        email: session.user.email ?? null,
        storageScope: userScope(session.user.id),
        session,
      });
      return;
    }

    setAnonymousState(anonymousSessionId);
  }, [setAnonymousState]);

  useEffect(() => {
    let isMounted = true;

    const safeInitialize = async () => {
      try {
        if (!isMounted) return;
        await initializeAuth();
      } catch (error) {
        console.error("Failed to initialize auth", error);
        if (isMounted && typeof window !== "undefined") {
          const anonymousSessionId = ensureAnonymousSessionId();
          setAnonymousState(anonymousSessionId);
        }
      }
    };

    safeInitialize();

    if (!isSupabaseConfigured) {
      return () => {
        isMounted = false;
      };
    }

    const subscription = supabaseAuthService.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted || typeof window === "undefined") return;

        const anonymousSessionId = ensureAnonymousSessionId();

        if (session?.user?.id) {
          linkAnonymousDataToUser(anonymousSessionId, session.user.id);
          setState({
            isInitialized: true,
            isAnonymous: false,
            userId: session.user.id,
            email: session.user.email ?? null,
            storageScope: userScope(session.user.id),
            session,
          });
          return;
        }

        setAnonymousState(anonymousSessionId);
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth, setAnonymousState]);

  const login = useCallback(
    async (email: string, password: string) => {
      await supabaseAuthService.login(email, password);
      await initializeAuth();
    },
    [initializeAuth],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      await supabaseAuthService.signup(email, password);
      await initializeAuth();
    },
    [initializeAuth],
  );

  const loginWithGoogle = useCallback(async () => {
    await supabaseAuthService.loginWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    if (typeof window === "undefined") return;

    const currentUserId = state.userId;
    const currentAnonymousSessionId = localStorage.getItem(
      ANONYMOUS_SESSION_ID_STORAGE_KEY,
    );

    if (isSupabaseConfigured) {
      try {
        await supabaseAuthService.logout();
      } catch (error) {
        console.error("Failed to logout from Supabase", error);
      }
    }

    if (currentUserId) {
      localStorage.removeItem(
        buildBudgetStateStorageKey(userScope(currentUserId)),
      );
    }

    if (currentAnonymousSessionId) {
      localStorage.removeItem(
        buildBudgetStateStorageKey(anonymousScope(currentAnonymousSessionId)),
      );
    }

    const nextAnonymousSessionId = createAnonymousSessionId();
    localStorage.setItem(
      ANONYMOUS_SESSION_ID_STORAGE_KEY,
      nextAnonymousSessionId,
    );
    setAnonymousState(nextAnonymousSessionId);
  }, [setAnonymousState, state.userId]);

  const getAccessToken = useCallback(async () => {
    if (!isSupabaseConfigured) return null;
    return supabaseAuthService.getToken();
  }, []);

  const value: AuthContextValue = {
    ...state,
    isSupabaseConfigured,
    login,
    signup,
    loginWithGoogle,
    logout,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
