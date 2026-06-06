import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { logoutUser } from "../api/auth.api.js";

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith("/rfqs/") ? "RFQ Details" : "VendorBridge");

  // Get user info from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PO";

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Even if the API fails, clear local storage
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                  borderRadius: "50%",
                  background: "var(--accent-danger)",
                }}
              />
            </button>

            {/* User avatar + dropdown */}
            <div style={{ position: "relative" }}>
              <div
                id="user-avatar-btn"
                className="avatar"
                role="button"
                tabIndex={0}
                aria-label="User account menu"
                onClick={() => setShowUserMenu((v) => !v)}
                onKeyDown={(e) => e.key === "Enter" && setShowUserMenu((v) => !v)}
              >
                {initials}
              </div>

              {showUserMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    minWidth: "200px",
                    background: "var(--bg)",
                    borderRadius: "var(--radius-inner)",
                    boxShadow: "var(--shadow-extruded-hover)",
                    padding: "8px",
                    zIndex: 300,
                    animation: "slideUp 0.2s ease-out",
                  }}
                >
                  {/* User info */}
                  <div
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid rgba(163,177,198,0.2)",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ fontWeight: "700", fontSize: "0.875rem", color: "var(--fg)" }}>
                      {user.name || "User"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                      {user.role?.replace("_", " ") || ""}
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    id="logout-btn"
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-inner)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.875rem",
                      color: "var(--accent-danger)",
                      fontWeight: "600",
                      fontFamily: "var(--font-body)",
                      transition: "var(--transition)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(229,62,62,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Overlay to close user menu */}
        {showUserMenu && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 200 }}
            onClick={() => setShowUserMenu(false)}
          />
        )}

        {/* Page Content */}
        <main className="page-content animate-fadeIn">
          <Outlet />
        </main>
      </div>

      {/* Mobile responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          #hamburger-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
