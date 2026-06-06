import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRFQs, getRFQStats } from "../../api/rfq.api.js";

// ── Demo data for when backend isn't running ──────────────────────
const DEMO_RFQS = [
  {
    _id: "r1",
    rfqNumber: "RFQ-2025-0001",
    title: "Office Furniture Procurement Q2",
    category: "Furniture",
    deadline: "2025-06-15",
    status: "Open",
    lineItemCount: 2,
    vendorCount: 2,
    createdAt: "2025-05-19T10:30:00Z",
    createdByUser: { name: "Procurement Officer" },
  },
  {
    _id: "r2",
    rfqNumber: "RFQ-2025-0002",
    title: "IT Hardware Refresh — Laptops & Monitors",
    category: "IT Hardware",
    deadline: "2025-06-30",
    status: "Open",
    lineItemCount: 4,
    vendorCount: 3,
    createdAt: "2025-05-21T09:00:00Z",
    createdByUser: { name: "Procurement Officer" },
  },
  {
    _id: "r3",
    rfqNumber: "RFQ-2025-0003",
    title: "Stationery Supplies Q2 2025",
    category: "Stationery",
    deadline: "2025-06-10",
    status: "Closed",
    lineItemCount: 8,
    vendorCount: 1,
    createdAt: "2025-05-15T14:00:00Z",
    createdByUser: { name: "Procurement Officer" },
  },
  {
    _id: "r4",
    rfqNumber: "RFQ-2025-0004",
    title: "Security Equipment — CCTV Installation",
    category: "Construction",
    deadline: "2025-07-01",
    status: "Draft",
    lineItemCount: 3,
    vendorCount: 0,
    createdAt: "2025-06-01T11:00:00Z",
    createdByUser: { name: "Procurement Officer" },
  },
  {
    _id: "r5",
    rfqNumber: "RFQ-2025-0005",
    title: "Catering Services — Annual Day",
    category: "Catering",
    deadline: "2025-05-01",
    status: "Expired",
    lineItemCount: 5,
    vendorCount: 2,
    createdAt: "2025-04-15T08:00:00Z",
    createdByUser: { name: "Procurement Officer" },
  },
];

const DEMO_STATS = { total: 12, Draft: 2, Open: 7, Closed: 2, Expired: 1 };

const STATUS_FILTERS = ["All", "Draft", "Open", "Closed", "Expired"];

// ── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ status }) {
  const badgeClass =
    {
      Draft: "badge-draft",
      Open: "badge-open",
      Closed: "badge-closed",
      Expired: "badge-expired",
    }[status] || "badge-draft";

  const icons = { Draft: "✏️", Open: "🟢", Closed: "🔒", Expired: "⏰" };

  return (
    <span className={`badge ${badgeClass}`}>
      {icons[status]} {status}
    </span>
  );
}

// ── RFQ Table Row ──────────────────────────────────────────────────
function RFQRow({ rfq, onView }) {
  const deadline = new Date(rfq.deadline);
  const isOverdue =
    rfq.status === "Open" && deadline < new Date();

  return (
    <tr
      style={{ cursor: "pointer" }}
      onClick={() => onView(rfq._id)}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(108, 99, 255, 0.04)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "";
      }}
    >
      <td>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: "600",
            fontSize: "0.8125rem",
            color: "var(--accent)",
          }}
        >
          {rfq.rfqNumber}
        </span>
      </td>
      <td>
        <div style={{ fontWeight: "600", color: "var(--fg)", marginBottom: "2px" }}>
          {rfq.title}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
          {rfq.category || "—"}
        </div>
      </td>
      <td>
        <span
          style={{
            fontSize: "0.8125rem",
            color: isOverdue ? "var(--accent-danger)" : "var(--fg)",
            fontWeight: isOverdue ? "600" : "400",
          }}
        >
          {isOverdue && "⚠ "}
          {deadline.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </td>
      <td>
        <div style={{ display: "flex", gap: "8px", fontSize: "0.8125rem", color: "var(--muted)" }}>
          <span title="Line items">📦 {rfq.lineItemCount}</span>
          <span title="Vendors">🏢 {rfq.vendorCount}</span>
        </div>
      </td>
      <td>
        <StatusBadge status={rfq.status} />
      </td>
      <td>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-secondary"
            style={{ padding: "6px 14px", fontSize: "0.8125rem", minHeight: "34px" }}
            onClick={(e) => {
              e.stopPropagation();
              onView(rfq._id);
            }}
            id={`rfq-view-btn-${rfq._id}`}
            aria-label={`View RFQ ${rfq.rfqNumber}`}
          >
            View
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── KPI Stats Row ─────────────────────────────────────────────────
function StatsRow({ stats }) {
  const kpis = [
    {
      label: "Total RFQs",
      value: stats.total,
      icon: "📋",
      color: "var(--fg)",
    },
    {
      label: "Active (Open)",
      value: stats.Open || 0,
      icon: "🟢",
      color: "var(--accent-secondary)",
    },
    {
      label: "Pending (Draft)",
      value: stats.Draft || 0,
      icon: "✏️",
      color: "var(--muted)",
    },
    {
      label: "Expired",
      value: stats.Expired || 0,
      icon: "⏰",
      color: "var(--accent-danger)",
    },
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

// ── Main RFQList Component ─────────────────────────────────────────
export default function RFQList() {
  const navigate = useNavigate();

  const [rfqs, setRfqs] = useState(DEMO_RFQS);
  const [stats, setStats] = useState(DEMO_STATS);
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Fetch RFQs ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rfqRes, statsRes] = await Promise.all([
          getAllRFQs({
            status: activeFilter === "All" ? undefined : activeFilter,
            search: search || undefined,
          }),
          getRFQStats(),
        ]);
        setRfqs(rfqRes.data?.rfqs || DEMO_RFQS);
        setStats(statsRes.data || DEMO_STATS);
      } catch {
        // Backend offline — use demo data
        let filtered = DEMO_RFQS;
        if (activeFilter !== "All") {
          filtered = filtered.filter((r) => r.status === activeFilter);
        }
        if (search) {
          filtered = filtered.filter(
            (r) =>
              r.title.toLowerCase().includes(search.toLowerCase()) ||
              r.category?.toLowerCase().includes(search.toLowerCase()) ||
              r.rfqNumber?.toLowerCase().includes(search.toLowerCase())
          );
        }
        setRfqs(filtered);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [activeFilter, search]);

  const filteredRFQs =
    activeFilter === "All"
      ? rfqs
      : rfqs.filter((r) => r.status === activeFilter);

  const displayRFQs = search
    ? filteredRFQs.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.category?.toLowerCase().includes(search.toLowerCase()) ||
          r.rfqNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : filteredRFQs;

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
          <h1>RFQ's</h1>
          <p>Manage requests for quotation across your procurement lifecycle</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/rfqs/create")}
          id="new-rfq-btn"
        >
          + New RFQ
        </button>
      </div>

      {/* KPI Stats */}
      <StatsRow stats={stats} />

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: "40px" }}
            placeholder="Search by title, category, RFQ number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="rfq-search-input"
            aria-label="Search RFQs"
          />
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Filter RFQs by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              className={`filter-tab${activeFilter === f ? " active" : ""}`}
              onClick={() => setActiveFilter(f)}
              id={`filter-tab-${f.toLowerCase()}`}
            >
              {f}
              {f !== "All" && (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "0.7rem",
                    opacity: 0.7,
                  }}
                >
                  ({stats[f] ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* RFQ Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div
            style={{
              padding: "60px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
            <p>Loading RFQs...</p>
          </div>
        ) : displayRFQs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No RFQs found</h3>
            <p>
              {search
                ? `No results for "${search}"`
                : `No ${activeFilter !== "All" ? activeFilter : ""} RFQs yet.`}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/rfqs/create")}
              style={{ marginTop: "16px" }}
              id="create-first-rfq-btn"
            >
              + Create your first RFQ
            </button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: "var(--radius-card)" }}>
            <table>
              <thead>
                <tr>
                  <th>RFQ #</th>
                  <th>Title / Category</th>
                  <th>Deadline</th>
                  <th>Items / Vendors</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayRFQs.map((rfq) => (
                  <RFQRow
                    key={rfq._id}
                    rfq={rfq}
                    onView={(id) => navigate(`/rfqs/${id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result count */}
      {displayRFQs.length > 0 && (
        <p
          style={{
            marginTop: "12px",
            fontSize: "0.8125rem",
            color: "var(--muted)",
            textAlign: "right",
          }}
        >
          Showing {displayRFQs.length} RFQ{displayRFQs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
