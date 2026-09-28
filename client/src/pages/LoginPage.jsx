import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="simple-auth-page">
      <section className="simple-auth-card">
        <div className="simple-auth-logo">
          <div className="simple-auth-mark">O</div>

          <h1>OddsnSods</h1>
        </div>

        <p className="simple-auth-tagline">
          Lists for all the bits and pieces.
        </p>

        <form
          className="simple-auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Password"
              required
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="simple-auth-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Log in"}
          </button>
        </form>

        <p className="simple-auth-switch">
          New to OddsnSods?{" "}
          <Link to="/register">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default LoginPage;