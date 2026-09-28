import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import "../AuthConcept.css";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (registerError) {
      setError(registerError.message);
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
            <h1>Create your account</h1>
            <p>A simple place for the things you need to remember, share and get done.</p>
          </header>

          <form className="auth-concept-form" onSubmit={handleSubmit}>
            <label className="auth-concept-field">
              <span>Name</span>
              <input
                className="auth-concept-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </label>

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
                  placeholder="Create a password"
                  required
                  minLength="6"
                  autoComplete="new-password"
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
            <p className="auth-concept-helper">Use at least 6 characters.</p>

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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="auth-concept-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

export default RegisterPage;
