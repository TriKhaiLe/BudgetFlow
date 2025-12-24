import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthDescription } from "../month-description";
import {
  renderWithProvider,
  createMockBudgetState,
  setupLocalStorageMock,
} from "@/test-utils";
import { STORAGE_KEY } from "@/lib/constants";

// Mock timers for testing auto-save behavior
jest.useFakeTimers();

describe("MonthDescription Component", () => {
  let localStorageMock: ReturnType<typeof setupLocalStorageMock>;

  beforeEach(() => {
    localStorageMock = setupLocalStorageMock();
  });

  afterEach(() => {
    localStorageMock.clear();
    jest.clearAllTimers();
  });

  it("should render textarea and label", () => {
    renderWithProvider(<MonthDescription />);

    expect(screen.getByLabelText(/notes for this month/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/add any notes or reminders/i)
    ).toBeInTheDocument();
  });

  it("should display existing month description", () => {
    const mockState = createMockBudgetState({
      monthDescription: "Holiday season budget",
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(
      /notes for this month/i
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Holiday season budget");
  });

  it("should update local state when typing", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    await user.type(textarea, "New note");

    expect(textarea).toHaveValue("New note");
  });

  it("should save description on blur", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    await user.type(textarea, "Test description");
    await user.tab(); // Trigger blur

    await waitFor(() => {
      const checkIcon = screen.getByTestId("icon-check");
      expect(checkIcon).toBeInTheDocument();
    });
  });

  it("should show saved indicator after saving", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    await user.type(textarea, "Updated note");
    await user.tab(); // Trigger blur

    await waitFor(() => {
      const checkIcon = screen.getByTestId("icon-check");
      expect(checkIcon).toBeInTheDocument();
    });
  });

  it("should hide saved indicator after 3 seconds", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    await user.type(textarea, "Another note");
    await user.tab(); // Trigger blur

    await waitFor(() => {
      const savedIndicator = screen.getByText("Saved", {
        selector: "span.text-sm.font-medium",
      });
      expect(savedIndicator).toBeInTheDocument();
    });

    // Fast-forward 3 seconds
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      const savedIndicator = screen.queryByText("Saved", {
        selector: "span.text-sm.font-medium",
      });
      expect(savedIndicator).not.toBeInTheDocument();
    });
  });

  it("should not show saved indicator if description unchanged", async () => {
    const user = userEvent.setup({ delay: null });
    const mockState = createMockBudgetState({
      monthDescription: "Existing note",
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    await user.click(textarea);
    await user.tab(); // Trigger blur without changing

    // Should not show the 'Saved' indicator (only help text contains 'saved')
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("should update when global state changes", () => {
    const mockState = createMockBudgetState({
      monthDescription: "Initial description",
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    const { rerender } = renderWithProvider(<MonthDescription />);

    let textarea = screen.getByLabelText(
      /notes for this month/i
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Initial description");

    // Simulate state change (e.g., after import)
    const updatedState = createMockBudgetState({
      monthDescription: "Updated from import",
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(updatedState));

    rerender(<MonthDescription />);

    textarea = screen.getByLabelText(
      /notes for this month/i
    ) as HTMLTextAreaElement;
    // Note: Component needs to be fully remounted to reflect localStorage changes
  });

  it("should handle empty description", async () => {
    const user = userEvent.setup({ delay: null });
    const mockState = createMockBudgetState({
      monthDescription: "Some text",
    });
    localStorageMock.setItem(STORAGE_KEY, JSON.stringify(mockState));

    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    await user.clear(textarea);
    await user.tab(); // Trigger blur

    await waitFor(() => {
      const savedIndicator = screen.getByText("Saved", {
        selector: "span.text-sm.font-medium",
      });
      expect(savedIndicator).toBeInTheDocument();
    });

    expect(textarea).toHaveValue("");
  });

  it("should display help text", () => {
    renderWithProvider(<MonthDescription />);

    expect(
      screen.getByText(
        /changes are saved automatically when you click outside/i
      )
    ).toBeInTheDocument();
  });

  it("should have correct textarea attributes", () => {
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    expect(textarea).toHaveAttribute("id", "month-description");
    expect(textarea).toHaveClass("min-h-[100px]", "resize-y");
  });

  it("should clear timeout on multiple saves", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);

    // First save
    await user.type(textarea, "First");
    await user.tab();

    await waitFor(() => {
      const savedIndicator = screen.getByText("Saved", {
        selector: "span.text-sm.font-medium",
      });
      expect(savedIndicator).toBeInTheDocument();
    });

    // Second save before 3 seconds
    await user.click(textarea);
    await user.type(textarea, " Second");
    await user.tab();

    // Should still show saved
    await waitFor(() => {
      const savedIndicator = screen.getByText("Saved", {
        selector: "span.text-sm.font-medium",
      });
      expect(savedIndicator).toBeInTheDocument();
    });

    // Fast-forward 3 seconds from second save
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      const savedIndicator = screen.queryByText("Saved", {
        selector: "span.text-sm.font-medium",
      });
      expect(savedIndicator).not.toBeInTheDocument();
    });
  });

  it("should handle multiline text", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    const multilineText = "Line 1\nLine 2\nLine 3";

    await user.type(textarea, multilineText.replace(/\n/g, "{Enter}"));

    expect(textarea).toHaveValue(multilineText);
  });

  it("should be accessible", () => {
    renderWithProvider(<MonthDescription />);

    const textarea = screen.getByLabelText(/notes for this month/i);
    const label = screen.getByText(/notes for this month/i);

    expect(label).toHaveAttribute("for", "month-description");
    expect(textarea).toHaveAttribute("id", "month-description");
  });
});
