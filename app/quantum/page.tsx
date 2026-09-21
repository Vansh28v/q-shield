"use client";

import { useState } from "react";
import Link from "next/link";

type Stage = {
  id: number;
  label: string;
  title: string;
  description: string;
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

export default function QuantumPage() {
  const [activeStage, setActiveStage] = useState(0);
  const [running, setRunning] = useState(false);

  function runProtocol() {
    setRunning(true);

    let current = 0;

    const interval = setInterval(() => {
      current++;

      if (current >= stages.length) {
        clearInterval(interval);
        setRunning(false);
        setActiveStage(stages.length - 1);
      } else {
        setActiveStage(current);
      }
    }, 650);
  }

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
              digital signature verification.
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
                  DEVIATION → THRESHOLD → DECISION
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