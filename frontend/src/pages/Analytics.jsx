const sample = [
  { label: "Jan", value: 30 },
  { label: "Feb", value: 20 },
  { label: "Mar", value: 45 },
  { label: "Apr", value: 28 },
  { label: "May", value: 60 },
  { label: "Jun", value: 48 },
];

export default function Analytics() {
  const max = Math.max(...sample.map((s) => s.value));

  return (
    <div className="page page-analytics">
      <div className="auth-card">
        <h2>Procurement Analytics</h2>
        <p className="muted">Monthly RFQ responses</p>

        <div className="chart">
          {sample.map((s) => (
            <div key={s.label} className="chart-bar">
              <div className="bar" style={{ height: `${(s.value / max) * 220}px` }} title={`${s.value}`}></div>
              <div className="bar-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
