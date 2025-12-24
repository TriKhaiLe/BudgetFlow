import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BudgetProvider } from "@/contexts/budget-context";
import type { BudgetState } from "@/lib/types";

/**
 * Custom render function that wraps components with BudgetProvider
 */
export function renderWithProvider(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <BudgetProvider>{children}</BudgetProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock localStorage for testing
 */
export class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

/**
 * Setup localStorage mock
 */
export function setupLocalStorageMock() {
  const localStorageMock = new LocalStorageMock();
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  return localStorageMock;
}

/**
 * Create a mock budget state for testing
 */
export function createMockBudgetState(
  overrides?: Partial<BudgetState>
): BudgetState {
  return {
    moneySources: [
      {
        id: "source-1",
        name: "Test Salary",
        budget: 5000,
        spent: 1200,
        balance: 3800,
      },
      {
        id: "source-2",
        name: "Test Savings",
        budget: 2000,
        spent: 500,
        balance: 1500,
      },
    ],
    transactions: [
      {
        id: "trans-1",
        description: "Test Groceries",
        amount: 200,
        category: "Food",
        date: "2025-12-15",
        moneySourceId: "source-1",
        type: "withdraw",
      },
      {
        id: "trans-2",
        description: "Test Freelance",
        amount: 500,
        category: "Income",
        date: "2025-12-20",
        moneySourceId: "source-2",
        type: "income",
      },
    ],
    featuredTransactions: [
      {
        id: "featured-1",
        description: "Important Payment",
        category: "Bills",
        amount: 1000,
        date: "2025-12-01",
      },
    ],
    transactionTemplates: [
      {
        id: "template-1",
        name: "Monthly Rent",
        description: "Apartment rent",
        amount: 1500,
        category: "Housing",
        moneySourceId: "source-1",
        type: "withdraw",
        affectBalance: true,
      },
    ],
    history: [
      {
        id: "hist-1",
        description: "Test history entry",
        timestamp: new Date().toISOString(),
      },
    ],
    currentMonth: new Date("2025-12-01").toISOString(),
    monthDescription: "Test month description",
    ...overrides,
  };
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
