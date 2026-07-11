import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/browse");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <div className="eyebrow" style={{ color: "var(--gold-dark)" }}>Welcome back</div>
        <h2 className="section-title">Sign in</h2>
        <p className="section-sub">Access your reservations and book new tables.</p>

        {error && <div className="error-banner">{error}</div>}

        <GoogleSignInButton onError={setError} onSuccess={() => navigate("/browse")} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span style={{ fontSize: 12, opacity: 0.6 }}>or sign in with email</span>
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </div>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 16, textAlign: "center" }}>
          Admin demo login: admin@restaurant.com / admin123
        </p>
      </div>
    </div>
  );
}
