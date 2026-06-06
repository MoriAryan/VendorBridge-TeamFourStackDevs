import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EmailModal from '../components/EmailModal';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import './POInvoice.css';

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Invoice List Panel ────────────────────────────────────────────────────
function InvoiceList({ list, activeId, onSelect, loading, panelOpen, onTogglePanel }) {
  const [collapsed, setCollapsed] = useState({ Sent: false, Paid: true, Overdue: false, Generated: true });
  const toggle = (g) => setCollapsed(prev => ({ ...prev, [g]: !prev[g] }));

  if (loading) return <div className="pi-list-loading">Loading…</div>;

  const groups = {
    Sent:      list.filter(i => i.status === 'Sent'),
    Overdue:   list.filter(i => i.status === 'Overdue'),
    Paid:      list.filter(i => i.status === 'Paid'),
    Generated: list.filter(i => i.status === 'Generated'),
  };

  const statusColor = { Sent: '#F59E0B', Overdue: '#EF4444', Paid: '#38B2AC', Generated: '#6C63FF' };

  return (
    <aside className={`pi-list-panel${panelOpen ? '' : ' pi-list-panel--hidden'}`}>
      <div className="pi-list-header">
        <h2 className="pi-list-title">Invoices</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pi-list-count">{list.length}</span>
          <button className="pi-panel-toggle" onClick={onTogglePanel} title="Collapse panel" aria-label="Collapse panel">
            ‹
          </button>
        </div>
      </div>

      {Object.entries(groups).map(([groupName, items]) =>
        items.length === 0 ? null : (
          <div key={groupName} className="pi-list-group">
            <button
              className="pi-list-group-btn"
              onClick={() => toggle(groupName)}
              aria-expanded={!collapsed[groupName]}
            >
              <span className="pi-list-group-label" style={{ color: statusColor[groupName] }}>
                {groupName} ({items.length})
              </span>
              <span className={`pi-list-chevron${collapsed[groupName] ? '' : ' pi-list-chevron--open'}`}>›</span>
            </button>

            {!collapsed[groupName] && items.map(inv => {
              const po = inv.purchaseOrderId;
              return (
                <button
                  key={inv._id}
                  className={`pi-list-item${inv._id === activeId ? ' pi-list-item--active' : ''}`}
                  onClick={() => onSelect(inv._id)}
                >
                  <div className="pi-list-item-top">
                    <span className="pi-list-item-po">{po?.poNumber || 'PO—'}</span>
                    <span className="pi-list-item-badge" style={{ background: statusColor[inv.status] + '22', color: statusColor[inv.status] }}>
                      {inv.status}
                    </span>
                  </div>
                  <p className="pi-list-item-vendor">{po?.vendor?.name || '—'}</p>
                  <p className="pi-list-item-amount">Rs. {fmt(po?.grandTotal)}</p>
                </button>
              );
            })}
          </div>
        )
      )}
    </aside>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function POInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [panelOpen, setPanelOpen] = useState(true);
  const [list, setList]             = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [data, setData]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg]   = useState('');
  const [showEmail, setShowEmail]   = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Fetch all invoices for list panel
  const fetchList = async () => {
    try {
      setListLoading(true);
      const res  = await fetch('/api/v1/invoices');
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setList(json.data);
      // Auto-select: use URL param, else first overdue, else first
      if (!id && json.data.length) {
        const first = json.data.find(i => i.status === 'Overdue') ||
                      json.data.find(i => i.status === 'Sent')    ||
                      json.data[0];
        navigate(`/invoices/${first._id}`, { replace: true });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setListLoading(false);
    }
  };

  // Fetch one invoice + its PO in ONE call (controller now returns {invoice, po})
  const fetchDetail = async (invoiceId) => {
    if (!invoiceId) return;
    try {
      setDetailLoading(true);
      setError('');
      setData(null);

      const res  = await fetch(`/api/v1/invoices/${invoiceId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      // Updated controller returns: { success, data: { invoice, po } }
      const { invoice, po } = json.data;
      setData({ invoice, po });
      setActionMsg('');
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  // Refresh list when navigated to an invoice ID that isn't in the list yet
  // (this happens when user clicks "View Generated Invoice" after an approval)
  useEffect(() => {
    if (id) {
      const inList = list.find(i => i._id === id);
      if (!inList && !listLoading) {
        // Newly generated invoice — refresh list to include it
        fetchList();
      }
      fetchDetail(id);
    }
  }, [id]);

  const handleSelect = (invoiceId) => navigate(`/invoices/${invoiceId}`);

  const handleMarkPaid = async () => {
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/v1/invoices/${data.invoice._id}/mark-paid`, { method: 'PATCH' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const updated = { ...data.invoice, status: 'Paid', paidAt: json.data.paidAt };
      setData(prev => ({ ...prev, invoice: updated }));
      setList(prev => prev.map(i => i._id === updated._id ? { ...i, status: 'Paid' } : i));
      setActionMsg('✓ Invoice marked as Paid. Purchase Order updated to Completed.');
    } catch (e) {
      setActionMsg(`⚠ ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    setPdfLoading(true);
    try { generateInvoicePDF(data?.po, data?.invoice); }
    catch (e) { alert('PDF error: ' + e.message); }
    finally { setPdfLoading(false); }
  };

  const status      = data?.invoice?.status || 'Sent';
  const statusLabel = { Sent: 'Pending Payment', Paid: 'Paid', Overdue: 'Overdue', Generated: 'Generated' }[status] || status;

  return (
    <div className="pi-layout">
      <Sidebar />

      {/* Invoice list panel */}
      <InvoiceList
        list={list}
        activeId={id}
        onSelect={handleSelect}
        loading={listLoading}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen(p => !p)}
      />

      <main className="pi-main">
        {!panelOpen && (
          <button
            className="pi-panel-expand"
            onClick={() => setPanelOpen(true)}
            title="Show invoice list"
            aria-label="Show invoice list"
          >
            ›
          </button>
        )}
        {detailLoading && <div className="pi-loader">Loading invoice…</div>}
        {error && !detailLoading && (
          <div className="pi-error">⚠ {error}
            <p className="pi-error-hint">Try <code>/api/v1/seed?force=1</code></p>
          </div>
        )}

        {!detailLoading && data && (
          <>
            {/* Header */}
            <header className="pi-header">
              <div>
                <h1 className="pi-page-title">Purchase Order &amp; Invoice</h1>
                <p className="pi-page-subtitle">{data.po?.poNumber} · Auto-generated after approval</p>
              </div>
              <div className="pi-actions">
                <button className="pi-action-btn" onClick={handleDownload} disabled={pdfLoading}>
                  {pdfLoading ? '⏳ Generating…' : '⬇ Download PDF'}
                </button>
                <button className="pi-action-btn" onClick={() => window.print()}>⎙ Print</button>
                <button className="pi-action-btn pi-action-btn--primary" onClick={() => setShowEmail(true)}>
                  ✉ Email Invoice
                </button>
              </div>
            </header>

            <div id="po-invoice-content">
              <div className="pi-immutable-note">
                <span>🔒</span> Auto-generated &amp; locked — all data read-only (Rules 2 &amp; 3).
              </div>

              {/* Billing */}
              <div className="pi-card">
                <p className="pi-card-title">Billing Information</p>
                <div className="pi-billing">
                  <div className="pi-billing-section">
                    <h3>Bill To</h3>
                    <p className="pi-billing-name">{data.po?.billTo?.name}</p>
                    <p className="pi-billing-detail">{data.po?.billTo?.address}</p>
                    <span className="pi-gstin">GSTIN: {data.po?.billTo?.gstin}</span>
                  </div>
                  <div className="pi-billing-section">
                    <h3>Vendor</h3>
                    <p className="pi-billing-name">{data.po?.vendor?.name}</p>
                    <p className="pi-billing-detail">{data.po?.vendor?.address}</p>
                    <span className="pi-gstin">GSTIN: {data.po?.vendor?.gstin}</span>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="pi-meta">
                {[
                  { label: 'PO Number',     value: data.po?.poNumber },
                  { label: 'Invoice Date',  value: fmtDate(data.invoice?.invoiceDate) },
                  { label: 'PO Date',       value: fmtDate(data.po?.poDate) },
                  { label: 'Due Date',      value: fmtDate(data.invoice?.dueDate), warn: status === 'Overdue' },
                ].map(m => (
                  <div key={m.label} className="pi-meta-item">
                    <p className="pi-meta-label">{m.label}</p>
                    <p className="pi-meta-value" style={m.warn ? { color: 'var(--danger)' } : {}}>
                      {m.value} {m.warn && '⚠'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div className="pi-card">
                <p className="pi-card-title">Line Items</p>
                <div className="pi-table-wrap">
                  <table className="pi-table">
                    <thead>
                      <tr>
                        <th>Item</th><th>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Price (Rs.)</th>
                        <th style={{ textAlign: 'right' }}>Total (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.po?.lineItems?.map((row, i) => (
                        <tr key={i}>
                          <td>{row.item}</td><td>{row.qty}</td>
                          <td className="pi-td-right">{fmt(row.unitPrice)}</td>
                          <td className="pi-td-right">{fmt(row.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pi-totals">
                  <div className="pi-totals-box">
                    {[
                      { label: 'Subtotal',    value: fmt(data.po?.subtotal) },
                      { label: 'CGST (9%)',   value: fmt(data.po?.cgst) },
                      { label: 'SGST (9%)',   value: fmt(data.po?.sgst) },
                    ].map(t => (
                      <div key={t.label} className="pi-totals-row">
                        <span className="pi-totals-label">{t.label}</span>
                        <span className="pi-totals-value">Rs. {t.value}</span>
                      </div>
                    ))}
                    <div className="pi-totals-row pi-totals-grand">
                      <span className="pi-totals-label">Grand Total</span>
                      <span className="pi-totals-value">Rs. {fmt(data.po?.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <footer className="pi-card pi-footer">
                <div className={`pi-status-pill pi-status-pill--${status.toLowerCase()}`}>
                  <span className={`pi-status-dot pi-status-dot--${status.toLowerCase()}`} />
                  Status: {statusLabel}
                  {data.invoice?.paidAt && (
                    <span style={{ fontWeight: 400, marginLeft: 8 }}>({fmtDate(data.invoice.paidAt)})</span>
                  )}
                </div>
                {status !== 'Paid' && (
                  <button id="btn-mark-paid" className="pi-mark-paid-btn" onClick={handleMarkPaid} disabled={submitting}>
                    {submitting ? 'Processing…' : '✓ Mark as Paid'}
                  </button>
                )}
              </footer>
            </div>

            {actionMsg && <div className="pi-action-msg">{actionMsg}</div>}
          </>
        )}

        {!detailLoading && !data && !error && (
          <div className="pi-empty">Select an invoice from the list to view details.</div>
        )}
      </main>

      {showEmail && <EmailModal po={data?.po} invoice={data?.invoice} onClose={() => setShowEmail(false)} />}
    </div>
  );
}
