import { useParams, useNavigate } from "react-router-dom";

// ── Demo data ─────────────────────────────────────────────────────
const DEMO_DATA = {
  r1: {
    _id: "r1",
    rfqNumber: "RFQ-2025-0001",
    title: "Office Furniture Procurement Q2",
    category: "Furniture",
    deadline: "2025-06-15",
    description: "Ergonomic chairs and standing desks for 3rd floor office renovation.",
    status: "Open",
    lineItems: [
      { _id: "i1", item: "Ergonomic Chair", qty: 25, unit: "NOS" },
      { _id: "i2", item: "Standing Desk", qty: 10, unit: "NOS" },
    ],
    vendorDetails: [
      { _id: "v1", name: "Infra Supplies Pvt Ltd", companyName: "Infra Supplies Pvt Ltd" },
      { _id: "v2", name: "TechCore LTD", companyName: "TechCore LTD" },
    ],
    createdByUser: { name: "Procurement Officer" },
    createdAt: "2025-05-19T10:30:00Z",
  },
};

function StatusBadge({ status }) {
  const colors = {
    Open: "var(--accent-secondary)",
    Draft: "var(--muted)",
    Closed: "var(--fg)",
    Expired: "var(--accent-danger)",
  };
  return (
    <span
      className="badge"
      style={{ color: colors[status] || "var(--muted)" }}
    >
      {status}
    </span>
  );
}

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // In production, fetch by ID; here use demo fallback
  const rfq = DEMO_DATA[id] || DEMO_DATA["r1"];

  const deadline = new Date(rfq.deadline);

  return (
    <div>
      {/* Page Header */}
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8125rem", minHeight: "32px" }}
              onClick={() => navigate("/rfqs")}
              id="back-to-rfqs-btn"
            >
              ← Back
            </button>
            <h1 style={{ margin: 0 }}>{rfq.rfqNumber}</h1>
            <StatusBadge status={rfq.status} />
          </div>
          <p>{rfq.title}</p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {rfq.status === "Draft" && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/rfqs/${id}/edit`)}
              id="edit-rfq-btn"
            >
              ✏️ Edit RFQ
            </button>
          )}
          {rfq.status === "Open" && (
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/quotations?rfq=${id}`)}
              id="view-quotations-btn"
            >
              💬 View Quotations
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Core Details */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "20px" }}>📋 RFQ Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Category", value: rfq.category || "—" },
                {
                  label: "Deadline",
                  value: deadline.toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                },
                {
                  label: "Created",
                  value: new Date(rfq.createdAt).toLocaleDateString("en-IN"),
                },
                {
                  label: "Created By",
                  value: rfq.createdByUser?.name || "—",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px solid rgba(163,177,198,0.15)",
                    paddingBottom: "10px",
                  }}
                >
                  <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{label}</span>
                  <span style={{ fontWeight: "600", fontSize: "0.875rem" }}>{value}</span>
                </div>
              ))}

              {rfq.description && (
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8125rem", display: "block", marginBottom: "6px" }}>
                    Description
                  </span>
                  <p style={{ fontSize: "0.875rem", color: "var(--fg)", lineHeight: "1.6" }}>
                    {rfq.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Vendors */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px" }}>
              🏢 Assigned Vendors ({rfq.vendorDetails?.length || 0})
            </h3>
            {rfq.vendorDetails?.length === 0 ? (
              <p className="text-muted text-sm">No vendors assigned</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {rfq.vendorDetails?.map((vendor) => (
                  <div key={vendor._id} className="vendor-tag">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                          boxShadow: "var(--shadow-extruded-sm)",
                          flexShrink: 0,
                        }}
                      >
                        {(vendor.name || vendor.companyName || "?")[0].toUpperCase()}
                      </div>
                      <span className="vendor-tag-name">
                        {vendor.companyName || vendor.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--accent-secondary)",
                        fontWeight: "600",
                      }}
                    >
                      Notified ✓
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Line Items */}
        <div>
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px" }}>
              📦 Line Items ({rfq.lineItems?.length || 0})
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.lineItems?.map((item, i) => (
                    <tr key={item._id || i}>
                      <td style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>
                        {i + 1}
                      </td>
                      <td style={{ fontWeight: "600" }}>{item.item}</td>
                      <td>{item.qty}</td>
                      <td style={{ color: "var(--muted)" }}>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Timeline (visual) */}
          <div className="card" style={{ padding: "24px", marginTop: "20px" }}>
            <h3 style={{ marginBottom: "16px" }}>📈 Procurement Status</h3>
            {[
              { label: "RFQ Created", done: true, icon: "📋" },
              { label: "Vendors Assigned", done: rfq.vendorDetails?.length > 0, icon: "🏢" },
              { label: "Quotations Received", done: false, icon: "💬" },
              { label: "Vendor Selected", done: false, icon: "✅" },
              { label: "Approval Pending", done: false, icon: "⏳" },
              { label: "PO Generated", done: false, icon: "📦" },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 0",
                  borderBottom:
                    i < 5 ? "1px solid rgba(163,177,198,0.12)" : "none",
                  opacity: step.done ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--bg)",
                    boxShadow: step.done
                      ? "var(--shadow-extruded-sm)"
                      : "var(--shadow-inset-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.875rem",
                    flexShrink: 0,
                  }}
                >
                  {step.icon}
                </div>
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: step.done ? "600" : "400",
                    color: step.done ? "var(--fg)" : "var(--muted)",
                  }}
                >
                  {step.label}
                </span>
                {step.done && (
                  <span
                    style={{
                      marginLeft: "auto",
                      color: "var(--accent-secondary)",
                      fontSize: "0.875rem",
                      fontWeight: "700",
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
