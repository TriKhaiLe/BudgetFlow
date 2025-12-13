# Refactoring Strategy Guide

This document outlines the periodic refactoring strategy for maintaining a clean, maintainable, and expandable codebase.

## When to Refactor

Perform refactoring when:

- Adding new features becomes cumbersome
- Code duplication is detected in 3+ places
- Files exceed ~300-400 lines
- Test coverage decreases or bugs increase
- New team members struggle to understand the code

## Refactoring Checklist

### 1. **DRY (Don't Repeat Yourself)**

- [ ] Extract duplicated components (e.g., `FormattedInput`)
- [ ] Centralize shared constants and configurations
- [ ] Create utility functions for repeated logic
- [ ] Extract common form schemas

### 2. **Single Responsibility**

- [ ] Each file should do one thing well
- [ ] Split large components into smaller, focused ones
- [ ] Separate business logic from UI components
- [ ] Use custom hooks for complex state logic

### 3. **Code Organization**

```
src/
├── components/
│   ├── ui/          # Reusable base UI components
│   ├── shared/      # Shared app-specific components
│   └── dashboard/   # Feature-specific components
├── contexts/
│   └── reducers/    # Split reducer logic by domain
├── lib/
│   ├── constants/   # App-wide constants
│   ├── schemas/     # Zod validation schemas
│   └── utils/       # Utility functions
└── hooks/           # Custom React hooks
```

### 4. **Type Safety**

- [ ] Ensure all functions have proper TypeScript types
- [ ] Avoid `any` type - use proper generics or union types
- [ ] Keep types in sync with API responses
- [ ] Document complex type patterns

### 5. **State Management**

- [ ] Keep reducer actions atomic and focused
- [ ] Extract complex reducer logic into pure functions
- [ ] Consider splitting large contexts by domain
- [ ] Use proper action types with discriminated unions

## Current Refactoring Actions (December 2025)

### Completed

1. ✅ Extracted `FormattedInput` to shared components
2. ✅ Created constants file for category suggestions and history icons
3. ✅ Split budget reducer into modular action handlers
4. ✅ Created shared form schemas file

### File Changes Summary

- `src/components/shared/formatted-input.tsx` - New reusable input component
- `src/lib/constants.ts` - Centralized constants
- `src/lib/schemas.ts` - Shared Zod schemas
- `src/contexts/reducers/` - Split reducer actions
- Updated `transactions-view.tsx`, `money-sources.tsx` to use shared components

## Best Practices

### Before Refactoring

1. Run `npm run typecheck` and `npm run lint` - fix all errors
2. Document current behavior
3. Create a backup/commit before major changes
4. Identify all usages of code being refactored

### During Refactoring

1. Make small, incremental changes
2. Test after each change
3. Keep PR/commits focused and atomic
4. Update imports progressively

### After Refactoring

1. Run full type check and lint
2. Test all affected features manually
3. Update documentation (this file, context-guide.md)
4. Review import paths for cleanup

## Code Quality Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Development testing
npm run dev
```

## Notes for Future Refactoring

- Consider extracting transaction/money source operations into a service layer
- The UPDATE_TRANSACTION action needs improvement (currently doesn't rebalance)
- Consider migrating to a more structured state management if complexity grows
- Watch for opportunities to add unit tests for reducer logic
