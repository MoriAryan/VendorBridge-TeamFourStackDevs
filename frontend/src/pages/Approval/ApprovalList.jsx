import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllApprovals } from "../../api/approval.api.js";
import { getCurrentUser } from "../../utils/auth.js";

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "—";

function KanbanColumn({ title, approvals, icon, color, onCardClick }) {
  const currentLevel = (approval) => {
    const pending = approval.approvalChain?.find((s) => s.status === "Pending");
    return pending ? pending.level : null;
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "16px",
      background: "rgba(163,177,198,0.05)", borderRadius: "var(--radius-lg)",
      padding: "16px", minHeight: "60vh",
      borderTop: `4px solid ${color}`
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{icon}</span> {title}
        </h3>
        <span style={{
          background: "var(--bg)", padding: "2px 8px", borderRadius: "var(--radius-pill)",
          fontSize: "0.8125rem", fontWeight: 700, boxShadow: "var(--shadow-inset-sm)"
        }}>
          {approvals.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {approvals.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem", fontStyle: "italic" }}>
            Empty
          </div>
        ) : (
          approvals.map((approval) => {
            const lvl = currentLevel(approval);
            return (
              <div
                key={approval._id}
                className="card"
                onClick={() => onCardClick(approval._id)}
                style={{
                  padding: "16px", cursor: "pointer", transition: "all 0.2s ease",
                  borderLeft: `3px solid ${color}`
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.9375rem" }}>
                    {approval.snapshot?.rfqNumber || approval.rfqInfo?.rfqNumber}
                  </span>
                  <span style={{ fontWeight: 800, color: "var(--accent)", fontSize: "1rem" }}>
                    {fmt(approval.snapshot?.totalAmount)}
                  </span>
                </div>
                
                <div style={{ fontSize: "0.8125rem", color: "var(--fg)", marginBottom: "4px" }}>
                  <strong>Vendor:</strong> {approval.snapshot?.vendorName}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {approval.snapshot?.rfqTitle}
                </div>

                {/* Status Indicator */}
                {lvl && title === "Pending" && (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", background: "var(--bg)", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                    Awaiting <strong>L{lvl}</strong> Approval
                  </div>
                )}
                {title === "Approved" && (
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", fontWeight: 600 }}>
                    Ready for PO
                  </div>
                )}
                {title === "Rejected" && (
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-danger)", fontWeight: 600 }}>
                    Requires Revision
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ApprovalList() {
  const navigate = useNavigate();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllApprovals();
      setApprovals(res.data?.approvals || []);
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
        navigate("/login");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pendingApprovals = approvals.filter(a => a.status === "Pending");
  const approvedApprovals = approvals.filter(a => a.status === "Approved");
  const rejectedApprovals = approvals.filter(a => a.status === "Rejected");

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Approval Workflow Board</h1>
        <p>Drag and drop support coming soon. Click a card to review details.</p>
      </div>

      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>
          Loading Kanban board...
        </div>
      ) : error ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--accent-danger)" }}>{error}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", minWidth: "900px", overflowX: "auto" }}>
          <KanbanColumn 
            title="Pending" 
            approvals={pendingApprovals} 
            icon="⏳" 
            color="#D97706" 
            onCardClick={(id) => navigate(`/approvals/${id}`)} 
          />
          <KanbanColumn 
            title="Approved" 
            approvals={approvedApprovals} 
            icon="✅" 
            color="#38B2AC" 
            onCardClick={(id) => navigate(`/approvals/${id}`)} 
          />
          <KanbanColumn 
            title="Rejected" 
            approvals={rejectedApprovals} 
            icon="❌" 
            color="#E53E3E" 
            onCardClick={(id) => navigate(`/approvals/${id}`)} 
          />
        </div>
      )}
    </div>
  );
}
