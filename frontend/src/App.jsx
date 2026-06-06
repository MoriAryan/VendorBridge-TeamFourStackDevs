import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard        from './pages/Dashboard';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import POInvoice        from './pages/POInvoice';
import Reports          from './pages/Reports';
import { Activity }     from './pages/Activity';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Screen 3 — Main Dashboard */}
        <Route path="/"          element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Screen 8 — Approval Workflow */}
        <Route path="/approvals"     element={<ApprovalWorkflow />} />
        <Route path="/approvals/:id" element={<ApprovalWorkflow />} />

        {/* Screen 9 — PO & Invoice */}
        <Route path="/invoices"            element={<POInvoice />} />
        <Route path="/invoices/:id"        element={<POInvoice />} />
        <Route path="/purchase-orders"     element={<POInvoice />} />
        <Route path="/purchase-orders/:id" element={<POInvoice />} />

        {/* Screen 11 — Reports & Analytics */}
        <Route path="/reports" element={<Reports />} />

        {/* Activity Log */}
        <Route path="/activity" element={<Activity />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
