"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
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
    detectionSemantics:
      "Intended detection path: a simulated signature/state deviation is detected by statistical verification.",
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
    detectionSemantics:
      "Detection path: the claimed signer identity is compared against the trusted expected signer identity. A mismatch is detected by identity verification, independent of attack intensity.",
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
    detectionSemantics:
      "Intended detection path: the quantum statistics may remain valid, but session/nonce freshness is rejected by the persistent replay ledger.",
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
    detectionSemantics:
      "Intended detection path: quantum correlation/statistical behavior changes, and the configured detection mechanism identifies the manipulation. Statistical verification is one component of this mechanism, not the whole of it.",
  },
];

type AttackResult = {
  attackType: string;
  intensity: number;
  detected: boolean;
  riskScore: number;
  message: string;
  mechanism?: string;
  evidence?: string | string[];
  decision?: string;
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

// FIX #1 (REPLAY) — a tracked transaction the Attack Lab can
// resubmit unchanged, so the persistent replay ledger has a real
// second occurrence of the same signatureId/sessionId/nonce to
// detect. Only used for the REPLAY attack type. UNCHANGED by Fix #2.
type ReplayTransaction = {
  sessionId: string;
  signatureId: string;
  nonce: string;
  signerId: string;
};

/* ------------------------------------------------------------------ */
/* SHARED INLINE STYLES FOR THE FIX 6 / FIX 7 / FIX 9 CLARITY BLOCKS    */
/* ------------------------------------------------------------------ */

const PASS_COLOR = "rgba(70, 220, 150, 0.9)";
const WARN_COLOR = "rgba(255, 95, 115, 0.9)";

const blockStyle: CSSProperties = {
  marginTop: "16px",
  padding: "16px 18px",
  borderRadius: "12px",
  background: "rgba(20, 25, 55, 0.28)",
};

const blockKickerStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.6,
  marginBottom: "8px",
};

const bodyTextStyle: CSSProperties = {
  margin: 0,
  fontSize: "13px",
  lineHeight: 1.6,
  opacity: 0.8,
};

const mutedTextStyle: CSSProperties = {
  margin: 0,
  fontSize: "12.5px",
  lineHeight: 1.6,
  opacity: 0.65,
};

const chainChipStyle: CSSProperties = {
  padding: "7px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(120, 150, 255, 0.22)",
  background: "rgba(20, 25, 55, 0.35)",
  fontSize: "11.5px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const detailCellStyle: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid rgba(120, 150, 255, 0.14)",
  borderRadius: "10px",
  background: "rgba(20, 25, 55, 0.22)",
};

const detailLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "10.5px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.55,
  marginBottom: "4px",
};

const detailValueStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const stageCardStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(120, 150, 255, 0.2)",
  background: "rgba(20, 25, 55, 0.32)",
};

const replayGhostButtonStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "1px solid rgba(120, 150, 255, 0.3)",
  background: "rgba(20, 25, 55, 0.4)",
  color: "inherit",
  fontSize: "12px",
  letterSpacing: "0.04em",
  cursor: "pointer",
};

// FIX #2 (IMPERSONATION) — fixed demo identities so the claimed
// signer and the trusted expected signer are explicitly different,
// giving a genuine identity mismatch for the backend to detect.
const IMPERSONATION_CLAIMED_SIGNER_ID = "ATTACK-LAB-IMPOSTOR";
const IMPERSONATION_EXPECTED_SIGNER_ID = "ATTACK-LAB-LEGITIMATE";

export default function AttackLab() {
  const [selected, setSelected] = useState("forgery");
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [error, setError] = useState("");

  // FIX #1 (REPLAY) — UNCHANGED by Fix #2.
  const [replayTransaction, setReplayTransaction] =
    useState<ReplayTransaction | null>(null);

  const selectedAttack = attacks.find(
    (attack) => attack.id === selected,
  )!;

  function generateReplayTransaction(): ReplayTransaction {
    const timestamp = Date.now();

    return {
      sessionId: `REPLAY-SESSION-${timestamp}`,
      signatureId: `REPLAY-SIG-${timestamp}`,
      nonce: `REPLAY-NONCE-${timestamp}`,
      signerId: "ATTACK-LAB-SIGNER",
    };
  }

  function startNewReplayTransaction() {
    setReplayTransaction(null);
    setCompleted(false);
    setResult(null);
    setError("");
  }

  const runSimulation = async () => {
    setRunning(true);
    setCompleted(false);
    setResult(null);
    setError("");

    try {
      const timestamp = Date.now();

      const isReplay = selectedAttack.apiType === "REPLAY";
      const isImpersonation =
        selectedAttack.apiType === "IMPERSONATION";

      /*
       * FIX #1 (REPLAY) — UNCHANGED. For REPLAY, reuse the same
       * session/signature/nonce across separate requests so the
       * persistent replay ledger has a genuine second occurrence
       * to detect.
       */
      let activeReplayTransaction = replayTransaction;

      if (isReplay && !activeReplayTransaction) {
        activeReplayTransaction = generateReplayTransaction();
        setReplayTransaction(activeReplayTransaction);
      }

      /*
       * FIX #2 (IMPERSONATION) — send two explicit, different
       * identities: signerId (the claimed identity) and
       * expectedSignerId (the trusted identity). Every other
       * attack type keeps its previous per-run identity behavior
       * unchanged.
       */
      const identity =
        isReplay && activeReplayTransaction
          ? activeReplayTransaction
          : isImpersonation
            ? {
                sessionId: `ATTACK-SESSION-${timestamp}`,
                signatureId: `ATTACK-SIG-${timestamp}`,
                nonce: `ATTACK-NONCE-${timestamp}`,
                signerId: IMPERSONATION_CLAIMED_SIGNER_ID,
              }
            : {
                sessionId: `ATTACK-SESSION-${timestamp}`,
                signatureId: `ATTACK-SIG-${timestamp}`,
                nonce: `ATTACK-NONCE-${timestamp}`,
                signerId: "ATTACK-LAB-SIGNER",
              };

      const experimentBody: Record<string, unknown> = {
        experimentId: `ATTACK-LAB-${timestamp}`,
        sessionId: identity.sessionId,
        signatureId: identity.signatureId,
        signerId: identity.signerId,
        message: "Q-SHIELD ATTACK LAB TEST",
        nonce: identity.nonce,

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
      };

      // FIX #2 (IMPERSONATION) — only sent for the IMPERSONATION
      // attack type, so other scenarios are unaffected.
      if (isImpersonation) {
        experimentBody.expectedSignerId =
          IMPERSONATION_EXPECTED_SIGNER_ID;
      }

      const response = await fetch("/api/security/attack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experiment: experimentBody,

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

  const latencyMs = result?.experiment.latencyMs;

  const latencyDisplay =
    typeof latencyMs === "number" && Number.isFinite(latencyMs)
      ? `${latencyMs.toFixed(2)}ms`
      : "N/A";

  const detected = result ? result.detected : null;

  const statisticalAccepted = result
    ? result.experiment.verification.accepted
    : null;

  const evidence: string[] =
    result && typeof result.evidence === "string"
      ? [result.evidence]
      : result && Array.isArray(result.evidence)
        ? result.evidence
        : [];

  const backendDetails: { label: string; value: string }[] = [];

  if (result && typeof result.intensity === "number") {
    backendDetails.push({
      label: "Attack intensity",
      value: `${(result.intensity * 100).toFixed(0)}%`,
    });
  }

  let comparisonNote = "";

  if (detected !== null && statisticalAccepted !== null) {
    if (detected && statisticalAccepted) {
      comparisonNote =
        "Quantum statistical verification accepted the measurement statistics (deviation within threshold), yet the final security decision still flagged the simulated attack. Detection therefore did not come from the statistical verifier rejecting the signature; it came from another security control. For example, in a replay scenario the quantum statistics can remain valid while session/nonce freshness is rejected by the replay ledger, and in an impersonation scenario detection comes from an identity comparison rather than the quantum experiment. See the mechanism reported below.";
    } else if (detected && !statisticalAccepted) {
      comparisonNote =
        "Quantum statistical verification rejected the signature (deviation exceeded the threshold), and the final security decision flagged the simulated attack as detected.";
    } else if (!detected && statisticalAccepted) {
      comparisonNote =
        "Quantum statistical verification accepted the measurement statistics, and the final security decision did not flag the simulated attack.";
    } else {
      comparisonNote =
        "Quantum statistical verification rejected the signature, while the final security decision reports the simulated attack as not detected. The two results are reported independently by the backend.";
    }
  }

  const finalDecisionLabel = (() => {
    if (!result) {
      return "—";
    }

    if (result.decision) {
      return String(result.decision).toUpperCase();
    }

    return result.detected ? "ATTACK DETECTED" : "NOT DETECTED";
  })();

  const isReplaySelected = selectedAttack.id === "replay";
  const isImpersonationSelected = selectedAttack.id === "impersonation";

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

            {/* FIX #2 (IMPERSONATION) — identity comparison panel,
                shown only for the Impersonation attack. Displays
                the two fixed demo identities that will actually be
                compared by the backend. */}
            {isImpersonationSelected && (
              <div
                style={{
                  ...blockStyle,
                  marginTop: "16px",
                  border: "1px solid rgba(120, 150, 255, 0.2)",
                }}
              >
                <span style={blockKickerStyle}>
                  IDENTITY COMPARISON
                </span>

                <p style={{ ...bodyTextStyle, marginBottom: "10px" }}>
                  Running this simulation submits a claimed signer
                  identity and compares it against the trusted
                  expected signer identity. Detection depends only
                  on whether these match — not on attack intensity.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                  }}
                >
                  <div style={detailCellStyle}>
                    <span style={detailLabelStyle}>
                      Claimed signer identity
                    </span>
                    <strong style={detailValueStyle}>
                      {IMPERSONATION_CLAIMED_SIGNER_ID}
                    </strong>
                  </div>

                  <div style={detailCellStyle}>
                    <span style={detailLabelStyle}>
                      Expected (trusted) signer identity
                    </span>
                    <strong style={detailValueStyle}>
                      {IMPERSONATION_EXPECTED_SIGNER_ID}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* FIX #1 (REPLAY) — UNCHANGED. Transaction tracker,
                shown only for the REPLAY attack. */}
            {isReplaySelected && (
              <div
                style={{
                  ...blockStyle,
                  marginTop: "16px",
                  border: "1px solid rgba(120, 150, 255, 0.2)",
                }}
              >
                <span style={blockKickerStyle}>
                  REPLAY TRANSACTION TRACKER
                </span>

                {replayTransaction ? (
                  <>
                    <p style={{ ...bodyTextStyle, marginBottom: "10px" }}>
                      A transaction is currently tracked. Running the
                      simulation again will resubmit these exact
                      identifiers — the persistent replay ledger
                      should report this as a replay.
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={detailCellStyle}>
                        <span style={detailLabelStyle}>
                          Session ID
                        </span>
                        <strong style={detailValueStyle}>
                          {replayTransaction.sessionId}
                        </strong>
                      </div>

                      <div style={detailCellStyle}>
                        <span style={detailLabelStyle}>
                          Signature ID
                        </span>
                        <strong style={detailValueStyle}>
                          {replayTransaction.signatureId}
                        </strong>
                      </div>

                      <div style={detailCellStyle}>
                        <span style={detailLabelStyle}>
                          Nonce
                        </span>
                        <strong style={detailValueStyle}>
                          {replayTransaction.nonce}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ ...bodyTextStyle, marginBottom: "12px" }}>
                    No transaction is tracked yet. Running the
                    simulation will create one and record it in the
                    replay ledger — that first run should NOT be
                    detected as a replay.
                  </p>
                )}

                <button
                  type="button"
                  style={replayGhostButtonStyle}
                  onClick={startNewReplayTransaction}
                  disabled={running || !replayTransaction}
                >
                  Start New Transaction
                </button>
              </div>
            )}

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

                <div
                  className="result-icon"
                  style={{
                    color: result.detected
                      ? PASS_COLOR
                      : WARN_COLOR,
                  }}
                >
                  {result.detected ? "✓" : "!"}
                </div>

                <div>
                  <span>SIMULATION RESULT</span>

                  <strong>
                    {result.detected
                      ? "ATTACK DETECTED — SECURITY TEST PASSED"
                      : "ATTACK NOT DETECTED — SECURITY TEST NOT PASSED"}
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

            {/* Result interpretation */}
            {completed && result && (
              <div
                style={{
                  ...blockStyle,
                  border: `1px solid ${
                    result.detected
                      ? "rgba(70, 220, 150, 0.4)"
                      : "rgba(255, 95, 115, 0.4)"
                  }`,
                  background: result.detected
                    ? "rgba(70, 220, 150, 0.06)"
                    : "rgba(255, 95, 115, 0.06)",
                }}
              >
                <span style={blockKickerStyle}>
                  HOW TO READ THIS RESULT
                </span>

                {/* Simulated attack → detection → test outcome */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "14px",
                  }}
                >
                  <span style={chainChipStyle}>
                    SIMULATED ATTACK: {selectedAttack.name}
                  </span>

                  <span style={{ opacity: 0.5 }}>→</span>

                  <span
                    style={{
                      ...chainChipStyle,
                      color: result.detected
                        ? PASS_COLOR
                        : WARN_COLOR,
                    }}
                  >
                    {result.detected
                      ? "DETECTED BY Q-SHIELD"
                      : "NOT DETECTED BY Q-SHIELD"}
                  </span>

                  <span style={{ opacity: 0.5 }}>→</span>

                  <span
                    style={{
                      ...chainChipStyle,
                      color: result.detected
                        ? PASS_COLOR
                        : WARN_COLOR,
                      fontWeight: 700,
                    }}
                  >
                    {result.detected
                      ? "SECURITY TEST: PASSED"
                      : "SECURITY TEST: NOT PASSED"}
                  </span>
                </div>

                <p
                  style={{
                    ...bodyTextStyle,
                    opacity: 1,
                    marginBottom: "6px",
                  }}
                >
                  <strong
                    style={{
                      color: result.detected
                        ? PASS_COLOR
                        : WARN_COLOR,
                    }}
                  >
                    {result.detected
                      ? "Attack detected — security control passed."
                      : "Attack not detected — security control did not detect the simulated attack."}
                  </strong>
                </p>

                <p style={mutedTextStyle}>
                  {result.detected
                    ? "Security test passed: the simulated attack was detected. \u201CPassed\u201D describes the security control, not the attack — the attack did not succeed in evading detection."
                    : "The security control did not detect the simulated attack in this run. This describes the detection outcome of the security control, not a success or failure of the attack itself."}
                </p>

                {/* Attack-type semantics (design intent) */}
                <p
                  style={{
                    ...mutedTextStyle,
                    marginTop: "12px",
                  }}
                >
                  <strong>{selectedAttack.name}.</strong>{" "}
                  {selectedAttack.detectionSemantics} The
                  mechanism and evidence reported by the backend
                  for this run are shown below and are the source
                  of truth for how this run was evaluated.
                </p>

                {selectedAttack.id === "replay" && (
                  <p
                    style={{
                      ...mutedTextStyle,
                      marginTop: "10px",
                    }}
                  >
                    A replay may preserve valid quantum measurement
                    statistics. Q-SHIELD therefore also checks
                    session/nonce freshness through the persistent
                    replay ledger, separately from the statistical
                    verification result shown below.
                  </p>
                )}

                {selectedAttack.id === "impersonation" && (
                  <p
                    style={{
                      ...mutedTextStyle,
                      marginTop: "10px",
                    }}
                  >
                    Impersonation is evaluated by comparing the
                    claimed signer identity against the trusted
                    expected identity, separately from the
                    statistical verification result shown below.
                  </p>
                )}

                {/* Real backend values (intensity only — mechanism,
                    decision, and attack type are shown in the
                    dedicated DETECTION MECHANISM section below) */}
                {backendDetails.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "10px",
                      marginTop: "14px",
                    }}
                  >
                    {backendDetails.map((detail) => (
                      <div
                        key={detail.label}
                        style={detailCellStyle}
                      >
                        <span style={detailLabelStyle}>
                          {detail.label}
                        </span>

                        <strong style={detailValueStyle}>
                          {detail.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* FIX 9 — Detection mechanism and backend evidence,
                made prominent immediately after the result
                interpretation area. All values come directly from
                the backend response (result.mechanism, result.decision,
                result.attackType, result.evidence). */}
            {completed && result && (
              <div
                style={{
                  ...blockStyle,
                  border: "1px solid rgba(140, 170, 255, 0.32)",
                  background: "rgba(90, 120, 255, 0.06)",
                }}
              >
                <span style={blockKickerStyle}>
                  DETECTION MECHANISM
                </span>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  <div style={detailCellStyle}>
                    <span style={detailLabelStyle}>
                      Mechanism
                    </span>

                    <strong style={detailValueStyle}>
                      {result.mechanism
                        ? result.mechanism
                        : "N/A"}
                    </strong>
                  </div>

                  <div style={detailCellStyle}>
                    <span style={detailLabelStyle}>
                      Detection decision
                    </span>

                    <strong style={detailValueStyle}>
                      {result.decision
                        ? result.decision
                        : "N/A"}
                    </strong>
                  </div>

                  <div style={detailCellStyle}>
                    <span style={detailLabelStyle}>
                      Attack type
                    </span>

                    <strong style={detailValueStyle}>
                      {result.attackType
                        ? result.attackType
                        : "N/A"}
                    </strong>
                  </div>
                </div>

                <span style={blockKickerStyle}>
                  BACKEND EVIDENCE
                </span>

                {evidence.length > 0 ? (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "18px",
                      fontSize: "12.5px",
                      lineHeight: 1.7,
                      opacity: 0.85,
                    }}
                  >
                    {evidence.map((item, index) => (
                      <li key={`${index}-${String(item)}`}>
                        {String(item)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={mutedTextStyle}>
                    No evidence returned by backend.
                  </p>
                )}
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
              <span>QUANTUM STAT. VERIFICATION</span>

              <strong>
                {result
                  ? result.experiment.verification.accepted
                    ? "ACCEPT"
                    : "REJECT"
                  : "—"}
              </strong>

              <small>
                Statistical decision only
              </small>
            </div>

            <div className="detection-card">
              <span>RESPONSE TIME</span>

              <strong>
                {result ? latencyDisplay : "—"}
              </strong>

              <small>
                Engine execution
              </small>
            </div>

          </div>

          {/* FIX 7 — Statistical verification vs final security decision */}
          <div
            style={{
              ...blockStyle,
              border: "1px solid rgba(120, 150, 255, 0.18)",
            }}
          >
            <span style={blockKickerStyle}>
              ATTACK DETECTION VS STATISTICAL VERIFICATION
            </span>

            <p
              style={{
                ...bodyTextStyle,
                marginBottom: "14px",
              }}
            >
              These are two related but distinct results. Q-SHIELD&apos;s
              quantum statistical verification and its final
              security decision can differ, because the final
              decision may combine the statistical result with
              other controls such as identity checks or session/
              nonce freshness.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "stretch",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              {/* A. QUANTUM STATISTICAL VERIFICATION */}
              <div style={{ ...stageCardStyle, flex: "1 1 260px" }}>
                <span style={detailLabelStyle}>
                  A — Quantum Statistical Verification
                </span>

                <p
                  style={{
                    margin: "4px 0 10px 0",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    opacity: 0.65,
                  }}
                >
                  Did the observed measurement behavior stay within
                  the configured statistical threshold?
                </p>

                <strong
                  style={{
                    ...detailValueStyle,
                    fontSize: "15px",
                    color:
                      statisticalAccepted === null
                        ? undefined
                        : statisticalAccepted
                          ? PASS_COLOR
                          : WARN_COLOR,
                  }}
                >
                  {statisticalAccepted === null
                    ? "—"
                    : statisticalAccepted
                      ? "ACCEPT"
                      : "REJECT"}
                </strong>

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "11.5px",
                    opacity: 0.6,
                  }}
                >
                  {result
                    ? `Deviation ${(deviation * 100).toFixed(2)}% vs threshold ${(threshold * 100).toFixed(2)}%`
                    : "Run a simulation to see this result."}
                </small>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  opacity: 0.5,
                  padding: "0 4px",
                }}
              >
                +
              </div>

              {/* B. FINAL SECURITY DECISION */}
              <div style={{ ...stageCardStyle, flex: "1 1 260px" }}>
                <span style={detailLabelStyle}>
                  B — Final Security Decision
                </span>

                <p
                  style={{
                    margin: "4px 0 10px 0",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    opacity: 0.65,
                  }}
                >
                  Did Q-SHIELD&apos;s security controls determine
                  that the simulated scenario should be accepted or
                  rejected?
                </p>

                <strong
                  style={{
                    ...detailValueStyle,
                    fontSize: "15px",
                    color:
                      detected === null
                        ? undefined
                        : detected
                          ? WARN_COLOR
                          : PASS_COLOR,
                  }}
                >
                  {finalDecisionLabel}
                </strong>

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "11.5px",
                    opacity: 0.6,
                  }}
                >
                  {detected === null
                    ? "Run a simulation to see this result."
                    : detected
                      ? "Attack detected — security test passed (the control caught the simulated attack)."
                      : "Attack not detected by the security controls for this run."}
                </small>
              </div>
            </div>

            <p style={mutedTextStyle}>
              Statistical verification evaluates the modeled quantum
              measurement behavior. The final security decision may
              additionally use identity checks, session/nonce
              freshness, or attack-specific controls — it is not
              always derived from statistical verification alone.
            </p>

            {comparisonNote && (
              <p style={{ ...mutedTextStyle, marginTop: "10px" }}>
                {comparisonNote}
              </p>
            )}

            {!result && (
              <p style={{ ...mutedTextStyle, marginTop: "10px" }}>
                Run a simulation to compare both results for a
                scenario. An attack can be detected even when the
                quantum statistics remain valid — for example,
                replay rejected by the replay ledger, or impersonation
                caught by an identity mismatch.
              </p>
            )}
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