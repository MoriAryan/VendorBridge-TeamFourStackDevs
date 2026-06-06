import React, { useState, useEffect, useCallback } from 'react';
import './Activity.css';

const BASE = 'http://localhost:5000';
const authH = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` });

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function getIconMeta(type, action) {
  if (type === 'Approval') return { icon: '✅', color: '#38B2AC' };
  if (type === 'RFQ') return { icon: '📋', color: '#6C63FF' };
  if (type === 'Invoice') return { icon: '🧾', color: '#D69E2E' };
  if (type === 'PurchaseOrder') return { icon: '📦', color: '#9F99FF' };
  if (type === 'Vendor') return { icon: '🏢', color: '#E53E3E' };
  return { icon: '🔔', color: '#718096' };
}

const FILTERS = ['All', 'RFQ', 'Approvals', 'Invoices', 'Vendors'];

export const Activity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchLogs = useCallback(async (filter) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter !== 'All') {
        // Map UI filter to backend entityType
        const map = {
          'RFQ': 'RFQ',
          'Approvals': 'Approval',
          'Invoices': 'Invoice',
          'Vendors': 'Vendor'
        };
        params.set('entityType', map[filter] || filter);
      }
      
      const res = await fetch(`${BASE}/api/v1/activity-logs?${params.toString()}`, { headers: authH() });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.activities || []);
      } else {
        throw new Error(json.message || 'Failed to fetch');
      }
    } catch (e) {
      setError(e.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(activeFilter);
  }, [fetchLogs, activeFilter]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', color: 'var(--fg)' }}>
          Activity &amp; Logs
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9375rem' }}>
          Procurement audit trail
        </p>
      </header>

      {/* Contextual Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: activeFilter === f ? 700 : 500,
              background: activeFilter === f ? 'var(--bg)' : 'transparent',
              boxShadow: activeFilter === f ? 'var(--shadow-inset-sm)' : 'none',
              color: activeFilter === f ? 'var(--accent)' : 'var(--muted)',
              transition: 'all 0.2s',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-extruded)' }}>
        <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(163,177,198,0.2)', marginBottom: '24px' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--fg)' }}>
            Chronological Feed <span style={{ float: 'right', fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>Immutable records</span>
          </p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading activity feed…</div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📭</div>
            <p>No activities found for this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {logs.map((log, index) => {
              const meta = getIconMeta(log.entityType, log.action);
              const isLast = index === logs.length - 1;

              return (
                <div key={log._id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                  {/* Icon Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {meta.icon}
                    </div>
                    {!isLast && (
                      <div style={{ width: '2px', background: 'rgba(163,177,198,0.3)', flex: 1, margin: '4px 0' }} />
                    )}
                  </div>

                  {/* Content Column */}
                  <div style={{ flex: 1, paddingBottom: isLast ? '0' : '20px' }}>
                    <div style={{ fontSize: '0.9375rem', color: 'var(--fg)', lineHeight: '1.5' }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px', display: 'flex', gap: '8px' }}>
                      <span>{fmtDate(log.createdAt)}</span>
                      {log.performedBy && (
                        <>
                          <span>·</span>
                          <span>{log.performedBy.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
