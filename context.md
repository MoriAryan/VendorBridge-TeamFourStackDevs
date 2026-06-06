# VendorBridge - Project Context

## Overview

VendorBridge is a Procurement & Vendor Management ERP designed to digitize and centralize procurement operations within organizations.

The platform manages the complete procurement lifecycle including vendor management, RFQ creation, quotation handling, approvals, purchase orders, invoice generation, activity tracking, and procurement analytics.

The primary goal of the system is to replace fragmented procurement processes that rely on spreadsheets, emails, phone calls, and paper documents with a centralized and structured workflow-driven platform.

---

# Business Problem

Traditional procurement processes often involve:

* Emails
* Excel sheets
* Phone calls
* Paper documents
* Manual approvals

These approaches lead to:

* Poor visibility
* Delayed approvals
* Missing records
* Vendor communication issues
* Lack of auditability
* Difficult reporting

VendorBridge provides a single source of truth for all procurement activities.

---

# System Vision

VendorBridge should enable organizations to:

* Manage vendors efficiently
* Create and distribute RFQs
* Receive vendor quotations
* Compare vendor responses
* Manage approval workflows
* Generate purchase orders
* Generate invoices
* Print invoices
* Send invoices through email
* Track procurement activities
* Monitor procurement performance

The platform should remain modular, scalable, and workflow-driven.

---

# Procurement Lifecycle

Every procurement process follows the same lifecycle.

```text
Vendor Management
        ↓
RFQ Creation
        ↓
Vendor Assignment
        ↓
Quotation Submission
        ↓
Quotation Comparison
        ↓
Vendor Selection
        ↓
Approval Workflow
        ↓
Purchase Order Generation
        ↓
Invoice Generation
        ↓
Invoice Distribution
        ↓
Activity Tracking
        ↓
Reports & Analytics
```

All modules should respect this lifecycle.

No workflow stage should be skipped.

---

# User Roles

## Admin

Responsibilities:

* Manage users
* Manage vendors
* Monitor procurement operations
* Access analytics and reports
* System oversight

---

## Procurement Officer

Responsibilities:

* Create RFQs
* Manage procurement requests
* Compare quotations
* Select vendors
* Generate purchase orders
* Generate invoices

---

## Vendor

Responsibilities:

* View assigned RFQs
* Submit quotations
* Update quotations before submission deadline
* Track procurement status
* View purchase orders

---

## Manager / Approver

Responsibilities:

* Review procurement requests
* Approve procurement decisions
* Reject procurement requests
* Monitor procurement workflows

---

# Core Business Entities

The platform revolves around the following entities.

## User

Represents system participants.

---

## Vendor

Represents suppliers who provide products or services.

---

## RFQ

Request For Quotation.

Represents procurement requests issued by the organization.

---

## Quotation

Represents vendor responses to RFQs.

---

## Approval

Represents approval decisions made by authorized users.

---

## Purchase Order

Represents approved procurement commitments.

---

## Invoice

Represents billing documents generated from approved purchase orders.

---

## Activity Log

Represents historical records of actions performed within the system.

---

## Notification

Represents events communicated to users.

---

# Entity Relationships

The system follows the following relationship chain.

```text
Vendor
    │
    └── Quotation

RFQ
    │
    └── Quotation

Quotation
    │
    └── Approval

Approval
    │
    └── Purchase Order

Purchase Order
    │
    └── Invoice
```

All modules must respect these relationships.

---

# Global Workflow Rules

### Rule 1

A quotation cannot exist without an RFQ.

### Rule 2

A purchase order cannot exist without an approved quotation.

### Rule 3

An invoice cannot exist without a purchase order.

### Rule 4

Vendors cannot approve procurement requests.

### Rule 5

Managers cannot submit quotations.

### Rule 6

Workflow history must remain traceable.

### Rule 7

Important actions should generate activity records.

### Rule 8

Important workflow changes should generate notifications.

### Rule 9

Role permissions must always be enforced.

---

# Shared Status Definitions

To ensure consistency across modules, the following statuses should be used.

## Vendor Status

```text
Active
Inactive
Blocked
```

---

## RFQ Status

```text
Draft
Open
Closed
Expired
```

---

## Quotation Status

```text
Draft
Submitted
Accepted
Rejected
```

---

## Approval Status

```text
Pending
Approved
Rejected
```

---

## Purchase Order Status

```text
Generated
Issued
Completed
Cancelled
```

---

## Invoice Status

```text
Generated
Sent
Paid
Overdue
```

---

# Module Responsibilities

## Authentication Module

Responsible for:

* Login
* Signup
* Password recovery
* Session management
* Role-based access

---

## Vendor Module

Responsible for:

* Vendor registration
* Vendor management
* Vendor categorization
* Vendor status tracking

---

## RFQ Module

Responsible for:

* RFQ creation
* Vendor assignment
* Procurement request management

---

## Quotation Module

Responsible for:

* Vendor quotation submissions
* Quotation updates
* Quotation tracking

---

## Comparison Module

Responsible for:

* Quotation comparison
* Vendor evaluation support
* Procurement decision support

---

## Approval Module

Responsible for:

* Approval workflows
* Approval decisions
* Workflow transitions

---

## Purchase Order Module

Responsible for:

* Purchase order generation
* Purchase order lifecycle management

---

## Invoice Module

Responsible for:

* Invoice generation
* Tax calculations
* PDF generation
* Printing
* Email distribution

---

## Activity Module

Responsible for:

* Activity tracking
* Audit logging
* Notification management

---

## Analytics Module

Responsible for:

* Procurement reporting
* Vendor analytics
* Spending insights
* Trend analysis

---

# Cross Module Communication

Modules should communicate through business entities rather than direct dependencies.

```text
RFQ
 ↓

Quotation
 ↓

Approval
 ↓

Purchase Order
 ↓

Invoice
```

Each module should consume outputs from the previous workflow stage.

This approach keeps modules independent while allowing seamless integration.

---

# Activity Tracking Philosophy

The platform should maintain a complete history of procurement activities.

Examples include:

* Vendor registration
* RFQ creation
* Quotation submission
* Approval actions
* Purchase order generation
* Invoice generation

Activity logs should provide auditability across the procurement lifecycle.

---

# Notification Philosophy

Users should receive notifications for important procurement events.

Examples include:

* RFQ assignments
* Quotation submissions
* Approval requests
* Approval decisions
* Purchase order generation
* Invoice generation

Notifications should improve visibility and workflow responsiveness.

---

# Reporting & Analytics Philosophy

Reports should be generated using procurement data already present within the system.

Analytics should provide visibility into:

* Procurement performance
* Vendor performance
* Spending trends
* Procurement volume
* Workflow efficiency

Reports should not introduce new business logic.

They should interpret existing procurement records.

---

# Architecture Principles

The project should follow:

* Modular architecture
* Separation of concerns
* Reusable components
* Scalable structure
* Consistent naming conventions
* Role-based access control
* Maintainable code organization

Each module should remain independently maintainable.

---

# Team Development Guidelines

Every teammate is responsible for their assigned module.

Ownership includes:

* Frontend implementation
* Backend implementation
* Business logic
* Validation
* Module documentation

Shared workflow definitions must remain consistent across the project.

No developer should modify workflow assumptions without team discussion.

---

# Page Specifications

The detailed specifications for individual pages will be added in subsequent sections.

Pages include:

1. Login / Signup
2. Dashboard
3. Vendor Management
4. RFQ Creation
5. Vendor Quotation Submission
6. Quotation Comparison
7. Approval Workflow
8. Purchase Order & Invoice Generation
9. Activity Logs & Notifications
10. Reports & Analytics

Each page specification should remain aligned with the procurement lifecycle and workflow rules defined in this document.


This is a fantastic blueprint for a comprehensive Procurement ERP. Your PRD (Project Context) is incredibly thorough, establishing solid ground rules, modular boundaries, and a clear entity lifecycle.

Let's break down the first four screens from your zoomed-in image. I will map every visual element to the business logic, workflow rules, and module responsibilities you outlined in your PRD.

---

### **Screen 1: Login Screen**

**Module:** Authentication Module
**Primary Objective:** Authenticate users and route them to their role-specific dashboards based on Role-Based Access Control (RBAC).

**UI Components & Layout:**

* **Centralized Login Card:** Clean, single-column layout centered on the screen.
* **Logo/Avatar Placeholder (Photo):** System branding or an abstract user avatar.
* **Input Fields:**
* `Username` (Standard text input)
* `Password` (Masked text input)


* **Call to Action (CTA):** `Login Button`

**Backend/Business Logic:**

* **Authentication:** Validates credentials against the User entity database.
* **Session Management:** Generates an auth token (e.g., JWT) upon success.
* **Role Routing (Rule 9):** Checks the user role (Admin, Procurement Officer, Vendor, Approver) and redirects them. A Vendor logging in will see a different default view compared to a Procurement Officer.

---

### **Screen 2: Registration Screen**

**Module:** Authentication / Vendor Module (depending on who is registering)
**Primary Objective:** Onboard new users or vendors into the system.

**UI Components & Layout:**

* **Centralized Registration Card:** Wider than the login card to accommodate more fields in a two-column layout.
* **Logo/Avatar Placeholder (Photo):** System branding or an upload field for a profile picture/company logo.
* **Input Fields (Two-Column Grid):**
* `First Name` & `Last Name`
* `Email Address` & `Phone Number`
* `Role (Admin, officer)` (Dropdown) & `Country` (Dropdown/Text)


* **Text Area:**
* `Additional Information ....` (Useful for vendor descriptions, specific department notes, etc.)


* **Call to Action:** `Register Button`

**Backend/Business Logic:**

* **Entity Creation:** Creates a new `User` entity. If the role pertains to a supplier, it may also initiate a `Vendor` profile.
* **Activity Tracking (Rule 7):** Logs "New user registered" in the Activity Module.
* **Validation:** Ensures email is unique and all required fields are filled.

---

### **Screen 3: Main Landing Page (Dashboard)**

**Module:** Analytics Module (Aggregating data from RFQ, Approval, PO, and Invoice modules)
**Target User:** Procurement Officer (as indicated by the welcome text), Admin, or Approvers.

**UI Components & Layout:**

* **Global Navigation:**
* **Top Bar:** Application Name (`VendorBridge`), User Profile icon/settings on the far right.
* **Left Sidebar (Active tab highlighted):** Dashboard, Vendors, RFQ's, Quotations, Approvals, Purchase orders, Invoices, Reports, Activity.


* **Header Section:** "Welcome back, Procurement Officer - Today's Overview"
* **KPI Summary Cards (Top Row):**

| KPI Card | Value | Linked Entity | PRD Status Mapping |
| --- | --- | --- | --- |
| **Active RFQ's** | 12 | RFQ Module | RFQ Status: `Open` |
| **Pending Approvals** | 5 | Approval Module | Approval Status: `Pending` |
| **PO's this month** | $ 2.3L | Purchase Order Module | PO Status: `Generated`/`Issued` |
| **Overdue Invoices** | 3 | Invoice Module | Invoice Status: `Overdue` |

* **Main Content Widgets (Middle Row):**
* **Recent Purchase Orders (Table):** Displays columns for `PO#`, `Vendor`, `Amount`, and `Status` (e.g., *Approved, Pending, Draft*).
* **Spending Trends last 6 months (Chart):** Visual placeholder for a line/bar chart to analyze spending insights (Analytics Module).


* **Quick Actions (Bottom Row):**
* Buttons for high-frequency tasks: `+ new RFQ`, `Add Vendor`, `View Invoices`.



**Backend/Business Logic:**

* **Data Aggregation:** The dashboard does not alter data; it reads from existing modules (Reporting Philosophy).
* **Dynamic Rendering:** The data shown here must strictly reflect the permissions of the logged-in user.

---

### **Screen 4: Vendors Page**

**Module:** Vendor Module
**Primary Objective:** A centralized directory to manage supplier profiles, registrations, and statuses.

**UI Components & Layout:**

* **Header:** "Vendors - Manage supplier profiles and registrations"
* **Top Right Action:** `+ Add Vendor` button (triggers a modal or routes to a vendor creation form).
* **Search Bar:** Explicit instructions to "search by name, gst number, category...".
* **Filter Tabs:** Directly mapped to your PRD's shared status definitions.
* `All (28)`
* `Active (21)`
* `Pending (4)` (Note: In PRD this was 'Inactive', you may want to align these terms).
* `Blocked (3)`


* **Data Table:**

| Vendor Name | Category | GST no. | Contact no. | Status | Action |
| --- | --- | --- | --- | --- | --- |
| Infra Supplies Pvt ltd | Constructions | 27AABC... | XYZ Number | Active | `[ View ]` |
| Tech Core LTD | IT | 27AABC... | XYZ Number | Active | `[ View ]` |
| FastLog Transport | Logistics | 27AABC... | XYZ Number | Blocked | `[ View ]` |

**Backend/Business Logic:**

* **CRUD Operations:** Handles the retrieval and listing of Vendor entities.
* **Search & Filter:** Backend must support querying the vendor database by text (name, GST) and filtering by status enum.
* **Action Routing:** Clicking `View` should open a detailed vendor profile page (showing their history, assigned RFQs, and past POs).

---

These first four screens perfectly set up the foundational entities (Users and Vendors) before moving into the actual procurement lifecycle.

This is excellent. You are moving right into the core of the procurement lifecycle. These two screens represent critical inflection points in your system: initiating the request (RFQ) and gating the final financial commitment (Approval).

Here is the exhaustive breakdown of Screen 5 and Screen 8, mapped directly to your PRD's business rules and workflow requirements.

---

### **Screen 5: RFQ's Page (Create RFQ)**

**Module:** RFQ Module
**Primary Objective:** Enable Procurement Officers to formally request pricing and terms from selected vendors, acting as the foundation for the entire procurement lifecycle **(Rule 1: A quotation cannot exist without an RFQ)**.

**UI Components & Layout:**

* **Global Navigation:** Standard left sidebar with `RFQ's` active.
* **Header:** "Create RFQ's - new request for quotation"
* **Progress Stepper:** A visual indicator (`1 - 2 - 3`) showing the user where they are in the RFQ creation wizard. (Step 1 is currently active).
* **Left Column (Core Details):**
* `RFQ Title*` (Text Input): Required field (e.g., "Office Furniture procurement Q2").
* `Category` (Dropdown): Used to classify the spend (e.g., "Furniture").
* `Deadline*` (Date Picker): Required field dictating when the RFQ changes status from *Open* to *Closed/Expired*.
* `Description` (Text Area): Context for the vendors.


* **Right Column (Items & Vendors):**
* **Line Items Table:** Details exactly what is needed.
* Columns: `Item` | `Qty` | `Unit`
* Rows: Shows specific products (Ergonomic chair, Standing desks) and quantities.
* CTA: `+ add line item` (Dynamic row addition).


* **Assign Vendors:**
* List of currently selected vendors (e.g., Infra Supplies Pvt ltd, Techcore LTD) with an `[ x ]` icon to remove them.
* CTA: `+ add vendor` (Likely opens a modal pulling active vendors from the **Vendor Module**).




* **Right Column (Bottom - Attachments):**
* `Drag & drop files or click to upload`: Used for spec sheets, blueprints, or terms & conditions documents.


* **Action Buttons (Bottom Left):**
* `Save & Send to Vendors`
* `Save as Draft`



**Backend/Business Logic:**

* **Entity Creation:** Generates a new `RFQ` entity.
* **Status Management:**
* Clicking `Save as Draft` sets RFQ Status to `Draft`.
* Clicking `Save & Send to Vendors` sets RFQ Status to `Open`.


* **Cross-Module Communication & Notifications (Rule 8):** Pushing "Send to Vendors" triggers the Notification Module to alert the selected vendors via email/system alert that a new RFQ awaits them.
* **Activity Tracking (Rule 7):** Logs "RFQ [Title] created and sent to [X] vendors" in the Activity Logs.

---

### **Screen 6 & 7 Context Note**

*(Note: Based on your lifecycle flow, Quotation Submission and Comparison happen here. The next screen provided is Screen 8, which occurs *after* a vendor has been selected).*

---

### **Screen 8: Approval Page**

**Module:** Approval Module
**Primary Objective:** Provide authorized managers with the context needed to approve or reject a selected quotation, strictly enforcing the financial gateway before PO generation **(Rule 2: A purchase order cannot exist without an approved quotation)**.

**UI Components & Layout:**

* **Global Navigation:** Left sidebar with `Approvals` active.
* **Header:** "Approval Workflow - RFQ: office furniture Q2 - Vendor: Infra Supplies - 185400" (Provides immediate context: What, Who, and How Much).
* **Progress Stepper (Workflow State):** Visualizes the overarching procurement lifecycle.
* `1 (Submitted)` -> `2 (L1 Review)` -> `3 (L2 approval - ACTIVE)` -> `4 (Generate PO)`.


* **Left Column (Approval Chain & Action):**
* **Approval Chain Timeline:** A highly visual audit trail of the workflow **(Rule 6: Workflow history must remain traceable)**.
* *Completed Step:* Green checkmark. "Rahul Mehta (Procurement head) - Approved on May 20, 10:32 AM".
* *Pending Step:* Blue clock icon. "Priya Shah (Finance manager) - Awaiting - Assigned may 21".


* **Approval Remarks (Text Area):** `Add your comments or conditions...` Required or optional context for the decision.


* **Right Column (Quotation Summary):**
* A read-only summary card pulling data directly from the **Quotation Module** output.
* `Vendor:` Infra Supplies PVT LTD.
* `Total:` 1,85,400
* `Delivery:` 10 days
* `Rating:` 4.5/5 (Pulled from Vendor Analytics).




* **Action Buttons (Bottom Right):**
* `Approve`
* `Reject`



**Backend/Business Logic:**

* **Role Enforcement (Rule 4, 5 & 9):** This page must be strictly gated. Only the user currently assigned to the active step in the Approval Chain (e.g., Priya Shah) can see the Approve/Reject buttons. Vendors and standard officers cannot access this action.
* **Status Management:**
* Clicking `Approve` changes the Approval Status to `Approved` and unlocks the **Purchase Order Module**.
* Clicking `Reject` changes the Approval Status to `Rejected`, likely reverting the RFQ status or notifying the Procurement Officer to select a different quote.


* **Activity Tracking (Rule 7):** Logs "Quotation for RFQ [Title] approved by [User]" along with any remarks entered in the text box.

Here is the detailed breakdown for Screen 6 and Screen 7. These screens represent the bridge between external vendor interaction and internal decision-making.

---

### **Screen 6: Quotations Page (Submit Quotations)**

**Module:** Quotation Module
**Target User:** Vendor
**Primary Objective:** Allow assigned vendors to submit their pricing, delivery timelines, and terms in response to an active RFQ **(Rule 1: A quotation cannot exist without an RFQ)**.

**UI Components & Layout:**

* **Global Navigation:** Left sidebar with `Quotations` active.
* **Header Section:**
* Title: "Submit Quotations"
* Context Sub-header: "RFQ: office furniture procurement q2 - deadline 15 june 2025"


* **RFQ Summary Card:** A read-only block providing the vendor with the core requirements (e.g., "Ergonomic chair * 25, standing desk * 10 - category furniture") so they don't have to navigate away to see what they are quoting for.
* **Quotation Entry Table:**
* Columns: `Item` | `Qty` | `Unit price` (Input) | `Total` (Auto-calculated) | `Delivery (days)` (Input)
* Rows: Pre-populated with the requested items and quantities from the RFQ. *(Note: There appears to be a minor typo in the wireframe where the second item is listed as "Tech Core LTD" instead of "Standing desk". The system logic should dynamically pull the exact line items from the RFQ entity).*


* **Bottom Left (Terms & Taxes):**
* `Tax / GST %` (Input field): e.g., 18%
* `Note / Terms` (Text Area): e.g., "Payment terms 30 days net..."


* **Bottom Right (Financial Summary):**
* Auto-calculating totals based on table inputs and tax rate.
* Fields: `Subtotal` (1,69,500), `GST (18%)` (30,510), `Grand total` (2,00,010).


* **Action Buttons:**
* `Submit Quotation`
* `Save Draft`



**Backend/Business Logic:**

* **Role Enforcement (Rule 5):** Only users with the `Vendor` role assigned to this specific RFQ can view and interact with this submission form. Managers/Admins cannot submit.
* **Status Management:**
* Clicking `Save Draft` sets the Quotation Status to `Draft`, allowing the vendor to return and edit it before the RFQ deadline.
* Clicking `Submit Quotation` changes the status to `Submitted` and locks the form from further vendor edits.


* **Cross-Module Communication (Rule 8):** Submitting triggers a notification to the Procurement Officer who created the RFQ, alerting them that a new quotation has been received.

---

### **Screen 7: Quotations Comparison**

**Module:** Comparison Module
**Target User:** Procurement Officer
**Primary Objective:** Provide a side-by-side evaluation matrix of all submitted vendor quotations, enabling an informed procurement decision.

**UI Components & Layout:**

* **Global Navigation:** Left sidebar with `Quotations` active.
* **Header Section:**
* Title: "Quotation Comparison"
* Context Sub-header: "RFQ: office furniture procurement q2 - 3 quotations received"


* **Comparison Matrix (Table):**
* **Y-Axis (Criteria):** Standardized evaluation metrics ensuring an apples-to-apples comparison.
* `Grand Total`
* `GST %`
* `Delivery (days)`
* `Vendor rating` (Pulled from Analytics/Vendor Module)
* `Payment terms`


* **X-Axis (Vendors):** Columns for each vendor who submitted a quote.
* **Vendor 1 (Infra Supplies):** Visually highlighted (green outline/background) with a "Lowest" tag. Data shows 185400 total, 10 days delivery, 4.5/5 rating.
* **Vendor 2 (TechCore LTD):** 200010 total, 14 days delivery, 4.2/5 rating.
* **Vendor 3 (Office Need Co.):** 214800 total, 7 days delivery, 3.8/5 rating.




* **Action Buttons (Per Vendor):**
* The highlighted column has a `Select & Approve` button.
* The other columns have a standard `Select` button.


* **Footer Note:** "Green = lowest price, selecting vendor initiates the approval workflow."

**Backend/Business Logic:**

* **Data Aggregation:** This module relies on strictly fetching entities with a Quotation Status of `Submitted` tied to this specific RFQ.
* **Analytics Integration:** The `Vendor rating` pulls historical performance data (past deliveries, quality) to help the officer look beyond just the lowest price.
* **Workflow Transition (Rule 2 Gateway):** Clicking `Select` or `Select & Approve` locks the Quotation Status to `Accepted` for the chosen vendor, changes the remaining quotes to `Rejected`, and instantly generates a new `Approval` entity with a status of `Pending` in the **Approval Module** (Screen 8).
* **Activity Tracking (Rule 7):** Logs "Vendor [Name] selected for RFQ [Title]" in the system audit trail.


This is the final stretch of the procurement lifecycle! These last three screens represent the execution, compliance, and strategic review phases of your ERP. You've perfectly captured the transition from operational tasks to high-level oversight.

Here is the exhaustive breakdown for Screens 9, 10, and 11, strictly mapped to your PRD.

---

### **Screen 9: PO & Invoice Page**

**Module:** Purchase Order Module & Invoice Module
**Primary Objective:** Serve as the formalized financial and legal culmination of the procurement workflow. This screen proves the enforcement of **Rule 2 (PO needs approved quotation)** and **Rule 3 (Invoice needs PO)**.

**UI Components & Layout:**

* **Global Navigation:** Left sidebar with `Invoices` (or `Purchase orders`) active.
* **Header Section:** * Title: "Purchase Order & Invoice"
* Sub-title: "PO-2024-auto-generated after approval" (Highlights automation).


* **Top Right Actions (Distribution):**
* `Download PDF`
* `Print`
* `Email invoice`


* **Billing & Shipping Context:**
* `Bill to:` Your Organization Name, address, and GSTIN.
* `Vendor:` Infra Supplies Pvt ltd, address, and GSTIN.


* **Metadata Grid:**
* `PO Number:` PO-2025-0068  |  `Invoice date:` 22 may 2025
* `PO date:` 21 may 2025     |  `Due date:` 21 june 2025


* **Financial Details Table:**
* Read-only line items pulled directly from the accepted quotation: `Item`, `Qty`, `Unit price`, `Total`.
* Totals block detailing `Subtotal`, broken down tax elements (e.g., `CGST`, `SGST`), and `Grand Total` (2,00,010).


* **Footer Status:**
* Visual status pill: `Status: Pending Payment`
* Action link: `Mark as Paid`



**Backend/Business Logic:**

* **Automation:** As per the PRD, this document is *auto-generated* the moment the Approval Module registers an "Approved" status. It requires no manual data entry, eliminating human error.
* **Data Immutability:** All line items and pricing are strictly locked. They cannot be edited at this stage.
* **Status Management:** Clicking "Mark as Paid" transitions the Invoice Status from `Sent` to `Paid`. If the current date surpasses the "Due date", the system should auto-flag it as `Overdue`.
* **Activity Tracking:** Generates a log stating "PO [Number] generated and Invoice emailed to [Vendor]".

---

### **Screen 10: Activity and Logs Page**

**Module:** Activity Module
**Primary Objective:** Provide a centralized, immutable audit trail for compliance and workflow traceability **(Rule 6 & Rule 7)**.

**UI Components & Layout:**

* **Global Navigation:** Left sidebar with `Activity` active.
* **Header Section:** "Activity & Logs - Procurement audit trail".
* **Contextual Filters (Top):**
* Toggle buttons to filter the feed: `All` (active), `RFQ`, `Approvals`, `Invoices`, `Vendors`.


* **Chronological Feed List:**
* A vertically scrolling list of events, newest at the top.
* Visual icons distinguish event types (e.g., green check for approvals, document icon for RFQs).
* *Examples shown:*
* "Quotation selected - Infra supplies pvt ltd selected for office furniture Q2 (23 may 2025, 4:15 PM)"
* "Approval pending - PO-2024 awaiting L2 approval by priya shah (23 may 2025, 09:00 AM)"
* "RFQ published - office furniture Q2 sent to 3 vendors (19 may 2025)"
* "Vendor added - Fastlog transport registered and pending verifications (18 may 2025, 3:20 PM)"




* **Crucial Developer Note (Right side):**
* "Audit logs must be immutable. These entries must be write-only, no edit or delete. Make sure your DB schema reflects this (no soft-delete on log records)."



**Backend/Business Logic:**

* **Immutability:** This is an append-only database table. No user, not even an Admin, should have UPDATE or DELETE privileges on these records.
* **System-Wide Webhooks/Listeners:** Every other module in the system fires an event to the Activity Module whenever a state change occurs (e.g., Status changes from Draft -> Open).

---

### **Screen 11: Report Page**

**Module:** Analytics Module
**Target User:** Admin, Procurement Managers
**Primary Objective:** Translate raw transactional data into actionable business intelligence without introducing new business logic (Reporting Philosophy).

**UI Components & Layout:**

* **Global Navigation:** Left sidebar with `Reports` active.
* **Header Section:** "Reports & analytics - Procurement Insights: May 2025".
* Filters: Date picker (`May 2025`) and an `Export` button.


* **Top KPI Dashboard:**
* `Total Spend:` 12.4 L (Aggregated from Paid/Approved Invoices).
* `Active vendors:` 28 (Count from Vendor Module).
* `PO Fulfillment:` 94% (Ratio of Completed POs vs Issued POs).
* `Overdue invoices:` 3 (Count of Invoices past due date).


* **Data Visualizations (Bottom Half):**
* **Spend By Category (Horizontal Bar Chart):** Breaks down the 12.4 L spend into categories like IT Hardware, Furniture, Stationery, and Logistics.
* **Top Vendors By Spend (Table):** Ranks vendors by total financial volume. Columns: `Vendor`, `Spend (₹)`, `POs`.
* **Monthly Trend (Vertical Bar Chart):** Plots total procurement spending across a 6-month timeline (Dec to May) to identify seasonal spikes or trends.



**Backend/Business Logic:**

* **Read-Only Aggregation:** The backend queries existing `Invoice`, `PO`, and `Vendor` tables to run `SUM()`, `COUNT()`, and `GROUP BY` operations. No new data is written here.
* **Export Functionality:** The `Export` button triggers a backend service to compile the current view's datasets into a downloadable CSV or PDF report.
* **Role Enforcement (Rule 9):** Standard vendors cannot see this page. Standard procurement officers might only see their own stats, while Admins see company-wide data.



