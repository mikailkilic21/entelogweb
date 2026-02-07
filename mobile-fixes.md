# Mobile App Fixes & Improvements

## Overview
This task tracks the implementation of 8 specific fixes and improvements requested for the mobile application.

## User Requests
1. **Financial Trend Chart**: Fix missing monthly data issue in Sales-Purchase chart.
2. **Warehouse**: Add warehouse selection and stock tab.
3. **Invoices**: List purchase invoices and add missing "Total Sales" bar in top section.
4. **Orders**: Show suggestion orders; fix approved orders showing suggestions.
5. **Checks**: Fix date filtering (daily, weekly, monthly, yearly) for Customer and Own checks.
6. **Current Accounts**: Remove total supplier/customer bars. Add employer-focused insights.
7. **Banks**: Implement DBS (Direct Debiting System) section matching Web logic.
8. **Settings**: Fix Firm/Period change defects and missing Database settings info.

## Implementation Plan

### Phase 1: Dashboard & Charts
- [ ] **Financial Trend**: Analyze `mobile/app/(tabs)/index.tsx` and data service. Ensure monthly data is correctly fetched/formatted.

### Phase 2: Invoices & Orders
- [ ] **Invoices**: Verify API call for purchase invoices. Add Total Sales summary.
- [ ] **Orders**: Adjust filtering logic for Suggestions vs Approved orders.

### Phase 3: Warehouse & Stocks
- [ ] **Warehouse**: Implement warehouse selector and stock view in Product details/listing.

### Phase 4: Financials (Checks, Banks, Accounts)
- [ ] **Checks**: Fix date filter logic in `checks.tsx`.
- [ ] **Current Accounts**: UI cleanup (remove bars) and add new insights.
- [ ] **Banks/DBS**: Port DBS logic from Web to Mobile.

### Phase 5: System & Settings
- [ ] **Settings**: Fix blocking issue in Firm/Period change. Display DB settings.

## Checkpoint
- Platform: Android (APK build requested)
- Framework: React Native / Expo
- Principles:
    - Efficient data fetching (fix missing data).
    - Clear UI for financial data.
    - Consistency with Web logic (DBS).

## Verification
- Lint check.
- Compile check (if possible locally, or ensure code valid).
