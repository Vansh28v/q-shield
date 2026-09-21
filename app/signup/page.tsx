"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

        <form className="auth-form">
          <label>
            Full name
            <input type="text" placeholder="Enter your name" />
          </label>

          <label>
            Email address
            <input type="email" placeholder="you@example.com" />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
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
            <input type="checkbox" />
            <span>
              I agree to the Q-SHIELD security and platform terms.
            </span>
          </label>

          <button type="button" className="auth-submit">
            CREATE SECURE ACCOUNT
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