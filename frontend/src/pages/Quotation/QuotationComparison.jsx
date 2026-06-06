import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { compareQuotations, selectQuotation } from "../../api/quotation.api.js";
import { createApproval } from "../../api/approval.api.js";
import { getAllRFQs } from "../../api/rfq.api.js";

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

// ── Confirm Select Modal ───────────────────────────────────────────
function ConfirmModal({ vendor, amount, onConfirm, onCancel, loading }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(61,72,82,0.5)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="card" style={{ maxWidth: "440px", width: "100%", padding: "36px", textAlign: "center" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "var(--bg)", boxShadow: "var(--shadow-extruded)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.75rem", margin: "0 auto 20px",
        }}>
          🏆
        </div>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Confirm Vendor Selection</h2>
        <p style={{ marginBottom: "6px" }}>
          You are selecting <strong style={{ color: "var(--fg)" }}>{vendor}</strong> as the winning vendor.
        </p>
        <p style={{ marginBottom: "28px", color: "var(--accent)", fontWeight: 700, fontSize: "1.1rem" }}>
          Total: {fmt(amount)}
        </p>
        <p style={{ fontSize: "0.8125rem", marginBottom: "28px" }}>
          This will mark all other quotations as <strong>Rejected</strong> and close the RFQ. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onConfirm}
            disabled={loading}
            id="confirm-select-btn"
          >
            {loading ? "Selecting..." : "✓ Confirm Selection"}
          </button>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor Column Header ───────────────────────────────────────────
function VendorHeader({ q, isCheapest, isSelected, onSelect, selectLoading }) {
  const isWinner = q.status === "Accepted";
  const isRejected = q.status === "Rejected";

  return (
    <div style={{
      padding: "20px 16px",
      borderRadius: "var(--radius-card)",
      background: "var(--bg)",
      boxShadow: isWinner
        ? "0 0 0 2px var(--accent-secondary), var(--shadow-extruded)"
        : isSelected
        ? "0 0 0 2px var(--accent), var(--shadow-extruded)"
        : "var(--shadow-extruded-sm)",
      position: "relative",
      textAlign: "center",
      transition: "var(--transition)",
      opacity: isRejected ? 0.55 : 1,
    }}>
      {/* Rank / Trophy */}
      <div style={{
        width: "42px", height: "42px", borderRadius: "50%",
        background: "var(--bg)", boxShadow: isCheapest ? "var(--shadow-extruded)" : "var(--shadow-extruded-sm)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem", margin: "0 auto 12px",
      }}>
        {isWinner ? "🏆" : isCheapest ? "⭐" : "🏢"}
      </div>

      {/* Vendor name */}
      <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--fg)", marginBottom: "4px" }}>
        {q.vendorName}
      </div>

      {/* Quotation number */}
      <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "12px" }}>
        {q.quotationNumber}
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: "12px" }}>
        {isWinner ? (
          <span style={{ background: "rgba(56,178,172,0.15)", color: "var(--accent-secondary)", fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-pill)" }}>
            ✓ WINNER
          </span>
        ) : isRejected ? (
          <span style={{ background: "rgba(229,62,62,0.1)", color: "var(--accent-danger)", fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-pill)" }}>
            REJECTED
          </span>
        ) : isCheapest ? (
          <span style={{ background: "rgba(108,99,255,0.1)", color: "var(--accent)", fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-pill)" }}>
            LOWEST BID
          </span>
        ) : (
          <span style={{ background: "rgba(107,114,128,0.08)", color: "var(--muted)", fontSize: "0.7rem", fontWeight: 600, padding: "3px 10px", borderRadius: "var(--radius-pill)" }}>
            #{q.rank}
          </span>
        )}
      </div>

      {/* Select button */}
      {!isWinner && !isRejected && (
        <button
          className="btn btn-primary"
          style={{ width: "100%", fontSize: "0.8125rem" }}
          onClick={() => onSelect(q)}
          disabled={selectLoading}
          id={`select-vendor-btn-${q.quotationId}`}
        >
          {selectLoading ? "..." : "🏆 Select"}
        </button>
      )}
    </div>
  );
}

// ── RFQ Selector (When no rfqId is provided) ─────────────────────
function RFQSelector({ onSelect }) {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        // Fetch all RFQs to allow comparison for both Open and Closed
        const res = await getAllRFQs({ status: "All" });
        // Filter to those that might have quotations (e.g. Open or Closed)
        const comparableRfqs = (res.data?.rfqs || []).filter(
          (r) => r.status === "Open" || r.status === "Closed"
        );
        setRfqs(comparableRfqs);
      } catch (err) {
        console.error("Failed to load RFQs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRfqs();
  }, []);

  if (loading) {
    return <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>Loading RFQs...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Select RFQ to Compare</h2>
      <p style={{ color: "var(--muted)", marginBottom: "24px" }}>
        Choose an active or closed RFQ below to view its side-by-side quotation comparison.
      </p>

      {rfqs.length === 0 ? (
        <div className="card" style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
          No RFQs available for comparison.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {rfqs.map((rfq) => (
            <div
              key={rfq._id}
              className="card"
              style={{
                padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", transition: "var(--transition)",
              }}
              onClick={() => onSelect(rfq._id)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>{rfq.rfqNumber}</span>
                  <span style={{
                    fontSize: "0.75rem", padding: "2px 8px", borderRadius: "var(--radius-pill)",
                    background: rfq.status === "Open" ? "rgba(56,178,172,0.12)" : "rgba(107,114,128,0.1)",
                    color: rfq.status === "Open" ? "var(--accent-secondary)" : "var(--muted)",
                  }}>
                    {rfq.status}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{rfq.title}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "4px" }}>
                  {rfq.vendorCount} Vendors Assigned
                </div>
              </div>
              <button className="btn btn-secondary">Compare →</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Comparison Component ──────────────────────────────────────
export default function QuotationComparison() {
  const [searchParams] = useSearchParams();
  const rfqId = searchParams.get("rfqId");
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [selectLoading, setSelectLoading] = useState(false);
  const [selectError, setSelectError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [winnerQuotationId, setWinnerQuotationId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await compareQuotations(rfqId);
      setData(res.data);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        navigate("/login");
      } else {
        setError(msg || "Failed to load comparison data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rfqId) {
      loadData();
    }
  }, [rfqId]);

  if (!rfqId) {
    return (
      <RFQSelector onSelect={(id) => navigate(`/quotations/compare?rfqId=${id}`)} />
    );
  }

  const handleSelectConfirm = async () => {
    setSelectLoading(true);
    setSelectError("");
    try {
      await selectQuotation(confirmTarget.quotationId);
      setWinnerQuotationId(confirmTarget.quotationId);
      setConfirmTarget(null);
      setSuccessMsg(`🏆 ${confirmTarget.vendorName} has been selected. The RFQ is now closed.`);
      loadData();
    } catch (err) {
      setSelectError(err.message || "Failed to select quotation.");
    } finally {
      setSelectLoading(false);
    }
  };

  const handleSendToApproval = async () => {
    if (!winnerQuotationId) return;
    setApprovalLoading(true);
    try {
      const res = await createApproval({ quotationId: winnerQuotationId });
      navigate(`/approvals/${res.data._id}`);
    } catch (err) {
      setSelectError(err.message || "Failed to create approval request.");
    } finally {
      setApprovalLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "12px", color: "var(--muted)" }}>⟳</div>
        <p>Building comparison matrix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: "48px", textAlign: "center", maxWidth: "480px", margin: "60px auto" }}>
        <p style={{ color: "var(--accent-danger)", marginBottom: "20px" }}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate("/rfqs")}>← Back to RFQs</button>
      </div>
    );
  }

  const { rfq, comparisonMatrix, summary, total } = data;

  if (!summary || summary.length === 0) {
    return (
      <div>
        <div className="page-header">
          <button className="btn btn-secondary" onClick={() => navigate(`/rfqs/${rfqId}`)} style={{ marginBottom: "16px" }}>
            ← Back
          </button>
          <h1>Quotation Comparison</h1>
          <p>{rfq.title}</p>
        </div>
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "16px" }}>💬</div>
          <h3 style={{ marginBottom: "8px" }}>No submitted quotations yet</h3>
          <p>Vendors need to submit their quotations before you can compare them.</p>
        </div>
      </div>
    );
  }

  const cheapestTotal = Math.min(...summary.map((s) => s.totalAmount));

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8125rem", minHeight: "32px" }}
              onClick={() => navigate(`/rfqs/${rfqId}`)}
              id="back-to-rfq-btn"
            >
              ← {rfq.rfqNumber}
            </button>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Quotation Comparison</h1>
          </div>
          <p style={{ margin: 0 }}>{rfq.title} · {total} vendor{total !== 1 ? "s" : ""} quoted</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/quotations?rfqId=${rfqId}`)}
          id="view-all-quotations-btn"
        >
          💬 View All Quotations
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div style={{
          padding: "14px 18px", borderRadius: "var(--radius-inner)", marginBottom: "20px",
          background: "rgba(56,178,172,0.1)", color: "var(--accent-secondary)", fontWeight: 600,
          boxShadow: "var(--shadow-inset-sm)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
          flexWrap: "wrap",
        }}>
          <span>{successMsg}</span>
          {winnerQuotationId && (
            <button
              className="btn btn-primary"
              style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}
              onClick={handleSendToApproval}
              disabled={approvalLoading}
              id="send-to-approval-btn"
            >
              {approvalLoading ? "Creating..." : "✅ Send to Approval →"}
            </button>
          )}
        </div>
      )}
      {selectError && (
        <div role="alert" style={{
          padding: "12px 16px", borderRadius: "var(--radius-inner)", marginBottom: "20px",
          background: "rgba(229,62,62,0.08)", color: "var(--accent-danger)", fontSize: "0.875rem",
        }}>
          {selectError}
        </div>
      )}

      {/* Key metrics comparison */}
      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "20px", fontSize: "1rem" }}>📊 Side-by-Side Summary</h3>
        <div className="table-wrapper">
          <div style={{
            display: "grid",
            gridTemplateColumns: `200px ${summary.map(() => "minmax(200px, 1fr)").join(" ")}`,
            gap: "12px", alignItems: "center",
            minWidth: "max-content"
          }}>
            {/* Row 1: Headers */}
          <div></div> {/* Empty top-left cell */}
          {summary.map((q) => (
            <div key={q.quotationId} style={{ alignSelf: "end" }}>
              <VendorHeader
                q={q}
                isCheapest={q.totalAmount === cheapestTotal && q.status !== "Rejected"}
                isSelected={confirmTarget?.quotationId === q.quotationId}
                onSelect={setConfirmTarget}
                selectLoading={selectLoading}
              />
            </div>
          ))}

          {/* Data Rows */}
          {[
            { label: "Grand Total", getValue: q => fmt(q.totalAmount), highlightCheck: true, large: true },
            { label: "Subtotal (ex-tax)", getValue: q => fmt(q.subtotal) },
            { label: "Tax Amount", getValue: q => fmt(q.taxAmount) },
            { label: "Delivery (days)", getValue: q => q.deliveryDays != null ? `${q.deliveryDays} days` : "—" },
            { label: "Payment Terms", getValue: q => q.paymentTerms || "—" },
            { label: "Valid Until", getValue: q => q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-IN") : "—" }
          ].flatMap((rowDef, ri) => [
            <div key={`label-${ri}`} style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--muted)" }}>
              {rowDef.label}
            </div>,
            ...summary.map((q) => {
              const highlight = rowDef.highlightCheck && q.totalAmount === cheapestTotal && q.status !== "Rejected";
              return (
                <div key={`${q.quotationId}-${ri}`} style={{
                  height: "44px", padding: "8px 12px", borderRadius: "var(--radius-inner)",
                  background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: highlight ? "var(--shadow-inset)" : "var(--shadow-inset-sm)",
                  fontSize: rowDef.large ? "0.9375rem" : "0.8125rem",
                  fontWeight: highlight ? 700 : 500,
                  color: highlight ? "var(--accent-secondary)" : "var(--fg)",
                  opacity: q.status === "Rejected" ? 0.5 : 1, transition: "var(--transition)",
                  textAlign: "center"
                }}>
                  {rowDef.getValue(q)}
                </div>
              );
            })
          ])}
          </div>
        </div>
      </div>

      {/* Item-level comparison */}
      {comparisonMatrix && comparisonMatrix.length > 0 && (
        <div className="card" style={{ padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(163,177,198,0.12)" }}>
            <h3 style={{ fontSize: "1rem", margin: 0 }}>📦 Line-Item Price Breakdown</h3>
          </div>
          <div className="table-wrapper" style={{ borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: "180px" }}>Item</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th>Unit</th>
                  {summary.map((q) => (
                    <th key={q.quotationId} style={{ textAlign: "right", minWidth: "130px" }}>
                      <span style={{ fontSize: "0.75rem", display: "block", fontWeight: 600, color: "var(--accent)" }}>
                        {q.vendorName.split(" ").slice(0, 2).join(" ")}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 400 }}>
                        Unit Price
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonMatrix.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{ fontWeight: 600 }}>{row.itemName}</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>{row.quantity}</td>
                    <td style={{ color: "var(--muted)" }}>{row.unit}</td>
                    {row.vendorPrices.map((vp) => {
                      const isReject = summary.find((s) => s.quotationId?.toString() === vp.quotationId?.toString())?.status === "Rejected";
                      return (
                        <td key={vp.quotationId} style={{ textAlign: "right" }}>
                          <span style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "var(--radius-pill)",
                            fontSize: "0.875rem",
                            fontWeight: vp.isCheapest ? 700 : 500,
                            background: vp.isCheapest && !isReject
                              ? "rgba(56,178,172,0.12)"
                              : "transparent",
                            color: vp.isCheapest && !isReject
                              ? "var(--accent-secondary)"
                              : isReject
                              ? "var(--muted)"
                              : "var(--fg)",
                            opacity: isReject ? 0.5 : 1,
                          }}>
                            {vp.unitPrice != null ? fmt(vp.unitPrice) : "—"}
                            {vp.isCheapest && !isReject && " ⭐"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Row totals */}
                <tr style={{ fontWeight: 700, borderTop: "2px solid rgba(163,177,198,0.2)" }}>
                  <td colSpan={3} style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Grand Total</td>
                  {summary.map((q) => (
                    <td key={q.quotationId} style={{
                      textAlign: "right",
                      color: q.totalAmount === cheapestTotal && q.status !== "Rejected"
                        ? "var(--accent-secondary)"
                        : "var(--fg)",
                      fontSize: "1rem",
                    }}>
                      {fmt(q.totalAmount)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmTarget && (
        <ConfirmModal
          vendor={confirmTarget.vendorName}
          amount={confirmTarget.totalAmount}
          onConfirm={handleSelectConfirm}
          onCancel={() => setConfirmTarget(null)}
          loading={selectLoading}
        />
      )}
    </div>
  );
}
