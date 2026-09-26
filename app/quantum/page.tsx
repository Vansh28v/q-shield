"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";

type Stage = {
  id: number;
  label: string;
  title: string;
  description: string;
};

type Verification = {
  accepted: boolean;
  threshold: number;
  deviation: number;
  confidence?: number;
};

// Same request structure that the Analytics page already sends to
// the existing /api/security/experiment endpoint.
type ExperimentRequest = {
  experimentId: string;
  sessionId: string;
  signatureId: string;
  signerId: string;
  message: string;
  nonce: string;
  alpha: number;
  beta: number;
  shots: number;
  threshold: number;
  seed: number;
  noise: {
    model: string;
    probability: number;
  };
  expectedSignerId: string;
  expectedMessage: string;
  unauthorizedVerification: boolean;
};

// Same response structure that the Analytics page already reads from
// the existing /api/security/experiment endpoint.
type ExperimentResponse = {
  success?: boolean;
  error?: string;
  experiment?: {
    experimentId?: string;
    latencyMs?: number;
    quantum?: {
      verification?: Verification;
    };
  };
};

type ExperimentResult = {
  experimentId: string;
  latencyMs?: number;
  verification: Verification;
};

type ContextField = {
  label: string;
  value: string;
};

const stages: Stage[] = [
  {
    id: 1,
    label: "THREAT",
    title: "Classical Cryptography",
    description:
      "Classical public-key systems such as RSA and ECC rely on mathematical problems that are difficult for classical computers.",
  },
  {
    id: 2,
    label: "QUANTUM THREAT",
    title: "Shor's Algorithm",
    description:
      "A sufficiently capable quantum computer can use Shor's algorithm to efficiently solve integer factorization and discrete-logarithm problems, threatening RSA and ECC.",
  },
  {
    id: 3,
    label: "RESPONSE",
    title: "Quantum Digital Signatures",
    description:
      "Q-SHIELD explores a teleportation-based quantum digital signature workflow designed around quantum states and measurement statistics.",
  },
  {
    id: 4,
    label: "ENTANGLEMENT",
    title: "Bell State",
    description:
      "An entangled Bell pair provides the quantum resource used by the teleportation stage.",
  },
  {
    id: 5,
    label: "TRANSFER",
    title: "Quantum Teleportation",
    description:
      "The sender performs a Bell-state measurement and communicates classical measurement information to the receiver.",
  },
  {
    id: 6,
    label: "CORRECTION",
    title: "Pauli Correction",
    description:
      "The receiver applies the corresponding Pauli operation based on the classical measurement result.",
  },
  {
    id: 7,
    label: "VERIFICATION",
    title: "Projective Measurement",
    description:
      "The reconstructed state is measured in selected bases to obtain observable outcomes for verification.",
  },
  {
    id: 8,
    label: "DECISION",
    title: "Statistical Verification",
    description:
      "Observed measurement statistics can be compared against expected behaviour using a threshold-based verification rule.",
  },
];

/* ------------------------------------------------------------------ */
/* EXPERIMENT CONFIGURATION                                            */
/* These are the parameters actually sent to the existing experiment   */
/* endpoint when RUN PROTOCOL is pressed.                              */
/* ------------------------------------------------------------------ */

const EXPERIMENT_SIGNER_ID = "Q-SHIELD-DEMO-SIGNER";
const EXPERIMENT_MESSAGE = "Q-SHIELD QUANTUM LAB EXPERIMENT";
const EXPERIMENT_SHOTS = 1000;
const EXPERIMENT_THRESHOLD = 0.05;

function buildExperimentRequest(): ExperimentRequest {
  const timestamp = Date.now();
  const seed = timestamp % 2147483647;

  const phase = ((seed % 100) / 100) * 0.35;

  const alpha = Math.cos(Math.PI / 5 + phase);
  const beta = Math.sin(Math.PI / 5 + phase);

  const cycleId = `QLAB-${timestamp}`;

  return {
    experimentId: `${cycleId}-EXPERIMENT`,
    sessionId: `${cycleId}-SESSION`,
    signatureId: `${cycleId}-SIG`,
    signerId: EXPERIMENT_SIGNER_ID,
    message: EXPERIMENT_MESSAGE,
    nonce: `${cycleId}-NONCE`,
    alpha,
    beta,
    shots: EXPERIMENT_SHOTS,
    threshold: EXPERIMENT_THRESHOLD,
    seed,
    noise: {
      model: "NONE",
      probability: 0,
    },
    expectedSignerId: EXPERIMENT_SIGNER_ID,
    expectedMessage: EXPERIMENT_MESSAGE,
    unauthorizedVerification: false,
  };
}

async function postExperiment(
  body: ExperimentRequest,
): Promise<ExperimentResponse> {
  const response = await fetch("/api/security/experiment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as ExperimentResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "/api/security/experiment failed.",
    );
  }

  return data;
}

function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/* ------------------------------------------------------------------ */
/* SHARED INLINE STYLES FOR THE NEW CONTEXT SECTIONS                   */
/* ------------------------------------------------------------------ */

const contextCellStyle: CSSProperties = {
  padding: "12px 14px",
  border: "1px solid rgba(120, 150, 255, 0.14)",
  borderRadius: "10px",
  background: "rgba(20, 25, 55, 0.22)",
};

const contextLabelStyle: CSSProperties = {
  display: "block",
  fontSize: "10.5px",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  opacity: 0.55,
  marginBottom: "4px",
};

const contextValueStyle: CSSProperties = {
  display: "block",
  fontSize: "13px",
  lineHeight: 1.4,
  wordBreak: "break-all",
};

const groupChipStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(120, 150, 255, 0.18)",
  background: "rgba(20, 25, 55, 0.28)",
  fontSize: "11.5px",
  letterSpacing: "0.04em",
};

const groupChipActiveStyle: CSSProperties = {
  ...groupChipStyle,
  border: "1px solid rgba(140, 170, 255, 0.6)",
  background: "rgba(90, 120, 255, 0.18)",
};

export default function QuantumPage() {
  const [activeStage, setActiveStage] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [request, setRequest] = useState<ExperimentRequest | null>(null);
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [error, setError] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const running = animating || fetching;

  async function executeExperiment(body: ExperimentRequest) {
    try {
      const data = await postExperiment(body);

      const verification = data.experiment?.quantum?.verification;

      if (!verification) {
        throw new Error(
          "Experiment response did not include verification data.",
        );
      }

      setResult({
        experimentId: data.experiment?.experimentId ?? body.experimentId,
        latencyMs: data.experiment?.latencyMs,
        verification,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Experiment execution failed.",
      );
    } finally {
      setFetching(false);
    }
  }

  function runProtocol() {
    if (running) {
      return;
    }

    const nextRequest = buildExperimentRequest();

    setRequest(nextRequest);
    setResult(null);
    setError("");
    setFetching(true);
    setAnimating(true);
    setActiveStage(0);

    void executeExperiment(nextRequest);

    let current = 0;

    intervalRef.current = setInterval(() => {
      current++;

      if (current >= stages.length) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setAnimating(false);
        setActiveStage(stages.length - 1);
      } else {
        setActiveStage(current);
      }
    }, 650);
  }

  /* ---------------------------------------------------------------- */
  /* DERIVED EXPERIMENT VALUES (ALL REAL — FROM REQUEST / RESPONSE)    */
  /* ---------------------------------------------------------------- */

  const verification =
    !running && result ? result.verification : null;

  const contextFields: ContextField[] = [];

  if (request) {
    contextFields.push(
      {
        label: "Experiment ID",
        value: result?.experimentId ?? request.experimentId,
      },
      { label: "Session ID", value: request.sessionId },
      { label: "Signature ID", value: request.signatureId },
      { label: "Signer ID", value: request.signerId },
      { label: "Message", value: request.message },
      { label: "Nonce", value: request.nonce },
      {
        label: "Input state (α, β)",
        value: `α = ${request.alpha.toFixed(4)}, β = ${request.beta.toFixed(4)}`,
      },
      { label: "Measurement shots", value: String(request.shots) },
      {
        label: "Threshold",
        value: formatPercent(
          verification ? verification.threshold : request.threshold,
        ),
      },
      { label: "Noise model", value: request.noise.model },
      {
        label: "Noise probability",
        value: String(request.noise.probability),
      },
      { label: "Seed", value: String(request.seed) },
    );
  }

  if (verification && result) {
    contextFields.push(
      {
        label: "Observed deviation",
        value: formatPercent(verification.deviation),
      },
      {
        label: "Verification result",
        value: verification.accepted ? "ACCEPT" : "REJECT",
      },
    );

    if (typeof verification.confidence === "number") {
      contextFields.push({
        label: "Confidence",
        value: verification.confidence.toFixed(4),
      });
    }

    if (typeof result.latencyMs === "number") {
      contextFields.push({
        label: "Latency",
        value: `${result.latencyMs.toFixed(2)} ms`,
      });
    }
  }

  const contextStatus = running
    ? "EXPERIMENT RUNNING"
    : error
      ? "EXPERIMENT FAILED"
      : verification
        ? verification.accepted
          ? "ACCEPT"
          : "REJECT"
        : "NO EXPERIMENT RUN YET";

  const acceptedColor = "rgba(70, 220, 150, 0.9)";
  const rejectedColor = "rgba(255, 95, 115, 0.9)";

  const quantumGroupActive = activeStage >= 3 && activeStage <= 6;
  const verificationGroupActive = activeStage === 7;

  const quantumProtocolSteps = [
    { label: "Bell State", stage: 3 },
    { label: "Teleportation", stage: 4 },
    { label: "Pauli Correction", stage: 5 },
    { label: "Projective Measurement", stage: 6 },
  ];

  const verificationSteps = [
    "Measurement Statistics",
    "Deviation",
    "Threshold Comparison",
    verification
      ? verification.accepted
        ? "ACCEPT"
        : "REJECT"
      : "ACCEPT / REJECT",
  ];

  return (
    <main className="quantum-page">
      <div className="quantum-bg-grid" />
      <div className="quantum-glow quantum-glow-one" />
      <div className="quantum-glow quantum-glow-two" />

      {/* SIDEBAR */}

      <aside className="quantum-sidebar">
        <Link href="/dashboard" className="quantum-brand">
          <div className="quantum-brand-symbol">◇</div>

          <div>
            <strong>Q-SHIELD</strong>
            <span>QUANTUM SECURITY</span>
          </div>
        </Link>

        <div className="quantum-sidebar-label">
          SECURITY CONSOLE
        </div>

        <nav className="quantum-nav">
          <Link href="/dashboard">
            <span>⌂</span>
            Overview
          </Link>

          <Link href="/quantum" className="quantum-nav-active">
            <span>◇</span>
            Quantum Lab
          </Link>

          <Link href="/signature">
            <span>✦</span>
            Signatures
          </Link>

          <Link href="/attack-lab">
            <span>⚡</span>
            Attack Lab
          </Link>

          <Link href="/intelligence">
            <span>◈</span>
            Intelligence
          </Link>

          <Link href="/analytics">
            <span>◌</span>
            Analytics
          </Link>

          <Link href="/events">
            <span>≡</span>
            Events
          </Link>
        </nav>

        <div className="quantum-sidebar-status">
          <span />
          QUANTUM ENGINE READY
        </div>
      </aside>

      {/* MAIN */}

      <section className="quantum-main">
        <header className="quantum-header">
          <div>
            <div className="quantum-eyebrow">
              Q-SHIELD / QUANTUM LAB
            </div>

            <h1>Quantum Security Protocol</h1>

            <p>
              From the quantum threat to teleportation-based
              digital signature verification. Run Protocol
              executes a controlled Q-SHIELD software experiment
              and reports its statistical verification result.
            </p>
          </div>

          <button
            className="quantum-run-button"
            onClick={runProtocol}
            disabled={running}
          >
            {running ? "PROTOCOL RUNNING..." : "RUN PROTOCOL"}
            <span>→</span>
          </button>
        </header>

        {/* CURRENT EXPERIMENT / EXPERIMENT CONTEXT */}

        <section className="quantum-panel">
          <div className="panel-heading">
            <div>
              <span>CURRENT EXPERIMENT</span>
              <h2>Experiment Context</h2>
            </div>

            <div
              style={{
                padding: "6px 12px",
                border: "1px solid rgba(120, 150, 255, 0.3)",
                borderRadius: "999px",
                fontSize: "10.5px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              ◇ MODELED SOFTWARE EVALUATION
            </div>
          </div>

          <p
            style={{
              margin: "0 0 12px 0",
              fontSize: "12.5px",
              lineHeight: 1.6,
              opacity: 0.65,
            }}
          >
            Results represent controlled software simulation, not
            physical quantum hardware measurements.
          </p>

          <p
            style={{
              margin: "0 0 16px 0",
              fontSize: "13px",
              lineHeight: 1.6,
              opacity: 0.8,
            }}
          >
            <strong>What is simulated:</strong> a
            teleportation-based quantum digital signature workflow
            (Bell-state entanglement, teleportation, Pauli
            correction and projective measurement), followed by
            statistical verification of the resulting measurement
            outcomes against a configured threshold.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ opacity: 0.55 }}>STATUS</span>

            <strong
              style={{
                color: verification
                  ? verification.accepted
                    ? acceptedColor
                    : rejectedColor
                  : error
                    ? rejectedColor
                    : undefined,
              }}
            >
              {contextStatus}
            </strong>
          </div>

          {!request && (
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: 1.6,
                opacity: 0.6,
              }}
            >
              No experiment has been run yet. Press RUN PROTOCOL to
              execute a controlled Q-SHIELD experiment. The values
              shown here come from the experiment request and the
              verification response.
            </p>
          )}

          {request && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",
                gap: "10px",
                marginBottom: "18px",
              }}
            >
              {contextFields.map((field) => (
                <div key={field.label} style={contextCellStyle}>
                  <span style={contextLabelStyle}>
                    {field.label}
                  </span>

                  <strong style={contextValueStyle}>
                    {field.value}
                  </strong>
                </div>
              ))}
            </div>
          )}

          {running && (
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: 1.6,
                opacity: 0.7,
              }}
            >
              Executing the experiment. The verification result
              will appear once the protocol run completes.
            </p>
          )}

          {error && !running && (
            <div
              style={{
                padding: "14px 16px",
                border: "1px solid rgba(255, 95, 115, 0.4)",
                borderRadius: "10px",
                background: "rgba(255, 95, 115, 0.08)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                EXPERIMENT FAILED
              </strong>

              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  lineHeight: 1.6,
                  opacity: 0.8,
                }}
              >
                {error}
              </p>
            </div>
          )}

          <div
            style={{
              marginTop: request || error || running ? "18px" : "16px",
              padding: "14px 16px",
              border: `1px solid ${
                verification
                  ? verification.accepted
                    ? "rgba(70, 220, 150, 0.4)"
                    : "rgba(255, 95, 115, 0.4)"
                  : "rgba(120, 150, 255, 0.18)"
              }`,
              borderRadius: "10px",
              background: verification
                ? verification.accepted
                  ? "rgba(70, 220, 150, 0.07)"
                  : "rgba(255, 95, 115, 0.07)"
                : "rgba(20, 25, 55, 0.28)",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: "12px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "6px",
              }}
            >
              WHAT THE RESULT MEANS
            </strong>

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: 1.6,
                opacity: 0.8,
              }}
            >
              Statistical verification compares the observed
              measurement deviation against the configured
              threshold.
            </p>

            {verification && (
              <>
                <p
                  style={{
                    margin: "10px 0 0 0",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong
                    style={{
                      color: verification.accepted
                        ? acceptedColor
                        : rejectedColor,
                    }}
                  >
                    {verification.accepted ? "ACCEPT" : "REJECT"}
                  </strong>
                  {" — "}
                  {verification.accepted
                    ? "Observed deviation is within the configured threshold, so the signature passed statistical verification."
                    : "Observed deviation exceeded the configured threshold, so the signature failed statistical verification."}
                </p>

                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "12.5px",
                    lineHeight: 1.6,
                    opacity: 0.65,
                  }}
                >
                  Observed deviation{" "}
                  {formatPercent(verification.deviation)} vs
                  configured threshold{" "}
                  {formatPercent(verification.threshold)}. The
                  statistical verifier is the authoritative
                  decision mechanism; no AI component is involved
                  in this decision.
                </p>
              </>
            )}
          </div>
        </section>

        {/* THREAT BANNER */}

        <section className="quantum-threat-banner">
          <div className="threat-icon">⚛</div>

          <div>
            <span>QUANTUM THREAT MODEL</span>

            <h2>
              Classical public-key cryptography faces a
              quantum-era challenge.
            </h2>

            <p>
              Q-SHIELD connects the threat posed by quantum
              computation to a quantum digital signature
              verification workflow.
            </p>
          </div>

          <div className="threat-arrow">→</div>

          <div className="threat-target">
            <span>Q-SHIELD RESPONSE</span>
            <strong>TELEPORTATION-BASED QDS</strong>
          </div>
        </section>

        {/* PROTOCOL PIPELINE */}

        <section className="quantum-panel">
          <div className="panel-heading">
            <div>
              <span>PROTOCOL PIPELINE</span>
              <h2>Threat → Quantum Verification</h2>
            </div>

            <div className="pipeline-counter">
              {String(activeStage + 1).padStart(2, "0")} / 08
            </div>
          </div>

          <div className="quantum-pipeline">
            {stages.map((stage, index) => (
              <button
                key={stage.id}
                className={`pipeline-stage ${
                  index === activeStage
                    ? "pipeline-stage-active"
                    : ""
                } ${
                  index < activeStage
                    ? "pipeline-stage-complete"
                    : ""
                }`}
                onClick={() => setActiveStage(index)}
              >
                <div className="pipeline-number">
                  {String(stage.id).padStart(2, "0")}
                </div>

                <div>
                  <small>{stage.label}</small>
                  <strong>{stage.title}</strong>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* QUANTUM PIPELINE VS SECURITY DECISION */}

        <section className="quantum-panel">
          <div className="panel-heading">
            <div>
              <span>PROTOCOL VS DECISION</span>
              <h2>Quantum Pipeline vs Security Decision</h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "14px",
            }}
          >
            {/* QUANTUM PROTOCOL STAGES */}
            <div
              style={{
                padding: "16px 18px",
                border: `1px solid ${
                  quantumGroupActive
                    ? "rgba(140, 170, 255, 0.5)"
                    : "rgba(120, 150, 255, 0.18)"
                }`,
                borderRadius: "12px",
                background: "rgba(20, 25, 55, 0.28)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: 0.6,
                  marginBottom: "4px",
                }}
              >
                STAGE GROUP A
              </strong>

              <strong
                style={{
                  display: "block",
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              >
                Simulated Quantum Protocol
              </strong>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                {quantumProtocolSteps.map((step, index) => (
                  <span
                    key={step.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={
                        activeStage === step.stage
                          ? groupChipActiveStyle
                          : groupChipStyle
                      }
                    >
                      {step.label}
                    </span>

                    {index < quantumProtocolSteps.length - 1 && (
                      <span style={{ opacity: 0.5 }}>→</span>
                    )}
                  </span>
                ))}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  opacity: 0.65,
                }}
              >
                These are the simulated quantum protocol stages.
                They produce the measurement outcomes that are
                later analysed; they do not decide ACCEPT or
                REJECT by themselves.
              </p>
            </div>

            {/* STATISTICAL VERIFICATION STAGES */}
            <div
              style={{
                padding: "16px 18px",
                border: `1px solid ${
                  verificationGroupActive
                    ? "rgba(140, 170, 255, 0.5)"
                    : "rgba(120, 150, 255, 0.18)"
                }`,
                borderRadius: "12px",
                background: "rgba(20, 25, 55, 0.28)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  opacity: 0.6,
                  marginBottom: "4px",
                }}
              >
                STAGE GROUP B
              </strong>

              <strong
                style={{
                  display: "block",
                  fontSize: "14px",
                  marginBottom: "12px",
                }}
              >
                Statistical Verification (Security Decision)
              </strong>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                {verificationSteps.map((label, index) => (
                  <span
                    key={`${label}-${index}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        ...(verificationGroupActive
                          ? groupChipActiveStyle
                          : groupChipStyle),
                        ...(index === verificationSteps.length - 1 &&
                        verification
                          ? {
                              color: verification.accepted
                                ? acceptedColor
                                : rejectedColor,
                              fontWeight: 700,
                            }
                          : {}),
                      }}
                    >
                      {label}
                    </span>

                    {index < verificationSteps.length - 1 && (
                      <span style={{ opacity: 0.5 }}>→</span>
                    )}
                  </span>
                ))}
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: "12.5px",
                  lineHeight: 1.6,
                  opacity: 0.65,
                }}
              >
                This is the statistical verification stage. It
                decides ACCEPT or REJECT by comparing the observed
                deviation with the configured threshold. The
                verifier is non-AI; AI is optional and advisory
                only.
              </p>
            </div>
          </div>
        </section>

        {/* ACTIVE STAGE */}

        <section className="quantum-workspace">
          <div className="quantum-explanation quantum-panel">
            <div className="panel-heading">
              <div>
                <span>ACTIVE PROTOCOL STAGE</span>
                <h2>{stages[activeStage].title}</h2>
              </div>
            </div>

            <p className="stage-description">
              {stages[activeStage].description}
            </p>

            {activeStage === 0 && (
              <div className="crypto-equation">
                <div>
                  <span>RSA</span>
                  <strong>Integer Factorization</strong>
                </div>

                <div>
                  <span>ECC</span>
                  <strong>Discrete Logarithm</strong>
                </div>
              </div>
            )}

            {activeStage === 1 && (
              <div className="shor-flow">
                <div>QUANTUM COMPUTER</div>
                <span>↓</span>
                <div className="shor-highlight">
                  SHOR&apos;S ALGORITHM
                </div>
                <span>↓</span>
                <div>MATHEMATICAL PROBLEM</div>
                <span>↓</span>
                <div>CRYPTOGRAPHIC THREAT</div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="qds-equation">
                <div className="qds-symbol">QDS</div>
                <div>
                  <strong>Quantum Digital Signature</strong>
                  <span>
                    Quantum states + measurement statistics
                  </span>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="bell-visual">
                <div className="qubit-card">
                  <span>QUBIT A</span>
                  <strong>|0⟩</strong>
                </div>

                <div className="entanglement-line">
                  <span>ENTANGLED</span>
                  <div />
                </div>

                <div className="qubit-card">
                  <span>QUBIT B</span>
                  <strong>|0⟩</strong>
                </div>

                <div className="bell-equation">
                  |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
                </div>
              </div>
            )}

            {activeStage === 4 && (
              <div className="teleport-visual">
                <div>
                  <small>ALICE</small>
                  <strong>|ψ⟩</strong>
                </div>

                <div className="teleport-arrow">
                  <span>CLASSICAL BITS</span>
                  ─────────→
                </div>

                <div>
                  <small>BOB</small>
                  <strong>|ψ⟩</strong>
                </div>
              </div>
            )}

            {activeStage === 5 && (
              <div className="pauli-grid">
                <div>
                  <span>00</span>
                  <strong>I</strong>
                  <small>Identity</small>
                </div>

                <div>
                  <span>01</span>
                  <strong>X</strong>
                  <small>Bit flip</small>
                </div>

                <div>
                  <span>10</span>
                  <strong>Z</strong>
                  <small>Phase flip</small>
                </div>

                <div>
                  <span>11</span>
                  <strong>XZ</strong>
                  <small>Combined</small>
                </div>
              </div>
            )}

            {activeStage === 6 && (
              <>
                <div className="measurement-visual">
                  <div className="measurement-axis">
                    <span>+</span>
                    <div />
                    <span>−</span>
                  </div>

                  <div className="measurement-bars">
                    <div>
                      <span>|0⟩</span>
                      <div>
                        <i style={{ width: "72%" }} />
                      </div>
                      <strong>72%</strong>
                    </div>

                    <div>
                      <span>|1⟩</span>
                      <div>
                        <i style={{ width: "28%" }} />
                      </div>
                      <strong>28%</strong>
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    margin: "12px 0 0 0",
                    fontSize: "12px",
                    lineHeight: 1.6,
                    opacity: 0.6,
                  }}
                >
                  ILLUSTRATIVE DISTRIBUTION — this diagram shows
                  what a measurement distribution looks like. It
                  is not the measured result of the current
                  experiment; see Experiment Context above for the
                  observed deviation.
                </p>
              </>
            )}

            {activeStage === 7 && (
              <div className="verification-visual">
                <div>
                  <span>OBSERVED</span>
                  <strong>Measurement Distribution</strong>
                </div>

                <div className="verification-symbol">≈</div>

                <div>
                  <span>EXPECTED</span>
                  <strong>Reference Distribution</strong>
                </div>

                <div className="verification-threshold">
                  {verification
                    ? `${formatPercent(verification.deviation)} DEVIATION vs ${formatPercent(verification.threshold)} THRESHOLD → ${
                        verification.accepted ? "ACCEPT" : "REJECT"
                      }`
                    : "DEVIATION → THRESHOLD → DECISION"}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT INFO PANEL */}

          <div className="quantum-info-column">
            <div className="quantum-panel state-card">
              <span>QUANTUM STATE</span>

              <div className="state-equation">
                |ψ⟩ = α|0⟩ + β|1⟩
              </div>

              <p>
                Q-SHIELD models the quantum state through
                its protocol stages before measurement.
              </p>
            </div>

            <div className="quantum-panel security-card">
              <span>SECURITY PRINCIPLE</span>

              <h3>Statistical verification</h3>

              <p>
                Verification compares observed behaviour
                against an expected statistical distribution
                and applies a configurable decision threshold.
              </p>

              <div className="security-line">
                <span>CORE VERIFIER</span>
                <strong>NON-AI</strong>
              </div>

              <div className="security-line">
                <span>AI LAYER</span>
                <strong>OPTIONAL</strong>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM STATUS */}

        <footer className="quantum-footer">
          <div>
            <span className="live-dot" />
            QUANTUM SIMULATION ENVIRONMENT
          </div>

          <div>
            BELL STATE <b>READY</b>
          </div>

          <div>
            TELEPORTATION <b>READY</b>
          </div>

          <div>
            MEASUREMENT <b>READY</b>
          </div>
        </footer>
      </section>
    </main>
  );
}