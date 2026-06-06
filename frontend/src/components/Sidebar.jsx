import { NavLink, useLocation } from "react-router-dom";
import { getCurrentUser } from "../utils/auth.js";
import NotificationBell from "./NotificationBell.jsx";

const ALL_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: "⊞", roles: ["admin", "procurement_officer", "vendor", "procurement_head", "finance_manager"] },
  { path: "/vendors", label: "Vendors", icon: "🏢", roles: ["admin", "procurement_officer"] },
  { path: "/rfqs", label: "RFQ's", icon: "📋", roles: ["admin", "procurement_officer", "vendor", "procurement_head", "finance_manager"] },
  { path: "/quotations", label: "Quotations", icon: "💬", roles: ["admin", "procurement_officer", "vendor", "procurement_head", "finance_manager"] },
  { path: "/quotations/compare", label: "Quotation Compare", icon: "⚖️", roles: ["admin", "procurement_officer", "procurement_head", "finance_manager"] },
  { path: "/approvals", label: "Approvals", icon: "✅", roles: ["admin", "procurement_officer", "procurement_head", "finance_manager"] },
  { path: "/purchase-orders", label: "Purchase Orders", icon: "📦", roles: ["admin", "procurement_officer", "vendor", "procurement_head", "finance_manager"] },
  { path: "/invoices", label: "Invoices", icon: "🧾", roles: ["admin", "procurement_officer", "vendor", "procurement_head", "finance_manager"] },
  { path: "/reports", label: "Reports", icon: "📊", roles: ["admin", "procurement_officer", "procurement_head", "finance_manager"] },
  { path: "/activity", label: "Activity", icon: "🕐", roles: ["admin", "procurement_officer"] },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const user = getCurrentUser();
  const userRole = user?.role || "vendor"; // fallback

  const navItems = ALL_ITEMS.filter((item) => item.roles.includes(userRole));

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

              {/* Dynamic notification logic removed from here, moving to dedicated bell */}
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
              {user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}
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
                {user?.name || "Unknown User"}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--muted)",
                  textTransform: "capitalize",
                }}
              >
                {user?.role?.replace("_", " ") || "No Role"}
              </div>
            </div>
            
            <div style={{ marginLeft: "auto" }}>
              <NotificationBell />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
