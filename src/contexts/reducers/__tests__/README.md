# BudgetFlow Test Suite

This directory contains comprehensive unit tests for the BudgetFlow application's core business logic using Jest and React Testing Library.

## Test Coverage Summary

- **71 tests** across 5 test suites, all passing ✅
- Focus on state management and utility functions
- ~97-100% coverage for tested modules

## Test Structure

### 📁 `src/contexts/reducers/__tests__/`

Core business logic tests for budget state management:

#### 1. **money-source-actions.test.ts** (4 test suites, 10 tests)

Tests money source CRUD operations:

- ✓ Add new money sources with generated IDs
- ✓ Update existing money sources
- ✓ Delete money sources (cascading to transactions)
- ✓ Adjust balances and recalculate spent amounts
- ✓ State immutability verification

#### 2. **transaction-actions.test.ts** (5 test suites, 14 tests)

Tests transaction management:

- ✓ Add expense/income transactions with balance updates
- ✓ Transactions that affect/don't affect balance
- ✓ Update transaction details
- ✓ Delete transactions with balance reversal
- ✓ Featured transactions (non-budget-affecting)
- ✓ Unique ID generation

#### 3. **template-actions.test.ts** (3 test suites, 10 tests)

Tests transaction template management:

- ✓ Create templates for recurring transactions
- ✓ Update template properties
- ✓ Delete templates
- ✓ Income vs expense templates
- ✓ Unique template ID generation

#### 4. **state-actions.test.ts** (6 test suites, 23 tests)

Tests global state operations:

- ✓ Initial state structure
- ✓ Set current budget month
- ✓ Update month descriptions
- ✓ Start new month (roll over balances)
- ✓ Import data with REPLACE/NEXT_MONTH strategies
- ✓ Backward compatibility migration

### 📁 `src/lib/__tests__/`

Utility function tests:

#### 5. **utils.test.ts** (5 test suites, 14 tests)

Tests helper functions:

- ✓ Currency formatting (USD with commas)
- ✓ Number formatting with thousand separators
- ✓ Parse formatted numbers back to numeric values
- ✓ Category color generation (consistent HSL colors)
- ✓ Tailwind className merging utility

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Configuration

- **jest.config.js** - Jest configuration with Next.js integration
- **jest.setup.js** - Global test setup (jest-dom matchers, crypto mock)

## Key Testing Patterns

### 1. **State Immutability**

Every test verifies that reducer functions don't mutate the original state:

```typescript
const result = handleAddMoneySource(initialState, payload);
expect(initialState.moneySources).toHaveLength(2); // Original unchanged
```

### 2. **History Logging**

All state-modifying actions add history entries:

```typescript
expect(result.history).toHaveLength(1);
expect(result.history[0].description).toContain("Created money source");
```

### 3. **Balance Calculations**

Tests verify correct balance/budget/spent calculations:

```typescript
expect(updatedSource.balance).toBe(3800); // 4000 - 200 expense
expect(updatedSource.spent).toBe(1200); // 1000 + 200
```

### 4. **Edge Cases**

Tests cover error conditions and edge cases:

```typescript
it("should return unchanged state if source not found", () => {
  const result = handleDeleteMoneySource(initialState, "non-existent");
  expect(result).toBe(initialState);
});
```

## Dependencies

- **jest** - Test runner
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - DOM matchers for Jest
- **jest-environment-jsdom** - Browser-like environment for tests
- **ts-jest** - TypeScript support for Jest

## Coverage Report

Run `npm run test:coverage` to generate a detailed coverage report. Key coverage areas:

- **State Actions**: ~97-100% coverage
- **Utility Functions**: ~100% coverage for tested functions
- **Business Logic**: All critical paths tested

## Writing New Tests

1. Create test files with `.test.ts` or `.test.tsx` extension
2. Place in `__tests__` directory near the code being tested
3. Use descriptive test names: `it('should do something specific')`
4. Follow AAA pattern: Arrange → Act → Assert
5. Test both success and failure scenarios

Example:

```typescript
describe("MyFeature", () => {
  let initialState: BudgetState;

  beforeEach(() => {
    initialState = {
      /* setup */
    };
  });

  it("should handle valid input correctly", () => {
    const result = myFunction(initialState, validInput);
    expect(result).toMatchExpectedBehavior();
  });

  it("should handle invalid input gracefully", () => {
    const result = myFunction(initialState, invalidInput);
    expect(result).toBe(initialState); // Unchanged
  });
});
```

## Next Steps for Testing

Potential areas for expanded test coverage:

- [ ] React component tests (using @testing-library/react)
- [ ] Integration tests for complete user flows
- [ ] E2E tests with Playwright or Cypress
- [ ] API/AI integration tests (mocked)
- [ ] LocalStorage persistence tests

---

**Last Updated**: December 18, 2025  
**Total Tests**: 71 passing ✅  
**Test Suites**: 5 passing ✅
