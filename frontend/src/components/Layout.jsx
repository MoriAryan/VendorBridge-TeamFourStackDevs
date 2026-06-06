import { NavLink, Outlet } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/vendors", label: "Vendors" },
  { to: "/rfqs", label: "RFQs" },
  { to: "/quotations", label: "Quotations" },
  { to: "/invoices", label: "Invoices" },
  { to: "/reports", label: "Reports" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/login", label: "Login" },
  { to: "/register", label: "Register" },
];

function Layout() {
  return (
    <div className="app-shell">
      <aside className="side-menu" aria-hidden={false}>
        <button className="hamburger" aria-label="Open menu">
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <nav className="side-panel" aria-label="Sidebar navigation">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " nav-link-active" : "")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* header removed — primary navigation is provided by the side hamburger menu */}

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>VendorBridge • Procurement & Vendor Management ERP</p>
      </footer>
    </div>
  );
}

export default Layout;
