import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClearableInput } from "../clearable-input";

describe("ClearableInput Component", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    placeholder: "Enter text",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the input with placeholder", () => {
      render(<ClearableInput {...defaultProps} />);

      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toBeInTheDocument();
    });

    it("should not show clear button when input is empty", () => {
      render(<ClearableInput {...defaultProps} value="" />);

      const clearButton = screen.queryByRole("button", {
        name: /clear input/i,
      });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should show clear button when input has value", () => {
      render(<ClearableInput {...defaultProps} value="some text" />);

      const clearButton = screen.getByRole("button", { name: /clear input/i });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe("clear functionality", () => {
    it("should call onChange with empty value when clear button is clicked", () => {
      const mockOnChange = jest.fn();
      render(
        <ClearableInput
          {...defaultProps}
          value="some text"
          onChange={mockOnChange}
        />
      );

      const clearButton = screen.getByRole("button", { name: /clear input/i });
      fireEvent.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { value: "" },
        })
      );
    });

    it("should call custom onClear handler when provided", () => {
      const mockOnClear = jest.fn();
      render(
        <ClearableInput
          {...defaultProps}
          value="some text"
          onClear={mockOnClear}
        />
      );

      const clearButton = screen.getByRole("button", { name: /clear input/i });
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalled();
    });

    it("should prefer onClear over onChange when both are provided", () => {
      const mockOnClear = jest.fn();
      const mockOnChange = jest.fn();
      render(
        <ClearableInput
          {...defaultProps}
          value="some text"
          onClear={mockOnClear}
          onChange={mockOnChange}
        />
      );

      const clearButton = screen.getByRole("button", { name: /clear input/i });
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalled();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("showClearButton prop", () => {
    it("should force show clear button when showClearButton is true", () => {
      render(
        <ClearableInput {...defaultProps} value="" showClearButton={true} />
      );

      const clearButton = screen.getByRole("button", { name: /clear input/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("should force hide clear button when showClearButton is false", () => {
      render(
        <ClearableInput
          {...defaultProps}
          value="some text"
          showClearButton={false}
        />
      );

      const clearButton = screen.queryByRole("button", {
        name: /clear input/i,
      });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe("input interaction", () => {
    it("should pass value to input", () => {
      render(<ClearableInput {...defaultProps} value="test value" />);

      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveValue("test value");
    });

    it("should call onChange when typing", () => {
      const mockOnChange = jest.fn();
      render(<ClearableInput {...defaultProps} onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText("Enter text");
      fireEvent.change(input, { target: { value: "new text" } });

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    it("should apply custom className to input", () => {
      render(<ClearableInput {...defaultProps} className="custom-class" />);

      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveClass("custom-class");
    });

    it("should apply wrapperClassName to wrapper div", () => {
      const { container } = render(
        <ClearableInput {...defaultProps} wrapperClassName="wrapper-class" />
      );

      expect(container.firstChild).toHaveClass("wrapper-class");
    });

    it("should add pr-9 class when clear button is visible", () => {
      render(<ClearableInput {...defaultProps} value="some text" />);

      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveClass("pr-9");
    });
  });

  describe("accessibility", () => {
    it("should have proper aria-label on clear button", () => {
      render(<ClearableInput {...defaultProps} value="some text" />);

      const clearButton = screen.getByRole("button", { name: /clear input/i });
      expect(clearButton).toHaveAttribute("aria-label", "Clear input");
    });

    it("should have tabIndex -1 on clear button to skip in tab order", () => {
      render(<ClearableInput {...defaultProps} value="some text" />);

      const clearButton = screen.getByRole("button", { name: /clear input/i });
      expect(clearButton).toHaveAttribute("tabIndex", "-1");
    });
  });
});
