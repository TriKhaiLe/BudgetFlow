"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  Dispatch,
} from "react";
import type {
  BudgetState,
  MoneySource,
  Transaction,
  FeaturedTransaction,
  TransactionTemplate,
} from "@/lib/types";
import { STORAGE_KEY } from "@/lib/constants";
import {
  initialBudgetState,
  handleAddMoneySource,
  handleUpdateMoneySource,
  handleDeleteMoneySource,
  handleAdjustBalance,
  handleAddTransaction,
  handleUpdateTransaction,
  handleDeleteTransaction,
  handleAddFeaturedTransaction,
  handleDeleteFeaturedTransaction,
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
  migrateState,
} from "./reducers";

type Action =
  | { type: "SET_INITIAL_STATE"; payload: BudgetState }
  | { type: "ADD_MONEY_SOURCE"; payload: Omit<MoneySource, "id" | "spent"> }
  | { type: "UPDATE_MONEY_SOURCE"; payload: MoneySource }
  | { type: "DELETE_MONEY_SOURCE"; payload: string }
  | {
      type: "ADD_TRANSACTION";
      payload: Omit<Transaction, "id" | "snapshot"> & {
        affectBalance: boolean;
      };
    }
  | { type: "UPDATE_TRANSACTION"; payload: Transaction }
  | { type: "DELETE_TRANSACTION"; payload: Transaction }
  | {
      type: "ADD_FEATURED_TRANSACTION";
      payload: Omit<FeaturedTransaction, "id" | "date">;
    }
  | { type: "DELETE_FEATURED_TRANSACTION"; payload: string }
  | { type: "ADD_TEMPLATE"; payload: Omit<TransactionTemplate, "id"> }
  | { type: "UPDATE_TEMPLATE"; payload: TransactionTemplate }
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
      payload: { description: string; changes: Record<string, number> };
    }
  | { type: "DELETE_BUDGET_LOG_ENTRY"; payload: string }
  | {
      type: "UPDATE_BUDGET_LOG_ENTRY";
      payload: {
        id: string;
        description: string;
        changes: Record<string, number>;
      };
    };

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

    case "ADD_TRANSACTION":
      return handleAddTransaction(state, action.payload);

    case "UPDATE_TRANSACTION":
      return handleUpdateTransaction(state, action.payload);

    case "DELETE_TRANSACTION":
      return handleDeleteTransaction(state, action.payload);

    case "ADD_FEATURED_TRANSACTION":
      return handleAddFeaturedTransaction(state, action.payload);

    case "DELETE_FEATURED_TRANSACTION":
      return handleDeleteFeaturedTransaction(state, action.payload);

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

    default:
      return state;
  }
};

const BudgetContext = createContext<
  { state: BudgetState; dispatch: Dispatch<Action> } | undefined
>(undefined);

export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(budgetReducer, initialBudgetState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(STORAGE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState) as BudgetState;
        const migratedState = migrateState(parsedState);
        dispatch({ type: "SET_INITIAL_STATE", payload: migratedState });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
      // If parsing fails, start with a clean slate
      dispatch({ type: "SET_INITIAL_STATE", payload: initialBudgetState });
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [state, isInitialized]);

  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {isInitialized ? (
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
