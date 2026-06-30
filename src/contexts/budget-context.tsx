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
import {
  STORAGE_KEY,
  buildBudgetStateStorageKey,
  buildBudgetVersionStorageKey,
} from "@/lib/constants";
import { toMonthKey } from "@/lib/utils";
import { useOptionalAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  budgetApiService,
  BudgetApiError,
} from "@/services/budget-api-service";
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
  isSyncStatusReady: boolean;
  isSyncing: boolean;
  isComparing: boolean;
  shouldHighlightSyncFromCloud: boolean;
  canSyncToCloud: boolean;
  canSyncFromCloud: boolean;
  currentVersion: number;
  serverVersion: number;
  compareResult: BudgetComparisonResult | null;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  compareWithCloud: () => Promise<BudgetComparisonResult | null>;
};

type BudgetComparisonRow = {
  section: string;
  localSummary: string;
  serverSummary: string;
  detail: string;
  isDifferent: boolean;
};

type BudgetComparisonResult = {
  month: string;
  localVersion: number;
  serverVersion: number;
  fetchedAt: string;
  rows: BudgetComparisonRow[];
  localState: BudgetState;
  serverState: BudgetState;
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

function summarizeArrayDiff(
  localItems: Array<{ id?: string }>,
  serverItems: Array<{ id?: string }>,
): string {
  const localMap = new Map(
    localItems.map((item, index) => [item.id ?? `local-${index}`, item]),
  );
  const serverMap = new Map(
    serverItems.map((item, index) => [item.id ?? `server-${index}`, item]),
  );

  const added = [...serverMap.keys()].filter((key) => !localMap.has(key));
  const removed = [...localMap.keys()].filter((key) => !serverMap.has(key));
  const changed = [...localMap.keys()].filter((key) => {
    const localItem = localMap.get(key);
    const serverItem = serverMap.get(key);
    return (
      serverItem && JSON.stringify(localItem) !== JSON.stringify(serverItem)
    );
  });

  const detailParts: string[] = [];
  if (added.length > 0) {
    detailParts.push(
      `added ${added.slice(0, 3).join(", ")}${added.length > 3 ? "…" : ""}`,
    );
  }
  if (removed.length > 0) {
    detailParts.push(
      `removed ${removed.slice(0, 3).join(", ")}${removed.length > 3 ? "…" : ""}`,
    );
  }
  if (changed.length > 0) {
    detailParts.push(
      `changed ${changed.slice(0, 3).join(", ")}${changed.length > 3 ? "…" : ""}`,
    );
  }

  return detailParts.length > 0
    ? detailParts.join("; ")
    : "no item-level differences";
}

function normalizeRecord(record: Record<string, boolean> | undefined): string {
  return JSON.stringify(
    Object.entries(record ?? {})
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .reduce<Record<string, boolean>>((accumulator, [key, value]) => {
        accumulator[key] = value;
        return accumulator;
      }, {}),
  );
}

function buildComparisonRows(
  localState: BudgetState,
  serverState: BudgetState,
): BudgetComparisonRow[] {
  const rows: BudgetComparisonRow[] = [];

  const pushRow = (
    section: string,
    localSummary: string,
    serverSummary: string,
    detail: string,
    isDifferent: boolean,
  ) => {
    rows.push({
      section,
      localSummary,
      serverSummary,
      detail,
      isDifferent,
    });
  };

  pushRow(
    "Money sources",
    `${localState.moneySources.length} items`,
    `${serverState.moneySources.length} items`,
    summarizeArrayDiff(localState.moneySources, serverState.moneySources),
    JSON.stringify(localState.moneySources) !==
      JSON.stringify(serverState.moneySources),
  );
  pushRow(
    "Templates",
    `${localState.templates.length} items`,
    `${serverState.templates.length} items`,
    summarizeArrayDiff(localState.templates, serverState.templates),
    JSON.stringify(localState.templates) !==
      JSON.stringify(serverState.templates),
  );
  pushRow(
    "History",
    `${localState.history.length} items`,
    `${serverState.history.length} items`,
    summarizeArrayDiff(localState.history, serverState.history),
    JSON.stringify(localState.history) !== JSON.stringify(serverState.history),
  );
  pushRow(
    "Budget log",
    `${localState.budgetLog.length} items`,
    `${serverState.budgetLog.length} items`,
    summarizeArrayDiff(localState.budgetLog, serverState.budgetLog),
    JSON.stringify(localState.budgetLog) !==
      JSON.stringify(serverState.budgetLog),
  );
  pushRow(
    "Budget snapshot",
    localState.budgetLogSnapshot ? "present" : "none",
    serverState.budgetLogSnapshot ? "present" : "none",
    localState.budgetLogSnapshot === serverState.budgetLogSnapshot
      ? "no snapshot difference"
      : "snapshot presence differs or content differs",
    JSON.stringify(localState.budgetLogSnapshot) !==
      JSON.stringify(serverState.budgetLogSnapshot),
  );
  pushRow(
    "Balance locks",
    `${Object.keys(localState.budgetLogBalanceLocks ?? {}).length} locks`,
    `${Object.keys(serverState.budgetLogBalanceLocks ?? {}).length} locks`,
    normalizeRecord(localState.budgetLogBalanceLocks) ===
      normalizeRecord(serverState.budgetLogBalanceLocks)
      ? "no lock differences"
      : "lock map differs",
    normalizeRecord(localState.budgetLogBalanceLocks) !==
      normalizeRecord(serverState.budgetLogBalanceLocks),
  );
  pushRow(
    "Current month",
    localState.currentMonth,
    serverState.currentMonth,
    localState.currentMonth === serverState.currentMonth
      ? "no month difference"
      : "month differs",
    localState.currentMonth !== serverState.currentMonth,
  );
  pushRow(
    "Month description",
    localState.monthDescription ?? "",
    serverState.monthDescription ?? "",
    localState.monthDescription === serverState.monthDescription
      ? "no description difference"
      : "description differs",
    (localState.monthDescription ?? "") !==
      (serverState.monthDescription ?? ""),
  );

  return rows;
}

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const auth = useOptionalAuth();
  const { toast } = useToast();
  const [state, dispatch] = useReducer(budgetReducer, initialBudgetState);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isSyncStatusReady, setIsSyncStatusReady] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isComparing, setIsComparing] = React.useState(false);
  const [shouldHighlightSyncFromCloud, setShouldHighlightSyncFromCloud] =
    React.useState(false);
  const [serverVersions, setServerVersions] = React.useState<
    Record<string, number>
  >({});
  const [localVersions, setLocalVersions] = React.useState<
    Record<string, number>
  >({});
  const [compareResult, setCompareResult] =
    React.useState<BudgetComparisonResult | null>(null);
  const stateRef = React.useRef(state);
  const serverVersionsRef = React.useRef(serverVersions);
  const localVersionsRef = React.useRef(localVersions);
  const warmupInFlightRef = React.useRef(false);

  const storageKey = React.useMemo(() => {
    if (auth?.storageScope) {
      return buildBudgetStateStorageKey(auth.storageScope);
    }
    return STORAGE_KEY;
  }, [auth?.storageScope]);

  const versionStorageKey = React.useMemo(() => {
    if (auth?.storageScope) {
      return buildBudgetVersionStorageKey(auth.storageScope);
    }
    return `${STORAGE_KEY}:versions`;
  }, [auth?.storageScope]);

  const isAuthReady = auth ? auth.isInitialized : true;
  const isRemoteSyncEnabled = Boolean(
    auth && auth.isSupabaseConfigured && !auth.isAnonymous,
  );
  const monthKey = React.useMemo(
    () => toMonthKey(state.currentMonth),
    [state.currentMonth],
  );
  const currentVersion = monthKey ? (localVersions[monthKey] ?? 0) : 0;
  const serverVersion = monthKey ? (serverVersions[monthKey] ?? 0) : 0;

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    serverVersionsRef.current = serverVersions;
  }, [serverVersions]);

  useEffect(() => {
    localVersionsRef.current = localVersions;
  }, [localVersions]);

  useEffect(() => {
    if (!isAuthReady) {
      setIsInitialized(false);
      return;
    }

    setIsInitialized(false);

    try {
      let storedState = localStorage.getItem(storageKey);
      let storedVersions = localStorage.getItem(versionStorageKey);

      if (!storedState && storageKey !== STORAGE_KEY) {
        const legacyState = localStorage.getItem(STORAGE_KEY);
        if (legacyState) {
          storedState = legacyState;
          localStorage.setItem(storageKey, legacyState);
        }
      }

      if (!storedVersions && versionStorageKey !== `${STORAGE_KEY}:versions`) {
        const legacyVersions = localStorage.getItem(`${STORAGE_KEY}:versions`);
        if (legacyVersions) {
          storedVersions = legacyVersions;
          localStorage.setItem(versionStorageKey, legacyVersions);
        }
      }

      if (storedState) {
        const parsedState = JSON.parse(storedState) as BudgetState;
        const migratedState = migrateState(parsedState);
        dispatch({ type: "SET_INITIAL_STATE", payload: migratedState });
      } else {
        dispatch({ type: "SET_INITIAL_STATE", payload: initialBudgetState });
      }

      if (storedVersions) {
        try {
          setLocalVersions(
            JSON.parse(storedVersions) as Record<string, number>,
          );
        } catch (error) {
          console.error(
            "Failed to load version cache from localStorage",
            error,
          );
          setLocalVersions({});
        }
      } else {
        setLocalVersions({});
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      // If parsing fails, start with a clean slate
      dispatch({ type: "SET_INITIAL_STATE", payload: initialBudgetState });
      setLocalVersions({});
    }

    setIsSyncStatusReady(false);
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

    if (!isSyncStatusReady) {
      toast({
        title: "Sync unavailable",
        description: "Cloud status is still loading.",
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
      setLocalVersions((prev) => ({
        ...prev,
        [monthKey]: response.version,
      }));
      setShouldHighlightSyncFromCloud(false);
      setCompareResult(null);

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
  }, [auth, isRemoteSyncEnabled, isSyncStatusReady, monthKey, toast]);

  const syncToCloud = React.useCallback(async () => {
    if (!isRemoteSyncEnabled) {
      toast({
        title: "Sync unavailable",
        description: "Sign in to enable cloud sync.",
        variant: "destructive",
      });
      return;
    }

    if (!isSyncStatusReady) {
      toast({
        title: "Sync unavailable",
        description: "Cloud status is still loading.",
        variant: "destructive",
      });
      return;
    }

    if (shouldHighlightSyncFromCloud) {
      toast({
        title: "Sync blocked",
        description: "Cloud data is newer. Sync from cloud first.",
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
      setLocalVersions((prev) => ({
        ...prev,
        [monthKey]: response.version,
      }));
      setShouldHighlightSyncFromCloud(false);
      setCompareResult(null);

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
  }, [
    auth,
    isRemoteSyncEnabled,
    isSyncStatusReady,
    monthKey,
    shouldHighlightSyncFromCloud,
    toast,
  ]);

  const compareWithCloud = React.useCallback(async () => {
    if (!isRemoteSyncEnabled) {
      toast({
        title: "Compare unavailable",
        description: "Sign in to enable cloud sync.",
        variant: "destructive",
      });
      return null;
    }

    if (!isSyncStatusReady) {
      toast({
        title: "Compare unavailable",
        description: "Cloud status is still loading.",
        variant: "destructive",
      });
      return null;
    }

    if (!monthKey) {
      toast({
        title: "Compare unavailable",
        description: "Current month is invalid.",
        variant: "destructive",
      });
      return null;
    }

    setIsComparing(true);
    try {
      const token = await auth?.getAccessToken();
      if (!token) {
        throw new Error("Missing access token");
      }

      const remote = await budgetApiService.getState(token, monthKey);
      const serverState = migrateState(remote.state);
      const localState = stateRef.current;
      const localVersion = localVersionsRef.current[monthKey] ?? 0;
      const result: BudgetComparisonResult = {
        month: monthKey,
        localVersion,
        serverVersion: remote.version,
        fetchedAt: new Date().toISOString(),
        rows: buildComparisonRows(localState, serverState),
        localState,
        serverState,
      };

      setServerVersions((prev) => ({
        ...prev,
        [monthKey]: remote.version,
      }));
      setShouldHighlightSyncFromCloud(remote.version > localVersion);
      setCompareResult(result);
      return result;
    } catch (error) {
      console.error("Failed to compare with cloud", error);
      toast({
        title: "Compare failed",
        description: "Could not fetch cloud data for comparison.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsComparing(false);
    }
  }, [auth, isRemoteSyncEnabled, isSyncStatusReady, monthKey, toast]);

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

      if (!monthKey) {
        throw new Error("Missing month key");
      }

      try {
        const serverVersion = await budgetApiService.getVersion(
          token,
          monthKey,
        );
        const localVersion = localVersionsRef.current[monthKey] ?? 0;

        setIsSyncStatusReady(true);
        setShouldHighlightSyncFromCloud(serverVersion.version > localVersion);
        setServerVersions((prev) => ({
          ...prev,
          [monthKey]: serverVersion.version,
        }));

        loadingToast.update({
          id: loadingToast.id,
          title: "Server ready",
          description:
            serverVersion.version > localVersion
              ? "Cloud has newer data available."
              : "Cloud data is up to date.",
        });
      } catch (error) {
        if (error instanceof BudgetApiError && error.status === 404) {
          setIsSyncStatusReady(true);
          setShouldHighlightSyncFromCloud(false);

          loadingToast.update({
            id: loadingToast.id,
            title: "Server ready",
            description: "No cloud data exists for this month yet.",
          });
          return;
        }

        throw error;
      }
    } catch (error) {
      console.error("Failed to warm up server", error);
      setIsSyncStatusReady(false);
      setShouldHighlightSyncFromCloud(false);
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
    if (isInitialized && isAuthReady) {
      try {
        localStorage.setItem(versionStorageKey, JSON.stringify(localVersions));
      } catch (error) {
        console.error("Failed to save version cache to localStorage", error);
      }
    }
  }, [isAuthReady, isInitialized, localVersions, versionStorageKey]);

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
        isSyncStatusReady,
        isSyncing,
        isComparing,
        shouldHighlightSyncFromCloud,
        canSyncToCloud:
          isSyncStatusReady && !isSyncing && !shouldHighlightSyncFromCloud,
        canSyncFromCloud: isSyncStatusReady && !isSyncing,
        currentVersion,
        serverVersion,
        compareResult,
        syncToCloud,
        syncFromCloud,
        compareWithCloud,
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
