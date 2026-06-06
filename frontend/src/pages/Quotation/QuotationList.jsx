import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { getQuotationsByRFQ, submitQuotation } from "../../api/quotation.api.js";
import { getRFQById } from "../../api/rfq.api.js";
import { getCurrentUser } from "../../utils/auth.js";

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "—";

function StatusBadge({ status }) {
  const map = {
    Draft:     { bg: "rgba(107,114,128,0.10)", color: "var(--muted)" },
    Submitted: { bg: "rgba(108,99,255,0.10)",  color: "var(--accent)" },
    Accepted:  { bg: "rgba(56,178,172,0.12)",  color: "var(--accent-secondary)" },
    Rejected:  { bg: "rgba(229,62,62,0.10)",   color: "var(--accent-danger)" },
  };
  const s = map[status] || map.Draft;
  return (
    <span style={{
      padding: "3px 12px", borderRadius: "var(--radius-pill)",
      fontSize: "0.75rem", fontWeight: 600,
      background: s.bg, color: s.color, boxShadow: "var(--shadow-inset-sm)",
    }}>
      {status}
    </span>
  );
}

// ── Quotation Card ─────────────────────────────────────────────────
function QuotationCard({ q, rank, onView }) {
  const isWinner = q.status === "Accepted";
  const isRejected = q.status === "Rejected";

  return (
    <div
      className="card"
      style={{
        padding: "24px",
        position: "relative",
        opacity: isRejected ? 0.65 : 1,
        transition: "var(--transition)",
        cursor: "pointer",
        ...(isWinner ? { boxShadow: "0 0 0 2px var(--accent-secondary), var(--shadow-extruded)" } : {}),
      }}
      onClick={onView}
      onMouseEnter={(e) => {
        if (!isRejected) e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
      id={`quotation-card-${q._id}`}
    >
      {/* Winner badge */}
      {isWinner && (
        <div style={{
          position: "absolute", top: "-10px", left: "24px",
          background: "var(--accent-secondary)", color: "#fff",
          fontSize: "0.7rem", fontWeight: 700, padding: "3px 12px",
          borderRadius: "var(--radius-pill)", letterSpacing: "0.04em",
        }}>
          🏆 SELECTED WINNER
        </div>
      )}

      {/* Rank badge */}
      {!isWinner && !isRejected && (
        <div style={{
          position: "absolute", top: "16px", right: "16px",
          width: "28px", height: "28px", borderRadius: "50%",
          background: "var(--bg)", boxShadow: "var(--shadow-extruded-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.75rem", fontWeight: 700, color: rank === 1 ? "var(--accent)" : "var(--muted)",
        }}>
          #{rank}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
        {/* Vendor Avatar */}
        <div style={{
          width: "48px", height: "48px", borderRadius: "var(--radius-inner)",
          background: "var(--bg)", boxShadow: "var(--shadow-extruded-sm)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.25rem", flexShrink: 0,
        }}>
          🏢
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--fg)", marginBottom: "2px" }}>
            {q.vendorInfo?.companyName || q.vendorInfo?.name || "Unknown Vendor"}
          </div>
          <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            {q.quotationNumber} · {q.vendorInfo?.vendorCategory || "No category"}
          </div>
        </div>
        <StatusBadge status={q.status} />
      </div>

      {/* Price summary */}
      <div className="res-grid-3" style={{ gap: "16px", marginBottom: "16px" }}>
        {[
          { label: "Subtotal", value: fmt(q.subtotal) },
          { label: `Tax (${q.taxPercent || 0}%)`, value: fmt(q.taxAmount) },
          {
            label: "Total",
            value: fmt(q.totalAmount),
            accent: true,
            large: true,
          },
        ].map(({ label, value, accent, large }) => (
          <div key={label} style={{
            padding: "12px", borderRadius: "var(--radius-inner)",
            background: "var(--bg)",
            boxShadow: accent ? "var(--shadow-inset)" : "var(--shadow-inset-sm)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {label}
            </div>
            <div style={{
              fontWeight: 700, fontSize: large ? "1.1rem" : "0.9rem",
              color: accent ? "var(--accent)" : "var(--fg)",
              fontFamily: "var(--font-display)",
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Meta info row */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--muted)" }}>
        {q.deliveryDays != null && (
          <span>🚚 {q.deliveryDays} days delivery</span>
        )}
        {q.paymentTerms && <span>💳 {q.paymentTerms}</span>}
        {q.validUntil && (
          <span>📅 Valid until {new Date(q.validUntil).toLocaleDateString("en-IN")}</span>
        )}
        <span style={{ marginLeft: "auto" }}>
          {q.lineItems?.length} item{q.lineItems?.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Submit Quotation Form ──────────────────────────────────────────
function SubmitQuotationForm({ rfq, existingQuotation, onSuccess }) {
  const [lineItems, setLineItems] = useState(() =>
    (rfq.lineItems || []).map((li) => ({
      rfqLineItemId: li._id,
      itemName: li.item || li.itemName,
      quantity: li.qty || li.quantity,
      unit: li.unit || "NOS",
      unitPrice: existingQuotation
        ? (existingQuotation.lineItems.find(
            (q) => q.rfqLineItemId?.toString() === li._id?.toString()
          )?.unitPrice || "")
        : "",
      notes: "",
    }))
  );
  const [taxPercent, setTaxPercent] = useState(existingQuotation?.taxPercent || 0);
  const [deliveryDays, setDeliveryDays] = useState(existingQuotation?.deliveryDays || "");
  const [paymentTerms, setPaymentTerms] = useState(existingQuotation?.paymentTerms || "");
  const [validUntil, setValidUntil] = useState(
    existingQuotation?.validUntil
      ? new Date(existingQuotation.validUntil).toISOString().split("T")[0]
      : ""
  );
  const [notes, setNotes] = useState(existingQuotation?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateItem = (i, field, val) => {
    setLineItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  };

  // Computed totals
  const subtotal = lineItems.reduce((acc, li) => acc + (Number(li.unitPrice) || 0) * (Number(li.quantity) || 0), 0);
  const taxAmount = (subtotal * Number(taxPercent)) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = lineItems.some((li) => !li.unitPrice || Number(li.unitPrice) <= 0);
    if (invalid) {
      setError("Please enter a valid unit price for every item.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await submitQuotation({
        rfqId: rfq._id,
        lineItems,
        taxPercent: Number(taxPercent),
        deliveryDays: deliveryDays !== "" ? Number(deliveryDays) : undefined,
        paymentTerms: paymentTerms || undefined,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to submit quotation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: "28px" }}>
      <h3 style={{ marginBottom: "6px", fontSize: "1rem" }}>
        {existingQuotation ? "✏️ Update Your Quotation" : " Submit Your Quotation"}
      </h3>
      <p style={{ marginBottom: "24px", fontSize: "0.875rem" }}>
        Fill in your prices for the requested items. You can update this before the deadline.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        {/* Line Items Pricing */}
        <div className="table-wrapper" style={{ marginBottom: "20px" }}>
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: "150px" }}>Item</th>
                <th style={{ minWidth: "80px", textAlign: "right" }}>Qty</th>
                <th style={{ minWidth: "100px" }}>Unit</th>
                <th style={{ minWidth: "120px", textAlign: "right" }}>Unit Price (₹) *</th>
                <th style={{ minWidth: "100px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{li.itemName}</td>
                  <td style={{ textAlign: "right", color: "var(--muted)" }}>{li.quantity}</td>
                  <td style={{ color: "var(--muted)" }}>{li.unit}</td>
                  <td style={{ textAlign: "right" }}>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: "120px", textAlign: "right", marginLeft: "auto", display: "block" }}
                      placeholder="0.00"
                      value={li.unitPrice}
                      min="0"
                      step="0.01"
                      onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                      id={`price-item-${i}`}
                      required
                    />
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: "var(--accent)" }}>
                    {li.unitPrice ? fmt(Number(li.unitPrice) * Number(li.quantity)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: "right", color: "var(--muted)", fontSize: "0.8125rem", fontWeight: 600 }}>
                  Subtotal
                </td>
                <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(subtotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Extra fields */}
        <div className="res-grid-3" style={{ gap: "16px", marginBottom: "16px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="tax-percent">Tax %</label>
            <input
              id="tax-percent"
              type="number" className="form-input"
              placeholder="0" min="0" max="100" step="0.5"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="delivery-days">Delivery (days)</label>
            <input
              id="delivery-days"
              type="number" className="form-input"
              placeholder="e.g. 14" min="0"
              value={deliveryDays}
              onChange={(e) => setDeliveryDays(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="valid-until">Valid Until</label>
            <input
              id="valid-until"
              type="date" className="form-input"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="form-label" htmlFor="payment-terms">Payment Terms</label>
          <input
            id="payment-terms"
            className="form-input"
            placeholder="e.g. 30 days net, 50% advance..."
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label className="form-label" htmlFor="quotation-notes">Additional Notes</label>
          <textarea
            id="quotation-notes"
            className="form-input"
            rows={3}
            placeholder="Warranty, after-sales support, delivery schedule details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ resize: "vertical", minHeight: "80px" }}
          />
        </div>

        {/* Total preview */}
        <div style={{
          display: "flex", justifyContent: "flex-end", alignItems: "center",
          gap: "24px", padding: "16px 20px",
          borderRadius: "var(--radius-inner)",
          background: "var(--bg)", boxShadow: "var(--shadow-inset-sm)",
          marginBottom: "20px",
        }}>
          <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Tax: <strong style={{ color: "var(--fg)" }}>{fmt(taxAmount)}</strong>
          </span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
            Total: {fmt(total)}
          </span>
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

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          id="submit-quotation-btn"
          style={{ minWidth: "200px" }}
        >
          {loading ? "Submitting..." : existingQuotation ? "✓ Update Quotation" : "Submit Quotation"}
        </button>
      </form>
    </div>
  );
}

// ── Main QuotationList Component ───────────────────────────────────
export default function QuotationList() {
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();
  // Support both /quotations?rfqId=xxx  and  /quotations/:id
  const rfqId = searchParams.get("rfqId") || routeId || null;
  const navigate = useNavigate();

  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [myQuotation, setMyQuotation] = useState(null);

  // Correct URL-safe base64 JWT decode
  const currentUser = getCurrentUser();
  const isVendor = currentUser?.role === "vendor";
  const isOfficer = currentUser?.role === "procurement_officer" || currentUser?.role === "admin";

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [rfqRes, qtRes] = await Promise.all([
        getRFQById(rfqId),
        getQuotationsByRFQ(rfqId),
      ]);
      setRfq(rfqRes.data);
      const qList = qtRes.data?.quotations || [];
      setQuotations(qList);

      // Find vendor's own quotation
      if (isVendor) {
        const own = qList.find((q) => q.vendor?.toString() === currentUser?._id);
        setMyQuotation(own || null);
      }
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        navigate("/login");
      } else {
        setError(msg || "Failed to load quotations.");
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
      <div style={{ padding: "80px", textAlign: "center", maxWidth: "500px", margin: "40px auto" }}>
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          background: "var(--bg)", boxShadow: "var(--shadow-extruded)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2.5rem", margin: "0 auto 24px",
        }}>💬</div>
        <h2 style={{ marginBottom: "12px", fontSize: "1.5rem" }}>Select an RFQ</h2>
        <p style={{ color: "var(--muted)", marginBottom: "32px", lineHeight: "1.6" }}>
          Quotations are linked to specific Requests for Quotation (RFQs). 
          Please select an RFQ from the list to view or compare its quotations.
        </p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate("/rfqs")}
          style={{ padding: "12px 24px", fontSize: "1rem" }}
        >
          View RFQs
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading quotations...</p>
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

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <button
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "0.8125rem", minHeight: "32px" }}
              onClick={() => navigate(`/rfqs/${rfqId}`)}
              id="back-to-rfq-btn"
            >
              ← {rfq?.rfqNumber}
            </button>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Quotations</h1>
            {quotations.length > 0 && (
              <span style={{
                background: "var(--bg)", boxShadow: "var(--shadow-inset-sm)",
                padding: "3px 12px", borderRadius: "var(--radius-pill)",
                fontSize: "0.8125rem", fontWeight: 600, color: "var(--muted)",
              }}>
                {quotations.length} received
              </span>
            )}
          </div>
          <p style={{ margin: 0 }}>
            {rfq?.title}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {isVendor && rfq?.status === "Open" && (
            <button
              className="btn btn-primary"
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              id="toggle-submit-form-btn"
            >
              {showSubmitForm ? "✕ Cancel" : myQuotation ? "✏️ Update Quotation" : " Submit Quotation"}
            </button>
          )}
          {isOfficer && quotations.length > 1 && rfq?.status === "Open" && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/quotations/compare?rfqId=${rfqId}`)}
              id="compare-btn"
            >
              ⚖️ Compare & Select
            </button>
          )}
        </div>
      </div>

      {/* Vendor Submit Form */}
      {showSubmitForm && rfq && (
        <div style={{ marginBottom: "28px" }}>
          <SubmitQuotationForm
            rfq={rfq}
            existingQuotation={myQuotation}
            onSuccess={() => { setShowSubmitForm(false); loadData(); }}
          />
        </div>
      )}

      {/* Quotation Cards / Empty State */}
      {quotations.length === 0 ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "var(--bg)", boxShadow: "var(--shadow-extruded)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", margin: "0 auto 20px",
          }}>
            💬
          </div>
          <h3 style={{ marginBottom: "8px" }}>No quotations yet</h3>
          <p>
            {isVendor
              ? "Submit your quotation for this RFQ using the button above."
              : "Assigned vendors haven't submitted quotations yet. They'll appear here once submitted."}
          </p>
          {isVendor && rfq?.status === "Open" && (
            <button className="btn btn-primary" style={{ marginTop: "20px" }} onClick={() => setShowSubmitForm(true)}>
               Submit Quotation
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {quotations.map((q, i) => (
            <QuotationCard
              key={q._id}
              q={q}
              rank={i + 1}
              onView={() => navigate(`/quotations/${q._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
