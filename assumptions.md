# Assumptions — VendorBridge Frontend

This file documents decisions made during frontend development that are **not explicitly specified** in `context.md`.

---

## Screen 8 — Approval Workflow

| # | Assumption | Reason |
|---|------------|--------|
| 1 | **Remarks are required** before Approve/Reject | context.md says "Required or optional context" — treating as required for accountability and audit trail integrity (Rule 7). |
| 2 | **Static/mock data** is used for the approval chain and quotation summary | No API contract defined yet. API integration points are marked with `// TODO` comments in the component. |
| 3 | **Sidebar is rendered inline** in the page component | No shared layout/router exists yet. Will be extracted to a shared `Layout.jsx` once `react-router-dom` is set up. |
| 4 | **Approve/Reject buttons are always visible** in this static build | context.md (Rule 4, 5, 9) states only the active approver should see action buttons. This gating requires backend auth context (JWT role + approval assignment). Marked with a code comment for backend integration. |
| 5 | **₹ (Rupee) currency symbol** is used for monetary values | context.md uses Indian numeric format (e.g., 1,85,400) suggesting INR context. |
| 6 | **Initials-based avatar** used in approval chain | No profile photo system is specified in context.md. |
| 7 | **Star icons** used for vendor rating display | context.md only states "4.5/5" without specifying the visual format. |
| 8 | **Error state on empty remarks** shows inline text (not a toast/modal) | context.md does not specify an error display pattern. Inline text chosen as the simplest accessible approach. |
| 9 | **Reject color is red (`#EF4444`)** | context.md does not define a danger/error color. Red is the universal convention for destructive actions. |
| 10 | **`react-router-dom` will be needed** for full navigation | context.md describes multi-page navigation (sidebar with 9 sections). Routing is not yet set up. |

---

## General / Cross-page

| # | Assumption | Reason |
|---|------------|--------|
| 1 | **No Tailwind CSS** — using Vanilla CSS | Tailwind is referenced in context.md design system for illustration, but it is not installed in the project. All styles are in `.css` files. |
| 2 | **`pages/` folder** inside `src/` for page-level components | Standard React convention. No folder structure is specified in context.md. |
| 3 | **Google Fonts** (Plus Jakarta Sans + DM Sans) loaded via `@import` in CSS | context.md specifies these fonts. Using CSS `@import` as no `index.html` head management tool (e.g., React Helmet) is set up. |

---

## Screen 9 — PO & Invoice

| # | Assumption | Reason |
|---|------------|--------|
| 1 | **`Invoices` is the active sidebar item** | context.md says "`Invoices` (or `Purchase orders`)" — chose `Invoices` as primary since the screen includes a full invoice document. |
| 2 | **Initial invoice status is `Pending Payment`** | context.md lists Invoice statuses as `Generated → Sent → Paid → Overdue`. Screen shows `Pending Payment` label — mapped to the `Sent` state (invoice has been dispatched). |
| 3 | **`Overdue` is auto-detected client-side** via `Date` comparison | context.md says "auto-flag as Overdue". In production, this would be a backend cron job. Client-side detection used for the static build. |
| 4 | **CGST (9%) + SGST (9%) = 18% GST** | context.md mentions "GST" without specifying the split. Standard Indian GST intra-state split (9+9) applied. |
| 5 | **Organisation billing info is mocked** as "VendorBridge Pvt. Ltd." | context.md says `Bill to: Your Organization Name`. Placeholder org data used. |
| 6 | **Line items** (Ergonomic Chair × 25, Standing Desk × 10) are pulled from the RFQ context in Screen 5 | context.md says data is "pulled directly from the accepted quotation". Same line items from the Office Furniture Q2 RFQ used for consistency. |
| 7 | **Download PDF / Email Invoice** show `alert()` placeholder | context.md specifies these as UI actions. Backend PDF service and mail service are not yet defined. Placeholders with `// TODO` comments added. |
| 8 | **`Print`** calls `window.print()` | Standard browser print API. No print stylesheet defined yet. |
| 9 | **"Mark as Paid" button is hidden after clicking** (replaced by status pill) | context.md does not specify post-action UI. Hiding the button prevents double-submission. |
| 10 | **Data is fully read-only** (no input fields) | context.md states "Data Immutability: All line items and pricing are strictly locked." Enforced via display-only elements. |

---

## General / Cross-page (Updated)

| # | Assumption | Reason |
|---|------------|--------|
| 1 | **No Tailwind CSS** — using Vanilla CSS | Tailwind is referenced in context.md design system for illustration, but it is not installed in the project. All styles are in `.css` files. |
| 2 | **`pages/` folder** inside `src/` for page-level components | Standard React convention. No folder structure is specified in context.md. |
| 3 | **Google Fonts** (Plus Jakarta Sans + DM Sans) loaded via `@import` in CSS | context.md specifies these fonts. Using CSS `@import` as no `index.html` head management tool (e.g., React Helmet) is set up. |
| 4 | **"Purchase Orders" removed from sidebar** | context.md defines both "Purchase Orders" and "Invoices" as sidebar items, but Screen 9 is a combined PO+Invoice document. Having two labels pointing to identical content is misleading. "Purchase Orders" will be re-added when a dedicated PO list view is built by the assigned team member. |
