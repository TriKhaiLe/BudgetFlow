import React from "react";
import { screen } from "@testing-library/react";
import { BudgetMonthSelector } from "../budget-month-selector";
import {
  renderWithProvider,
  createMockBudgetState,
  setupLocalStorageMock,
} from "@/test-utils";
import { STORAGE_KEY } from "@/lib/constants";

describe("BudgetMonthSelector Component", () => {
  let localStorageMock: ReturnType<typeof setupLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = setupLocalStorageMock();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("should render the selector component", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2025-12-01").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<BudgetMonthSelector />);

    expect(screen.getByText(/december 2025/i)).toBeInTheDocument();
  });

  it("should display calendar icon", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2025-12-01").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<BudgetMonthSelector />);

    expect(screen.getByTestId("icon-calendar")).toBeInTheDocument();
  });

  it("should display current month and year", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2025-06-15").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<BudgetMonthSelector />);

    expect(screen.getByText(/june 2025/i)).toBeInTheDocument();
  });

  it("should format different months correctly", () => {
    const testCases = [
      { month: "2025-01-01", expected: "January 2025" },
      { month: "2025-06-01", expected: "June 2025" },
      { month: "2025-12-01", expected: "December 2025" },
    ];

    testCases.forEach(({ month, expected }) => {
      const mockState = createMockBudgetState({
        currentMonth: new Date(month).toISOString(),
      });
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

      const { unmount } = renderWithProvider(<BudgetMonthSelector />);

      expect(screen.getByText(expected)).toBeInTheDocument();

      unmount();
      localStorageMock.clear();
    });
  });

  it("should be accessible", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2025-12-01").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<BudgetMonthSelector />);

    const button = screen.getByRole("button", { name: /december 2025/i });
    expect(button).toBeEnabled();
    expect(button).toBeVisible();
  });

  it("should handle date at beginning of month", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2025-03-01T00:00:00.000Z").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<BudgetMonthSelector />);

    expect(screen.getByText(/march 2025/i)).toBeInTheDocument();
  });

  it("should handle date in middle of month", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2025-08-15T12:30:00.000Z").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<BudgetMonthSelector />);

    expect(screen.getByText(/august 2025/i)).toBeInTheDocument();
  });

  it("should format year transitions correctly", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2026-01-01").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<BudgetMonthSelector />);

    expect(screen.getByText("January 2026")).toBeInTheDocument();
  });
});
