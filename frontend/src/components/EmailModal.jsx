import React, { useState } from 'react';
import './EmailModal.css';

export default function EmailModal({ po, invoice, onClose }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const vendorEmail = 'billing@infrasupplies.in'; // mocked — in production pulled from Vendor entity
  const subject     = `Invoice from VendorBridge — ${po?.poNumber}`;
  const body        = `Dear ${po?.vendor?.name},\n\nPlease find attached the invoice for ${po?.poNumber}.\n\nGrand Total: ₹${Number(po?.grandTotal || 0).toLocaleString('en-IN')}\nDue Date: ${invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}\n\nKindly ensure payment before the due date.\n\nRegards,\nVendorBridge Procurement Team`;

  const handleSend = () => {
    setSending(true);
    // Simulate email send — replace with POST /api/v1/invoices/:id/email in production
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">✉ Email Invoice</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {sent ? (
          <div className="modal__success">
            <span className="modal__success-icon">✓</span>
            <p>Invoice emailed to <strong>{vendorEmail}</strong> successfully.</p>
          </div>
        ) : (
          <>
            <div className="modal__body">
              <div className="modal__field">
                <label className="modal__label">To</label>
                <div className="modal__value">{vendorEmail}</div>
              </div>
              <div className="modal__field">
                <label className="modal__label">Subject</label>
                <div className="modal__value">{subject}</div>
              </div>
              <div className="modal__field">
                <label className="modal__label">Message Preview</label>
                <pre className="modal__preview">{body}</pre>
              </div>
            </div>
            <div className="modal__footer">
              <button className="modal__btn modal__btn--cancel" onClick={onClose}>Cancel</button>
              <button className="modal__btn modal__btn--send" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : '✉ Send Invoice'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
