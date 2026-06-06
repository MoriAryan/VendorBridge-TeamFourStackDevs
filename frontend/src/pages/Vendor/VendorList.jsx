import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllVendors,
  createVendor,
  updateVendorStatus,
} from "../../api/vendor.api.js";
import { getCurrentUser } from "../../utils/auth.js";

// ── Constants ──────────────────────────────────────────────────────
const STATUS_FILTERS = ["All", "Active", "Inactive", "Blocked"];

const VENDOR_CATEGORIES = [
  "Furniture",
  "IT Hardware",
  "Software",
  "Logistics",
  "Construction",
  "Stationery",
  "Catering",
  "Maintenance",
  "Electronics",
  "Other",
];

// ── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    Active: {
      background: "rgba(56,178,172,0.12)",
      color: "var(--accent-secondary)",
      boxShadow: "var(--shadow-inset-sm)",
    },
    Inactive: {
      background: "rgba(107,114,128,0.1)",
      color: "var(--muted)",
      boxShadow: "var(--shadow-inset-sm)",
    },
    Blocked: {
      background: "rgba(229,62,62,0.1)",
      color: "var(--accent-danger)",
      boxShadow: "var(--shadow-inset-sm)",
    },
  };

  const icons = { Active: "🟢", Inactive: "⚫", Blocked: "🚫" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 12px",
        borderRadius: "var(--radius-pill)",
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.02em",
        ...(styles[status] || styles.Inactive),
      }}
    >
      {icons[status]} {status}
    </span>
  );
}

// ── KPI Stats Row ─────────────────────────────────────────────────
function StatsRow({ stats }) {
  const kpis = [
    { label: "Total Vendors", value: stats.total || 0, icon: "🏢", color: "var(--fg)" },
    { label: "Active", value: stats.active || 0, icon: "🟢", color: "var(--accent-secondary)" },
    { label: "Inactive", value: stats.inactive || 0, icon: "⚫", color: "var(--muted)" },
    { label: "Blocked", value: stats.blocked || 0, icon: "🚫", color: "var(--accent-danger)" },
  ];

  return (
    <div className="kpi-grid" style={{ marginBottom: "32px" }}>
      {kpis.map(({ label, value, icon, color }) => (
        <div key={label} className="kpi-card">
          <div className="kpi-icon" aria-hidden="true" style={{ fontSize: "1.25rem" }}>
            {icon}
          </div>
          <div className="kpi-value" style={{ color }}>
            {value}
          </div>
          <div className="kpi-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Add Vendor Modal ───────────────────────────────────────────────
function AddVendorModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    companyName: "",
    gstNumber: "",
    phone: "",
    country: "India",
    vendorCategory: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Contact name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      await createVendor(form);
      onSuccess();
    } catch (err) {
      setApiError(err.message || "Failed to add vendor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Vendor"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(61, 72, 82, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "600px",
          padding: "40px",
          position: "relative",
          animation: "slideUp 0.25s ease-out",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          id="vendor-modal-close-btn"
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "none",
            background: "var(--bg)",
            boxShadow: "var(--shadow-extruded-sm)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem",
            color: "var(--muted)",
            transition: "var(--transition)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-extruded)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-extruded-sm)";
            e.currentTarget.style.transform = "none";
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "var(--radius-inner)",
              background: "var(--bg)",
              boxShadow: "var(--shadow-extruded)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              marginBottom: "16px",
            }}
          >
            🏢
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "4px" }}>
            Add New Vendor
          </h2>
          <p style={{ fontSize: "0.875rem" }}>
            Register a supplier in the VendorBridge directory
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="res-grid-2" style={{ gap: "16px" }}>
            {/* Contact Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="v-name">
                Contact Name <span style={{ color: "var(--accent-danger)" }}>*</span>
              </label>
              <input
                ref={firstInputRef}
                id="v-name"
                className="form-input"
                placeholder="Rahul Mehta"
                value={form.name}
                onChange={set("name")}
                aria-required="true"
              />
              {errors.name && (
                <span style={{ color: "var(--accent-danger)", fontSize: "0.75rem" }}>
                  {errors.name}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="v-email">
                Email Address <span style={{ color: "var(--accent-danger)" }}>*</span>
              </label>
              <input
                id="v-email"
                type="email"
                className="form-input"
                placeholder="vendor@company.com"
                value={form.email}
                onChange={set("email")}
                aria-required="true"
              />
              {errors.email && (
                <span style={{ color: "var(--accent-danger)", fontSize: "0.75rem" }}>
                  {errors.email}
                </span>
              )}
            </div>

            {/* Company Name */}
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label" htmlFor="v-company">
                Company Name <span style={{ color: "var(--accent-danger)" }}>*</span>
              </label>
              <input
                id="v-company"
                className="form-input"
                placeholder="Infra Supplies Pvt Ltd"
                value={form.companyName}
                onChange={set("companyName")}
                aria-required="true"
              />
              {errors.companyName && (
                <span style={{ color: "var(--accent-danger)", fontSize: "0.75rem" }}>
                  {errors.companyName}
                </span>
              )}
            </div>

            {/* GST Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="v-gst">
                GST Number
              </label>
              <input
                id="v-gst"
                className="form-input"
                placeholder="27AABC1234Z1Z5"
                value={form.gstNumber}
                onChange={set("gstNumber")}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="v-phone">
                Phone Number
              </label>
              <input
                id="v-phone"
                className="form-input"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label" htmlFor="v-category">
                Category
              </label>
              <select
                id="v-category"
                className="form-select"
                value={form.vendorCategory}
                onChange={set("vendorCategory")}
              >
                <option value="">Select category...</option>
                {VENDOR_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div className="form-group">
              <label className="form-label" htmlFor="v-country">
                Country
              </label>
              <input
                id="v-country"
                className="form-input"
                placeholder="India"
                value={form.country}
                onChange={set("country")}
              />
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <div
              role="alert"
              style={{
                marginTop: "16px",
                padding: "12px 16px",
                borderRadius: "var(--radius-inner)",
                background: "rgba(229,62,62,0.08)",
                color: "var(--accent-danger)",
                fontSize: "0.875rem",
                fontWeight: 500,
                boxShadow: "var(--shadow-inset-sm)",
              }}
            >
              {apiError}
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "28px",
              paddingTop: "24px",
              borderTop: "none",
            }}
          >
            <button
              type="submit"
              className="btn btn-primary"
              id="add-vendor-submit-btn"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? "Registering..." : "✓ Register Vendor"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Status Change Modal ────────────────────────────────────────────
function StatusModal({ vendor, onClose, onSuccess }) {
  const [status, setStatus] = useState(vendor.vendorStatus || "Active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      await updateVendorStatus(vendor._id, status);
      onSuccess(status);
    } catch (err) {
      setError(err.message || "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "Active", icon: "🟢", desc: "Vendor can receive RFQs and submit quotations" },
    { value: "Inactive", icon: "⚫", desc: "Vendor is temporarily deactivated from the system" },
    { value: "Blocked", icon: "🚫", desc: "Vendor is blocked — cannot access any procurement data" },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(61, 72, 82, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: "420px", padding: "32px" }}
      >
        <h2 style={{ fontSize: "1.1rem", marginBottom: "6px" }}>Update Vendor Status</h2>
        <p style={{ fontSize: "0.875rem", marginBottom: "24px" }}>
          {vendor.companyName || vendor.name}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "var(--radius-inner)",
                border: "none",
                background: "var(--bg)",
                boxShadow:
                  status === opt.value
                    ? "var(--shadow-inset)"
                    : "var(--shadow-extruded-sm)",
                cursor: "pointer",
                transition: "var(--transition)",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "1.1rem", marginTop: "1px" }}>{opt.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--fg)" }}>
                  {opt.value}
                  {status === opt.value && (
                    <span style={{ marginLeft: "8px", color: "var(--accent)", fontSize: "0.75rem" }}>
                      ✓ Selected
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>
                  {opt.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-inner)",
              background: "rgba(229,62,62,0.08)",
              color: "var(--accent-danger)",
              fontSize: "0.8125rem",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
            id="vendor-status-save-btn"
            style={{ flex: 1 }}
          >
            {loading ? "Saving..." : "Save Status"}
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Table Row ───────────────────────────────────────────────
function VendorRow({ vendor, onView, onStatusChange }) {
  const [hovering, setHovering] = useState(false);

  return (
    <tr
      style={{ cursor: "pointer", transition: "background 0.2s" }}
      onClick={() => onView(vendor._id)}
      onMouseEnter={(e) => {
        setHovering(true);
        e.currentTarget.style.background = "rgba(108, 99, 255, 0.04)";
      }}
      onMouseLeave={(e) => {
        setHovering(false);
        e.currentTarget.style.background = "";
      }}
    >
      {/* Company / Contact */}
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "var(--radius-inner)",
              background: "var(--bg)",
              boxShadow: "var(--shadow-extruded-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              flexShrink: 0,
              transition: "var(--transition)",
              ...(hovering ? { boxShadow: "var(--shadow-extruded)" } : {}),
            }}
          >
            🏢
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--fg)", fontSize: "0.875rem" }}>
              {vendor.companyName || vendor.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
              {vendor.name} · {vendor.email}
            </div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td>
        <span
          style={{
            fontSize: "0.8125rem",
            color: "var(--fg)",
            background: "var(--bg)",
            boxShadow: "var(--shadow-inset-sm)",
            padding: "3px 10px",
            borderRadius: "var(--radius-pill)",
            display: "inline-block",
          }}
        >
          {vendor.vendorCategory || "—"}
        </span>
      </td>

      {/* GST */}
      <td>
        <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", color: "var(--muted)" }}>
          {vendor.gstNumber || "—"}
        </span>
      </td>

      {/* Phone */}
      <td style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
        {vendor.phone || "—"}
      </td>

      {/* Status */}
      <td>
        <StatusBadge status={vendor.vendorStatus} />
      </td>

      {/* Actions */}
      <td>
        <div
          style={{ display: "flex", gap: "8px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-secondary"
            style={{ padding: "6px 14px", fontSize: "0.8125rem", minHeight: "34px" }}
            onClick={() => onView(vendor._id)}
            id={`vendor-view-btn-${vendor._id}`}
            aria-label={`View ${vendor.companyName}`}
          >
            View
          </button>
          {onStatusChange && (
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8125rem", minHeight: "34px" }}
              onClick={() => onStatusChange(vendor)}
              id={`vendor-status-btn-${vendor._id}`}
              aria-label={`Change status of ${vendor.companyName}`}
            >
              ⚙
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Main VendorList Component ──────────────────────────────────────
export default function VendorList() {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, blocked: 0 });
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // vendor object

  const currentUser = getCurrentUser();
  const canManage = currentUser && ["admin", "procurement_officer"].includes(currentUser.role);

  const fetchData = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await getAllVendors({
        status: activeFilter === "All" ? undefined : activeFilter,
        search: search || undefined,
      });
      setVendors(res.data?.vendors || []);
      setStats(res.data?.stats || { total: 0, active: 0, inactive: 0, blocked: 0 });
    } catch (err) {
      const msg = err.message || "";
      if (
        msg.includes("401") ||
        msg.toLowerCase().includes("unauthorized") ||
        msg.toLowerCase().includes("token")
      ) {
        navigate("/login");
      } else {
        setFetchError(msg || "Failed to load vendors. Please refresh.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [activeFilter, search]);

  const handleVendorAdded = () => {
    setShowAddModal(false);
    fetchData();
  };

  const handleStatusUpdated = (newStatus) => {
    setStatusModal(null);
    // Optimistic update in the list
    setVendors((prev) =>
      prev.map((v) =>
        v._id === statusModal._id ? { ...v, vendorStatus: newStatus } : v
      )
    );
    // Recalculate stats optimistically
    fetchData();
  };

  return (
    <div>
      {/* Page Header */}
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1>Vendors</h1>
          <p>Manage supplier profiles, registrations, and procurement relationships</p>
        </div>
        {canManage && (
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            id="add-vendor-btn"
          >
            + Add Vendor
          </button>
        )}
      </div>

      {/* KPI Stats */}
      <StatsRow stats={stats} />

      {/* Error Banner */}
      {fetchError && (
        <div
          role="alert"
          style={{
            marginBottom: "24px",
            padding: "12px 16px",
            borderRadius: "var(--radius-inner)",
            background: "rgba(229,62,62,0.08)",
            color: "var(--accent-danger)",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {fetchError}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: "40px" }}
            placeholder="Search by name, company, GST number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="vendor-search-input"
            aria-label="Search vendors"
          />
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Filter vendors by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              id={`vendor-filter-${f.toLowerCase()}`}
              className={`filter-tab ${activeFilter === f ? "active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
              {f === "All" && stats.total > 0 && (
                <span className="tab-count">{stats.total}</span>
              )}
              {f === "Active" && stats.active > 0 && (
                <span className="tab-count">{stats.active}</span>
              )}
              {f === "Inactive" && stats.inactive > 0 && (
                <span className="tab-count">{stats.inactive}</span>
              )}
              {f === "Blocked" && stats.blocked > 0 && (
                <span className="tab-count">{stats.blocked}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {loading ? (
          <div
            style={{
              padding: "80px",
              textAlign: "center",
              color: "var(--muted)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "var(--bg)",
                boxShadow: "var(--shadow-extruded)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                animation: "spin 1s linear infinite",
              }}
            >
              ⟳
            </div>
            <p>Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div
            style={{
              padding: "80px 40px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "var(--bg)",
                boxShadow: "var(--shadow-extruded)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
              }}
            >
              🏢
            </div>
            <div>
              <h3 style={{ marginBottom: "8px" }}>
                {search || activeFilter !== "All"
                  ? "No vendors match your filters"
                  : "No vendors yet"}
              </h3>
              <p style={{ maxWidth: "360px", margin: "0 auto" }}>
                {search || activeFilter !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Add your first vendor to start building your supplier network."}
              </p>
            </div>
            {!search && activeFilter === "All" && canManage && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
                id="empty-add-vendor-btn"
              >
                + Add First Vendor
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: "220px" }}>Vendor</th>
                  <th>Category</th>
                  <th>GST Number</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <VendorRow
                    key={vendor._id}
                    vendor={vendor}
                    onView={(id) => navigate(`/vendors/${id}`)}
                    onStatusChange={canManage ? (v) => setStatusModal(v) : null}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result Count */}
      {!loading && vendors.length > 0 && (
        <p
          style={{
            marginTop: "16px",
            fontSize: "0.8125rem",
            color: "var(--muted)",
            textAlign: "right",
          }}
        >
          Showing {vendors.length} of {stats.total} vendors
        </p>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddVendorModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleVendorAdded}
        />
      )}
      {statusModal && (
        <StatusModal
          vendor={statusModal}
          onClose={() => setStatusModal(null)}
          onSuccess={handleStatusUpdated}
        />
      )}

      {/* Keyframe for loading spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
