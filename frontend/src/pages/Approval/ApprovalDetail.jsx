import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApprovalById, decideApproval } from "../../api/approval.api.js";
import { getCurrentUser } from "../../utils/auth.js";

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "—";

// ── Timeline Step ──────────────────────────────────────────────────
function ChainStep({ step, isActive, isLocked }) {
  const statusColor = {
    Approved: "var(--accent-secondary)",
    Rejected: "var(--accent-danger)",
    Pending: isActive ? "var(--accent)" : "var(--muted)",
  }[step.status] || "var(--muted)";

  const statusIcon = { Approved: "✓", Rejected: "✕", Pending: isActive ? "●" : "○" }[step.status] || "○";

  return (
    <div style={{
      display: "flex", gap: "16px", alignItems: "flex-start",
      padding: "16px 0", borderBottom: "1px solid rgba(163,177,198,0.1)",
      opacity: isLocked ? 0.45 : 1,
    }}>
      {/* Step indicator */}
      <div style={{
        width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
        background: "var(--bg)",
        boxShadow: step.status !== "Pending" ? "var(--shadow-extruded-sm)" : "var(--shadow-inset-sm)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem", fontWeight: 700, color: statusColor,
        border: isActive ? `2px solid ${statusColor}` : "none",
        transition: "var(--transition)",
      }}>
        {statusIcon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
            {step.label}
          </span>
          <span style={{
            padding: "2px 10px", borderRadius: "var(--radius-pill)",
            fontSize: "0.7rem", fontWeight: 700,
            background: step.status === "Approved" ? "rgba(56,178,172,0.12)"
              : step.status === "Rejected" ? "rgba(229,62,62,0.1)"
              : isActive ? "rgba(108,99,255,0.1)"
              : "rgba(107,114,128,0.08)",
            color: statusColor,
          }}>
            {step.status}
          </span>
        </div>

        {step.approverName && (
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: "2px" }}>
            {step.approverName}
          </div>
        )}
        {step.decidedAt && (
          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            {new Date(step.decidedAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </div>
        )}
        {step.remarks && (
          <div style={{
            marginTop: "8px", padding: "8px 12px", borderRadius: "var(--radius-inner)",
            background: "var(--bg)", boxShadow: "var(--shadow-inset-sm)",
            fontSize: "0.8125rem", color: "var(--fg)", fontStyle: "italic",
          }}>
            "{step.remarks}"
          </div>
        )}
      </div>
    </div>
  );
}

// ── Decision Panel ─────────────────────────────────────────────────
function DecisionPanel({ approvalId, level, onSuccess }) {
  const [decision, setDecision] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (d) => {
    setLoading(true);
    setError("");
    try {
      await decideApproval(approvalId, { level, decision: d, remarks });
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to submit decision.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: "24px" }}>
      <h3 style={{ fontSize: "1rem", marginBottom: "16px" }}>
         Your Decision — Level {level}
      </h3>

      <div className="form-group" style={{ marginBottom: "16px" }}>
        <label className="form-label" htmlFor="approval-remarks">
          Remarks / Conditions
        </label>
        <textarea
          id="approval-remarks"
          className="form-input"
          rows={3}
          placeholder="Add your comments, conditions, or reason for rejection..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          style={{ resize: "vertical", minHeight: "80px" }}
        />
      </div>

      {error && (
        <div role="alert" style={{
          padding: "10px 14px", borderRadius: "var(--radius-inner)",
          background: "rgba(229,62,62,0.08)", color: "var(--accent-danger)",
          fontSize: "0.875rem", marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={() => handleSubmit("Approved")}
          disabled={loading}
          id="btn-approve"
        >
          {loading ? "..." : "✓ Approve"}
        </button>
        <button
          onClick={() => handleSubmit("Rejected")}
          disabled={loading}
          id="btn-reject"
          style={{
            flex: 1, padding: "10px 20px", borderRadius: "var(--radius-btn)",
            border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
            fontWeight: 600, fontSize: "0.9375rem",
            background: "var(--bg)", boxShadow: "var(--shadow-extruded-sm)",
            color: "var(--accent-danger)", transition: "var(--transition)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-inset-sm)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-extruded-sm)"; }}
        >
          {loading ? "..." : "✕ Reject"}
        </button>
      </div>
    </div>
  );
}

// ── Main Detail Page ───────────────────────────────────────────────
export default function ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isOfficer = currentUser?.role === "procurement_officer" || currentUser?.role === "admin";
  const canDecide = currentUser?.role === "admin" || currentUser?.role === "approver" || currentUser?.role === "procurement_officer";

  const [approval, setApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getApprovalById(id);
      setApproval(res.data);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        navigate("/login");
      } else {
        setError(msg || "Approval not found");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", color: "var(--muted)" }}>
        Loading approval...
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="card" style={{ padding: "48px", textAlign: "center", maxWidth: "480px", margin: "60px auto" }}>
        <p style={{ color: "var(--accent-danger)", marginBottom: "20px" }}>{error || "Approval not found"}</p>
        <button className="btn btn-primary" onClick={() => navigate("/approvals")}>
          ← Back to Approvals
        </button>
      </div>
    );
  }

  const q = approval.quotationInfo;
  const rfq = approval.rfqInfo;
  const vendor = q?.vendorInfo;

  // Find the active (Pending) step that can be decided
  const activeStep = approval.approvalChain?.find((s) => s.status === "Pending");
  const isPending = approval.status === "Pending";

  // Determine if current user can decide the active step based on their role
  let userCanDecideActiveStep = false;
  if (activeStep && currentUser) {
    if (activeStep.level === 1 && (currentUser.role === "procurement_head" || currentUser.role === "admin")) {
      userCanDecideActiveStep = true;
    } else if (activeStep.level === 2 && (currentUser.role === "finance_manager" || currentUser.role === "admin")) {
      userCanDecideActiveStep = true;
    }
  }

  // Step lock logic — level N is locked if level N-1 is not Approved
  const isStepLocked = (step) => {
    if (step.level === 1) return false;
    const prev = approval.approvalChain?.find((s) => s.level === step.level - 1);
    return !prev || prev.status !== "Approved";
  };

  const overallStatusColor = {
    Pending: "#D97706",
    Approved: "var(--accent-secondary)",
    Rejected: "var(--accent-danger)",
  }[approval.status] || "var(--muted)";

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8125rem", minHeight: "32px" }}
              onClick={() => navigate("/approvals")}
              id="back-to-approvals-btn"
            >
              ← Back
            </button>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>
              {approval.snapshot?.rfqNumber}
            </h1>
            <span style={{
              padding: "4px 14px", borderRadius: "var(--radius-pill)",
              fontSize: "0.8125rem", fontWeight: 600,
              background: `${overallStatusColor}18`,
              color: overallStatusColor, boxShadow: "var(--shadow-inset-sm)",
            }}>
              {approval.status}
            </span>
          </div>
          <p style={{ margin: 0 }}>
            {approval.snapshot?.rfqTitle} · {approval.snapshot?.vendorName}
          </p>
        </div>
        <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--accent)", fontFamily: "var(--font-display)" }}>
          {fmt(approval.snapshot?.totalAmount)}
        </div>
      </div>

      <div className="res-grid-weighted" style={{ gap: "24px" }}>
        {/* Left — Approval Chain + Decision Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Chain Timeline */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "4px" }}>Approval Chain</h3>
            <p style={{ fontSize: "0.8125rem", marginBottom: "16px" }}>
              Requested by {approval.requestedByUser?.name || "Procurement Officer"} on{" "}
              {new Date(approval.createdAt).toLocaleDateString("en-IN")}
            </p>

            {approval.approvalChain?.map((step) => (
              <ChainStep
                key={step.level}
                step={step}
                isActive={step._id?.toString() === activeStep?._id?.toString()}
                isLocked={isStepLocked(step)}
              />
            ))}

            {approval.finalizedAt && (
              <div style={{ paddingTop: "14px", fontSize: "0.8125rem", color: "var(--muted)" }}>
                Finalized on {new Date(approval.finalizedAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Decision Panel — only when pending and user can decide */}
          {isPending && userCanDecideActiveStep && activeStep && (
            <DecisionPanel
              approvalId={approval._id}
              level={activeStep.level}
              onSuccess={load}
            />
          )}

          {!isPending && (
            <div className="card" style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                {approval.status === "Approved" ? "🎉" : "❌"}
              </div>
              <div style={{ fontWeight: 700, color: overallStatusColor, marginBottom: "4px" }}>
                This approval is {approval.status}
              </div>
              {approval.status === "Approved" && (
                <p style={{ fontSize: "0.8125rem" }}>
                  Purchase Order can now be generated.
                </p>
              )}
              {approval.rejectionReason && (
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)", fontStyle: "italic" }}>
                  "{approval.rejectionReason}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right — Quotation Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Vendor + Price Summary */}
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "16px" }}>💬 Quotation Summary</h3>

            {/* Vendor info */}
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px", borderRadius: "var(--radius-inner)",
              background: "var(--bg)", boxShadow: "var(--shadow-inset-sm)",
              marginBottom: "16px",
            }}>
              <div style={{
                width: "42px", height: "42px", borderRadius: "var(--radius-inner)",
                background: "var(--accent)", color: "#fff", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", fontWeight: 700, boxShadow: "var(--shadow-extruded-sm)",
              }}>
                {(vendor?.companyName || vendor?.name || "?")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                  {vendor?.companyName || vendor?.name}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{vendor?.email}</div>
                {vendor?.gstNumber && (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>GST: {vendor.gstNumber}</div>
                )}
              </div>
            </div>

            {/* Price breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {[
                { label: "Subtotal", value: fmt(q?.subtotal) },
                { label: `Tax (${q?.taxPercent || 0}%)`, value: fmt(q?.taxAmount) },
                { label: "Grand Total", value: fmt(q?.totalAmount), accent: true, large: true },
              ].map(({ label, value, accent, large }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", borderRadius: "var(--radius-inner)",
                  background: "var(--bg)",
                  boxShadow: accent ? "var(--shadow-inset)" : "var(--shadow-inset-sm)",
                }}>
                  <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{label}</span>
                  <span style={{
                    fontWeight: large ? 800 : 600,
                    fontSize: large ? "1.1rem" : "0.9375rem",
                    color: accent ? "var(--accent)" : "var(--fg)",
                    fontFamily: large ? "var(--font-display)" : "inherit",
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Terms */}
            {(q?.deliveryDays != null || q?.paymentTerms) && (
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--muted)" }}>
                {q?.deliveryDays != null && <span>🚚 {q.deliveryDays} days delivery</span>}
                {q?.paymentTerms && <span>💳 {q.paymentTerms}</span>}
              </div>
            )}
          </div>

          {/* Line Items */}
          {q?.lineItems && q.lineItems.length > 0 && (
            <div className="card" style={{ padding: "0", overflow: "hidden" }}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(163,177,198,0.12)" }}>
                <h3 style={{ fontSize: "1rem", margin: 0 }}>📦 Line Items</h3>
              </div>
              <div className="table-wrapper" style={{ borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th>Unit</th>
                      <th style={{ textAlign: "right" }}>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.lineItems.map((item, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                        <td style={{ textAlign: "right", color: "var(--muted)" }}>{item.quantity}</td>
                        <td style={{ color: "var(--muted)" }}>{item.unit}</td>
                        <td style={{ textAlign: "right" }}>{fmt(item.unitPrice)}</td>
                        <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RFQ Info */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "14px" }}>📋 RFQ Reference</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "RFQ Number", value: rfq?.rfqNumber },
                { label: "Title", value: rfq?.title },
                { label: "Category", value: rfq?.category || "—" },
                { label: "Deadline", value: rfq?.deadline ? new Date(rfq.deadline).toLocaleDateString("en-IN") : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between",
                  borderBottom: "1px solid rgba(163,177,198,0.1)", paddingBottom: "8px",
                }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              style={{ marginTop: "14px", fontSize: "0.8125rem", padding: "6px 14px" }}
              onClick={() => navigate(`/rfqs/${approval.rfq}`)}
              id="view-rfq-btn"
            >
              View RFQ →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
