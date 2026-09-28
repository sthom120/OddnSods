import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "../AuthConcept.css";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-concept-page">
      <div className="auth-concept-shell">
        <Link to="/login" className="auth-concept-brand" aria-label="OddsnSods">
          <img src="/oddsnsods-logo.png" alt="OddsnSods" />
        </Link>

        <section className="auth-concept-card">
          <header className="auth-concept-heading">
            <h1>Welcome back</h1>
            <p>Keep everything somewhere other than your head.</p>
          </header>

          <form className="auth-concept-form" onSubmit={handleSubmit}>
            <label className="auth-concept-field">
              <span>Email</span>
              <input
                className="auth-concept-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <label className="auth-concept-field">
              <span>Password</span>
              <div className="auth-password-wrap">
                <input
                  className="auth-concept-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div className="auth-concept-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-concept-submit"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="auth-concept-switch">
            New to OddsnSods? <Link to="/register">Create an account</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
