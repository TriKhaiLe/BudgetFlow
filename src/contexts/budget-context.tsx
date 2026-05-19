"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  Dispatch,
} from "react";
import type { BudgetState, MoneySource, BudgetLogTemplate } from "@/lib/types";
import { STORAGE_KEY, buildBudgetStateStorageKey } from "@/lib/constants";
import { toMonthKey } from "@/lib/utils";
import { useOptionalAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  budgetApiService,
  BudgetApiError,
} from "@/services/budget-api-service";
import { apiService } from "@/services/api-service";
import {
  initialBudgetState,
  handleAddMoneySource,
  handleUpdateMoneySource,
  handleDeleteMoneySource,
  handleAdjustBalance,
  handleAddTemplate,
  handleUpdateTemplate,
  handleDeleteTemplate,
  handleSetCurrentMonth,
  handleImportData,
  handleStartNewMonth,
  handleUpdateMonthDescription,
  handleInitializeBudgetLog,
  handleAddBudgetLogEntry,
  handleDeleteBudgetLogEntry,
  handleUpdateBudgetLogEntry,
  handleToggleBudgetLogBalanceLock,
  handleSaveBudgetLogSnapshot,
  migrateState,
} from "./reducers";

type Action =
  | { type: "SET_INITIAL_STATE"; payload: BudgetState }
  | { type: "ADD_MONEY_SOURCE"; payload: Omit<MoneySource, "id" | "spent"> }
  | { type: "UPDATE_MONEY_SOURCE"; payload: MoneySource }
  | { type: "DELETE_MONEY_SOURCE"; payload: string }
  | { type: "ADD_TEMPLATE"; payload: Omit<BudgetLogTemplate, "id"> }
  | { type: "UPDATE_TEMPLATE"; payload: BudgetLogTemplate }
  | { type: "DELETE_TEMPLATE"; payload: string }
  | {
      type: "IMPORT_DATA";
      payload: { state: BudgetState; strategy: "REPLACE" | "NEXT_MONTH" };
    }
  | {
      type: "ADJUST_BALANCE";
      payload: { moneySourceId: string; newBalance: number };
    }
  | { type: "SET_CURRENT_MONTH"; payload: Date }
  | { type: "START_NEW_MONTH" }
  | { type: "UPDATE_MONTH_DESCRIPTION"; payload: string }
  | { type: "INITIALIZE_BUDGET_LOG"; payload: string }
  | {
      type: "ADD_BUDGET_LOG_ENTRY";
      payload: {
        description: string;
        changes: Record<string, number>;
        createdAt?: string;
      };
    }
  | { type: "DELETE_BUDGET_LOG_ENTRY"; payload: string }
  | {
      type: "UPDATE_BUDGET_LOG_ENTRY";
      payload: {
        id: string;
        description: string;
        changes: Record<string, number>;
        createdAt?: string;
      };
    }
  | { type: "TOGGLE_BUDGET_LOG_BALANCE_LOCK"; payload: string }
  | { type: "SAVE_BUDGET_LOG_SNAPSHOT" };

/**
 * Budget reducer - handles all state mutations.
 * Each action is delegated to a specialized handler function for better maintainability.
 */
const budgetReducer = (state: BudgetState, action: Action): BudgetState => {
  switch (action.type) {
    case "SET_INITIAL_STATE":
      return action.payload;

    case "SET_CURRENT_MONTH":
      return handleSetCurrentMonth(state, action.payload);

    case "ADD_MONEY_SOURCE":
      return handleAddMoneySource(state, action.payload);

    case "UPDATE_MONEY_SOURCE":
      return handleUpdateMoneySource(state, action.payload);

    case "ADJUST_BALANCE":
      return handleAdjustBalance(state, action.payload);

    case "DELETE_MONEY_SOURCE":
      return handleDeleteMoneySource(state, action.payload);

    case "ADD_TEMPLATE":
      return handleAddTemplate(state, action.payload);

    case "UPDATE_TEMPLATE":
      return handleUpdateTemplate(state, action.payload);

    case "DELETE_TEMPLATE":
      return handleDeleteTemplate(state, action.payload);

    case "IMPORT_DATA":
      return handleImportData(state, action.payload);

    case "START_NEW_MONTH":
      return handleStartNewMonth(state);

    case "UPDATE_MONTH_DESCRIPTION":
      return handleUpdateMonthDescription(state, action.payload);

    case "INITIALIZE_BUDGET_LOG":
      return handleInitializeBudgetLog(state, action.payload);

    case "ADD_BUDGET_LOG_ENTRY":
      return handleAddBudgetLogEntry(state, action.payload);

    case "DELETE_BUDGET_LOG_ENTRY":
      return handleDeleteBudgetLogEntry(state, action.payload);

    case "UPDATE_BUDGET_LOG_ENTRY":
      return handleUpdateBudgetLogEntry(state, action.payload);

    case "TOGGLE_BUDGET_LOG_BALANCE_LOCK":
      return handleToggleBudgetLogBalanceLock(state, action.payload);

    case "SAVE_BUDGET_LOG_SNAPSHOT":
      return handleSaveBudgetLogSnapshot(state);

    default:
      return state;
  }
};

type BudgetContextValue = {
  state: BudgetState;
  dispatch: Dispatch<Action>;
  isSyncEnabled: boolean;
  isSyncing: boolean;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
};

function buildSyncState(state: BudgetState): BudgetState {
  const { budgetLogSnapshot, ...rest } = state;
  return rest;
}

function mergeLocalSnapshot(
  remoteState: BudgetState,
  localSnapshot: BudgetState["budgetLogSnapshot"],
): BudgetState {
  return {
    ...remoteState,
    budgetLogSnapshot: localSnapshot ?? null,
  };
}

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const auth = useOptionalAuth();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(budgetReducer, initialBudgetState);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [serverVersions, setServerVersions] = React.useState<
    Record<string, number>
  >({});
  const stateRef = React.useRef(state);
  const serverVersionsRef = React.useRef(serverVersions);
  const warmupInFlightRef = React.useRef(false);

  const storageKey = React.useMemo(() => {
    if (auth?.storageScope) {
      return buildBudgetStateStorageKey(auth.storageScope);
    }
    return STORAGE_KEY;
  }, [auth?.storageScope]);

  const isAuthReady = auth ? auth.isInitialized : true;
  const isRemoteSyncEnabled = Boolean(
    auth && auth.isSupabaseConfigured && !auth.isAnonymous,
  );
  const monthKey = React.useMemo(
    () => toMonthKey(state.currentMonth),
    [state.currentMonth],
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    serverVersionsRef.current = serverVersions;
  }, [serverVersions]);

  useEffect(() => {
    if (!isAuthReady) {
      setIsInitialized(false);
      return;
    }

    setIsInitialized(false);

    try {
      let storedState = localStorage.getItem(storageKey);

      if (!storedState && storageKey !== STORAGE_KEY) {
        const legacyState = localStorage.getItem(STORAGE_KEY);
        if (legacyState) {
          storedState = legacyState;
          localStorage.setItem(storageKey, legacyState);
        }
      }

      if (storedState) {
        const parsedState = JSON.parse(storedState) as BudgetState;
        const migratedState = migrateState(parsedState);
        dispatch({ type: "SET_INITIAL_STATE", payload: migratedState });
      } else {
        dispatch({ type: "SET_INITIAL_STATE", payload: initialBudgetState });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      // If parsing fails, start with a clean slate
      dispatch({ type: "SET_INITIAL_STATE", payload: initialBudgetState });
    }

    setIsInitialized(true);
  }, [isAuthReady, storageKey]);

  const syncFromCloud = React.useCallback(async () => {
    if (!isRemoteSyncEnabled) {
      toast({
        title: "Sync unavailable",
        description: "Sign in to enable cloud sync.",
        variant: "destructive",
      });
      return;
    }

    if (!monthKey) {
      toast({
        title: "Sync unavailable",
        description: "Current month is invalid.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const token = await auth?.getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      const response = await budgetApiService.getState(token, monthKey);
      setServerVersions((prev) => ({
        ...prev,
        [monthKey]: response.version,
      }));

      const localSnapshot = stateRef.current.budgetLogSnapshot ?? null;

      dispatch({
        type: "SET_INITIAL_STATE",
        payload: mergeLocalSnapshot(
          migrateState(response.state),
          localSnapshot,
        ),
      });

      toast({
        title: "Synced from cloud",
        description: "Cloud data loaded into this device.",
      });
    } catch (error) {
      const status = error instanceof BudgetApiError ? error.status : undefined;

      if (status === 404) {
        toast({
          title: "No cloud data",
          description: "No budget data found for this month.",
          variant: "destructive",
        });
      } else {
        console.error("Failed to sync from cloud", error);
        toast({
          title: "Sync failed",
          description: "Could not load data from the cloud.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [auth, isRemoteSyncEnabled, monthKey, toast]);

  const syncToCloud = React.useCallback(async () => {
    if (!isRemoteSyncEnabled) {
      toast({
        title: "Sync unavailable",
        description: "Sign in to enable cloud sync.",
        variant: "destructive",
      });
      return;
    }

    if (!monthKey) {
      toast({
        title: "Sync unavailable",
        description: "Current month is invalid.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      const token = await auth?.getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      let version = serverVersionsRef.current[monthKey];
      if (version === undefined) {
        try {
          const remote = await budgetApiService.getState(token, monthKey);
          version = remote.version;
        } catch (error) {
          if (!(error instanceof BudgetApiError && error.status === 404)) {
            throw error;
          }
          version = 0;
        }
      }

      const response = await budgetApiService.upsertState(token, monthKey, {
        version: version ?? 0,
        state: buildSyncState(stateRef.current),
      });

      setServerVersions((prev) => ({
        ...prev,
        [monthKey]: response.version,
      }));

      toast({
        title: "Synced to cloud",
        description: "Local data uploaded to the cloud.",
      });
    } catch (error) {
      const status = error instanceof BudgetApiError ? error.status : undefined;

      if (status === 409) {
        toast({
          title: "Sync conflict",
          description:
            "Cloud data changed. Sync from cloud before uploading again.",
          variant: "destructive",
        });
      } else {
        console.error("Failed to sync to cloud", error);
        toast({
          title: "Sync failed",
          description: "Could not upload data to the cloud.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [auth, isRemoteSyncEnabled, monthKey, toast]);

  const warmUpServer = React.useCallback(async () => {
    if (!isRemoteSyncEnabled || warmupInFlightRef.current) {
      return;
    }

    warmupInFlightRef.current = true;
    const loadingToast = toast({
      title: "Warming up server",
      description: "Checking cloud status...",
    });

    try {
      const token = await auth?.getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      await apiService.getProfile(token);

      loadingToast.update({
        id: loadingToast.id,
        title: "Server ready",
        description: "Cloud sync service is awake.",
      });
    } catch (error) {
      console.error("Failed to warm up server", error);
      loadingToast.update({
        id: loadingToast.id,
        title: "Server check failed",
        description: "Could not reach the server.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        loadingToast.dismiss();
      }, 2000);
      warmupInFlightRef.current = false;
    }
  }, [auth, isRemoteSyncEnabled, toast]);

  useEffect(() => {
    if (!isRemoteSyncEnabled) {
      return;
    }

    warmUpServer();
    const intervalId = setInterval(
      () => {
        warmUpServer();
      },
      5 * 60 * 1000,
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [isRemoteSyncEnabled, warmUpServer]);

  useEffect(() => {
    if (isInitialized && isAuthReady) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [state, isInitialized, isAuthReady, storageKey]);

  return (
    <BudgetContext.Provider
      value={{
        state,
        dispatch,
        isSyncEnabled: isRemoteSyncEnabled,
        isSyncing,
        syncToCloud,
        syncFromCloud,
      }}
    >
      {isInitialized && isAuthReady ? (
        children
      ) : (
        <div className="flex h-screen items-center justify-center">
          Loading Budget...
        </div>
      )}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudget must be used within a BudgetProvider");
  }
  return context;
};
