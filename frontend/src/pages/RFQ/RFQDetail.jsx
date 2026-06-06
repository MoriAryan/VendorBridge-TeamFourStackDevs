import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRFQById } from "../../api/rfq.api.js";
import { getQuotationCount } from "../../api/quotation.api.js";
import { getCurrentUser } from "../../utils/auth.js";

// ── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Open:    { bg: "rgba(56,178,172,0.12)",  color: "var(--accent-secondary)" },
    Draft:   { bg: "rgba(107,114,128,0.10)", color: "var(--muted)" },
    Closed:  { bg: "rgba(61,72,82,0.10)",    color: "var(--fg)" },
    Expired: { bg: "rgba(229,62,62,0.10)",   color: "var(--accent-danger)" },
  };
  const s = map[status] || map.Draft;
  return (
    <span style={{
      padding: "4px 14px", borderRadius: "var(--radius-pill)",
      fontSize: "0.8125rem", fontWeight: 600,
      background: s.bg, color: s.color,
      boxShadow: "var(--shadow-inset-sm)",
    }}>
      {status}
    </span>
  );
}

// ── Info Row ───────────────────────────────────────────────────────
function InfoRow({ label, value, accent }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      borderBottom: "1px solid rgba(163,177,198,0.12)", paddingBottom: "10px",
    }}>
      <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: "0.875rem", color: accent || "var(--fg)" }}>
        {value}
      </span>
    </div>
  );
}

// ── Procurement Timeline ───────────────────────────────────────────
function ProcurementTimeline({ rfq, quotationCount, isVendor }) {
  const vendorCount = rfq.vendorDetails?.length || 0;
  const steps = isVendor 
    ? [
        { label: "RFQ Published",      done: rfq.status !== "Draft", icon: "📋" },
        { label: "Quotation Window",   done: rfq.status === "Open",  icon: "⏳" },
        { label: "Result Declared",    done: rfq.status === "Closed",icon: "🏆" },
      ]
    : [
        { label: "RFQ Created",        done: true,                  icon: "📋" },
        { label: "Vendors Assigned",   done: vendorCount > 0,       icon: "🏢" },
        { label: `Quotations Received (${quotationCount})`, done: quotationCount > 0, icon: "💬" },
        { label: "Vendor Selected",    done: rfq.status === "Closed", icon: "✅" },
        { label: "Approval Pending",   done: false,                 icon: "⏳" },
        { label: "PO Generated",       done: false,                 icon: "📦" },
      ];

  return (
    <div className="card" style={{ padding: "24px" }}>
      <h3 style={{ marginBottom: "20px", fontSize: "1rem" }}>📈 Procurement Status</h3>
      {steps.map((step, i) => (
        <div
          key={i}
          style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "10px 0",
            borderBottom: i < steps.length - 1 ? "1px solid rgba(163,177,198,0.1)" : "none",
          }}
        >
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "var(--bg)", flexShrink: 0,
            boxShadow: step.done ? "var(--shadow-extruded-sm)" : "var(--shadow-inset-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.9rem", opacity: step.done ? 1 : 0.4,
            transition: "var(--transition)",
          }}>
            {step.icon}
          </div>
          <span style={{
            fontSize: "0.875rem", fontWeight: step.done ? 600 : 400,
            color: step.done ? "var(--fg)" : "var(--muted)",
            flex: 1,
          }}>
            {step.label}
          </span>
          {step.done && (
            <span style={{ color: "var(--accent-secondary)", fontSize: "0.875rem", fontWeight: 700 }}>
              ✓
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [quotationCount, setQuotationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = getCurrentUser();
  const canManage = currentUser && ["admin", "procurement_officer"].includes(currentUser.role);
  const isVendor = currentUser?.role === "vendor";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [rfqRes, countRes] = await Promise.all([
          getRFQById(id),
          getQuotationCount(id),
        ]);
        setRfq(rfqRes.data);
        setQuotationCount(countRes.data?.count || 0);
      } catch (err) {
        const msg = err.message || "";
        if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
          navigate("/login");
        } else {
          setError(msg || "RFQ not found");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px", color: "var(--muted)" }}>⟳</div>
        <p>Loading RFQ details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "60px 0" }}>
        <div className="card" style={{ padding: "48px", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}></div>
          <h2 style={{ marginBottom: "8px" }}>RFQ Not Found</h2>
          <p style={{ marginBottom: "24px" }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/rfqs")} id="back-to-rfqs-error-btn">
            ← Back to RFQs
          </button>
        </div>
      </div>
    );
  }

  const deadline = rfq.deadline ? new Date(rfq.deadline) : null;
  const isOverdue = deadline && rfq.status === "Open" && deadline < new Date();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8125rem", minHeight: "32px" }}
              onClick={() => navigate("/rfqs")}
              id="back-to-rfqs-btn"
            >
              ← Back
            </button>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>{rfq.rfqNumber}</h1>
            <StatusBadge status={rfq.status} />
          </div>
          <p style={{ margin: 0 }}>{rfq.title}</p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {rfq.status === "Draft" && canManage && (
            <button className="btn btn-secondary" onClick={() => navigate(`/rfqs/${id}/edit`)} id="edit-rfq-btn">
              ✏️ Edit RFQ
            </button>
          )}
          {(rfq.status === "Open" || rfq.status === "Closed") && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/quotations?rfqId=${id}`)}
                id="view-quotations-btn"
              >
                💬 Quotations
                {quotationCount > 0 && (
                  <span style={{
                    marginLeft: "6px", background: "var(--accent)",
                    color: "#fff", borderRadius: "var(--radius-pill)",
                    fontSize: "0.7rem", padding: "2px 8px", fontWeight: 700,
                  }}>
                    {quotationCount}
                  </span>
                )}
              </button>
              {quotationCount > 1 && rfq.status === "Open" && canManage && (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/quotations/compare?rfqId=${id}`)}
                  id="compare-quotations-btn"
                >
                  ⚖️ Compare & Select
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <div style={{
          padding: "12px 16px", borderRadius: "var(--radius-inner)",
          background: "rgba(229,62,62,0.08)", color: "var(--accent-danger)",
          fontSize: "0.875rem", fontWeight: 500, marginBottom: "20px",
        }}>
          This RFQ's deadline has passed. Consider closing it.
        </div>
      )}

      <div className="res-grid-2" style={{ gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Core Details */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "1rem" }}>📋 RFQ Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <InfoRow label="Category" value={rfq.category || "—"} />
              <InfoRow
                label="Deadline"
                value={deadline
                  ? deadline.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                  : "—"
                }
                accent={isOverdue ? "var(--accent-danger)" : undefined}
              />
              <InfoRow
                label="Created"
                value={rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString("en-IN") : "—"}
              />
              <InfoRow label="Created By" value={rfq.createdByUser?.name || "—"} />

              {rfq.description && (
                <div style={{ paddingTop: "4px" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.75rem", display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Description
                  </span>
                  <p style={{ fontSize: "0.875rem", color: "var(--fg)", lineHeight: "1.7", margin: 0 }}>
                    {rfq.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Vendors - Hidden for vendors for privacy */}
          {!isVendor && (
            <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "1rem" }}>
              🏢 Assigned Vendors ({rfq.vendorDetails?.length || 0})
            </h3>
            {(!rfq.vendorDetails || rfq.vendorDetails.length === 0) ? (
              <p className="text-muted text-sm">No vendors assigned to this RFQ</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {rfq.vendorDetails.map((vendor) => (
                  <div
                    key={vendor._id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: "var(--radius-inner)",
                      background: "var(--bg)", boxShadow: "var(--shadow-inset-sm)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "var(--accent)", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
                        boxShadow: "var(--shadow-extruded-sm)",
                      }}>
                        {(vendor.companyName || vendor.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--fg)" }}>
                          {vendor.companyName || vendor.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                          {vendor.email}
                        </div>
                      </div>
                    </div>
                    {rfq.status === "Open" && (
                      <span style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", fontWeight: 600 }}>
                        Notified ✓
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Line Items */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "1rem" }}>
              📦 Line Items ({rfq.lineItems?.length || 0})
            </h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>#</th>
                    <th>Item</th>
                    <th style={{ textAlign: "right" }}>Qty</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {rfq.lineItems?.map((item, i) => (
                    <tr key={item._id || i}>
                      <td style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{item.item || item.itemName}</td>
                      <td style={{ textAlign: "right" }}>{item.qty || item.quantity}</td>
                      <td style={{ color: "var(--muted)" }}>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Procurement Timeline */}
          <ProcurementTimeline rfq={rfq} quotationCount={quotationCount} />
        </div>
      </div>
    </div>
  );
}
