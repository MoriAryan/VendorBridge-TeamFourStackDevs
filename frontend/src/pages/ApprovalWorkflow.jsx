import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth.js';
import './ApprovalWorkflow.css';

const BASE = 'http://localhost:5000';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });

const STEPS = ['Submitted', 'L1 Review', 'L2 Approval', 'Generate PO'];

function StarRating({ value = 0, max = 5 }) {
  return (
    <div className="aw-rating">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`aw-star${i < Math.floor(value) ? ' aw-star--filled' : ''}`}>★</span>
      ))}
      <span className="aw-rating-text">{value}/{max}</span>
    </div>
  );
}

// ── Request List Panel (collapsible groups) ───────────────────────────────
function RequestList({ list, activeId, onSelect, loading, panelOpen, onTogglePanel }) {
  const [collapsed, setCollapsed] = useState({ Pending: false, Approved: true, Rejected: true });
  const toggle = (g) => setCollapsed(prev => ({ ...prev, [g]: !prev[g] }));

  if (loading) return <div className="aw-list-loading">Loading…</div>;

  const groups = {
    Pending:  list.filter(a => a.status === 'Pending'),
    Approved: list.filter(a => a.status === 'Approved'),
    Rejected: list.filter(a => a.status === 'Rejected'),
  };

  return (
    <aside className={`aw-list-panel${panelOpen ? '' : ' aw-list-panel--hidden'}`}>
      <div className="aw-list-header">
        <h2 className="aw-list-title">Requests</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="aw-list-count">{list.length}</span>
          <button className="aw-panel-toggle" onClick={onTogglePanel} title="Collapse panel" aria-label="Collapse panel">
            ‹
          </button>
        </div>
      </div>

      {Object.entries(groups).map(([groupName, items]) =>
        items.length === 0 ? null : (
          <div key={groupName} className="aw-list-group">
            <button
              className="aw-list-group-btn"
              onClick={() => toggle(groupName)}
              aria-expanded={!collapsed[groupName]}
            >
              <span className={`aw-list-group-label aw-list-group-label--${groupName.toLowerCase()}`}>
                {groupName} ({items.length})
              </span>
              <span className={`aw-list-chevron${collapsed[groupName] ? '' : ' aw-list-chevron--open'}`}>›</span>
            </button>

            {!collapsed[groupName] && items.map(a => (
              <button
                key={a._id}
                className={`aw-list-item${a._id === activeId ? ' aw-list-item--active' : ''}`}
                onClick={() => onSelect(a._id)}
              >
                <div className="aw-list-item-top">
                  <span className="aw-list-item-rfq">{a.snapshot?.rfqTitle || a.rfqTitle}</span>
                  <span className={`aw-list-item-badge aw-list-item-badge--${a.status.toLowerCase()}`}>
                    {a.status}
                  </span>
                </div>
                <p className="aw-list-item-vendor">{a.snapshot?.vendorName || a.vendor?.name}</p>
                <p className="aw-list-item-amount">Rs. {Number(a.snapshot?.totalAmount || a.quotationAmount).toLocaleString('en-IN')}</p>
              </button>
            ))}
          </div>
        )
      )}
    </aside>
  );
}

// ── Main Detail View ──────────────────────────────────────────────────────
export default function ApprovalWorkflow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [list, setList]           = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [approval, setApproval]   = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);  // set when approval is Approved
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError]         = useState('');
  const [remarks, setRemarks]     = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const currentUser = getCurrentUser();

  // Redirect vendors away from approvals
  useEffect(() => {
    if (currentUser?.role === 'vendor') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  // Fetch all approvals for the list panel
  const fetchList = async () => {
    try {
      setListLoading(true);
      const res  = await fetch(`${BASE}/api/v1/approvals`, { headers: authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setList(json.data.approvals || json.data);
      // Auto-select: use URL param, else first pending, else first item
      const approvalsList = json.data.approvals || json.data;
      if (!id && approvalsList.length) {
        const firstPending = approvalsList.find(a => a.status === 'Pending') || approvalsList[0];
        navigate(`/approvals/${firstPending._id}`, { replace: true });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setListLoading(false);
    }
  };

  // Fetch one approval for the detail panel
  const fetchDetail = async (approvalId) => {
    if (!approvalId) return;
    try {
      setDetailLoading(true);
      setError('');
      const res  = await fetch(`${BASE}/api/v1/approvals/${approvalId}`, { headers: authH() });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setApproval(json.data);
      setInvoiceId(json.invoiceId || null);   // populated when status === Approved
      setRemarks('');
      setFormError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);
  useEffect(() => { if (id) fetchDetail(id); }, [id]);

  const handleSelect = (approvalId) => navigate(`/approvals/${approvalId}`);

  const handleAction = async (action) => {
    if (!remarks.trim()) { setFormError('Remarks are required.'); return; }
    setFormError('');
    setSubmitting(true);
    try {
      const pendingLevel = approval.approvalChain.find(l => l.status === 'Pending');
      if (!pendingLevel) throw new Error("No pending approval level found.");

      const newDecision = action === 'approve' ? 'Approved' : 'Rejected';
      const res  = await fetch(`${BASE}/api/v1/approvals/${approval._id}/decide`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', ...authH() },
        body:    JSON.stringify({ level: pendingLevel.level, decision: newDecision, remarks }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setApproval(json.data);
      if (json.invoiceId) setInvoiceId(json.invoiceId);   // capture generated invoice ID
      setRemarks('');
      setList(prev => prev.map(a => a._id === json.data._id ? { ...a, status: json.data.status } : a));
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStepStatus = (idx) => {
    if (!approval) return 'pending';
    if (approval.status === 'Approved') return 'done';
    const activeLevel = approval.approvalChain?.find(s => s.status === 'Pending')?.level || 1;
    if (idx < activeLevel) return 'done';
    if (idx === activeLevel) return 'active';
    return 'pending';
  };

  const isActionable    = approval?.status === 'Pending';
  const activeChainStep = approval?.approvalChain?.find(s => s.status === 'Pending');

  return (
    <div className="aw-layout" style={{ minHeight: 'calc(100vh - 80px)' }}>

      {/* Request list panel */}
      <RequestList
        list={list}
        activeId={id}
        onSelect={handleSelect}
        loading={listLoading}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen(p => !p)}
      />

      {/* Detail panel */}
      <main className="aw-main">
        {/* Expand button — shown only when list panel is hidden */}
        {!panelOpen && (
          <button
            className="aw-panel-expand"
            onClick={() => setPanelOpen(true)}
            title="Show requests"
            aria-label="Show requests panel"
          >
            ›
          </button>
        )}
        {detailLoading && <div className="aw-loader">Loading details…</div>}
        {error && !detailLoading && <div className="aw-error">{error}</div>}

        {!detailLoading && approval && (
          <>
            {/* Header */}
            <header className="aw-header">
              <div>
                <h1 className="aw-page-title">Approval Workflow</h1>
                <p className="aw-page-subtitle">
                  RFQ: <strong>{approval.snapshot?.rfqTitle || approval.rfqTitle}</strong>
                  &nbsp;·&nbsp; Vendor: <strong>{approval.snapshot?.vendorName || approval.vendor?.name}</strong>
                  &nbsp;·&nbsp; <strong>Rs. {Number(approval.snapshot?.totalAmount || approval.quotationAmount).toLocaleString('en-IN')}</strong>
                  &nbsp;&nbsp;
                  <span className={`aw-badge aw-badge--${approval.status?.toLowerCase()}`}>{approval.status}</span>
                </p>
              </div>
            </header>

            {/* Stepper */}
            <div className="aw-stepper-card">
              <div className="aw-stepper">
                {STEPS.map((label, idx) => {
                  const st = getStepStatus(idx);
                  return (
                    <React.Fragment key={label}>
                      <div className={`aw-step aw-step--${st}`}>
                        <div className="aw-step-circle">{st === 'done' ? '✓' : idx + 1}</div>
                        <span className="aw-step-label">{label}</span>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`aw-step-connector${st === 'done' ? ' aw-step-connector--done' : ''}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Two columns */}
            <div className="aw-columns">
              <div className="aw-left-col">
                {/* Approval Chain */}
                <div className="aw-card">
                  <h2 className="aw-card-title">Approval Chain</h2>
                  <div className="aw-chain">
                    {(approval.approvalChain || approval.chain)?.map((step, idx) => (
                      <div key={idx} className="aw-chain-item">
                        <div className="aw-chain-line">
                          <div className={`aw-chain-dot aw-chain-dot--${step.status.toLowerCase()}`}>
                            {step.status === 'Approved' ? '✓' : step.status === 'Rejected' ? '✗' : '⏰'}
                          </div>
                          {idx < (approval.approvalChain || approval.chain).length - 1 && <div className="aw-chain-vline" />}
                        </div>
                        <div className="aw-chain-info">
                          <p className="aw-chain-name">{step.approverName || step.name}</p>
                          <p className="aw-chain-role">{step.label || step.role}</p>
                          <span className={`aw-chain-status aw-chain-status--${step.status.toLowerCase()}`}>
                            {step.status === 'Approved' && step.decidedAt
                              ? `Approved on ${new Date(step.decidedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                              : step.status === 'Rejected' ? 'Rejected'
                              : 'Awaiting'}
                          </span>
                          {step.remarks && <p className="aw-chain-remarks">"{step.remarks}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remarks */}
                <div className="aw-card">
                  <h2 className="aw-card-title">
                    Approval Remarks
                    {activeChainStep && isActionable && (
                      <span className="aw-approver-tag"> — Acting as: L{activeChainStep.level} Approver</span>
                    )}
                  </h2>
                  <textarea
                    id="approval-remarks"
                    className="aw-textarea"
                    placeholder="Add your comments or conditions before approving / rejecting..."
                    rows={5}
                    value={remarks}
                    onChange={(e) => { setRemarks(e.target.value); setFormError(''); }}
                    disabled={!isActionable || submitting}
                    aria-label="Approval remarks"
                  />
                  {formError && <p className="aw-form-error">{formError}</p>}
                </div>
              </div>

              <div className="aw-right-col">
                <div className="aw-card">
                  <h2 className="aw-card-title">Quotation Summary</h2>
                  <div className="aw-summary">
                    <div className="aw-summary-row">
                      <span className="aw-summary-label">Vendor</span>
                      <span className="aw-summary-value">{approval.snapshot?.vendorName || approval.vendor?.name}</span>
                    </div>
                    <div className="aw-summary-row">
                      <span className="aw-summary-label">RFQ</span>
                      <span className="aw-summary-value">{approval.snapshot?.rfqTitle || approval.rfqTitle}</span>
                    </div>
                    <div className="aw-summary-row">
                      <span className="aw-summary-label">Category</span>
                      <span className="aw-summary-value">{approval.category || '—'}</span>
                    </div>
                    <div className="aw-summary-row">
                      <span className="aw-summary-label">Delivery</span>
                      <span className="aw-summary-value">{approval.deliveryDays} days</span>
                    </div>
                    <div className="aw-summary-row">
                      <span className="aw-summary-label">Vendor Rating</span>
                      <StarRating value={approval.vendorRating} />
                    </div>
                  </div>

                  {/* Line items mini-table */}
                  {approval.lineItems?.length > 0 && (() => {
                    const subtotal   = approval.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
                    const cgst       = Math.round(subtotal * 0.09);
                    const sgst       = Math.round(subtotal * 0.09);
                    const grandTotal = subtotal + cgst + sgst;
                    const fmt = (n) => Number(n).toLocaleString('en-IN');
                    return (
                      <>
                        <div className="aw-items-table">
                          <div className="aw-items-header">
                            <span>Item</span><span>Qty</span><span>Unit Price</span><span>Total</span>
                          </div>
                          {approval.lineItems.map((li, i) => (
                            <div key={i} className="aw-items-row">
                              <span>{li.item}</span>
                              <span>{li.qty}</span>
                              <span>₹{fmt(li.unitPrice)}</span>
                              <span>₹{fmt(li.qty * li.unitPrice)}</span>
                            </div>
                          ))}
                        </div>
                        {/* Tax breakdown */}
                        <div className="aw-tax-breakdown">
                          <div className="aw-tax-row">
                            <span>Subtotal</span>
                            <span>₹{fmt(subtotal)}</span>
                          </div>
                          <div className="aw-tax-row">
                            <span>CGST (9%)</span>
                            <span>₹{fmt(cgst)}</span>
                          </div>
                          <div className="aw-tax-row">
                            <span>SGST (9%)</span>
                            <span>₹{fmt(sgst)}</span>
                          </div>
                          <div className="aw-tax-row aw-tax-row--total">
                            <span>Grand Total (incl. 18% GST)</span>
                            <span>₹{fmt(grandTotal)}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Status result or action buttons */}
                {approval.status === 'Approved' && (
                  <div className="aw-status-result aw-status-result--approved">
                    ✓ Fully Approved — PO &amp; Invoice auto-generated.
                    <button
                      className="aw-view-po-btn"
                      onClick={() => navigate(invoiceId ? `/invoices/${invoiceId}` : '/invoices')}
                    >
                      View Generated Invoice →
                    </button>
                  </div>
                )}
                {approval.status === 'Rejected' && (
                  <div className="aw-status-result aw-status-result--rejected">
                    ✗ Rejected — Procurement Officer has been notified.
                  </div>
                )}
                {isActionable && (
                  <div className="aw-actions">
                    <button id="btn-approve" className="aw-btn aw-btn--approve" onClick={() => handleAction('approve')} disabled={submitting}>
                      {submitting ? '…' : '✓ Approve'}
                    </button>
                    <button id="btn-reject"  className="aw-btn aw-btn--reject"  onClick={() => handleAction('reject')}  disabled={submitting}>
                      {submitting ? '…' : '✗ Reject'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Empty state — no approval selected */}
        {!detailLoading && !approval && !error && (
          <div className="aw-empty">
            <p>Select a request from the list to review it.</p>
          </div>
        )}
      </main>
    </div>
  );
}
