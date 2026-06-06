import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const BASE = 'http://localhost:5000';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });

function fmt(n)  { return Number(n || 0).toLocaleString('en-IN'); }
function fmtL(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${fmt(n)}`;
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Mini sparkline bar (pure CSS) ────────────────────────────────────────────
function SparkBar({ data, color }) {
  const max = Math.max(...data.map(d => d.amount), 1);
  return (
    <div className="db-spark">
      {data.map((d, i) => (
        <div key={i} className="db-spark-col" title={`${d.label}: ${fmtL(d.amount)}`}>
          <div className="db-spark-fill" style={{ height: `${Math.max((d.amount / max) * 100, d.amount > 0 ? 6 : 2)}%`, background: color }} />
          <span className="db-spark-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Status dot ───────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const map = {
    Pending:   '#D69E2E', Approved:  '#38B2AC', Rejected: '#E53E3E',
    Issued:    '#6C63FF', Completed: '#38B2AC', Overdue:  '#E53E3E',
    Generated: '#9F99FF', Paid:      '#38B2AC',
  };
  return <span className="db-dot" style={{ background: map[status] || '#CBD5E0' }} />;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent, onClick }) {
  return (
    <div className={`db-kpi${onClick ? ' db-kpi--click' : ''}`} onClick={onClick} style={{ '--acc': accent }}>
      <div className="db-kpi-top">
        <div className="db-kpi-icon">{icon}</div>
        <p className="db-kpi-label">{label}</p>
      </div>
      <p className="db-kpi-value">{value}</p>
      {sub && <p className="db-kpi-sub">{sub}</p>}
      {onClick && <span className="db-kpi-arrow">→</span>}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const now = new Date();

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${BASE}/api/v1/analytics/summary`, { headers: authHeader() });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load analytics');
        setData(json.data);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="db-main"><div className="db-loader">Loading dashboard…</div></div>
  );

  if (error) return (
    <div className="db-main">
      <div className="db-error">⚠ {error}
        <p style={{ fontSize: 13, marginTop: 10 }}>
          Seed the database: <a href={`${BASE}/api/v1/seed`} target="_blank" rel="noreferrer"><code>/api/v1/seed</code></a>
        </p>
      </div>
    </div>
  );

  const { kpis, monthlyTrend, recentPOs, recentApprovals, spendByCategory, pipeline } = data;

  return (
    <div>
      <main className="db-main">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="db-header">
          <div>
            <p className="db-greeting">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, Procurement Officer 👋</p>
            <h1 className="db-title">Dashboard</h1>
            <p className="db-subtitle">Today's Overview — {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="db-header-actions">
            <button className="db-action-pill" onClick={() => navigate('/rfqs/create')}>⊕ New RFQ</button>
            <button className="db-action-pill db-action-pill--primary" onClick={() => navigate('/reports')}>📊 Analytics</button>
          </div>
        </header>

        {/* ── KPI Row ────────────────────────────────────────────────────── */}
        <div className="db-kpi-row">
          <KpiCard icon="⏳" label="Pending Approvals"  value={kpis.pendingApprovals}       sub="Awaiting L1 or L2 sign-off"   accent="#D69E2E" onClick={() => navigate('/approvals')} />
          <KpiCard icon="💸" label="Committed Spend"    value={fmtL(kpis.committedSpend)}    sub={`Paid: ${fmtL(kpis.totalSpend)}`} accent="#6C63FF" onClick={() => navigate('/invoices')} />
          <KpiCard icon="📦" label="PO Fulfillment"     value={`${kpis.poFulfillment}%`}     sub={`${kpis.completedPos}/${kpis.totalPos} POs completed`} accent="#38B2AC" onClick={() => navigate('/invoices')} />
          <KpiCard icon="🔴" label="Overdue Invoices"   value={kpis.overdueInvoices}         sub={`${kpis.paidInvoices} invoices paid`} accent="#E53E3E" onClick={() => navigate('/invoices')} />
        </div>

        {/* ── Row 2 — Trend + Approval Funnel ────────────────────────────── */}
        <div className="db-row-2">
          <div className="db-card db-card--trend">
            <div className="db-card-head">
              <p className="db-card-title">Spending Trend</p>
              <span className="db-card-badge">Last 6 months</span>
            </div>
            <SparkBar data={monthlyTrend} color="#6C63FF" />
            <div className="db-trend-footer">
              <span>Total committed: <strong>{fmtL(kpis.committedSpend)}</strong></span>
            </div>
          </div>

          <div className="db-card db-card--funnel">
            <div className="db-card-head">
              <p className="db-card-title">Approval Funnel</p>
            </div>
            <div className="db-funnel">
              {[
                { label: 'Total Requests',  value: kpis.totalApprovals, w: 100,  color: '#6C63FF' },
                { label: 'Approved',         value: pipeline.approved,   w: kpis.totalApprovals ? Math.round((pipeline.approved / kpis.totalApprovals) * 100) : 0,  color: '#38B2AC' },
                { label: 'Pending',          value: pipeline.pending,    w: kpis.totalApprovals ? Math.round((pipeline.pending  / kpis.totalApprovals) * 100) : 0,  color: '#D69E2E' },
                { label: 'Rejected',         value: pipeline.rejected,   w: kpis.totalApprovals ? Math.round((pipeline.rejected / kpis.totalApprovals) * 100) : 0,  color: '#E53E3E' },
              ].map(f => (
                <div key={f.label} className="db-funnel-row">
                  <span className="db-funnel-label">{f.label}</span>
                  <div className="db-funnel-track">
                    <div className="db-funnel-bar" style={{ width: `${f.w}%`, background: f.color }} />
                  </div>
                  <span className="db-funnel-val" style={{ color: f.color }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3 — Recent POs + Recent Approvals ──────────────────────── */}
        <div className="db-row-3">
          <div className="db-card">
            <div className="db-card-head">
              <p className="db-card-title">Recent Purchase Orders</p>
              <button className="db-see-all" onClick={() => navigate('/invoices')}>See all →</button>
            </div>
            {recentPOs.length === 0
              ? <p className="db-empty">No purchase orders yet.</p>
              : (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead><tr><th>PO #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentPOs.map(po => (
                      <tr key={po._id} className="db-table-row" onClick={() => navigate('/invoices')}>
                        <td className="db-po-num">{po.poNumber}</td>
                        <td>{po.vendor?.name || '—'}</td>
                        <td className="db-amount">₹{fmt(po.grandTotal)}</td>
                        <td><div className="db-status-cell"><StatusDot status={po.status} />{po.status}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="db-card">
            <div className="db-card-head">
              <p className="db-card-title">Recent Approval Requests</p>
              <button className="db-see-all" onClick={() => navigate('/approvals')}>See all →</button>
            </div>
            {recentApprovals.length === 0
              ? <p className="db-empty">No approval requests yet.</p>
              : (
              <div className="db-approval-feed">
                {recentApprovals.map(a => (
                  <div key={a._id} className="db-approval-item" onClick={() => navigate(`/approvals/${a._id}`)}>
                    <div className="db-approval-avatar">{a.snapshot?.vendorName?.[0] || '?'}</div>
                    <div className="db-approval-info">
                      <p className="db-approval-title">{a.snapshot?.rfqTitle || a.snapshot?.rfqNumber}</p>
                      <p className="db-approval-meta">
                        {a.status === 'Pending' ? 'Awaiting approval' : a.status}
                        {' · '}₹{fmt(a.snapshot?.totalAmount)}
                      </p>
                    </div>
                    <StatusDot status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Row 4 — Spend by Category + Quick Actions ──────────────────── */}
        <div className="db-row-4">
          <div className="db-card">
            <div className="db-card-head">
              <p className="db-card-title">Spend by Category (Approved)</p>
              <button className="db-see-all" onClick={() => navigate('/reports')}>Full report →</button>
            </div>
            {spendByCategory.length === 0
              ? <p className="db-empty">Approve requests to see category spend.</p>
              : (
              <div className="db-cat-list">
                {spendByCategory.map((c, i) => {
                  const colors = ['#6C63FF','#38B2AC','#D69E2E','#E53E3E','#9F99FF'];
                  const maxAmt = spendByCategory[0].amount;
                  return (
                    <div key={i} className="db-cat-row">
                      <span className="db-cat-name">{c.category}</span>
                      <div className="db-cat-track">
                        <div className="db-cat-bar" style={{ width: `${(c.amount / maxAmt) * 100}%`, background: colors[i % colors.length] }} />
                      </div>
                      <span className="db-cat-val">{fmtL(c.amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="db-card db-card--actions">
            <p className="db-card-title">Quick Actions</p>
            <div className="db-quick-actions">
              {[
                { icon: '📋', label: 'View RFQs',        sub: 'Create & manage RFQs',    path: '/rfqs',      color: '#6C63FF' },
                { icon: '✦',  label: 'View Approvals',   sub: `${kpis.pendingApprovals} pending`,  path: '/approvals', color: '#38B2AC' },
                { icon: '📊', label: 'Full Analytics',   sub: 'Reports & insights',      path: '/reports',   color: '#D69E2E' },
              ].map((a, i) => (
                <button key={i} className="db-qa-btn" onClick={() => navigate(a.path)} style={{ '--qacolor': a.color }}>
                  <span className="db-qa-icon">{a.icon}</span>
                  <div className="db-qa-text">
                    <p className="db-qa-label">{a.label}</p>
                    <p className="db-qa-sub">{a.sub}</p>
                  </div>
                  <span className="db-qa-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
