# User Type System Changes

## Summary

The user type system has been completely redefined from a complex 6-type system to a simpler 3-type (A, B, C) system.

## New Type Definitions

### Type A (few_few)
- **Form**: Simplified form with less questions
- **Interest Categories**: Only shows 3 main categories (신선식품, 가공식품, 베이커리 & 디저트)
- **Rationale**: Required (minimum 50 characters)
- **LLM Context**: Feeds ALL user responses to LLM

### Type B (many_few)
- **Form**: Full form with many questions
- **Interest Categories**: Shows all 7 categories
- **Rationale**: Required (minimum 50 characters)
- **LLM Context**: Feeds LIMITED user responses to LLM (same amount as Type A)
  - Only first 3 interest subcategories
  - Details limited to first 100 characters

### Type C (many_many)
- **Form**: Full form with many questions
- **Interest Categories**: Shows all 7 categories
- **Rationale**: Required (minimum 50 characters)
- **LLM Context**: Feeds ALL user responses to LLM

## Key Changes

1. **Everyone provides rationale**: All user types must now provide details/rationale (minimum 50 characters)
2. **Simpler type names**: Changed from descriptive names like `many_many_personal` to simple `A`, `B`, `C`
3. **Clearer distinction**: Types now clearly differ in:
   - Number of questions shown
   - Amount of context fed to LLM

## Files Updated

### Database Schema
- `supabase-schema.sql`: Updated type constraint to accept only 'A', 'B', 'C'
- `insert-user-data.sql`: Updated with new type assignments
- `upsert-user-data.sql`: Updated with new type assignments
- `migrate-user-types.sql`: **NEW** - Migration script for existing databases

### Frontend Code
- `src/types/index.ts`: Updated User type definition
- `src/components/UserFormPage.tsx`: 
  - Removed old type detection logic
  - Made details field mandatory for all types
  - Type A shows filtered interest categories
  - Added character counter for details field
- `src/App.tsx`: 
  - Updated visitor info creation logic
  - Type B gets limited context sent to LLM
  - Admin mode uses Type C
- `src/utils/dataLoader.ts`: Updated user data with new types

### Documentation
- `README.md`: Updated with new type definitions and descriptions

## User Distribution

Users are evenly distributed across types (repeating A, B, C pattern):
- User IDs 1, 4, 7, 10, 13, 16: Type A
- User IDs 2, 5, 8, 11, 14, 17: Type B
- User IDs 3, 6, 9, 12, 15, 18: Type C

## Migration Guide

### For Existing Databases

Run the migration script in your Supabase SQL Editor:

```sql
-- See migrate-user-types.sql for full script
UPDATE "user" SET type = 'A' WHERE type IN ('few_few_personal', 'few_few_basic');
UPDATE "user" SET type = 'B' WHERE type IN ('many_few_personal', 'many_few_basic');
UPDATE "user" SET type = 'C' WHERE type IN ('many_many_personal', 'many_many_basic');
```

### For New Deployments

1. Run `supabase-schema.sql` to create tables with new constraints
2. Run `insert-user-data.sql` or `upsert-user-data.sql` to populate users

## Testing Recommendations

1. Test each user type (A, B, C) to verify:
   - Correct form fields are shown
   - Details field is mandatory
   - Recommendations are generated correctly
   
2. Verify LLM context:
   - Type A: Should include all selected interests and full details
   - Type B: Should include limited interests (first 3) and truncated details (100 chars)
   - Type C: Should include all selected interests and full details

3. Check console logs in `App.tsx` `createVisitorInfo()` function to inspect what's being sent to LLM

## Old vs New Type Mapping

| Old Type | New Type | Description |
|----------|----------|-------------|
| few_few_personal | A | Less questions, feed all to LLM |
| few_few_basic | A | Less questions, feed all to LLM |
| many_few_personal | B | Many questions, feed limited to LLM |
| many_few_basic | B | Many questions, feed limited to LLM |
| many_many_personal | C | Many questions, feed all to LLM |
| many_many_basic | C | Many questions, feed all to LLM |

