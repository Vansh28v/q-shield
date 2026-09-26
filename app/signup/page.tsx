"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please accept the security and platform terms.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-grid" />

      <div className="auth-orbit orbit-one" />
      <div className="auth-orbit orbit-two" />

      <section className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">◇</div>
          <div>
            <div className="auth-brand-name">Q-SHIELD</div>
            <div className="auth-brand-sub">QUANTUM SECURITY PLATFORM</div>
          </div>
        </div>

        <div className="auth-heading">
          <span>ACCESS PROTOCOL</span>
          <h1>Create your account</h1>
          <p>
            Initialize a secure workspace for quantum digital signature
            analysis.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>

          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </label>

          <label>
            Confirm password
            <div className="password-field">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
            </div>
          </label>

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I agree to the Q-SHIELD security and platform terms.
            </span>
          </label>

          {error && (
            <p style={{ color: "#ff6b6b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "CREATING ACCOUNT…" : "CREATE SECURE ACCOUNT"}
            <span>→</span>
          </button>
        </form>

        <div className="auth-divider">
          <span>ALREADY REGISTERED?</span>
        </div>

        <Link href="/login" className="auth-secondary">
          RETURN TO SECURE LOGIN
        </Link>

        <div className="auth-status">
          <span className="status-dot" />
          QUANTUM ENGINE OPERATIONAL
        </div>
      </section>

      <div className="auth-side-text auth-side-left">
        Q-SHIELD // IDENTITY PROTOCOL
      </div>

      <div className="auth-side-text auth-side-right">
        SECURE CHANNEL // 01
      </div>
    </main>
  );
}