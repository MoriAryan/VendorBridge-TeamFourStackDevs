import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVendorById, updateVendor, updateVendorStatus } from "../../api/vendor.api.js";

const VENDOR_CATEGORIES = [
  "Furniture","IT Hardware","Software","Logistics","Construction",
  "Stationery","Catering","Maintenance","Electronics","Other",
];

function StatusBadge({ status }) {
  const styles = {
    Active: { background: "rgba(56,178,172,0.12)", color: "var(--accent-secondary)" },
    Inactive: { background: "rgba(107,114,128,0.1)", color: "var(--muted)" },
    Blocked: { background: "rgba(229,62,62,0.1)", color: "var(--accent-danger)" },
  };
  const icons = { Active: "🟢", Inactive: "⚫", Blocked: "🚫" };
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "6px 16px", borderRadius: "var(--radius-pill)",
        fontSize: "0.875rem", fontWeight: 600,
        boxShadow: "var(--shadow-inset-sm)",
        ...(styles[status] || styles.Inactive),
      }}
    >
      {icons[status]} {status}
    </span>
  );
}

function InfoField({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "var(--radius-inner)",
          background: "var(--bg)",
          boxShadow: "var(--shadow-inset-sm)",
          fontSize: "0.875rem",
          fontFamily: mono ? "monospace" : "inherit",
          color: value ? "var(--fg)" : "var(--muted)",
          minHeight: "44px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Status change
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getVendorById(id);
        setVendor(res.data);
        setEditForm({
          name: res.data.name || "",
          companyName: res.data.companyName || "",
          gstNumber: res.data.gstNumber || "",
          phone: res.data.phone || "",
          country: res.data.country || "India",
          vendorCategory: res.data.vendorCategory || "",
        });
      } catch (err) {
        const msg = err.message || "";
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          navigate("/login");
        } else {
          setError(msg || "Vendor not found.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateVendor(id, editForm);
      setVendor((prev) => ({ ...prev, ...editForm }));
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || "Failed to save changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusLoading(true);
    setStatusError("");
    try {
      await updateVendorStatus(id, newStatus);
      setVendor((prev) => ({ ...prev, vendorStatus: newStatus }));
    } catch (err) {
      setStatusError(err.message || "Failed to update status.");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⟳</div>
        <p>Loading vendor profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 0" }}>
        <div className="card" style={{ padding: "48px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}></div>
          <h2 style={{ marginBottom: "8px" }}>Vendor Not Found</h2>
          <p style={{ marginBottom: "24px" }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/vendors")} id="vendor-back-btn">
            ← Back to Vendors
          </button>
        </div>
      </div>
    );
  }

  const statusOptions = ["Active", "Inactive", "Blocked"];

  return (
    <div>
      {/* Back Navigation */}
      <button
        className="btn btn-secondary"
        onClick={() => navigate("/vendors")}
        id="vendor-detail-back-btn"
        style={{ marginBottom: "24px", padding: "8px 16px", fontSize: "0.875rem" }}
      >
        ← Back to Vendors
      </button>

      {/* Page Header */}
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Avatar */}
          <div
            style={{
              width: "72px", height: "72px", borderRadius: "var(--radius-card)",
              background: "var(--bg)", boxShadow: "var(--shadow-extruded)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem",
            }}
          >
            🏢
          </div>
          <div>
            <h1 style={{ fontSize: "1.75rem", marginBottom: "6px" }}>
              {vendor.companyName || vendor.name}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <StatusBadge status={vendor.vendorStatus} />
              {vendor.vendorCategory && (
                <span style={{ fontSize: "0.8125rem", color: "var(--muted)", background: "var(--bg)", boxShadow: "var(--shadow-inset-sm)", padding: "3px 12px", borderRadius: "var(--radius-pill)" }}>
                  {vendor.vendorCategory}
                </span>
              )}
              {vendor.assignedRFQCount > 0 && (
                <span style={{ fontSize: "0.8125rem", color: "var(--accent)", fontWeight: 600 }}>
                  📋 {vendor.assignedRFQCount} RFQ{vendor.assignedRFQCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {!editing ? (
            <button className="btn btn-primary" onClick={() => setEditing(true)} id="vendor-edit-btn">
              ✏ Edit Profile
            </button>
          ) : (
            <>
              <button className="btn btn-primary" onClick={handleSave} disabled={saveLoading} id="vendor-save-btn">
                {saveLoading ? "Saving..." : "✓ Save Changes"}
              </button>
              <button className="btn btn-secondary" onClick={() => { setEditing(false); setSaveError(""); }} disabled={saveLoading}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success / Error Banners */}
      {saveSuccess && (
        <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "var(--radius-inner)", background: "rgba(56,161,105,0.1)", color: "var(--accent-success)", fontSize: "0.875rem", fontWeight: 500 }}>
          ✓ Vendor profile saved successfully
        </div>
      )}
      {saveError && (
        <div role="alert" style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "var(--radius-inner)", background: "rgba(229,62,62,0.08)", color: "var(--accent-danger)", fontSize: "0.875rem", fontWeight: 500 }}>
          {saveError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
        {/* Left — Profile Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card" style={{ padding: "28px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              📋 Vendor Information
            </h3>

            {!editing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <InfoField label="Contact Name" value={vendor.name} />
                <InfoField label="Email Address" value={vendor.email} />
                <InfoField label="Company Name" value={vendor.companyName} />
                <InfoField label="GST Number" value={vendor.gstNumber} mono />
                <InfoField label="Phone Number" value={vendor.phone} />
                <InfoField label="Country" value={vendor.country} />
                <InfoField label="Category" value={vendor.vendorCategory} />
                <InfoField label="Member Since" value={vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { id: "edit-name", label: "Contact Name", field: "name", placeholder: "Rahul Mehta" },
                  { id: "edit-company", label: "Company Name", field: "companyName", placeholder: "Infra Supplies Pvt Ltd", fullWidth: true },
                  { id: "edit-gst", label: "GST Number", field: "gstNumber", placeholder: "27AABC1234Z1Z5", mono: true },
                  { id: "edit-phone", label: "Phone Number", field: "phone", placeholder: "+91 98765 43210" },
                  { id: "edit-country", label: "Country", field: "country", placeholder: "India" },
                ].map(({ id, label, field, placeholder, fullWidth, mono }) => (
                  <div key={field} className="form-group" style={fullWidth ? { gridColumn: "1 / -1" } : {}}>
                    <label className="form-label" htmlFor={id}>{label}</label>
                    <input
                      id={id}
                      className="form-input"
                      placeholder={placeholder}
                      value={editForm[field]}
                      onChange={(e) => setEditForm((p) => ({ ...p, [field]: e.target.value }))}
                      style={mono ? { fontFamily: "monospace", textTransform: "uppercase" } : {}}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-category">Category</label>
                  <select
                    id="edit-category"
                    className="form-select"
                    value={editForm.vendorCategory}
                    onChange={(e) => setEditForm((p) => ({ ...p, vendorCategory: e.target.value }))}
                  >
                    <option value="">Select category...</option>
                    {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Status & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Status Card */}
          <div className="card" style={{ padding: "24px" }}>
            <h4 style={{ marginBottom: "16px", fontSize: "0.9375rem" }}>⚙ Vendor Status</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {statusOptions.map((opt) => {
                const isActive = vendor.vendorStatus === opt;
                const colors = {
                  Active: "var(--accent-secondary)",
                  Inactive: "var(--muted)",
                  Blocked: "var(--accent-danger)",
                };
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isActive || statusLoading}
                    onClick={() => handleStatusChange(opt)}
                    id={`status-option-${opt.toLowerCase()}`}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-inner)",
                      border: "none",
                      background: "var(--bg)",
                      boxShadow: isActive ? "var(--shadow-inset)" : "var(--shadow-extruded-sm)",
                      cursor: isActive ? "default" : "pointer",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: isActive ? colors[opt] : "var(--muted)",
                      transition: "var(--transition)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      opacity: statusLoading ? 0.6 : 1,
                    }}
                  >
                    <span>{opt}</span>
                    {isActive && <span style={{ color: colors[opt] }}>✓ Current</span>}
                  </button>
                );
              })}
            </div>
            {statusError && (
              <p style={{ fontSize: "0.75rem", color: "var(--accent-danger)", marginTop: "10px" }}>{statusError}</p>
            )}
          </div>

          {/* Stats Card */}
          <div className="card" style={{ padding: "24px" }}>
            <h4 style={{ marginBottom: "16px", fontSize: "0.9375rem" }}>📊 Procurement Stats</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Assigned RFQs", value: vendor.assignedRFQCount || 0, icon: "📋" },
                { label: "Quotations", value: "—", icon: "💬" },
                { label: "Purchase Orders", value: "—", icon: "📦" },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: "var(--radius-inner)",
                    background: "var(--bg)", boxShadow: "var(--shadow-inset-sm)",
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{icon} {label}</span>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "var(--fg)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: "24px" }}>
            <h4 style={{ marginBottom: "16px", fontSize: "0.9375rem" }}>⚡ Quick Actions</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                className="btn btn-secondary"
                style={{ width: "100%", textAlign: "left", padding: "10px 14px" }}
                onClick={() => navigate("/rfqs/create")}
                id="vendor-create-rfq-btn"
              >
                📋 Create RFQ for this Vendor
              </button>
              <button
                className="btn btn-secondary"
                style={{ width: "100%", textAlign: "left", padding: "10px 14px" }}
                onClick={() => navigate("/rfqs")}
                id="vendor-view-rfqs-btn"
              >
                📂 View All RFQs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
