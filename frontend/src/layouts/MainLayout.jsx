import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

// Map route paths to human-readable page titles
const pageTitles = {
  "/dashboard": "Dashboard",
  "/vendors": "Vendors",
  "/rfqs": "RFQ's",
  "/rfqs/create": "Create RFQ",
  "/quotations": "Quotations",
  "/approvals": "Approvals",
  "/purchase-orders": "Purchase Orders",
  "/invoices": "Invoices",
  "/reports": "Reports",
  "/activity": "Activity & Logs",
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/rfqs/") ? "RFQ Details" : "VendorBridge");

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          {/* Mobile hamburger */}
          <button
            id="hamburger-menu-btn"
            className="btn-icon btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            style={{ display: "none" }}
          >
            ☰
          </button>

          <h2 className="topbar-title">{currentTitle}</h2>

          <div className="topbar-actions">
            {/* Notifications */}
            <button
              id="notification-btn"
              className="btn-icon btn"
              aria-label="View notifications"
              style={{ position: "relative" }}
            >
              🔔
              <span
                className="notification-dot"
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  width: "7px",
                  height: "7px",
                }}
              />
            </button>

            {/* User avatar */}
            <div
              id="user-avatar-btn"
              className="avatar"
              role="button"
              tabIndex={0}
              aria-label="User account"
            >
              PO
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content animate-fadeIn">
          <Outlet />
        </main>
      </div>

      {/* Mobile hamburger (CSS-controlled visibility) */}
      <style>{`
        @media (max-width: 768px) {
          #hamburger-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
