import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './Activity.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function fmtAmt(n) {
  if (!n && n !== 0) return null;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

const ACTION_META = {
  REQUEST_CREATED:   { icon: '⊕', label: 'Request Created',  color: '#6C63FF' },
  APPROVAL_APPROVED: { icon: '✅', label: 'Approved',         color: '#38B2AC' },
  APPROVAL_REJECTED: { icon: '❌', label: 'Rejected',         color: '#E53E3E' },
  PO_GENERATED:      { icon: '📦', label: 'PO Generated',     color: '#9F99FF' },
  INVOICE_GENERATED: { icon: '🧾', label: 'Invoice / Payment', color: '#D69E2E' },
};

function getActionMeta(type) {
  return ACTION_META[type] || { icon: '🔔', label: type || 'Action', color: '#718096' };
}

// status derived from log array
function deriveStatus(logs) {
  const isPaid     = logs.some(l => l.description?.toLowerCase().includes('paid'));
  const hasPO      = logs.some(l => l.actionType === 'PO_GENERATED');
  const isRejected = logs.some(l => l.actionType === 'APPROVAL_REJECTED');
  const isApproved = logs.some(l => l.actionType === 'APPROVAL_APPROVED') && !isRejected;
  if (isPaid)     return { label: 'Paid',       color: '#38B2AC' };
  if (hasPO)      return { label: 'PO Issued',  color: '#6C63FF' };
  if (isRejected) return { label: 'Rejected',   color: '#E53E3E' };
  if (isApproved) return { label: 'Approved',   color: '#38B2AC' };
  return            { label: 'Pending',          color: '#D69E2E' };
}

// ── Single entity group card ──────────────────────────────────────────────────
function EntityGroup({ group, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const navigate = useNavigate();

  const firstLog   = group.logs[0];
  const status     = deriveStatus(group.logs);
  const displayAmt = group.grandTotal || group.amount;
  const shortId    = String(group._id).slice(-8).toUpperCase();

  // Extract readable title from first log description
  const rawTitle = firstLog?.description || '';
  const title = rawTitle
    .replace(/^New (RFQ|procurement request) created:\s*/i, '')
    .replace(/ from .*/i, '')
    .replace(/"([^"]+)".*/i, '$1')
    .replace(/^\s*"?/, '').replace(/"?\s*$/, '')
    .trim() || `Entity #${shortId}`;

  return (
    <div className={`act-group ${open ? 'act-group--open' : ''}`}>

      {/* ── Clickable header ────────────────────────────────────────────── */}
      <div className="act-group-header" onClick={() => setOpen(v => !v)} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setOpen(v => !v)}>
        <div className="act-group-icon-wrap">
          <div className="act-group-entity-icon">
            {firstLog ? getActionMeta(firstLog.actionType).icon : '📋'}
          </div>
        </div>

        <div className="act-group-info">
          <div className="act-group-title-row">
            <span className="act-group-title">{title}</span>
            <span className="act-group-badge" style={{ background: status.color + '22', color: status.color }}>
              {status.label}
            </span>
          </div>
          <div className="act-group-meta">
            <code className="act-group-id">#{shortId}</code>
            <span className="act-sep">·</span>
            <span>{group.entityType}</span>
            {displayAmt && (<><span className="act-sep">·</span><strong>{fmtAmt(displayAmt)}</strong></>)}
            <span className="act-sep">·</span>
            <span>{group.logs.length} event{group.logs.length !== 1 ? 's' : ''}</span>
            <span className="act-sep">·</span>
            <span className="act-group-lastdate">{fmtDate(group.latestAt)}</span>
          </div>
        </div>

        <button
          className={`act-toggle-btn ${open ? 'act-toggle-btn--open' : ''}`}
          aria-label={open ? 'Collapse' : 'Expand history'}
          tabIndex={-1}
        >
          <span className="act-toggle-icon">{open ? '▲' : '▼'}</span>
          <span className="act-toggle-label">{open ? 'Collapse' : 'History'}</span>
        </button>
      </div>

      {/* ── Expanded timeline ───────────────────────────────────────────── */}
      {open && (
        <div className="act-group-body">
          {group.logs.map((log, idx) => {
            const meta  = getActionMeta(log.actionType);
            const isLast = idx === group.logs.length - 1;
            return (
              <div key={log._id || idx} className="act-log-item">
                <div className="act-log-icon-col">
                  <div className="act-log-dot" style={{ background: meta.color }}>
                    <span>{meta.icon}</span>
                  </div>
                  {!isLast && <div className="act-log-vline" style={{ background: `${meta.color}44` }} />}
                </div>
                <div className="act-log-card">
                  <div className="act-log-card-top">
                    <span className="act-log-badge" style={{ background: meta.color + '1A', color: meta.color }}>
                      {meta.label}
                    </span>
                    {log.metadata?.grandTotal && (
                      <span className="act-log-amt">{fmtAmt(log.metadata.grandTotal)}</span>
                    )}
                    <button className="act-log-view-btn"
                      onClick={() => {
                        const routes = { Approval: `/approvals/${log.entityId}`, PurchaseOrder: '/invoices', Invoice: '/invoices' };
                        if (routes[log.entityType]) navigate(routes[log.entityType]);
                      }}
                    >View →</button>
                  </div>
                  <p className="act-log-desc">{log.description}</p>
                  <span className="act-log-time">{fmtDate(log.createdAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'latest',     label: '🕒 Most Recent' },
  { value: 'oldest',     label: '🕓 Oldest First' },
  { value: 'amount_desc', label: '₹ Highest Value' },
  { value: 'amount_asc',  label: '₹ Lowest Value' },
  { value: 'events_desc', label: '📊 Most Events' },
];

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'PO Issued', 'Paid'];

export const Activity = () => {
  const [groups, setGroups]       = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Filters (server-side)
  const [search, setSearch]       = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  // Client-side filters/sort
  const [statusFilter, setStatus] = useState('All');
  const [sortBy, setSortBy]       = useState('latest');
  const [minAmt, setMinAmt]       = useState('');
  const [maxAmt, setMaxAmt]       = useState('');
  const [showAdvanced, setShowAdv] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search)   params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo)   params.set('dateTo', dateTo);

      const res  = await fetch(`/api/v1/activity-logs/grouped?${params}`);
      const json = await res.json();
      if (json.success) { setGroups(json.data.groups || []); setTotal(json.data.total || 0); }
      else throw new Error(json.message || 'Failed to fetch');
    } catch (e) { setError(e.message); setGroups([]); }
    finally { setLoading(false); }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // Client-side: filter by status + amount range, then sort
  const filtered = groups
    .filter(g => {
      if (statusFilter !== 'All') {
        const s = deriveStatus(g.logs).label;
        if (s !== statusFilter) return false;
      }
      const amt = g.grandTotal || g.amount || 0;
      if (minAmt && amt < Number(minAmt)) return false;
      if (maxAmt && amt > Number(maxAmt)) return false;
      return true;
    })
    .sort((a, b) => {
      const aAmt = a.grandTotal || a.amount || 0;
      const bAmt = b.grandTotal || b.amount || 0;
      if (sortBy === 'oldest')     return new Date(a.latestAt) - new Date(b.latestAt);
      if (sortBy === 'amount_desc') return bAmt - aAmt;
      if (sortBy === 'amount_asc')  return aAmt - bAmt;
      if (sortBy === 'events_desc') return b.logs.length - a.logs.length;
      return new Date(b.latestAt) - new Date(a.latestAt); // latest (default)
    });

  const hasFilters = statusFilter !== 'All' || minAmt || maxAmt || dateFrom || dateTo || search;
  const clearAll = () => { setStatus('All'); setMinAmt(''); setMaxAmt(''); setDateFrom(''); setDateTo(''); setSearch(''); };

  return (
    <div className="act-layout">
      <Sidebar />
      <main className="act-main">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="act-header">
          <div>
            <p className="act-greeting">Audit Trail</p>
            <h1 className="act-title">Activity Logs</h1>
            <p className="act-subtitle">Click any entity card to expand its full procurement history</p>
          </div>
          <div className="act-header-right">
            <div className="act-stat-pill">
              <span className="act-stat-val">{filtered.length}</span>
              <span className="act-stat-lbl">Entities</span>
            </div>
          </div>
        </header>

        {/* ── Search + Sort bar ───────────────────────────────────────── */}
        <div className="act-top-bar">
          <div className="act-search-wrap">
            <span className="act-search-icon">🔍</span>
            <input className="act-search" type="text"
              placeholder="Search by description, vendor, RFQ title…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="act-search-clear" onClick={() => setSearch('')}>×</button>}
          </div>
          <div className="act-sort-wrap">
            <label className="act-sort-label">Sort</label>
            <select className="act-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button className={`act-adv-btn ${showAdvanced ? 'act-adv-btn--active' : ''}`} onClick={() => setShowAdv(v => !v)}>
            ⚙ Filters {hasFilters && <span className="act-adv-dot" />}
          </button>
        </div>

        {/* ── Advanced Filters ────────────────────────────────────────── */}
        {showAdvanced && (
          <div className="act-adv-panel">
            <div className="act-adv-grid">
              {/* Status filter */}
              <div className="act-adv-group">
                <label className="act-adv-label">Status</label>
                <div className="act-status-chips">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s}
                      className={`act-status-chip ${statusFilter === s ? 'act-status-chip--active' : ''}`}
                      onClick={() => setStatus(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="act-adv-group">
                <label className="act-adv-label">Value Range (₹)</label>
                <div className="act-range-row">
                  <input className="act-range-input" type="number" placeholder="Min (e.g. 50000)" value={minAmt} onChange={e => setMinAmt(e.target.value)} min="0" />
                  <span className="act-range-sep">to</span>
                  <input className="act-range-input" type="number" placeholder="Max (e.g. 500000)" value={maxAmt} onChange={e => setMaxAmt(e.target.value)} min="0" />
                </div>
              </div>

              {/* Date range */}
              <div className="act-adv-group">
                <label className="act-adv-label">Date Range</label>
                <div className="act-range-row">
                  <input className="act-range-input act-date-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <span className="act-range-sep">to</span>
                  <input className="act-range-input act-date-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </div>
            </div>

            {hasFilters && (
              <button className="act-clear-btn" onClick={clearAll}>✕ Clear All Filters</button>
            )}
          </div>
        )}

        {/* ── Groups ──────────────────────────────────────────────────── */}
        <div className="act-card">
          <div className="act-card-head">
            <p className="act-card-title"><span className="act-card-bar" />Procurement Audit Timeline</p>
            {!loading && <span className="act-card-count">{filtered.length} of {total}</span>}
          </div>

          {loading && <div className="act-loader"><div className="act-spinner" /><p>Loading…</p></div>}
          {!loading && error && (
            <div className="act-error">⚠ {error}
              <button className="act-retry" onClick={fetchGroups}>Retry</button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="act-empty">
              <span className="act-empty-icon">🗂</span>
              <p>No records match your filters.</p>
              {hasFilters && <button className="act-clear-btn" onClick={clearAll}>Clear Filters</button>}
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="act-groups">
              {filtered.map((g, i) => <EntityGroup key={g._id || i} group={g} defaultOpen={false} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Activity;
