"use client";

import { useState } from "react";
import Link from "next/link";

type AnalysisResult = {
  success: boolean;
  experiment: {
    quantum: {
      verification: {
        accepted: boolean;
        threshold: number;
        deviation: number;
        riskIndicator: number;
        confidence: number;
      };
    };
    threat: {
      detected: boolean;
      threatLevel: string;
      threatType: string;
      riskScore: number;
      reasons: string[];
      recommendedAction: string;
    };
    latencyMs: number;
  };
};

export default function IntelligencePage() {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] =
    useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const runAnalysis = async () => {
    setRunning(true);
    setCompleted(false);
    setResult(null);
    setError("");

    try {
      const timestamp = Date.now();

      const response = await fetch(
        "/api/security/experiment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experimentId: `INTEL-${timestamp}`,
            sessionId: `INTEL-SESSION-${timestamp}`,
            signatureId: `INTEL-SIG-${timestamp}`,
            signerId: "INTELLIGENCE-ENGINE",
            message: "Q-SHIELD INTELLIGENCE ANALYSIS",
            nonce: `INTEL-NONCE-${timestamp}`,

            // Clean asymmetric state.
            alpha: 0.8,
            beta: 0.6,

            shots: 1000,
            threshold: 0.05,
            seed: 20260919,

            noise: {
              model: "NONE",
              probability: 0,
            },

            expectedSignerId: "INTELLIGENCE-ENGINE",
            expectedMessage:
              "Q-SHIELD INTELLIGENCE ANALYSIS",

            unauthorizedVerification: false,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Threat analysis failed.",
        );
      }

      setResult(data);
      setCompleted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Threat analysis failed.",
      );
    } finally {
      setRunning(false);
    }
  };

  const verification =
    result?.experiment.quantum.verification;

  const threat =
    result?.experiment.threat;

  const risk =
    threat?.riskScore ?? 0;

  const deviation =
    verification?.deviation ?? 0;

  const threshold =
    verification?.threshold ?? 0.05;

  const confidence =
    verification?.confidence ?? 0;

  const latency =
    result?.experiment.latencyMs ?? 0;

  const threatName =
    threat?.threatType ?? "NORMAL_BEHAVIOUR";

  const threatLevel =
    threat?.threatLevel ?? "LOW";

  return (
    <main className="intelligence-page">
      <div className="intelligence-grid-bg" />

      <div className="intelligence-container">

        {/* HEADER */}
        <header className="intelligence-header">
          <div>
            <div className="intelligence-eyebrow">
              Q-SHIELD / THREAT INTELLIGENCE
            </div>

            <h1>Security Intelligence</h1>

            <p>
              Analyze quantum-signature telemetry and identify
              patterns associated with potential security threats.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="intelligence-back"
          >
            ← Dashboard
          </Link>
        </header>

        {/* STATUS */}
        <section className="intel-status-bar">

          <div>
            <span className="intel-live-dot" />
            INTELLIGENCE ENGINE
            <strong>ONLINE</strong>
          </div>

          <div>
            DATA POINTS
            <strong>
              {completed ? "1,000" : "0"}
            </strong>
          </div>

          <div>
            MODEL VERSION
            <strong>QSI-1.0</strong>
          </div>

          <div>
            LAST ANALYSIS
            <strong>
              {completed
                ? new Date().toLocaleTimeString()
                : "—"}
            </strong>
          </div>

        </section>

        {/* THREAT SCORE */}
        <section className="intel-hero">

          <div className="intel-hero-copy">

            <span>LIVE THREAT ASSESSMENT</span>

            <h2>
              Quantum Security
              <br />
              Intelligence
            </h2>

            <p>
              The intelligence layer analyzes statistical
              features produced by the quantum verification
              pipeline. It provides additional context while
              preserving the primary statistical verification
              decision.
            </p>

            <button
              className="analysis-button"
              onClick={runAnalysis}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="analysis-spinner" />
                  Analyzing Telemetry...
                </>
              ) : (
                <>
                  ✦ Run Threat Analysis
                </>
              )}
            </button>

          </div>

          <div className="threat-score">

            <div className="threat-ring">

              <div>
                <strong>
                  {completed
                    ? Math.round(risk * 100)
                    : "—"}
                </strong>

                <span>RISK</span>
              </div>

            </div>

            <div className="threat-state">
              <span className="intel-live-dot" />

              {completed
                ? `${threatLevel} THREAT ENVIRONMENT`
                : "AWAITING ANALYSIS"}
            </div>

          </div>

        </section>

        {/* MODELS */}
        <section className="intel-section">

          <div className="intel-section-heading">

            <div>
              <span>MODEL REGISTRY</span>
              <h2>Intelligence Models</h2>
            </div>

            <span className="model-count">
              02 MODELS
            </span>

          </div>

          <div className="model-grid">

            <article className="model-card">

              <div className="model-top">

                <div className="model-icon">
                  ◈
                </div>

                <span className="model-status">
                  <i />
                  ADVISORY
                </span>

              </div>

              <span className="model-type">
                CLASSIFICATION
              </span>

              <h3>
                Threat Classifier
              </h3>

              <p>
                Classifies observed quantum-signature
                behaviour into legitimate activity and
                known attack categories.
              </p>

              <div className="model-bottom">

                <div>
                  <span>
                    MODEL STATUS
                  </span>

                  <strong>
                    OPTIONAL
                  </strong>
                </div>

                <div className="mini-bar">
                  <i style={{ width: "97.8%" }} />
                </div>

              </div>

            </article>

            <article className="model-card">

              <div className="model-top">

                <div className="model-icon">
                  ◈
                </div>

                <span className="model-status">
                  <i />
                  ADVISORY
                </span>

              </div>

              <span className="model-type">
                ANOMALY ANALYSIS
              </span>

              <h3>
                Anomaly Detector
              </h3>

              <p>
                Identifies unusual measurement distributions
                that deviate from established security
                baselines.
              </p>

              <div className="model-bottom">

                <div>
                  <span>
                    MODEL STATUS
                  </span>

                  <strong>
                    OPTIONAL
                  </strong>
                </div>

                <div className="mini-bar">
                  <i style={{ width: "94.6%" }} />
                </div>

              </div>

            </article>

          </div>

        </section>

        {/* THREAT CLASSIFICATION */}
        <section className="intel-section">

          <div className="intel-section-heading">

            <div>
              <span>
                BEHAVIOURAL CLASSIFICATION
              </span>

              <h2>
                Detected Patterns
              </h2>
            </div>

            <span className="model-count">
              {completed
                ? "ANALYZED"
                : "READY"}
            </span>

          </div>

          <div className="threat-table">

            <div className="threat-table-head">
              <span>BEHAVIOUR</span>
              <span>CONFIDENCE</span>
              <span>SEVERITY</span>
              <span>STATUS</span>
            </div>

            <div className="threat-row">

              <strong>
                {threatName}
              </strong>

              <div className="confidence">

                <div>
                  <i
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          confidence * 100,
                        ),
                      )}%`,
                    }}
                  />
                </div>

                <span>
                  {(confidence * 100).toFixed(1)}%
                </span>

              </div>

              <span
                className={`severity severity-${threatLevel.toLowerCase()}`}
              >
                {threatLevel}
              </span>

              <span className="pattern-status">

                <i />

                {completed
                  ? "ANALYZED"
                  : "WAITING"}

              </span>

            </div>

          </div>

        </section>

        {/* LIVE TELEMETRY */}
        <section className="intel-section">

          <div className="intel-section-heading">

            <div>
              <span>
                STATISTICAL TELEMETRY
              </span>

              <h2>
                Verification Signals
              </h2>
            </div>

          </div>

          <div className="detection-grid">

            <div className="detection-card">
              <span>
                OBSERVED DEVIATION
              </span>

              <strong>
                {(deviation * 100).toFixed(2)}%
              </strong>

              <small>
                Threshold:{" "}
                {(threshold * 100).toFixed(2)}%
              </small>
            </div>

            <div className="detection-card">
              <span>
                VERIFICATION
              </span>

              <strong>
                {verification
                  ? verification.accepted
                    ? "ACCEPT"
                    : "REJECT"
                  : "—"}
              </strong>

              <small>
                Primary security decision
              </small>
            </div>

            <div className="detection-card">
              <span>
                THREAT RISK
              </span>

              <strong>
                {(risk * 100).toFixed(2)}%
              </strong>

              <small>
                Security engine
              </small>
            </div>

            <div className="detection-card">
              <span>
                PROCESSING TIME
              </span>

              <strong>
                {completed
                  ? `${latency.toFixed(2)}ms`
                  : "—"}
              </strong>

              <small>
                Experiment execution
              </small>
            </div>

          </div>

        </section>

        {/* RESULT */}
        {completed && result && (
          <section className="analysis-result">

            <div className="result-symbol">
              {threat?.detected ? "!" : "✓"}
            </div>

            <div>

              <span>
                ANALYSIS COMPLETE
              </span>

              <strong>
                {threat?.detected
                  ? "Threat detected"
                  : "No active threat detected"}
              </strong>

              <p>
                {threat?.reasons?.length
                  ? threat.reasons.join(" ")
                  : "Telemetry was processed successfully. The statistical verification layer remains authoritative."}
              </p>

            </div>

            <div className="result-time">

              <span>
                RECOMMENDED ACTION
              </span>

              <strong>
                {threat?.recommendedAction ??
                  "ALLOW"}
              </strong>

            </div>

          </section>
        )}

        {/* ERROR */}
        {error && (
          <section className="analysis-result">
            <div className="result-symbol">
              !
            </div>

            <div>
              <span>
                ANALYSIS ERROR
              </span>

              <strong>
                Threat analysis failed
              </strong>

              <p>
                {error}
              </p>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="intel-footer">

          <span>
            Q-SHIELD INTELLIGENCE ENGINE
          </span>

          <span>
            Statistical verification remains the primary
            security decision layer.
          </span>

        </footer>

      </div>
    </main>
  );
}