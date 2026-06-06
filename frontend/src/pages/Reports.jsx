import React, { useState, useEffect, useRef } from 'react';
import './Reports.css';

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000");
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });

function fmt(n)  { return Number(n || 0).toLocaleString('en-IN'); }
function fmtL(n) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${fmt(n)}`;
}

const PALETTE = ['#6C63FF','#38B2AC','#D69E2E','#E53E3E','#9F99FF','#DD6B20','#805AD5','#2F855A'];

// ── SVG Area / Line Chart (replaces the flat bar chart) ──────────────────────
function AreaChart({ data, color = '#6C63FF', height = 220 }) {
  if (!data || data.length === 0) return <p className="rp-empty">No trend data.</p>;

  const W = 560; const H = height;
  const PAD = { top: 30, right: 20, bottom: 44, left: 60 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top  - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.amount), 1);
  // 5 nice Y gridlines
  const yTicks = Array.from({ length: 5 }, (_, i) => maxVal * (i / 4));

  const xOf = (i) => PAD.left + (i / (data.length - 1 || 1)) * iW;
  const yOf = (v) => PAD.top  + iH - (v / maxVal) * iH;

  // Build SVG polyline points
  const pts  = data.map((d, i) => `${xOf(i)},${yOf(d.amount)}`).join(' ');
  // Area path (closed at baseline)
  const areaD = [
    `M${xOf(0)},${yOf(data[0].amount)}`,
    ...data.slice(1).map((d, i) => {
      // Smooth bezier between points
      const x1 = xOf(i); const y1 = yOf(data[i].amount);
      const x2 = xOf(i + 1); const y2 = yOf(d.amount);
      const cx1 = x1 + (x2 - x1) * 0.5; const cx2 = x2 - (x2 - x1) * 0.5;
      return `C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`;
    }),
    `L${xOf(data.length - 1)},${PAD.top + iH}`,
    `L${xOf(0)},${PAD.top + iH}`,
    'Z',
  ].join(' ');
  // Line path only (no close)
  const lineD = [
    `M${xOf(0)},${yOf(data[0].amount)}`,
    ...data.slice(1).map((d, i) => {
      const x1 = xOf(i); const y1 = yOf(data[i].amount);
      const x2 = xOf(i + 1); const y2 = yOf(d.amount);
      const cx1 = x1 + (x2 - x1) * 0.5; const cx2 = x2 - (x2 - x1) * 0.5;
      return `C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`;
    }),
  ].join(' ');

  const gradId  = `area-grad-${color.replace('#','')}`;
  const glowId  = `area-glow-${color.replace('#','')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rp-area-chart" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.38" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Y-axis grid lines */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line
            x1={PAD.left} y1={yOf(v)} x2={W - PAD.right} y2={yOf(v)}
            stroke="rgba(163,177,198,0.3)" strokeWidth="1" strokeDasharray={i === 0 ? 'none' : '4,4'}
          />
          <text x={PAD.left - 8} y={yOf(v) + 4} textAnchor="end" fontSize="9" fill="#718096" fontFamily="DM Sans,sans-serif">
            {v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${gradId})`} />

      {/* Glow line */}
      <path d={lineD} fill="none" stroke={color} strokeWidth="5" strokeOpacity="0.18" filter={`url(#${glowId})`} strokeLinecap="round" strokeLinejoin="round" />

      {/* Main line */}
      <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points + labels */}
      {data.map((d, i) => (
        <g key={i}>
          {/* X label */}
          <text x={xOf(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#718096" fontFamily="DM Sans,sans-serif" fontWeight="600">
            {d.label}
          </text>

          {/* Vertical tick */}
          <line x1={xOf(i)} y1={PAD.top + iH} x2={xOf(i)} y2={PAD.top + iH + 5} stroke="rgba(163,177,198,0.5)" strokeWidth="1" />

          {/* Only draw circle + value if amount > 0 */}
          {d.amount > 0 && (
            <>
              {/* Shadow circle */}
              <circle cx={xOf(i)} cy={yOf(d.amount)} r="7" fill={color} opacity="0.15" />
              {/* Main dot */}
              <circle cx={xOf(i)} cy={yOf(d.amount)} r="4.5" fill={color} stroke="white" strokeWidth="2" />
              {/* Value label */}
              <text x={xOf(i)} y={yOf(d.amount) - 12} textAnchor="middle" fontSize="10" fill={color} fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="800">
                {d.amount >= 100000 ? `₹${(d.amount/100000).toFixed(2)}L` : d.amount >= 1000 ? `₹${(d.amount/1000).toFixed(1)}K` : `₹${d.amount}`}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}


// ── Horizontal Bar Chart ──────────────────────────────────────────────────────
function HBar({ data, showVal = true }) {
  const max = Math.max(...data.map(d => d.value ?? d.amount ?? 0), 1);
  return (
    <div className="rp-hbar-chart">
      {data.map((d, i) => {
        const v = d.value ?? d.amount ?? 0;
        return (
          <div key={i} className="rp-hbar-row">
            <span className="rp-hbar-cat">{d.label ?? d.category ?? d.vendor}</span>
            <div className="rp-hbar-track">
              <div className="rp-hbar-fill" style={{ width: `${(v / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
            </div>
            {showVal && <span className="rp-hbar-val">{typeof v === 'number' && v > 999 ? fmtL(v) : v}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── SVG Donut ─────────────────────────────────────────────────────────────────
function Donut({ segments, size = 140, stroke = 14 }) {
  const R = (size / 2) - stroke; const C = 2 * Math.PI * R; let offset = 0;
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  return (
    <div className="rp-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="#D4D8E2" strokeWidth={stroke} />
        {segments.map((seg, i) => {
          const pct = seg.value / total; const dash = pct * C; const gap = C - dash;
          const el = <circle key={i} cx={size/2} cy={size/2} r={R} fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset * C}
            transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dasharray 0.7s ease' }} />;
          offset += pct; return el;
        })}
        <text x={size/2} y={size/2 - 5} textAnchor="middle" fontSize="15" fontWeight="800" fill="#2D3748">{total}</text>
        <text x={size/2} y={size/2 + 12} textAnchor="middle" fontSize="9"  fill="#718096">Total</text>
      </svg>
      <div className="rp-donut-legend">
        {segments.map((s, i) => (
          <div key={i} className="rp-donut-leg-row">
            <span className="rp-donut-dot" style={{ background: s.color }} />
            <span className="rp-leg-label">{s.label}</span>
            <span className="rp-leg-val">{s.value}</span>
            <span className="rp-leg-pct">({total > 0 ? Math.round((s.value/total)*100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <div className="rp-kpi-card" style={{ '--acc': accent }}>
      <div className="rp-kpi-icon">{icon}</div>
      <div className="rp-kpi-body">
        <p className="rp-kpi-label">{label}</p>
        <p className="rp-kpi-value">{value}</p>
        {sub && <p className="rp-kpi-sub">{sub}</p>}
      </div>
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(data) {
  if (!data) return;
  const { kpis, spendByCategory, topVendors, monthlyTrend, pipeline, invoiceStatusDist } = data;
  const rows = [
    ['VendorBridge — Procurement Analytics Report'],
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
    ['=== KEY PERFORMANCE INDICATORS ==='],
    ['Metric','Value'],
    ['Total Paid Spend (₹)', kpis.totalSpend],
    ['Committed Spend (₹)', kpis.committedSpend],
    ['Pending Approvals', kpis.pendingApprovals],
    ['Approved Approvals', kpis.approvedApprovals],
    ['Rejected Approvals', kpis.rejectedApprovals],
    ['Approval Rate (%)', kpis.approvalRate],
    ['Avg Cycle Time (days)', kpis.avgCycleDays],
    ['Overdue Invoices', kpis.overdueInvoices],
    ['Paid Invoices', kpis.paidInvoices],
    ['PO Fulfillment (%)', kpis.poFulfillment],
    ['Total POs', kpis.totalPos],
    ['Completed POs', kpis.completedPos],
    [],
    ['=== SPEND BY CATEGORY ==='],
    ['Category', 'Amount (₹)'],
    ...spendByCategory.map(c => [c.category, c.amount]),
    [],
    ['=== TOP VENDORS BY SPEND ==='],
    ['Vendor', 'Spend (₹)', 'POs'],
    ...topVendors.map(v => [v.vendor, v.spend, v.pos]),
    [],
    ['=== MONTHLY TREND ==='],
    ['Month', 'Amount (₹)', 'PO Count'],
    ...monthlyTrend.map(m => [m.label, m.amount, m.count]),
    [],
    ['=== INVOICE STATUS DISTRIBUTION ==='],
    ['Status', 'Count'],
    ...invoiceStatusDist.map(i => [i.status, i.count]),
  ];
  const csv  = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'vendorbridge_analytics.csv' });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF Export (print-based, no deps) ────────────────────────────────────────
function exportPDF() {
  window.print();
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Reports() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [exporting, setExp]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${BASE}/api/v1/analytics/summary`, { headers: authH() });
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setData(json.data);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCSV = () => { setExp('csv'); exportCSV(data); setTimeout(() => setExp(''), 1500); };
  const handlePDF = () => { setExp('pdf'); setTimeout(() => { exportPDF(); setExp(''); }, 300); };

  if (loading) return (<div><main className="rp-main"><div className="rp-loader">Loading analytics…</div></main></div>);
  if (error)   return (<div><main className="rp-main"><div className="rp-error">{error}<p>Run <code>/api/v1/seed?force=1</code></p></div></main></div>);

  const { kpis, spendByCategory, invoiceStatusDist, topVendors, monthlyTrend, pipeline } = data;

  return (
    <div>
      <main className="rp-main" id="rp-print-area">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="rp-header">
          <div>
            <h1 className="rp-page-title">Reports &amp; Analytics</h1>
          </div>
          <div className="rp-export-group">
            <button className="rp-export-btn rp-export-btn--csv" onClick={handleCSV} disabled={!!exporting}>
              {exporting === 'csv' ? '⏳ Exporting…' : '⬇ Export CSV'}
            </button>
            <button className="rp-export-btn rp-export-btn--pdf" onClick={handlePDF} disabled={!!exporting}>
              {exporting === 'pdf' ? '⏳ Printing…' : '🖨 Export PDF'}
            </button>
          </div>
        </header>

        {/* ── KPI Row ────────────────────────────────────────────────────── */}
        <div className="rp-kpi-row">
          <KpiCard icon="💸" label="Total Paid Spend"    value={fmtL(kpis.totalSpend)}      sub={`Committed: ${fmtL(kpis.committedSpend)}`}  accent="#6C63FF" />
          <KpiCard icon="✅" label="Approval Rate"       value={`${kpis.approvalRate}%`}     sub={`${kpis.approvedApprovals} of ${kpis.totalApprovals} approved`} accent="#38B2AC" />
          <KpiCard icon="⚡" label="Avg Cycle Time"      value={`${kpis.avgCycleDays}d`}     sub="From submission to decision"               accent="#D69E2E" />
          <KpiCard icon="📦" label="PO Fulfillment"      value={`${kpis.poFulfillment}%`}    sub={`${kpis.completedPos}/${kpis.totalPos} POs completed`} accent="#9F99FF" />
          <KpiCard icon="🔴" label="Overdue Invoices"    value={kpis.overdueInvoices}        sub={`${kpis.paidInvoices} invoices paid`}       accent="#E53E3E" />
        </div>

        {/* ── Row 2: Monthly Trend + Approval Pipeline ───────────────────── */}
        <div className="rp-row-2">
          <div className="rp-card rp-card--trend">
            <p className="rp-card-title">Monthly Spend Trend</p>
            <AreaChart data={monthlyTrend} color="#6C63FF" height={230} />
          </div>
          <div className="rp-card rp-card--pipeline">
            <p className="rp-card-title">Approval Pipeline</p>
            <Donut segments={[
              { label: 'Approved', value: pipeline.approved, color: '#38B2AC' },
              { label: 'Pending',  value: pipeline.pending,  color: '#D69E2E' },
              { label: 'Rejected', value: pipeline.rejected, color: '#E53E3E' },
            ]} />
            <div className="rp-pipeline-metrics">
              <div className="rp-pm-item">
                <span className="rp-pm-val" style={{ color: '#38B2AC' }}>{kpis.approvalRate}%</span>
                <span className="rp-pm-label">Approval Rate</span>
              </div>
              <div className="rp-pm-item">
                <span className="rp-pm-val" style={{ color: '#D69E2E' }}>{kpis.avgCycleDays}d</span>
                <span className="rp-pm-label">Avg Cycle</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Spend by Category + Invoice Status ──────────────────── */}
        <div className="rp-row-3">
          <div className="rp-card">
            <p className="rp-card-title">Spend by Category (Approved)</p>
            {spendByCategory.length === 0
              ? <p className="rp-empty">No approved spend yet.</p>
              : <HBar data={spendByCategory.map(c => ({ label: c.category, value: c.amount }))} />}
          </div>
          <div className="rp-card">
            <p className="rp-card-title">Invoice Status Distribution</p>
            <Donut size={130} stroke={13} segments={invoiceStatusDist.filter(i => i.count > 0).map((i, idx) => ({
              label: i.status, value: i.count,
              color: ({ Paid: '#38B2AC', Overdue: '#E53E3E', Sent: '#D69E2E', Generated: '#9F99FF' })[i.status] || '#CBD5E0',
            }))} />
          </div>
        </div>

        {/* ── Row 4: Top Vendors + Commitment vs Paid ────────────────────── */}
        <div className="rp-row-3">
          <div className="rp-card">
            <p className="rp-card-title">Top Vendors by Spend</p>
            {topVendors.length === 0
              ? <p className="rp-empty">No vendor data yet.</p>
              : (
              <div className="rp-vendor-table-wrap">
                <table className="rp-vendor-table">
                  <thead><tr><th>#</th><th>Vendor</th><th>Spend</th><th>POs</th></tr></thead>
                  <tbody>
                    {topVendors.map((v, i) => (
                      <tr key={i}>
                        <td className="rp-rank">{i + 1}</td>
                        <td className="rp-vname">{v.vendor}</td>
                        <td className="rp-vspend">{fmtL(v.spend)}</td>
                        <td className="rp-vpos"><span className="rp-pos-badge">{v.pos}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rp-card">
            <p className="rp-card-title">Budget Utilisation</p>
            <div className="rp-utilisation">
              <div className="rp-util-ring-wrap">
                {/* Circular progress ring */}
                {(() => {
                  const pct    = kpis.committedSpend > 0 ? Math.min((kpis.totalSpend / kpis.committedSpend) * 100, 100) : 0;
                  const R      = 60; const C = 2 * Math.PI * R;
                  const dash   = (pct / 100) * C;
                  return (
                    <svg width="160" height="160" viewBox="0 0 160 160">
                      <circle cx="80" cy="80" r={R} fill="none" stroke="#D4D8E2" strokeWidth="14" />
                      <circle cx="80" cy="80" r={R} fill="none" stroke="#38B2AC" strokeWidth="14"
                        strokeDasharray={`${dash} ${C - dash}`}
                        strokeDashoffset={C * 0.25}
                        strokeLinecap="round"
                        transform="rotate(-90 80 80)"
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                      />
                      <text x="80" y="74"  textAnchor="middle" fontSize="20" fontWeight="800" fill="#2D3748">{Math.round(pct)}%</text>
                      <text x="80" y="92"  textAnchor="middle" fontSize="9.5" fill="#718096">Utilised</text>
                    </svg>
                  );
                })()}
              </div>
              <div className="rp-util-breakdown">
                <div className="rp-util-row">
                  <span className="rp-util-dot" style={{ background: '#38B2AC' }} />
                  <div>
                    <p className="rp-util-label">Paid</p>
                    <p className="rp-util-val">{fmtL(kpis.totalSpend)}</p>
                  </div>
                </div>
                <div className="rp-util-row">
                  <span className="rp-util-dot" style={{ background: '#9F99FF' }} />
                  <div>
                    <p className="rp-util-label">Committed</p>
                    <p className="rp-util-val">{fmtL(kpis.committedSpend)}</p>
                  </div>
                </div>
                <div className="rp-util-row">
                  <span className="rp-util-dot" style={{ background: '#E0E5EC' }} />
                  <div>
                    <p className="rp-util-label">Unpaid</p>
                    <p className="rp-util-val">{fmtL(Math.max(kpis.committedSpend - kpis.totalSpend, 0))}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Lifecycle Summary ───────────────────────────────────────────── */}
        <div className="rp-card rp-card--lifecycle">
          <p className="rp-card-title">Full Procurement Lifecycle Summary</p>
          <div className="rp-lifecycle-steps">
            {[
              { icon: '📋', label: 'Total Requests',  count: kpis.totalApprovals,         color: '#6C63FF' },
              { icon: '⏳', label: 'Pending',          count: pipeline.pending,             color: '#D69E2E' },
              { icon: '✅', label: 'Approved',         count: pipeline.approved,            color: '#38B2AC' },
              { icon: '❌', label: 'Rejected',         count: pipeline.rejected,            color: '#E53E3E' },
              { icon: '📦', label: 'POs Generated',    count: kpis.totalPos,               color: '#9F99FF' },
              { icon: '🏁', label: 'POs Completed',   count: kpis.completedPos,            color: '#38B2AC' },
              { icon: '💰', label: 'Invoices Paid',    count: kpis.paidInvoices,            color: '#D69E2E' },
              { icon: '',  label: 'Overdue',          count: kpis.overdueInvoices,         color: '#E53E3E' },
            ].map((s, i) => (
              <div key={i} className="rp-lc-step">
                <div className="rp-lc-icon">{s.icon}</div>
                <div className="rp-lc-count" style={{ color: s.color }}>{s.count}</div>
                <div className="rp-lc-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Vendor Spend Bar ────────────────────────────────────────────── */}
        {topVendors.length > 0 && (
          <div className="rp-card">
            <p className="rp-card-title">Vendor Spend Comparison</p>
            <HBar data={topVendors.map(v => ({ label: v.vendor, value: v.spend }))} />
          </div>
        )}

      </main>
    </div>
  );
}
