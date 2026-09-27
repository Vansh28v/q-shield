"use client";

import { useState } from "react";
import Link from "next/link";

type AnalysisResult = {
  success: boolean;
  experiment: {
    experimentId: string;
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

type ScenarioType = "NORMAL" | "CHANNEL" | "IMPERSONATION" | "REPLAY";

type HistoryItem = {
  id: string;
  timestamp: string;
  scenarioName: string;
  decision: string;
  riskScore: number;
  threatType: string;
  action: string;
};

const scenarios: Array<{
  type: ScenarioType;
  label: string;
  tag: string;
  desc: string;
  color: string;
}> = [
  {
    type: "NORMAL",
    label: "Normal Verification",
    tag: "CLEAN STATE",
    desc: "Authentic signer, zero channel noise, matching expected identity.",
    color: "#35d8ff"
  },
  {
    type: "CHANNEL",
    label: "Channel Interference",
    tag: "DEPOLARIZING NOISE",
    desc: "Simulates depolarizing noise (p=0.15) along the quantum communication channel.",
    color: "#438dff"
  },
  {
    type: "IMPERSONATION",
    label: "Impersonation Attempt",
    tag: "IDENTITY MISMATCH",
    desc: "Unauthorized signer attempts authentication using mismatched identity parameters.",
    color: "#ff963f"
  },
  {
    type: "REPLAY",
    label: "Replay Attack",
    tag: "LEDGER NONCE REUSE",
    desc: "Executes a valid transaction, then re-submits the exact signature context to trigger the persistent replay ledger.",
    color: "#a65cff"
  }
];

export default function IntelligencePage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("NORMAL");
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const runAnalysis = async () => {
    setRunning(true);
    setCompleted(false);
    setResult(null);
    setError("");

    try {
      const timestamp = Date.now();
      let bodyData: Record<string, unknown> = {};

      if (selectedScenario === "NORMAL") {
        bodyData = {
          experimentId: `INTEL-NORM-${timestamp}`,
          sessionId: `SESS-NORM-${timestamp}`,
          signatureId: `SIG-NORM-${timestamp}`,
          signerId: "INTELLIGENCE-ENGINE",
          message: "Q-SHIELD INTELLIGENCE ANALYSIS",
          nonce: `NONCE-NORM-${timestamp}`,
          alpha: 0.8,
          beta: 0.6,
          shots: 1000,
          threshold: 0.05,
          seed: 20260919,
          noise: { model: "NONE", probability: 0 },
          expectedSignerId: "INTELLIGENCE-ENGINE",
          expectedMessage: "Q-SHIELD INTELLIGENCE ANALYSIS",
          unauthorizedVerification: false,
        };
      } else if (selectedScenario === "CHANNEL") {
        bodyData = {
          experimentId: `INTEL-CHAN-${timestamp}`,
          sessionId: `SESS-CHAN-${timestamp}`,
          signatureId: `SIG-CHAN-${timestamp}`,
          signerId: "INTELLIGENCE-ENGINE",
          message: "Q-SHIELD CHANNEL NOISE EVALUATION",
          nonce: `NONCE-CHAN-${timestamp}`,
          alpha: 0.8,
          beta: 0.6,
          shots: 1000,
          threshold: 0.05,
          seed: timestamp,
          noise: { model: "DEPOLARIZING", probability: 0.15 },
          expectedSignerId: "INTELLIGENCE-ENGINE",
          expectedMessage: "Q-SHIELD CHANNEL NOISE EVALUATION",
          unauthorizedVerification: false,
        };
      } else if (selectedScenario === "IMPERSONATION") {
        bodyData = {
          experimentId: `INTEL-IMP-${timestamp}`,
          sessionId: `SESS-IMP-${timestamp}`,
          signatureId: `SIG-IMP-${timestamp}`,
          signerId: "ATTACKER-NODE-X",
          message: "Q-SHIELD IMPERSONATION TEST",
          nonce: `NONCE-IMP-${timestamp}`,
          alpha: 0.8,
          beta: 0.6,
          shots: 1000,
          threshold: 0.05,
          seed: timestamp,
          noise: { model: "NONE", probability: 0 },
          expectedSignerId: "INTELLIGENCE-ENGINE",
          expectedMessage: "Q-SHIELD IMPERSONATION TEST",
          unauthorizedVerification: false,
        };
      } else if (selectedScenario === "REPLAY") {
        // Step 1: Execute primary transaction to record nonce in persistent ReplayLedger
        const primarySignatureId = `SIG-REPLAY-${timestamp}`;
        const primarySessionId = `SESS-REPLAY-${timestamp}`;
        const primaryNonce = `NONCE-REPLAY-${timestamp}`;

        const firstRes = await fetch("/api/security/experiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experimentId: `INTEL-REPLAY-INIT-${timestamp}`,
            sessionId: primarySessionId,
            signatureId: primarySignatureId,
            signerId: "INTELLIGENCE-ENGINE",
            message: "Q-SHIELD REPLAY LEDGER INITIALIZATION",
            nonce: primaryNonce,
            alpha: 0.8,
            beta: 0.6,
            shots: 1000,
            threshold: 0.05,
            seed: 20260919,
            noise: { model: "NONE", probability: 0 },
            expectedSignerId: "INTELLIGENCE-ENGINE",
            expectedMessage: "Q-SHIELD REPLAY LEDGER INITIALIZATION",
            unauthorizedVerification: false,
          }),
        });

        if (!firstRes.ok) {
          throw new Error("Failed to initialize replay transaction in ledger.");
        }

        // Step 2: Submit second transaction with identical signatureId/sessionId/nonce context to trigger real replay detection
        bodyData = {
          experimentId: `INTEL-REPLAY-SECOND-${timestamp}`,
          sessionId: primarySessionId,
          signatureId: primarySignatureId,
          signerId: "INTELLIGENCE-ENGINE",
          message: "Q-SHIELD REPLAY LEDGER INITIALIZATION",
          nonce: primaryNonce,
          alpha: 0.8,
          beta: 0.6,
          shots: 1000,
          threshold: 0.05,
          seed: 20260919,
          noise: { model: "NONE", probability: 0 },
          expectedSignerId: "INTELLIGENCE-ENGINE",
          expectedMessage: "Q-SHIELD REPLAY LEDGER INITIALIZATION",
          unauthorizedVerification: false,
        };
      }

      const response = await fetch("/api/security/experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Threat analysis failed.");
      }

      setResult(data);
      setCompleted(true);

      const scenarioMeta = scenarios.find((s) => s.type === selectedScenario);
      const dec = data.experiment.quantum.verification.accepted ? "ACCEPT" : "REJECT";
      const item: HistoryItem = {
        id: data.experiment.experimentId,
        timestamp: new Date().toLocaleTimeString(),
        scenarioName: scenarioMeta?.label ?? selectedScenario,
        decision: dec,
        riskScore: data.experiment.threat.riskScore,
        threatType: data.experiment.threat.threatType,
        action: data.experiment.threat.recommendedAction,
      };

      setHistory((prev) => [item, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Threat analysis failed.");
    } finally {
      setRunning(false);
    }
  };

  const verification = result?.experiment.quantum.verification;
  const threat = result?.experiment.threat;
  const risk = threat?.riskScore ?? 0;
  const deviation = verification?.deviation ?? 0;
  const threshold = verification?.threshold ?? 0.05;
  const confidence = verification?.confidence ?? 0;
  const latency = result?.experiment.latencyMs ?? 0;
  const threatName = threat?.threatType ?? "NORMAL_BEHAVIOUR";
  const threatLevel = threat?.threatLevel ?? "LOW";

  return (
    <main className="intelligence-page">
      <div className="intelligence-grid-bg" />

      <div className="intelligence-container">

        {/* HEADER */}
        <header className="intelligence-header">
          <div>
            <div className="intelligence-eyebrow">
              Q-SHIELD / THREAT INTELLIGENCE CONSOLE
            </div>

            <h1>Security Intelligence</h1>

            <p>
              Evaluate real-time quantum signature telemetry across four backend-supported analysis scenarios.
            </p>
          </div>

          <Link href="/dashboard" className="intelligence-back">
            ← Dashboard
          </Link>
        </header>

        {/* STATUS BAR */}
        <section className="intel-status-bar">
          <div>
            <span className="intel-live-dot" />
            INTELLIGENCE ENGINE
            <strong>ONLINE</strong>
          </div>

          <div>
            ANALYSES IN SESSION
            <strong>{history.length}</strong>
          </div>

          <div>
            MODEL VERSION
            <strong>QSI-1.0</strong>
          </div>

          <div>
            LAST ANALYSIS
            <strong>
              {completed ? new Date().toLocaleTimeString() : "—"}
            </strong>
          </div>
        </section>

        {/* SCENARIO SELECTOR HUD */}
        <section className="intel-section" style={{ marginBottom: "32px" }}>
          <div className="intel-section-heading">
            <div>
              <span>ANALYSIS CONTROL CONSOLE</span>
              <h2>Select Threat Scenario</h2>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {scenarios.map((sc) => {
              const isSelected = selectedScenario === sc.type;
              return (
                <div
                  key={sc.type}
                  onClick={() => setSelectedScenario(sc.type)}
                  style={{
                    background: isSelected ? "rgba(7, 17, 35, 0.95)" : "rgba(5, 14, 29, 0.7)",
                    border: `1px solid ${isSelected ? sc.color : "rgba(73, 104, 170, 0.3)"}`,
                    borderRadius: "8px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    boxShadow: isSelected ? `0 0 20px ${sc.color}25` : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: sc.color, letterSpacing: "0.1em" }}>
                      {sc.tag}
                    </span>
                    {isSelected && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.color }} />}
                  </div>
                  <h3 style={{ color: "#edf4ff", fontSize: "17px", fontWeight: "700", marginBottom: "6px" }}>
                    {sc.label}
                  </h3>
                  <p style={{ color: "rgba(176, 191, 221, 0.7)", fontSize: "12.5px", lineHeight: 1.5, margin: 0 }}>
                    {sc.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HERO EXECUTION CONSOLE */}
        <section className="intel-hero">
          <div className="intel-hero-copy">
            <span>LIVE THREAT ASSESSMENT</span>

            <h2>
              {scenarios.find((s) => s.type === selectedScenario)?.label}
            </h2>

            <p>
              {scenarios.find((s) => s.type === selectedScenario)?.desc}
            </p>

            <button
              className="analysis-button"
              onClick={runAnalysis}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="analysis-spinner" />
                  Executing Security Analysis...
                </>
              ) : (
                <>
                  ✦ Run Threat Analysis ({selectedScenario})
                </>
              )}
            </button>
          </div>

          <div className="threat-score">
            <div className="threat-ring">
              <div>
                <strong>
                  {completed ? Math.round(risk * 100) : "—"}
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

        {/* RECENT SESSION HISTORY TABLE */}
        {history.length > 0 && (
          <section className="intel-section" style={{ marginTop: "40px" }}>
            <div className="intel-section-heading">
              <div>
                <span>SESSION HISTORY</span>
                <h2>Recent Session Analyses</h2>
              </div>
              <span className="model-count">{history.length} EXECUTED</span>
            </div>

            <div className="threat-table">
              <div className="threat-table-head">
                <span>TIME</span>
                <span>SCENARIO</span>
                <span>DECISION</span>
                <span>RISK</span>
                <span>THREAT TYPE</span>
                <span>ACTION</span>
              </div>

              {history.map((item, idx) => (
                <div key={idx} className="threat-row">
                  <span style={{ fontSize: "12px", color: "rgba(176, 191, 221, 0.6)", fontFamily: "monospace" }}>
                    {item.timestamp}
                  </span>
                  <strong style={{ color: "#edf4ff" }}>{item.scenarioName}</strong>
                  <span style={{ color: item.decision === "ACCEPT" ? "#35d8ff" : "#ff5555", fontWeight: "700" }}>
                    {item.decision}
                  </span>
                  <span style={{ fontFamily: "monospace" }}>
                    {(item.riskScore * 100).toFixed(1)}%
                  </span>
                  <span style={{ color: item.threatType !== "NONE" ? "#ff963f" : "rgba(176, 191, 221, 0.7)" }}>
                    {item.threatType}
                  </span>
                  <span style={{ fontWeight: "700", color: item.action === "ALLOW" ? "#35d8ff" : "#ff963f" }}>
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DETECTED PATTERNS & TELEMETRY RESULT DETAILS */}
        {completed && (
          <>
            <section className="intel-section">
              <div className="intel-section-heading">
                <div>
                  <span>BEHAVIOURAL CLASSIFICATION</span>
                  <h2>Detected Patterns</h2>
                </div>
                <span className="model-count">ANALYZED</span>
              </div>

              <div className="threat-table">
                <div className="threat-table-head">
                  <span>BEHAVIOUR</span>
                  <span>CONFIDENCE</span>
                  <span>SEVERITY</span>
                  <span>STATUS</span>
                </div>

                <div className="threat-row">
                  <strong>{threatName}</strong>
                  <div className="confidence">
                    <div>
                      <i style={{ width: `${Math.max(0, Math.min(100, confidence * 100))}%` }} />
                    </div>
                    <span>{(confidence * 100).toFixed(1)}%</span>
                  </div>

                  <span className={`severity severity-${threatLevel.toLowerCase()}`}>
                    {threatLevel}
                  </span>

                  <span className="pattern-status">
                    <i />
                    ANALYZED
                  </span>
                </div>
              </div>
            </section>

            <section className="intel-section">
              <div className="intel-section-heading">
                <div>
                  <span>STATISTICAL TELEMETRY</span>
                  <h2>Verification Signals</h2>
                </div>
              </div>

              <div className="detection-grid">
                <div className="detection-card">
                  <span>OBSERVED DEVIATION</span>
                  <strong>{(deviation * 100).toFixed(2)}%</strong>
                  <small>Threshold: {(threshold * 100).toFixed(2)}%</small>
                </div>

                <div className="detection-card">
                  <span>VERIFICATION</span>
                  <strong>
                    {verification?.accepted ? "ACCEPT" : "REJECT"}
                  </strong>
                  <small>Primary security decision</small>
                </div>

                <div className="detection-card">
                  <span>THREAT RISK</span>
                  <strong>{(risk * 100).toFixed(2)}%</strong>
                  <small>Security engine</small>
                </div>

                <div className="detection-card">
                  <span>PROCESSING TIME</span>
                  <strong>{`${latency.toFixed(2)}ms`}</strong>
                  <small>Experiment execution</small>
                </div>
              </div>
            </section>
          </>
        )}

        {/* RESULT ACTION ADVISORY */}
        {completed && result && (
          <section className="analysis-result">
            <div className="result-symbol">
              {threat?.detected ? "!" : "✓"}
            </div>

            <div>
              <span>ANALYSIS COMPLETE</span>
              <strong>
                {threat?.detected ? "Threat detected" : "No active threat detected"}
              </strong>
              <p>
                {threat?.reasons?.length
                  ? threat.reasons.join(" ")
                  : "Telemetry was processed successfully. The statistical verification layer remains authoritative."}
              </p>
            </div>

            <div className="result-time">
              <span>RECOMMENDED ACTION</span>
              <strong>{threat?.recommendedAction ?? "ALLOW"}</strong>
            </div>
          </section>
        )}

        {/* ERROR */}
        {error && (
          <section className="analysis-result">
            <div className="result-symbol">!</div>
            <div>
              <span>ANALYSIS ERROR</span>
              <strong>Threat analysis failed</strong>
              <p>{error}</p>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="intel-footer">
          <span>Q-SHIELD INTELLIGENCE ENGINE</span>
          <span>Statistical verification remains the primary security decision layer.</span>
        </footer>

      </div>
    </main>
  );
}