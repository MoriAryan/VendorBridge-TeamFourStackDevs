import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState({ api: "loading", db: "loading" });

  useEffect(() => {
    fetch("/api/v1/health")
      .then((response) => response.json())
      .then((data) => {
        setStatus({ api: data.api || "unknown", db: data.db || "unknown" });
      })
      .catch(() => {
        setStatus({ api: "offline", db: "offline" });
      });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: "520px", width: "100%", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(15,23,42,0.96)", padding: "40px", boxShadow: "0 40px 120px rgba(15,23,42,0.35)" }}>
        <h1 style={{ margin: 0, fontSize: "2.75rem", fontWeight: 700 }}>VendorBridge</h1>
        <p style={{ marginTop: "24px", fontSize: "1.125rem", lineHeight: 1.75, color: "#cbd5e1" }}>
          Procurement & Vendor Management ERP
        </p>
        <div style={{ marginTop: "32px", padding: "24px", borderRadius: "20px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(148,163,184,0.12)" }}>
          <p style={{ margin: 0, fontSize: "1rem", color: "#94a3b8" }}>
            API status: <strong style={{ color: "#ffffff" }}>{status.api}</strong>
          </p>
          <p style={{ margin: "12px 0 0", fontSize: "1rem", color: "#94a3b8" }}>
            DB status: <strong style={{ color: "#ffffff" }}>{status.db}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

