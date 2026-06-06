import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllApprovals } from "../../api/approval.api.js";
import { getCurrentUser } from "../../utils/auth.js";

const fmt = (n) =>
  n != null
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n)
    : "—";

function StatusBadge({ status }) {
  const map = {
    Pending:  { bg: "rgba(245,158,11,0.12)",  color: "#D97706" },
    Approved: { bg: "rgba(56,178,172,0.12)",  color: "var(--accent-secondary)" },
    Rejected: { bg: "rgba(229,62,62,0.10)",   color: "var(--accent-danger)" },
  };
  const s = map[status] || map.Pending;
  return (
    <span style={{
      padding: "3px 12px", borderRadius: "var(--radius-pill)",
      fontSize: "0.75rem", fontWeight: 600,
      background: s.bg, color: s.color, boxShadow: "var(--shadow-inset-sm)",
    }}>
      {status === "Pending" ? "⏳ " : status === "Approved" ? "✓ " : "✕ "}{status}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ padding: "20px 24px", flex: 1 }}>
      <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: accent || "var(--fg)", fontFamily: "var(--font-display)" }}>
        {value}
      </div>
    </div>
  );
}

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

export default function ApprovalList() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState({ Pending: 0, Approved: 0, Rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const load = async (status) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllApprovals({ status: status === "All" ? undefined : status });
      setApprovals(res.data?.approvals || []);
      setStats(res.data?.stats || { Pending: 0, Approved: 0, Rejected: 0 });
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

  useEffect(() => { load(activeFilter); }, [activeFilter]);

  const handleFilter = (f) => { setActiveFilter(f); };

  const currentLevel = (approval) => {
    // Find the first Pending step
    const pending = approval.approvalChain?.find((s) => s.status === "Pending");
    return pending ? pending.level : null;
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>Approval Workflow</h1>
          <p>Review and approve procurement requests before purchase orders are generated</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <StatCard label="Pending Review" value={stats.Pending} accent="#D97706" />
        <StatCard label="Approved" value={stats.Approved} accent="var(--accent-secondary)" />
        <StatCard label="Rejected" value={stats.Rejected} accent="var(--accent-danger)" />
        <StatCard label="Total" value={(stats.Pending || 0) + (stats.Approved || 0) + (stats.Rejected || 0)} />
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            id={`filter-${f.toLowerCase()}`}
            onClick={() => handleFilter(f)}
            style={{
              padding: "7px 18px", borderRadius: "var(--radius-pill)",
              border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: "0.875rem",
              fontWeight: activeFilter === f ? 700 : 500,
              background: "var(--bg)",
              boxShadow: activeFilter === f ? "var(--shadow-inset)" : "var(--shadow-extruded-sm)",
              color: activeFilter === f ? "var(--accent)" : "var(--muted)",
              transition: "var(--transition)",
            }}
          >
            {f}
            {f !== "All" && stats[f] > 0 && (
              <span style={{ marginLeft: "6px", fontSize: "0.7rem", opacity: 0.7 }}>
                ({stats[f]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)" }}>
          Loading approvals...
        </div>
      ) : error ? (
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ color: "var(--accent-danger)" }}>⚠ {error}</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="card" style={{ padding: "64px", textAlign: "center" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "var(--bg)", boxShadow: "var(--shadow-extruded)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", margin: "0 auto 20px",
          }}>
            ✅
          </div>
          <h3 style={{ marginBottom: "8px" }}>
            {activeFilter === "All" ? "No approval requests yet" : `No ${activeFilter} approvals`}
          </h3>
          <p style={{ maxWidth: "360px", margin: "0 auto" }}>
            Approval requests appear here once a vendor is selected from a quotation comparison.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {approvals.map((approval) => {
            const lvl = currentLevel(approval);
            const isFinalized = approval.status !== "Pending";
            return (
              <div
                key={approval._id}
                className="card"
                style={{
                  padding: "22px 24px", cursor: "pointer",
                  transition: "var(--transition)",
                  borderLeft: `4px solid ${
                    approval.status === "Approved" ? "var(--accent-secondary)"
                    : approval.status === "Rejected" ? "var(--accent-danger)"
                    : "var(--accent)"}`,
                }}
                onClick={() => navigate(`/approvals/${approval._id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
                id={`approval-row-${approval._id}`}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: 1 }}>
                    {/* RFQ + Vendor */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                        {approval.snapshot?.rfqNumber || approval.rfqInfo?.rfqNumber}
                      </span>
                      <span style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>·</span>
                      <span style={{ fontSize: "0.875rem", color: "var(--fg)" }}>
                        {approval.snapshot?.vendorName}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: "10px" }}>
                      {approval.snapshot?.rfqTitle}
                    </div>

                    {/* Chain steps */}
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {approval.approvalChain?.map((step) => (
                        <div key={step.level} style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "4px 10px", borderRadius: "var(--radius-pill)",
                          background: "var(--bg)",
                          boxShadow: step.status === "Pending" ? "var(--shadow-inset-sm)" : "var(--shadow-extruded-sm)",
                          fontSize: "0.75rem", fontWeight: 600,
                          color: step.status === "Approved" ? "var(--accent-secondary)"
                            : step.status === "Rejected" ? "var(--accent-danger)"
                            : "var(--muted)",
                        }}>
                          <span>L{step.level}</span>
                          <span>
                            {step.status === "Approved" ? "✓" : step.status === "Rejected" ? "✕" : "…"}
                          </span>
                          <span style={{ fontWeight: 400 }}>{step.label.split("–")[1]?.trim() || step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                    <StatusBadge status={approval.status} />
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--accent)", fontFamily: "var(--font-display)" }}>
                      {fmt(approval.snapshot?.totalAmount)}
                    </div>
                    {!isFinalized && lvl && (
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        Awaiting L{lvl} Decision
                      </div>
                    )}
                    {approval.finalizedAt && (
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {new Date(approval.finalizedAt).toLocaleDateString("en-IN")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
