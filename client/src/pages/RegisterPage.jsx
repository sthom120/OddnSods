import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

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
          One place for all your lists.
        </p>

        <form
          className="simple-auth-form"
          onSubmit={handleSubmit}
        >
          <label>
            Name

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Your name"
              required
              autoComplete="name"
            />
          </label>

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
              placeholder="At least 6 characters"
              required
              minLength="6"
              autoComplete="new-password"
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
              ? "Creating account..."
              : "Create account"}
          </button>
        </form>

        <p className="simple-auth-switch">
          Already have an account?{" "}
          <Link to="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default RegisterPage;