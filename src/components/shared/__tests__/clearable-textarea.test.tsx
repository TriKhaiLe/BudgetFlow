import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClearableTextarea } from "../clearable-textarea";

describe("ClearableTextarea Component", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
    placeholder: "Enter notes",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the textarea with placeholder", () => {
      render(<ClearableTextarea {...defaultProps} />);

      const textarea = screen.getByPlaceholderText("Enter notes");
      expect(textarea).toBeInTheDocument();
    });

    it("should not show clear button when textarea is empty", () => {
      render(<ClearableTextarea {...defaultProps} value="" />);

      const clearButton = screen.queryByRole("button", {
        name: /clear textarea/i,
      });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should show clear button when textarea has value", () => {
      render(<ClearableTextarea {...defaultProps} value="some text" />);

      const clearButton = screen.getByRole("button", {
        name: /clear textarea/i,
      });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe("clear functionality", () => {
    it("should call onChange with empty value when clear button is clicked", () => {
      const mockOnChange = jest.fn();
      render(
        <ClearableTextarea
          {...defaultProps}
          value="some text"
          onChange={mockOnChange}
        />
      );

      const clearButton = screen.getByRole("button", {
        name: /clear textarea/i,
      });
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
        <ClearableTextarea
          {...defaultProps}
          value="some text"
          onClear={mockOnClear}
        />
      );

      const clearButton = screen.getByRole("button", {
        name: /clear textarea/i,
      });
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalled();
    });

    it("should prefer onClear over onChange when both are provided", () => {
      const mockOnClear = jest.fn();
      const mockOnChange = jest.fn();
      render(
        <ClearableTextarea
          {...defaultProps}
          value="some text"
          onClear={mockOnClear}
          onChange={mockOnChange}
        />
      );

      const clearButton = screen.getByRole("button", {
        name: /clear textarea/i,
      });
      fireEvent.click(clearButton);

      expect(mockOnClear).toHaveBeenCalled();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("showClearButton prop", () => {
    it("should force show clear button when showClearButton is true", () => {
      render(
        <ClearableTextarea {...defaultProps} value="" showClearButton={true} />
      );

      const clearButton = screen.getByRole("button", {
        name: /clear textarea/i,
      });
      expect(clearButton).toBeInTheDocument();
    });

    it("should force hide clear button when showClearButton is false", () => {
      render(
        <ClearableTextarea
          {...defaultProps}
          value="some text"
          showClearButton={false}
        />
      );

      const clearButton = screen.queryByRole("button", {
        name: /clear textarea/i,
      });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe("textarea interaction", () => {
    it("should pass value to textarea", () => {
      render(<ClearableTextarea {...defaultProps} value="test value" />);

      const textarea = screen.getByPlaceholderText("Enter notes");
      expect(textarea).toHaveValue("test value");
    });

    it("should call onChange when typing", () => {
      const mockOnChange = jest.fn();
      render(<ClearableTextarea {...defaultProps} onChange={mockOnChange} />);

      const textarea = screen.getByPlaceholderText("Enter notes");
      fireEvent.change(textarea, { target: { value: "new text" } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it("should handle multiline text", () => {
      const multilineText = "Line 1\nLine 2\nLine 3";
      render(<ClearableTextarea {...defaultProps} value={multilineText} />);

      const textarea = screen.getByPlaceholderText("Enter notes");
      expect(textarea).toHaveValue(multilineText);
    });
  });

  describe("styling", () => {
    it("should apply custom className to textarea", () => {
      render(<ClearableTextarea {...defaultProps} className="custom-class" />);

      const textarea = screen.getByPlaceholderText("Enter notes");
      expect(textarea).toHaveClass("custom-class");
    });

    it("should apply wrapperClassName to wrapper div", () => {
      const { container } = render(
        <ClearableTextarea {...defaultProps} wrapperClassName="wrapper-class" />
      );

      expect(container.firstChild).toHaveClass("wrapper-class");
    });

    it("should add pr-9 class when clear button is visible", () => {
      render(<ClearableTextarea {...defaultProps} value="some text" />);

      const textarea = screen.getByPlaceholderText("Enter notes");
      expect(textarea).toHaveClass("pr-9");
    });
  });

  describe("accessibility", () => {
    it("should have proper aria-label on clear button", () => {
      render(<ClearableTextarea {...defaultProps} value="some text" />);

      const clearButton = screen.getByRole("button", {
        name: /clear textarea/i,
      });
      expect(clearButton).toHaveAttribute("aria-label", "Clear textarea");
    });

    it("should have tabIndex -1 on clear button to skip in tab order", () => {
      render(<ClearableTextarea {...defaultProps} value="some text" />);

      const clearButton = screen.getByRole("button", {
        name: /clear textarea/i,
      });
      expect(clearButton).toHaveAttribute("tabIndex", "-1");
    });
  });
});
