"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!email.trim()) return;
    setSubmitted(true);
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
            <div className="auth-brand-sub">
              QUANTUM SECURITY PLATFORM
            </div>
          </div>
        </div>

        {!submitted ? (
          <>
            <div className="auth-heading">
              <span>RECOVERY PROTOCOL</span>

              <h1>Reset your access</h1>

              <p>
                Enter the email associated with your Q-SHIELD account.
                We&apos;ll initiate the secure recovery sequence.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <label>
                Email address

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <button type="submit" className="auth-submit">
                INITIATE RECOVERY
                <span>→</span>
              </button>
            </form>

            <div className="auth-divider">
              <span>SECURE ACCESS</span>
            </div>

            <Link href="/login" className="auth-secondary">
              ← RETURN TO LOGIN
            </Link>
          </>
        ) : (
          <div className="recovery-success">
            <div className="recovery-icon">✓</div>

            <span>RECOVERY REQUEST ACCEPTED</span>

            <h1>Check your inbox</h1>

            <p>
              If an account exists for
              <strong> {email}</strong>, recovery instructions
              will be sent to that address.
            </p>

            <Link href="/login" className="auth-submit recovery-button">
              RETURN TO LOGIN
              <span>→</span>
            </Link>
          </div>
        )}

        <div className="auth-status">
          <span className="status-dot" />
          QUANTUM ENGINE OPERATIONAL
        </div>
      </section>

      <div className="auth-side-text auth-side-left">
        Q-SHIELD // RECOVERY PROTOCOL
      </div>

      <div className="auth-side-text auth-side-right">
        SECURE CHANNEL // 02
      </div>
    </main>
  );
}