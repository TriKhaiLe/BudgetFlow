## Changes Made:
- Extracted shared `FormattedInput` component to `src/components/shared/`
- Created centralized constants in `src/lib/constants.ts`
- Created shared form schemas in `src/lib/schemas.ts`
- Split budget reducer into modular action handlers in `src/contexts/reducers/`
- Updated `transactions-view.tsx` and `money-sources.tsx` to use shared code

## New File Structure:
- `src/lib/constants.ts` - Category suggestions, history icons, storage keys
- `src/lib/schemas.ts` - Zod validation schemas for forms
- `src/components/shared/` - Reusable app-specific components
- `src/contexts/reducers/` - Split reducer action handlers