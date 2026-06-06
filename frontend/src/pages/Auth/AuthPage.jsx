import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../../api/auth.api.js";

const ROLES = [
  { value: "procurement_officer", label: "Procurement Officer" },
  { value: "admin", label: "Admin" },
  { value: "vendor", label: "Vendor" },
  { value: "approver", label: "Approver / Manager" },
];

// ── Reusable field component ────────────────────────────────────────
function Field({ id, label, type = "text", placeholder, value, onChange, error, required }) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        id={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={required}
        aria-invalid={!!error}
        autoComplete={type === "password" ? "current-password" : "on"}
      />
      {error && (
        <span role="alert" style={{ color: "var(--accent-danger)", fontSize: "0.75rem" }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Login Form ──────────────────────────────────────────────────────
function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await loginUser({ email, password });
      // Store token for Bearer header fallback
      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      onSuccess(res.data?.user);
    } catch (err) {
      setApiError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Field
        id="login-email"
        label="Email Address"
        type="email"
        placeholder="officer@company.com"
        value={email}
        onChange={setEmail}
        error={errors.email}
        required
      />
      <Field
        id="login-password"
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        required
      />

      {apiError && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-inner)",
            background: "rgba(229,62,62,0.08)",
            color: "var(--accent-danger)",
            fontSize: "0.875rem",
            fontWeight: "500",
            boxShadow: "var(--shadow-inset-sm)",
          }}
        >
          ⚠ {apiError}
        </div>
      )}

      <button
        id="login-submit-btn"
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: "100%", marginTop: "4px" }}
      >
        {loading ? "Signing in..." : "Sign In →"}
      </button>
    </form>
  );
}

// ── Register Form ───────────────────────────────────────────────────
function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "procurement_officer",
    companyName: "",
    phone: "",
    country: "India",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const set = (field) => (val) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await registerUser(form);
      if (res.data?.accessToken) {
        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      onSuccess(res.data?.user);
    } catch (err) {
      setApiError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <Field
          id="reg-name"
          label="Full Name"
          placeholder="Aryan Mori"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          required
        />
        <Field
          id="reg-email"
          label="Email Address"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
          required
        />
        <Field
          id="reg-password"
          label="Password"
          type="password"
          placeholder="Min. 6 characters"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          required
        />
        <div className="form-group">
          <label className="form-label" htmlFor="reg-role">
            Role <span className="required">*</span>
          </label>
          <select
            id="reg-role"
            className="form-select"
            value={form.role}
            onChange={(e) => set("role")(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          id="reg-company"
          label="Company Name"
          placeholder="Infra Supplies Pvt Ltd"
          value={form.companyName}
          onChange={set("companyName")}
        />
        <Field
          id="reg-phone"
          label="Phone Number"
          placeholder="+91 98765 43210"
          value={form.phone}
          onChange={set("phone")}
        />
      </div>

      {apiError && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-inner)",
            background: "rgba(229,62,62,0.08)",
            color: "var(--accent-danger)",
            fontSize: "0.875rem",
            fontWeight: "500",
            boxShadow: "var(--shadow-inset-sm)",
          }}
        >
          ⚠ {apiError}
        </div>
      )}

      <button
        id="register-submit-btn"
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: "100%", marginTop: "4px" }}
      >
        {loading ? "Creating Account..." : "Create Account →"}
      </button>
    </form>
  );
}

// ── Main Auth Page ──────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"

  const handleSuccess = (user) => {
    // Route based on role
    navigate("/rfqs", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background circles */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "var(--bg)",
          boxShadow: "var(--shadow-extruded)",
          top: "-100px",
          right: "-100px",
          opacity: 0.6,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "var(--bg)",
          boxShadow: "var(--shadow-inset)",
          bottom: "-60px",
          left: "-60px",
          opacity: 0.5,
        }}
      />

      {/* Auth Card */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: mode === "register" ? "680px" : "440px",
          padding: "40px",
          position: "relative",
          zIndex: 1,
          transition: "max-width 0.35s ease-out",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "var(--radius-inner)",
              background: "var(--bg)",
              boxShadow: "var(--shadow-extruded)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "1.75rem",
            }}
          >
            🔗
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 800,
              marginBottom: "4px",
            }}
          >
            Vendor<span style={{ color: "var(--accent)" }}>Bridge</span>
          </h1>
          <p style={{ fontSize: "0.875rem" }}>
            {mode === "login"
              ? "Sign in to your procurement dashboard"
              : "Create your procurement account"}
          </p>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--bg)",
            boxShadow: "var(--shadow-inset-sm)",
            borderRadius: "var(--radius-btn)",
            padding: "4px",
            marginBottom: "32px",
          }}
          role="tablist"
        >
          {[
            { key: "login", label: "Sign In" },
            { key: "register", label: "Register" },
          ].map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={mode === key}
              id={`auth-tab-${key}`}
              type="button"
              onClick={() => setMode(key)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "var(--radius-btn)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "var(--transition)",
                background: mode === key ? "var(--accent)" : "transparent",
                color: mode === key ? "#fff" : "var(--muted)",
                boxShadow: mode === key
                  ? "5px 5px 10px rgba(108,99,255,0.35),-3px -3px 8px rgba(255,255,255,0.4)"
                  : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        {mode === "login" ? (
          <LoginForm onSuccess={handleSuccess} />
        ) : (
          <RegisterForm onSuccess={handleSuccess} />
        )}

        {/* Footer hint */}
        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "0.8125rem",
            color: "var(--muted)",
          }}
        >
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                id="switch-to-register-btn"
                onClick={() => setMode("register")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                }}
              >
                Register here
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                id="switch-to-login-btn"
                onClick={() => setMode("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
