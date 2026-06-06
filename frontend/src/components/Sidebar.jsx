import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "⊞" },
  { path: "/vendors", label: "Vendors", icon: "🏢" },
  { path: "/rfqs", label: "RFQ's", icon: "📋" },
  { path: "/rfqs", label: "Quotations", icon: "💬" },
  { path: "/approvals", label: "Approvals", icon: "✅" },
  { path: "/purchase-orders", label: "Purchase Orders", icon: "📦" },
  { path: "/invoices", label: "Invoices", icon: "🧾" },
  { path: "/reports", label: "Reports", icon: "📊" },
  { path: "/activity", label: "Activity", icon: "🕐" },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(61,72,82,0.3)",
            zIndex: 99,
            backdropFilter: "blur(2px)",
          }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar${isOpen ? " open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          Vendor<span>Bridge</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              id={`nav-${item.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? " active" : ""}`
              }
              onClick={onClose}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>

              {/* Notification dot for RFQs (demo) */}
              {item.path === "/rfqs" && (
                <span
                  className="notification-dot"
                  style={{ marginLeft: "auto" }}
                  aria-label="New RFQ notifications"
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "16px",
            borderTop: "1px solid rgba(163,177,198,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "var(--radius-inner)",
              background: "var(--bg)",
              boxShadow: "var(--shadow-inset-sm)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: "700",
                flexShrink: 0,
                boxShadow: "var(--shadow-extruded-sm)",
              }}
            >
              PO
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: "600",
                  color: "var(--fg)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Procurement Officer
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--muted)",
                }}
              >
                officer@vendorbridge.com
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
