import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AuthPage from "./pages/Auth/AuthPage.jsx";
import RFQList from "./pages/RFQ/RFQList.jsx";
import CreateRFQ from "./pages/RFQ/CreateRFQ.jsx";
import RFQDetail from "./pages/RFQ/RFQDetail.jsx";
import VendorList from "./pages/Vendor/VendorList.jsx";
import VendorDetail from "./pages/Vendor/VendorDetail.jsx";
import QuotationList from "./pages/Quotation/QuotationList.jsx";
import QuotationComparison from "./pages/Quotation/QuotationComparison.jsx";
import ApprovalList from "./pages/Approval/ApprovalList.jsx";
import ApprovalDetail from "./pages/Approval/ApprovalDetail.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PurchaseOrder from "./pages/PurchaseOrder.jsx";
import Invoice from "./pages/Invoice.jsx";
import Reports from "./pages/Reports.jsx";
import { Activity } from "./pages/Activity.jsx";

// ── Auth guard: check if a token is stored ────────────────────────
function isLoggedIn() {
  return !!localStorage.getItem("accessToken");
}

// ── Protected Route: redirects to /login if not authenticated ────
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ── Placeholder components for future modules ─────────────────────
function Placeholder({ title, icon }) {
  return (
    <div>
      <div className="page-header">
        <h1>
          {icon} {title}
        </h1>
        <p>This module is under active development</p>
      </div>
      <div
        className="card"
        style={{ padding: "60px", textAlign: "center" }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "var(--bg)",
            boxShadow: "var(--shadow-extruded)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            margin: "0 auto 24px",
          }}
        >
          {icon}
        </div>
        <h2 style={{ marginBottom: "8px" }}>{title}</h2>
        <p style={{ maxWidth: "360px", margin: "0 auto" }}>
          This module is part of the VendorBridge procurement lifecycle and will
          be available soon.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes — accessible without login */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />

        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Main app shell — all protected */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Vendors */}
          <Route path="/vendors" element={<VendorList />} />
          <Route path="/vendors/:id" element={<VendorDetail />} />

          {/* RFQs — Primary module */}
          <Route path="/rfqs" element={<RFQList />} />
          <Route path="/rfqs/create" element={<CreateRFQ />} />
          <Route path="/rfqs/:id" element={<RFQDetail />} />

          {/* Quotations — /compare must come before /:id */}
          <Route path="/quotations" element={<QuotationList />} />
          <Route path="/quotations/compare" element={<QuotationComparison />} />
          <Route path="/quotations/:id" element={<QuotationList />} />

          {/* Approvals */}
          <Route path="/approvals" element={<ApprovalList />} />
          <Route path="/approvals/:id" element={<ApprovalDetail />} />

          {/* Purchase Orders */}
          <Route path="/purchase-orders" element={<PurchaseOrder />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrder />} />

          {/* Invoices */}
          <Route path="/invoices" element={<Invoice />} />
          <Route path="/invoices/:id" element={<Invoice />} />

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />

          {/* Activity */}
          <Route path="/activity" element={<Activity />} />

          {/* 404 catch-all */}
          <Route
            path="*"
            element={<Placeholder title="Page Not Found" icon="🔍" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
