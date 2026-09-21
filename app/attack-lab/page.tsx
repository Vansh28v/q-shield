"use client";

import { useState } from "react";
import Link from "next/link";

const attacks = [
  {
    id: "forgery",
    number: "01",
    name: "Signature Forgery",
    description:
      "Attempts to modify the quantum signature while preserving the apparent message identity.",
    icon: "✦",
    risk: "HIGH",
    apiType: "FORGERY",
  },
  {
    id: "impersonation",
    number: "02",
    name: "Impersonation",
    description:
      "Simulates an unauthorized entity attempting to authenticate as a legitimate signer.",
    icon: "◇",
    risk: "CRITICAL",
    apiType: "IMPERSONATION",
  },
  {
    id: "replay",
    number: "03",
    name: "Replay Attack",
    description:
      "Reuses a previously valid signature in an attempt to bypass fresh verification.",
    icon: "↻",
    risk: "HIGH",
    apiType: "REPLAY",
  },
  {
    id: "channel",
    number: "04",
    name: "Quantum Channel Attack",
    description:
      "Introduces disturbances into the quantum communication channel.",
    icon: "⚡",
    risk: "CRITICAL",
    apiType: "CHANNEL_MANIPULATION",
  },
];

type AttackResult = {
  attackType: string;
  intensity: number;
  detected: boolean;
  riskScore: number;
  message: string;
  experiment: {
    verification: {
      accepted: boolean;
      threshold: number;
      deviation: number;
      riskIndicator: number;
      confidence: number;
    };
    latencyMs?: number;
  };
};

export default function AttackLab() {
  const [selected, setSelected] = useState("forgery");
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [error, setError] = useState("");

  const selectedAttack = attacks.find(
    (attack) => attack.id === selected,
  )!;

  const runSimulation = async () => {
    setRunning(true);
    setCompleted(false);
    setResult(null);
    setError("");

    try {
      const timestamp = Date.now();

      const response = await fetch("/api/security/attack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experiment: {
            experimentId: `ATTACK-LAB-${timestamp}`,
            sessionId: `ATTACK-SESSION-${timestamp}`,
            signatureId: `ATTACK-SIG-${timestamp}`,
            signerId: "ATTACK-LAB-SIGNER",
            message: "Q-SHIELD ATTACK LAB TEST",
            nonce: `ATTACK-NONCE-${timestamp}`,

            // Asymmetric quantum state so a bit-flip
            // creates a measurable statistical change.
            alpha: 0.8,
            beta: 0.6,

            shots: 1000,
            threshold: 0.05,
            seed: 20260919,

            noise: {
              model: "NONE",
              probability: 0,
            },
          },

          attack: {
            type: selectedAttack.apiType,
            intensity: 1,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Attack simulation failed.",
        );
      }

      setResult(data.attack);
      setCompleted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Attack simulation failed.",
      );
    } finally {
      setRunning(false);
    }
  };

  const deviation =
    result?.experiment.verification.deviation ?? 0;

  const threshold =
    result?.experiment.verification.threshold ?? 0.05;

  const riskScore =
    result?.riskScore ?? 0;

  const latency =
    result?.experiment.latencyMs ?? 0;

  return (
    <main className="attack-page">
      <div className="attack-background" />

      <div className="attack-container">

        {/* Header */}
        <header className="attack-header">
          <div>
            <div className="attack-eyebrow">
              Q-SHIELD / ADVERSARIAL SECURITY
            </div>

            <h1>Attack Laboratory</h1>

            <p>
              Simulate adversarial scenarios against the Quantum
              Digital Signature verification framework.
            </p>
          </div>

          <Link href="/dashboard" className="attack-back">
            ← Dashboard
          </Link>
        </header>

        {/* Status bar */}
        <div className="attack-status">
          <div>
            <span className="live-dot" />
            SIMULATION ENVIRONMENT
            <strong>READY</strong>
          </div>

          <div>
            QUANTUM CHANNEL
            <strong className="stable">STABLE</strong>
          </div>

          <div>
            DETECTION ENGINE
            <strong>ACTIVE</strong>
          </div>
        </div>

        {/* Main grid */}
        <div className="attack-layout">

          {/* Attack selection */}
          <section className="attack-panel attack-selection">

            <div className="panel-title">
              <div>
                <span>ATTACK VECTORS</span>
                <h2>Select Scenario</h2>
              </div>

              <div className="vector-count">
                04
              </div>
            </div>

            <div className="attack-list">
              {attacks.map((attack) => (
                <button
                  key={attack.id}
                  onClick={() => {
                    setSelected(attack.id);
                    setCompleted(false);
                    setResult(null);
                    setError("");
                  }}
                  className={`attack-option ${
                    selected === attack.id
                      ? "attack-selected"
                      : ""
                  }`}
                >
                  <div className="attack-number">
                    {attack.number}
                  </div>

                  <div className="attack-icon">
                    {attack.icon}
                  </div>

                  <div className="attack-option-text">
                    <strong>{attack.name}</strong>
                    <span>{attack.description}</span>
                  </div>

                  <div
                    className={`risk risk-${attack.risk.toLowerCase()}`}
                  >
                    {attack.risk}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Simulation */}
          <section className="attack-panel simulation-panel">

            <div className="panel-title">
              <div>
                <span>SIMULATION CORE</span>
                <h2>{selectedAttack.name}</h2>
              </div>

              <div className="simulation-state">
                <span className={running ? "pulse" : ""} />
                {running ? "RUNNING" : "STANDBY"}
              </div>
            </div>

            {/* Quantum flow */}
            <div className="quantum-flow">

              <div className="flow-node">
                <div className="flow-symbol">
                  S
                </div>
                <span>Signer</span>
              </div>

              <div className="flow-line">
                <i />
              </div>

              <div className="flow-node">
                <div className="flow-symbol bell">
                  B
                </div>
                <span>Bell State</span>
              </div>

              <div className="flow-line attack-line">
                <i />
                <b>ATTACK</b>
              </div>

              <div className="flow-node">
                <div className="flow-symbol">
                  V
                </div>
                <span>Verifier</span>
              </div>

            </div>

            {/* Parameters */}
            <div className="simulation-controls">

              <div className="control">
                <label>MEASUREMENT SHOTS</label>

                <div className="control-value">
                  1,000
                </div>
              </div>

              <div className="control">
                <label>CHANNEL NOISE</label>

                <div className="control-value">
                  0%
                </div>
              </div>

              <div className="control">
                <label>ATTACK INTENSITY</label>

                <div className="control-value">
                  100%
                </div>
              </div>

            </div>

            {/* Run button */}
            <button
              className={`run-button ${
                running ? "running" : ""
              }`}
              onClick={runSimulation}
              disabled={running}
            >
              {running ? (
                <>
                  <span className="button-spinner" />
                  Running Simulation...
                </>
              ) : (
                <>
                  ⚡ Run Attack Simulation
                </>
              )}
            </button>

            {/* Result */}
            {completed && result && (
              <div className="simulation-result">

                <div className="result-icon">
                  {result.detected ? "!" : "✓"}
                </div>

                <div>
                  <span>SIMULATION RESULT</span>

                  <strong>
                    {result.detected
                      ? "Attack Detected"
                      : "Attack Not Detected"}
                  </strong>

                  <p>
                    {result.message}
                  </p>
                </div>

                <div className="result-score">
                  <span>RISK SCORE</span>

                  <strong>
                    {(riskScore * 100).toFixed(2)}%
                  </strong>
                </div>

              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

          </section>
        </div>

        {/* Detection metrics */}
        <section className="detection-section">

          <div className="detection-heading">

            <div>
              <span>DETECTION TELEMETRY</span>
              <h2>Security Response</h2>
            </div>

            <div className="threshold">
              THRESHOLD

              <strong>
                {(threshold * 100).toFixed(2)}%
              </strong>
            </div>

          </div>

          <div className="detection-grid">

            <div className="detection-card">
              <span>OBSERVED DEVIATION</span>

              <strong>
                {(deviation * 100).toFixed(2)}%
              </strong>

              <small>
                {deviation > threshold
                  ? "↑ Above threshold"
                  : "Within threshold"}
              </small>
            </div>

            <div className="detection-card">
              <span>RISK SCORE</span>

              <strong>
                {(riskScore * 100).toFixed(2)}%
              </strong>

              <small>
                Engine calculated
              </small>
            </div>

            <div className="detection-card">
              <span>VERIFICATION</span>

              <strong>
                {result
                  ? result.experiment.verification.accepted
                    ? "ACCEPT"
                    : "REJECT"
                  : "—"}
              </strong>

              <small>
                Statistical decision
              </small>
            </div>

            <div className="detection-card">
              <span>RESPONSE TIME</span>

              <strong>
                {result
                  ? `${latency.toFixed(2)}ms`
                  : "—"}
              </strong>

              <small>
                Engine execution
              </small>
            </div>

          </div>
        </section>

        {/* Footer */}
        <footer className="attack-footer">

          <span>
            Q-SHIELD ATTACK LAB
          </span>

          <span>
            All simulations run inside an isolated security
            environment.
          </span>

        </footer>

      </div>
    </main>
  );
}