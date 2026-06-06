# Activity Log Feature

## Overview

Implement a centralized activity logging system that tracks procurement-related events across the VendorBridge platform.

The activity log should provide:

* Audit trail of user actions
* Dashboard activity timeline
* Activity filtering and searching
* Foundation for notifications

---

# Phase 1: Backend Setup

## Task 1: Create ActivityLog Schema

* [ ] Create `ActivityLog` mongoose model

Fields:

```js
{
  companyId,
  userId,
  actionType,
  entityType,
  entityId,
  description,
  metadata,
  createdAt
}
```

Indexes:

* createdAt
* companyId
* userId
* actionType

---

## Task 2: Define Activity Types

Create constants file:

```js
RFQ_CREATED
RFQ_UPDATED
RFQ_PUBLISHED

VENDOR_INVITED

QUOTATION_SUBMITTED
QUOTATION_UPDATED

APPROVAL_REQUESTED
APPROVAL_APPROVED
APPROVAL_REJECTED

PO_GENERATED

INVOICE_GENERATED
```

Location:

```text
backend/src/constants/activityTypes.js
```

---

# Phase 2: Logging Service

## Task 3: Create Activity Logging Utility

Create:

```text
backend/src/services/activityLogger.js
```

Function:

```js
logActivity({
  userId,
  companyId,
  actionType,
  entityType,
  entityId,
  description,
  metadata
});
```

Responsibilities:

* Create activity log record
* Validate payload
* Save activity to database

---

# Phase 3: RFQ Events

## Task 4: Log RFQ Creation

Trigger when RFQ is created.

Example:

```text
Alice created RFQ-100
```

Metadata:

```js
{
  rfqId,
  title
}
```

---

## Task 5: Log RFQ Updates

Trigger when:

* RFQ edited
* Deadline changed
* Vendor assignments updated

---

## Task 6: Log Vendor Invitations

Trigger when vendors are assigned.

Example:

```text
Invitation sent to Dell HQ for RFQ-100
```

Metadata:

```js
{
  vendorId,
  rfqId
}
```

---

# Phase 4: Quotation Events

## Task 7: Log Quotation Submission

Trigger when vendor submits quotation.

Example:

```text
Dell HQ submitted quotation for RFQ-100
```

---

## Task 8: Log Quotation Updates

Trigger when vendor edits quotation.

---

# Phase 5: Approval Events

## Task 9: Log Approval Request

Example:

```text
Approval requested for RFQ-100
```

---

## Task 10: Log Approval Decision

Events:

* Approved
* Rejected

Example:

```text
Bob approved quotation for RFQ-100
```

---

# Phase 6: Purchase Order & Invoice Events

## Task 11: Log Purchase Order Creation

Example:

```text
PO-2025-00123 generated
```

---

## Task 12: Log Invoice Generation

Example:

```text
Invoice INV-2025-00087 generated
```

---

# Phase 7: API Development

## Task 13: Get Activity Logs

Endpoint:

```http
GET /api/activity-logs
```

Support:

* pagination
* sorting
* filtering

Query params:

```text
?page=
?limit=
?actionType=
?userId=
?entityType=
```

---

## Task 14: Get Recent Activities

Endpoint:

```http
GET /api/activity-logs/recent
```

Returns:

* latest 10 activities

Used on dashboard.

---

# Phase 8: Frontend Timeline

## Task 15: Create Activity Timeline Component

Location:

```text
frontend/src/components/activity/ActivityTimeline.jsx
```

Display:

* icon
* description
* timestamp
* user name

Example:

```text
RFQ-100 created by Alice
2 hours ago
```

---

## Task 16: Create Activity Service

Location:

```text
frontend/src/services/activityService.js
```

Functions:

```js
getActivities()
getRecentActivities()
```

---

## Task 17: Dashboard Integration

Add Recent Activity card.

Location:

```text
Dashboard.jsx
```

Display:

* latest 10 activities
* loading state
* empty state

---

# Phase 9: Filters

## Task 18: Activity Filters

Add:

* Action Type filter
* User filter
* Date range filter

---

## Task 19: Search Activities

Allow searching by:

* RFQ ID
* Vendor Name
* PO Number
* Invoice Number

---

# Phase 10: Testing

## Task 20: Backend Tests

Verify:

* Activity creation
* Filtering
* Pagination
* Sorting

---

## Task 21: Frontend Tests

Verify:

* Timeline rendering
* Filters
* API integration

---

# Acceptance Criteria

* Every procurement event creates an activity log.
* Activities are stored in MongoDB.
* Timeline displays newest events first.
* Dashboard shows recent activity.
* Filtering and search work correctly.
* Activity logs cannot be edited after creation.
