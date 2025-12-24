// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import React from 'react';

// Mock crypto.randomUUID for tests
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  }
}

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  __esModule: true,
  Calendar: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-calendar" />,
  CalendarPlus: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-calendar-plus" />,
  Check: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-check" />,
  ChevronDown: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-chevron-down" />,
  ChevronUp: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-chevron-up" />,
  DollarSign: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-dollar-sign" />,
  MoreHorizontal: ({ className, ...props}) => <span {...props} className={className} data-testid="icon-more-horizontal" />,
  Pen: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-pen" />,
  PiggyBank: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-piggy-bank" />,
  PlusCircle: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-plus-circle" />,
  ReceiptText: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-receipt-text" />,
  Trash: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-trash" />,
  X: ({ className, ...props }) => <span {...props} className={className} data-testid="icon-x" />,
}))

// Mock Radix UI components
jest.mock('@radix-ui/react-select', () => ({
  Root: ({ children, onValueChange, value, ...props }) => (
    <div data-testid="select-root" {...props}>{children}</div>
  ),
  Trigger: ({ children, ...props }) => (
    <button data-testid="select-trigger" {...props}>{children}</button>
  ),
  Value: ({ children, placeholder }) => (
    <span data-testid="select-value">{children || placeholder}</span>
  ),
  Content: ({ children, ...props }) => (
    <div data-testid="select-content" {...props}>{children}</div>
  ),
  Viewport: ({ children, ...props }) => (
    <div data-testid="select-viewport" {...props}>{children}</div>
  ),
  Item: ({ children, value, ...props }) => (
    <div data-testid="select-item" data-value={value} {...props}>{children}</div>
  ),
  ItemText: ({ children, ...props }) => (
    <span data-testid="select-item-text" {...props}>{children}</span>
  ),
  ItemIndicator: ({ children, ...props }) => (
    <span data-testid="select-item-indicator" {...props}>{children}</span>
  ),
  ScrollUpButton: Object.assign(
    ({ children, ...props }) => <div data-testid="select-scroll-up-button" {...props}>{children}</div>,
    { displayName: 'SelectScrollUpButton' }
  ),
  ScrollDownButton: Object.assign(
    ({ children, ...props }) => <div data-testid="select-scroll-down-button" {...props}>{children}</div>,
    { displayName: 'SelectScrollDownButton' }
  ),
  Icon: ({ children, ...props }) => <span data-testid="select-icon" {...props}>{children}</span>,
  Portal: ({ children }) => <>{children}</>,
  Group: ({ children, ...props }) => <div data-testid="select-group" {...props}>{children}</div>,
  Label: ({ children, ...props }) => <div data-testid="select-label" {...props}>{children}</div>,
  Separator: (props) => <div data-testid="select-separator" {...props} />,
}))

jest.mock('@radix-ui/react-popover', () => ({
  Root: ({ children, open, onOpenChange }) => <div data-testid="popover-root">{children}</div>,
  Trigger: ({ children, asChild, ...props }) => {
    if (asChild && children) {
      return children;
    }
    return <button data-testid="popover-trigger" {...props}>{children}</button>;
  },
  Content: ({ children, ...props }) => (
    <div data-testid="popover-content" {...props}>{children}</div>
  ),
  Portal: ({ children }) => <>{children}</>,
}))

jest.mock('@radix-ui/react-alert-dialog', () => {
  let isOpen = false;
  return {
    Root: ({ children, open, onOpenChange }) => {
      React.useEffect(() => {
        if (open !== undefined) isOpen = open;
      }, [open]);
      return <div data-testid="alert-dialog-root" onClick={() => onOpenChange?.(true)}>{children}</div>;
    },
    Trigger: ({ children, asChild, onClick, ...props }) => {
      const handleClick = () => {
        isOpen = true;
        onClick?.();
      };
      if (asChild && children) {
        return React.cloneElement(children, { onClick: handleClick });
      }
      return <button data-testid="alert-dialog-trigger" onClick={handleClick} {...props}>{children}</button>;
    },
    Portal: ({ children }) => isOpen ? <>{children}</> : null,
    Overlay: ({ ...props }) => isOpen ? <div data-testid="alert-dialog-overlay" {...props} /> : null,
    Content: ({ children, ...props }) => isOpen ? (
      <div role="alertdialog" data-testid="alert-dialog-content" {...props}>{children}</div>
    ) : null,
    Header: ({ children, ...props }) => <div data-testid="alert-dialog-header" {...props}>{children}</div>,
    Title: ({ children, ...props }) => <h2 data-testid="alert-dialog-title" {...props}>{children}</h2>,
    Description: ({ children, ...props }) => <div data-testid="alert-dialog-description" {...props}>{children}</div>,
    Footer: ({ children, ...props }) => <div data-testid="alert-dialog-footer" {...props}>{children}</div>,
    Action: ({ children, onClick, ...props }) => {
      const handleClick = () => {
        isOpen = false;
        onClick?.();
      };
      return <button data-testid="alert-dialog-action" onClick={handleClick} {...props}>{children}</button>;
    },
    Cancel: ({ children, onClick, ...props }) => {
      const handleClick = () => {
        isOpen = false;
        onClick?.();
      };
      return <button data-testid="alert-dialog-cancel" onClick={handleClick} {...props}>{children}</button>;
    },
  };
});
