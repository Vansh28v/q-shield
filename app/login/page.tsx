"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="auth-page">
      <div className="auth-grid" />
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <Link href="/" className="auth-brand">
        <div className="auth-brand-mark">
          <span />
          <span />
          <span />
        </div>

        <div>
          <strong>Q-SHIELD</strong>
          <small>QUANTUM SECURITY PLATFORM</small>
        </div>
      </Link>

      <div className="auth-geometry geometry-left">
        <span />
        <span />
        <span />
      </div>

      <div className="auth-geometry geometry-right">
        <span />
        <span />
        <span />
      </div>

      <section className="auth-card">
        <div className="auth-card-top">
          <div className="auth-eyebrow">
            <span />
            SECURE ACCESS
          </div>

          <h1>Welcome back.</h1>

          <p>
            Sign in to access the Q-SHIELD quantum security environment.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <label>
            <span>EMAIL ADDRESS</span>

            <div className="auth-input">
              <span className="input-icon">@</span>

              <input
                type="email"
                placeholder="operator@qshield.io"
              />
            </div>
          </label>

          <label>
            <span>PASSWORD</span>

            <div className="auth-input">
              <span className="input-icon">◇</span>

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </label>

          <div className="auth-options">
            <label className="remember">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>

            <Link href="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button className="auth-submit" type="submit">
            <span>AUTHENTICATE</span>
            <strong>→</strong>
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <small>OR</small>
          <span />
        </div>

        <div className="auth-signup">
          <span>New to Q-SHIELD?</span>
          <Link href="/signup">Create an account →</Link>
        </div>

        <div className="auth-security">
          <span className="security-dot" />
          <span>QUANTUM ENGINE</span>
          <b>OPERATIONAL</b>
        </div>
      </section>

      <div className="auth-footer">
        <span>Q-SHIELD // SECURE ENVIRONMENT</span>
        <span>ENCRYPTED SESSION</span>
      </div>
    </main>
  );
}