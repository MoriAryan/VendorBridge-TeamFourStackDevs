import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth.js';
import EmailModal from '../components/EmailModal.jsx';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';
import './POInvoice.css';

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000");
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });

function fmt(n) { return Number(n || 0).toLocaleString('en-IN'); }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = status || 'Sent';
  const label = { Sent: 'Pending Payment', Paid: 'Paid', Overdue: 'Overdue', Generated: 'Generated' }[s] || s;
  
  const colors = {
    Sent:      { color: '#D69E2E', bg: 'rgba(214,158,46,0.1)' },
    Overdue:   { color: '#E53E3E', bg: 'rgba(229,62,62,0.1)' },
    Paid:      { color: '#38B2AC', bg: 'rgba(56,178,172,0.1)' },
    Generated: { color: '#6C63FF', bg: 'rgba(108,99,255,0.1)' },
  }[s] || { color: '#718096', bg: 'rgba(113,128,150,0.1)' };

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '999px',
      fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
      color: colors.color, background: colors.bg
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.color }}></span>
      {label}
    </span>
  );
}

// ── Invoice List View ─────────────────────────────────────────────────────
function InvoiceListView({ list, loading, error, onSelect }) {
  const [filter, setFilter] = useState('All');
  
  if (loading) return <div className="pi-loader">Loading invoices…</div>;
  if (error) return <div className="pi-error">{error}</div>;

  const filtered = filter === 'All' 
    ? list 
    : list.filter(i => (filter === 'Pending Payment' ? i.status === 'Sent' : i.status === filter));

  const stats = {
    All: list.length,
    'Pending Payment': list.filter(i => i.status === 'Sent').length,
    Paid: list.filter(i => i.status === 'Paid').length,
    Overdue: list.filter(i => i.status === 'Overdue').length,
    Generated: list.filter(i => i.status === 'Generated').length,
  };

  return (
    <div className="pi-dashboard">
      <header className="pi-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="pi-page-title">Invoices</h1>
          <p className="pi-page-subtitle">Manage purchase orders, invoices, and payments</p>
        </div>
      </header>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['All', 'Pending Payment', 'Overdue', 'Paid', 'Generated'].map(f => {
          if (f !== 'All' && stats[f] === 0) return null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: filter === f ? 700 : 500,
                background: filter === f ? 'var(--bg)' : 'transparent',
                boxShadow: filter === f ? 'var(--sh-in-sm)' : 'none',
                color: filter === f ? 'var(--accent)' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              {f} <span style={{ opacity: 0.6, marginLeft: '4px' }}>({stats[f]})</span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="pi-empty card">No invoices found for this filter.</div>
      ) : (
        <div className="pi-list-grid">
          {filtered.map(inv => {
            const po = inv.purchaseOrderId;
            return (
              <div 
                key={inv._id} 
                className="card pi-list-card" 
                onClick={() => onSelect(inv._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{po?.poNumber || 'PO—'}</div>
                  <StatusBadge status={inv.status} />
                </div>
                
                <div style={{ fontSize: '0.875rem', color: 'var(--fg)', marginBottom: '4px' }}>
                  <strong>Vendor:</strong> {po?.vendor?.name || '—'}
                </div>
                
                <div style={{ fontSize: '0.8125rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span>{fmtDate(inv.createdAt)}</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
                    Rs. {fmt(po?.grandTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [list, setList]             = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [data, setData]             = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMsg, setActionMsg]   = useState('');
  const [showEmail, setShowEmail]   = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Fetch all invoices
  const fetchList = async () => {
    try {
      setListLoading(true);
      const res  = await fetch(`${BASE}/api/v1/invoices`, { headers: authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setList(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setListLoading(false);
    }
  };

  // Fetch detail
  const fetchDetail = async (invoiceId) => {
    if (!invoiceId) return;
    try {
      setDetailLoading(true);
      setError('');
      setData(null);

      const res  = await fetch(`${BASE}/api/v1/invoices/${invoiceId}`, { headers: authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const { invoice, po } = json.data;
      setData({ invoice, po });
      setActionMsg('');
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { 
    if (!id) fetchList(); 
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchDetail(id);
    }
  }, [id]);

  const handleMarkPaid = async () => {
    setSubmitting(true);
    try {
      const res  = await fetch(`${BASE}/api/v1/invoices/${data.invoice._id}/mark-paid`, { method: 'PATCH', headers: authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      
      const updated = { ...data.invoice, status: 'Paid', paidAt: json.data.paidAt };
      setData(prev => ({ ...prev, invoice: updated }));
      setActionMsg('✓ Invoice marked as Paid. Purchase Order updated to Completed.');
    } catch (e) {
      setActionMsg(`${e.message}`);
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

  // If no ID is provided, show the dashboard list
  if (!id) {
    return (
      <div className="pi-layout">
        <main className="pi-main">
          <InvoiceListView 
            list={list} 
            loading={listLoading} 
            error={error} 
            onSelect={(invoiceId) => navigate(`/invoices/${invoiceId}`)} 
          />
        </main>
      </div>
    );
  }

  // Detail View
  const status      = data?.invoice?.status || 'Sent';
  const statusLabel = { Sent: 'Pending Payment', Paid: 'Paid', Overdue: 'Overdue', Generated: 'Generated' }[status] || status;

  return (
    <div className="pi-layout">
      <main className="pi-main">
        {detailLoading && <div className="pi-loader">Loading invoice details…</div>}
        {error && !detailLoading && (
          <div className="card pi-error">
            <p>{error}</p>
            <button className="pi-action-btn" onClick={() => navigate('/invoices')} style={{ marginTop: '16px' }}>← Back to Invoices</button>
          </div>
        )}

        {!detailLoading && data && (
          <>
            {/* Header */}
            <header className="pi-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={() => navigate('/invoices')}
                  style={{
                    padding: '8px', border: 'none', background: 'var(--bg)', borderRadius: '50%',
                    boxShadow: 'var(--sh-out-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ←
                </button>
                <div>
                  <h1 className="pi-page-title">Purchase Order &amp; Invoice</h1>
                  <p className="pi-page-subtitle">{data.po?.poNumber} · Auto-generated</p>
                </div>
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
              {/* Billing Info */}
              <div className="pi-card" style={{ marginBottom: '24px' }}>
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
              <div className="pi-meta" style={{ marginBottom: '24px' }}>
                {[
                  { label: 'PO Number',     value: data.po?.poNumber },
                  { label: 'Invoice Date',  value: fmtDate(data.invoice?.invoiceDate) },
                  { label: 'PO Date',       value: fmtDate(data.po?.poDate) },
                  { label: 'Due Date',      value: fmtDate(data.invoice?.dueDate), warn: status === 'Overdue' },
                ].map(m => (
                  <div key={m.label} className="pi-meta-item">
                    <p className="pi-meta-label">{m.label}</p>
                    <p className="pi-meta-value" style={m.warn ? { color: 'var(--danger)' } : {}}>
                      {m.value} {m.warn && ''}
                    </p>
                  </div>
                ))}
              </div>

              {/* Line Items */}
              <div className="pi-card" style={{ marginBottom: '24px' }}>
                <p className="pi-card-title">Line Items</p>
                <div className="pi-table-wrap">
                  <table className="pi-table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: "150px" }}>Item</th>
                        <th style={{ minWidth: "80px" }}>Qty</th>
                        <th style={{ minWidth: "120px", textAlign: 'right' }}>Unit Price (Rs.)</th>
                        <th style={{ minWidth: "120px", textAlign: 'right' }}>Total (Rs.)</th>
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

              {/* Footer / Status */}
              <footer className="pi-card pi-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <StatusBadge status={status} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    Current Status: {statusLabel}
                    {data.invoice?.paidAt && ` (Paid on ${fmtDate(data.invoice.paidAt)})`}
                  </span>
                </div>
                
                {status !== 'Paid' && getCurrentUser()?.role !== 'vendor' && (
                  <button id="btn-mark-paid" className="pi-mark-paid-btn" onClick={handleMarkPaid} disabled={submitting}>
                    {submitting ? 'Processing…' : '✓ Mark as Paid'}
                  </button>
                )}
              </footer>
            </div>

            {actionMsg && <div className="pi-action-msg" style={{ marginTop: '24px' }}>{actionMsg}</div>}
          </>
        )}
      </main>

      {showEmail && <EmailModal po={data?.po} invoice={data?.invoice} onClose={() => setShowEmail(false)} />}
    </div>
  );
}
