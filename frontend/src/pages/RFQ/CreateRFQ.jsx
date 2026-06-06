import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createRFQ } from "../../api/rfq.api.js";

// ── Sample vendors (would come from API in production) ──────────────
const SAMPLE_VENDORS = [
  { _id: "v1", name: "Infra Supplies Pvt Ltd", category: "Construction" },
  { _id: "v2", name: "TechCore LTD", category: "IT" },
  { _id: "v3", name: "FastLog Transport", category: "Logistics" },
  { _id: "v4", name: "Office Need Co.", category: "Furniture" },
  { _id: "v5", name: "DigitalPro Systems", category: "IT" },
];

const CATEGORIES = [
  "Furniture",
  "IT Hardware",
  "Software",
  "Logistics",
  "Construction",
  "Stationery",
  "Catering",
  "Maintenance",
  "Other",
];

const STEPS = [
  { number: 1, label: "RFQ Details" },
  { number: 2, label: "Review" },
  { number: 3, label: "Confirm" },
];

// ── Stepper Component ───────────────────────────────────────────────
function Stepper({ current }) {
  return (
    <div className="stepper" style={{ position: "relative", marginBottom: "48px" }}>
      {STEPS.map((step, idx) => {
        const isCompleted = current > step.number;
        const isActive = current === step.number;

        return (
          <div key={step.number} className="stepper-step">
            {/* Step circle */}
            <div style={{ position: "relative" }}>
              <div
                className={`stepper-circle ${
                  isCompleted ? "completed" : isActive ? "active" : "pending"
                }`}
              >
                {isCompleted ? "✓" : step.number}
              </div>
              <span
                className={`stepper-label ${isActive ? "active-label" : ""}`}
                style={{ left: "50%" }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {idx < STEPS.length - 1 && (
              <div className={`stepper-line ${isCompleted ? "filled" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Line Items Table ────────────────────────────────────────────────
function LineItemsTable({ lineItems, onChange }) {
  const addRow = () => {
    onChange([...lineItems, { id: Date.now(), item: "", qty: "", unit: "NOS" }]);
  };

  const removeRow = (id) => {
    if (lineItems.length === 1) return; // Keep at least one row
    onChange(lineItems.filter((r) => r.id !== id));
  };

  const updateRow = (id, field, value) => {
    onChange(lineItems.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  return (
    <div>
      <div className="table-wrapper" style={{ borderRadius: "var(--radius-inner)" }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Item</th>
              <th style={{ width: "15%" }}>Qty</th>
              <th style={{ width: "20%" }}>Unit</th>
              <th style={{ width: "10%", textAlign: "center" }}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: "8px 12px", minHeight: "36px" }}
                    value={row.item}
                    onChange={(e) => updateRow(row.id, "item", e.target.value)}
                    placeholder="e.g. Ergonomic Chair"
                    id={`line-item-name-${row.id}`}
                    aria-label="Item name"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: "8px 12px", minHeight: "36px" }}
                    value={row.qty}
                    onChange={(e) => updateRow(row.id, "qty", e.target.value)}
                    placeholder="0"
                    min="1"
                    id={`line-item-qty-${row.id}`}
                    aria-label="Quantity"
                  />
                </td>
                <td>
                  <select
                    className="form-select"
                    style={{ padding: "8px 12px", minHeight: "36px" }}
                    value={row.unit}
                    onChange={(e) => updateRow(row.id, "unit", e.target.value)}
                    id={`line-item-unit-${row.id}`}
                    aria-label="Unit"
                  >
                    {["NOS", "KG", "Litre", "Box", "Set", "Meter", "Piece"].map(
                      (u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      )
                    )}
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    className="vendor-tag-remove"
                    onClick={() => removeRow(row.id)}
                    disabled={lineItems.length === 1}
                    aria-label={`Remove ${row.item || "item"}`}
                    style={{ margin: "0 auto" }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" className="add-row-btn" onClick={addRow} id="add-line-item-btn">
        <span>+</span> add line item
      </button>
    </div>
  );
}

// ── Vendor Selector Modal ───────────────────────────────────────────
function VendorModal({ assigned, onClose, onAdd }) {
  const [search, setSearch] = useState("");
  const filtered = SAMPLE_VENDORS.filter(
    (v) =>
      !assigned.find((a) => a._id === v._id) &&
      v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="vendor-modal-title">
      <div className="modal">
        <div className="flex items-center justify-between mb-4">
          <h3 id="vendor-modal-title" style={{ fontSize: "1.125rem" }}>
            Add Vendor
          </h3>
          <button
            className="btn-icon btn"
            onClick={onClose}
            aria-label="Close vendor modal"
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          className="form-input mb-4"
          placeholder="Search vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="vendor-search-input"
          autoFocus
        />

        {filtered.length === 0 ? (
          <p className="text-muted text-sm" style={{ textAlign: "center", padding: "24px" }}>
            {search ? "No vendors found matching your search." : "All vendors are already assigned."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map((vendor) => (
              <button
                key={vendor._id}
                type="button"
                onClick={() => onAdd(vendor)}
                id={`vendor-option-${vendor._id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-inner)",
                  background: "var(--bg)",
                  boxShadow: "var(--shadow-extruded-sm)",
                  border: "none",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  width: "100%",
                  textAlign: "left",
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
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "var(--fg)",
                    }}
                  >
                    {vendor.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {vendor.category}
                  </div>
                </div>
                <span style={{ color: "var(--accent)", fontSize: "1.25rem" }}>+</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 1 Form ─────────────────────────────────────────────────────
function Step1({ form, onChange, errors }) {
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleAddVendor = (vendor) => {
    onChange("assignedVendors", [...form.assignedVendors, vendor]);
    setVendorModalOpen(false);
  };

  const handleRemoveVendor = (id) => {
    onChange(
      "assignedVendors",
      form.assignedVendors.filter((v) => v._id !== id)
    );
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const fileData = files.map((f) => ({
      filename: f.name,
      size: f.size,
      type: f.type,
    }));
    onChange("attachments", [...form.attachments, ...fileData]);
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const fileData = files.map((f) => ({
      filename: f.name,
      size: f.size,
      type: f.type,
    }));
    onChange("attachments", [...form.attachments, ...fileData]);
  };

  return (
    <>
      {vendorModalOpen && (
        <VendorModal
          assigned={form.assignedVendors}
          onClose={() => setVendorModalOpen(false)}
          onAdd={handleAddVendor}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        {/* LEFT COLUMN — Core Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* RFQ Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="rfq-title">
              RFQ Title <span className="required">*</span>
            </label>
            <input
              id="rfq-title"
              type="text"
              className="form-input"
              placeholder="e.g. Office Furniture Procurement Q2"
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              aria-required="true"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "rfq-title-error" : undefined}
            />
            {errors.title && (
              <span
                id="rfq-title-error"
                role="alert"
                style={{ color: "var(--accent-danger)", fontSize: "0.75rem" }}
              >
                {errors.title}
              </span>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label" htmlFor="rfq-category">
              Category
            </label>
            <select
              id="rfq-category"
              className="form-select"
              value={form.category}
              onChange={(e) => onChange("category", e.target.value)}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label className="form-label" htmlFor="rfq-deadline">
              Deadline <span className="required">*</span>
            </label>
            <input
              id="rfq-deadline"
              type="date"
              className="form-input"
              value={form.deadline}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              onChange={(e) => onChange("deadline", e.target.value)}
              aria-required="true"
              aria-invalid={!!errors.deadline}
            />
            {errors.deadline && (
              <span
                role="alert"
                style={{ color: "var(--accent-danger)", fontSize: "0.75rem" }}
              >
                {errors.deadline}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="rfq-description">
              Description
            </label>
            <textarea
              id="rfq-description"
              className="form-textarea"
              placeholder="Describe what you need, specifications, and any special requirements..."
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* RIGHT COLUMN — Items, Vendors, Attachments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Line Items */}
          <div>
            <div className="section-header">
              <span className="section-title">Line Items</span>
            </div>
            <div className="card" style={{ padding: "16px", borderRadius: "var(--radius-inner)" }}>
              <LineItemsTable
                lineItems={form.lineItems}
                onChange={(items) => onChange("lineItems", items)}
              />
            </div>
            {errors.lineItems && (
              <span
                role="alert"
                style={{ color: "var(--accent-danger)", fontSize: "0.75rem" }}
              >
                {errors.lineItems}
              </span>
            )}
          </div>

          {/* Assign Vendors */}
          <div>
            <div className="section-header">
              <span className="section-title">Assign Vendors</span>
            </div>
            <div
              className="card"
              style={{
                padding: "16px",
                borderRadius: "var(--radius-inner)",
                minHeight: "80px",
              }}
            >
              {form.assignedVendors.length === 0 ? (
                <p
                  className="text-muted text-sm"
                  style={{ textAlign: "center", padding: "8px 0" }}
                >
                  No vendors assigned yet
                </p>
              ) : (
                form.assignedVendors.map((vendor) => (
                  <div key={vendor._id} className="vendor-tag">
                    <span className="vendor-tag-name">🏢 {vendor.name}</span>
                    <button
                      type="button"
                      className="vendor-tag-remove"
                      onClick={() => handleRemoveVendor(vendor._id)}
                      aria-label={`Remove ${vendor.name}`}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}

              <button
                type="button"
                className="add-row-btn"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setVendorModalOpen(true)}
                id="add-vendor-btn"
              >
                <span>+</span> add vendor
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="section-header">
              <span className="section-title">Attachments</span>
            </div>
            <div
              className="upload-zone"
              onClick={handleDropZoneClick}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              role="button"
              tabIndex={0}
              aria-label="Upload attachments"
              onKeyDown={(e) => e.key === "Enter" && handleDropZoneClick()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={handleFileChange}
                id="file-upload-input"
                aria-label="File upload"
              />
              <div className="upload-zone-icon">📎</div>
              {form.attachments.length === 0 ? (
                <p>
                  <strong>Drag & drop files</strong> or click to upload
                </p>
              ) : (
                <div>
                  {form.attachments.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 0",
                        fontSize: "0.8125rem",
                        color: "var(--fg)",
                      }}
                    >
                      <span>📄</span>
                      <span style={{ flex: 1, textAlign: "left" }}>{f.filename}</span>
                      <span style={{ color: "var(--accent-secondary)", fontWeight: "600" }}>
                        ✓
                      </span>
                    </div>
                  ))}
                  <p style={{ marginTop: "8px", fontSize: "0.75rem" }}>
                    Click to add more files
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Step 2 — Review ─────────────────────────────────────────────────
function Step2({ form }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
      {/* Left — Core details */}
      <div className="card" style={{ padding: "24px" }}>
        <h3 style={{ marginBottom: "20px", fontSize: "1rem" }}>📋 RFQ Details</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { label: "Title", value: form.title },
            { label: "Category", value: form.category || "Not specified" },
            {
              label: "Deadline",
              value: form.deadline
                ? new Date(form.deadline).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
              <span style={{ fontSize: "0.8125rem", color: "var(--muted)", fontWeight: "500", flexShrink: 0 }}>
                {label}
              </span>
              <span style={{ fontSize: "0.875rem", color: "var(--fg)", fontWeight: "600", textAlign: "right" }}>
                {value}
              </span>
            </div>
          ))}
          {form.description && (
            <div>
              <span style={{ fontSize: "0.8125rem", color: "var(--muted)", fontWeight: "500" }}>
                Description
              </span>
              <p style={{ marginTop: "4px", fontSize: "0.875rem", color: "var(--fg)" }}>
                {form.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Items + Vendors */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "1rem" }}>📦 Line Items ({form.lineItems.filter(i => i.item).length})</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {form.lineItems
                  .filter((i) => i.item)
                  .map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: "500" }}>{row.item}</td>
                      <td>{row.qty}</td>
                      <td style={{ color: "var(--muted)" }}>{row.unit}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <h3 style={{ marginBottom: "12px", fontSize: "1rem" }}>
            🏢 Assigned Vendors ({form.assignedVendors.length})
          </h3>
          {form.assignedVendors.length === 0 ? (
            <p className="text-muted text-sm">No vendors assigned</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {form.assignedVendors.map((v) => (
                <div
                  key={v._id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "var(--radius-inner)",
                    background: "var(--bg)",
                    boxShadow: "var(--shadow-inset-sm)",
                    fontSize: "0.875rem",
                    color: "var(--fg)",
                    fontWeight: "500",
                  }}
                >
                  {v.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Success ────────────────────────────────────────────────
function Step3({ submittedRFQ, sendToVendors }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        maxWidth: "480px",
        margin: "0 auto",
      }}
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
          margin: "0 auto 24px",
          fontSize: "2rem",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        {sendToVendors ? "🚀" : "📝"}
      </div>

      <h2 style={{ marginBottom: "8px", color: "var(--fg)" }}>
        {sendToVendors ? "RFQ Sent to Vendors!" : "RFQ Saved as Draft"}
      </h2>
      <p style={{ marginBottom: "8px" }}>
        {sendToVendors
          ? "Your RFQ has been published and vendors have been notified."
          : "Your RFQ has been saved. You can edit and send it later."}
      </p>
      {submittedRFQ?.rfqNumber && (
        <div
          style={{
            display: "inline-block",
            padding: "8px 20px",
            borderRadius: "var(--radius-pill)",
            background: "var(--bg)",
            boxShadow: "var(--shadow-inset-sm)",
            fontFamily: "var(--font-display)",
            fontWeight: "700",
            fontSize: "1rem",
            color: "var(--accent)",
            marginBottom: "32px",
          }}
        >
          {submittedRFQ.rfqNumber}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/rfqs")}
          id="view-all-rfqs-btn"
        >
          View All RFQs
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/rfqs/create")}
          id="create-another-rfq-btn"
        >
          + Create Another
        </button>
      </div>
    </div>
  );
}

// ── Main CreateRFQ Component ─────────────────────────────────────────
const initialLineItem = () => ({
  id: Date.now(),
  item: "",
  qty: "",
  unit: "NOS",
});

export default function CreateRFQ() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedRFQ, setSubmittedRFQ] = useState(null);
  const [sendToVendors, setSendToVendors] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "",
    deadline: "",
    description: "",
    lineItems: [initialLineItem()],
    assignedVendors: [],
    attachments: [],
  });

  const [errors, setErrors] = useState({});

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // ── Validation ──────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "RFQ title is required";
    if (!form.deadline) newErrors.deadline = "Deadline is required";
    const validItems = form.lineItems.filter((i) => i.item.trim() && i.qty);
    if (validItems.length === 0) {
      newErrors.lineItems = "At least one complete line item is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (sendNow) => {
    setSendToVendors(sendNow);
    setLoading(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      category: form.category,
      deadline: form.deadline,
      description: form.description.trim(),
      lineItems: form.lineItems
        .filter((i) => i.item.trim() && i.qty)
        .map(({ item, qty, unit }) => ({ item, qty: Number(qty), unit })),
      assignedVendors: form.assignedVendors.map((v) => v._id),
      sendToVendors: sendNow,
    };

    try {
      const res = await createRFQ(payload);
      setSubmittedRFQ(res.data);
      setStep(3);
    } catch (err) {
      // Demo mode — show success without real backend
      setSubmittedRFQ({
        rfqNumber: `RFQ-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        title: form.title,
        status: sendNow ? "Open" : "Draft",
      });
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !validate()) return;
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>Create RFQ's</h1>
        <p>new request for quotation</p>
      </div>

      {/* Stepper */}
      <Stepper current={step} />

      {/* Card */}
      <div className="card" style={{ padding: "32px" }}>
        {step === 1 && (
          <Step1 form={form} onChange={handleFieldChange} errors={errors} />
        )}
        {step === 2 && <Step2 form={form} />}
        {step === 3 && (
          <Step3 submittedRFQ={submittedRFQ} sendToVendors={sendToVendors} />
        )}

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            style={{
              marginTop: "16px",
              padding: "12px 16px",
              borderRadius: "var(--radius-inner)",
              background: "rgba(229,62,62,0.08)",
              color: "var(--accent-danger)",
              fontSize: "0.875rem",
              fontWeight: "500",
              boxShadow: "var(--shadow-inset-sm)",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 3 && (
          <>
            <div
              className="divider"
              style={{ marginTop: "32px", marginBottom: "24px" }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {/* Left actions (Step 1 only) */}
              {step === 1 && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNext}
                    id="rfq-next-btn"
                    disabled={loading}
                  >
                    Review RFQ →
                  </button>
                </div>
              )}

              {/* Step 2 actions */}
              {step === 2 && (
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                    id="rfq-send-to-vendors-btn"
                  >
                    {loading ? "Sending..." : "🚀 Save & Send to Vendors"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                    id="rfq-save-draft-btn"
                  >
                    {loading ? "Saving..." : "📝 Save as Draft"}
                  </button>
                </div>
              )}

              {/* Right: Back + Cancel */}
              <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
                {step > 1 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleBack}
                    id="rfq-back-btn"
                    disabled={loading}
                  >
                    ← Back
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => navigate("/rfqs")}
                  id="rfq-cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
