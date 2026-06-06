import { useState } from "react";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(null);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ type: "loading", message: "Signing in..." });
    try {
      // Placeholder: backend endpoint may not exist yet
      await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setStatus({ type: "success", message: "Signed in (mock)" });
    } catch (err) {
      setStatus({ type: "error", message: "Login failed" });
    }
  }

  return (
    <div className="page page-auth">
      <div className="auth-card">
        <h2>Sign in to VendorBridge</h2>
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required className="form-input" />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={onChange} required className="form-input" />
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="btn-primary" type="submit">Sign In</button>
            {status && <div className={`status ${status.type}`}>{status.message}</div>}
          </div>
        </form>
      </div>
    </div>
  );
}
