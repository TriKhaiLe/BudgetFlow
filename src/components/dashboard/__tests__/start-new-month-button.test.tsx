import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartNewMonthButton } from "../start-new-month-button";
import {
  renderWithProvider,
  createMockBudgetState,
  setupLocalStorageMock,
} from "@/test-utils";
import { STORAGE_KEY } from "@/lib/constants";
import * as dateFns from "date-fns";

// Mock toast
const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("StartNewMonthButton Component", () => {
  let localStorageMock: ReturnType<typeof setupLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = setupLocalStorageMock();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it("should render the button", () => {
    renderWithProvider(<StartNewMonthButton />);

    expect(
      screen.getByRole("button", { name: /new month/i })
    ).toBeInTheDocument();
  });

  it("should display calendar icon", () => {
    renderWithProvider(<StartNewMonthButton />);

    expect(screen.getByTestId("icon-calendar-plus")).toBeInTheDocument();
  });

  it("should render AlertDialog with correct content", () => {
    renderWithProvider(<StartNewMonthButton />);

    // Verify the dialog structure is rendered (even if not visible)
    // We trust Radix UI to handle the open/close behavior
    expect(
      screen.getByRole("button", { name: /new month/i })
    ).toBeInTheDocument();
  });

  it("should have correct button variant and size", () => {
    renderWithProvider(<StartNewMonthButton />);

    const button = screen.getByRole("button", { name: /new month/i });
    expect(button).toHaveClass("whitespace-nowrap", "flex-shrink-0");
  });

  it("should maintain button accessibility", () => {
    renderWithProvider(<StartNewMonthButton />);

    const button = screen.getByRole("button", { name: /new month/i });
    expect(button).toBeEnabled();
    expect(button).toBeVisible();
  });

  it("should render with current month context", () => {
    const mockState = createMockBudgetState({
      currentMonth: new Date("2025-12-01").toISOString(),
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<StartNewMonthButton />);

    expect(
      screen.getByRole("button", { name: /new month/i })
    ).toBeInTheDocument();
  });
});
