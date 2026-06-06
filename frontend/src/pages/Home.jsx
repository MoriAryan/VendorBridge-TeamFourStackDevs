import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState({ api: "loading", db: "loading" });

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/health")
      .then((response) => response.json())
      .then((data) => setStatus({ api: data.api || "unknown", db: data.db || "unknown" }))
      .catch(() => setStatus({ api: "offline", db: "offline" }));
  }, []);

  return (
    <div className="page page-home">
      <section className="hero-card">
        <div>
          <span className="eyebrow">Procurement made modern</span>
          <h1>VendorBridge brings your procurement workflow into one clean platform.</h1>
          <p>
            Manage vendors, RFQs, quotes, approvals, purchase orders, invoices, and analytics in a single ERP experience.
          </p>
        </div>

        <div className="status-card">
          <h2>System status</h2>
          <dl>
            <div>
              <dt>API</dt>
              <dd>{status.api}</dd>
            </div>
            <div>
              <dt>Database</dt>
              <dd>{status.db}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h3>Vendor Management</h3>
          <p>Centralize suppliers, contacts, and vendor performance from one dashboard.</p>
        </article>
        <article className="feature-card">
          <h3>RFQ & Quotation Workflow</h3>
          <p>Create requests, collect vendor bids, compare offers, and move approvals forward.</p>
        </article>
        <article className="feature-card">
          <h3>Purchase Orders & Invoices</h3>
          <p>Convert approvals into purchase orders and keep invoice billing aligned with procurement.</p>
        </article>
        <article className="feature-card">
          <h3>Reports & Analytics</h3>
          <p>Track spend, vendor responsiveness, and procurement bottlenecks with clear reporting.</p>
        </article>
      </section>
    </div>
  );
}
