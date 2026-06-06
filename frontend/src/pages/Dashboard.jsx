export default function Dashboard() {
  const stats = [
    { label: "Vendors", value: 24 },
    { label: "Open RFQs", value: 6 },
    { label: "Active Quotations", value: 18 },
    { label: "Invoices", value: 12 },
  ];

  return (
    <div className="page page-dashboard">
      <section className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="overview-card">
        <h2>Quick actions</h2>
        <div className="actions">
          <button className="btn-primary">Create RFQ</button>
          <button className="btn-secondary">New Vendor</button>
          <button className="btn-secondary">Generate PO</button>
        </div>
      </section>
    </div>
  );
}
