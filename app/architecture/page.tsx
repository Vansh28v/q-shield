"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* QUANTUM CANVAS BACKDROP */
function QuantumField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let mouseX = window.innerWidth * 0.7;
    let mouseY = window.innerHeight * 0.6;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
    };

    const drawHex = (x: number, y: number, radius: number, intensity: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + radius * Math.cos(angle);
        const hy = y + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      const alpha = 0.02 + intensity * 0.35;
      ctx.strokeStyle = `rgba(53, 216, 255, ${alpha})`;
      ctx.lineWidth = 0.8 + intensity * 1.2;

      if (intensity > 0.1) {
        ctx.shadowBlur = 10 + intensity * 20;
        ctx.shadowColor = "rgba(53, 216, 255, 0.5)";
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      const spacingX = 90;
      const spacingY = 80;
      const columns = Math.ceil(width / spacingX) + 2;
      const rows = Math.ceil(height / spacingY) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const x = c * spacingX + (r % 2 === 0 ? 0 : spacingX / 2);
          const y = r * spacingY;
          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const intensity = dist < 250 ? Math.pow(1 - dist / 250, 2) : 0;
          drawHex(x, y, 16, intensity);
        }
      }
      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="quantum-field" aria-hidden="true" />;
}

function ShieldLogo() {
  return (
    <div className="brand-mark">
      <div className="brand-diamond">
        <div className="brand-core" />
      </div>
    </div>
  );
}

function Arrow() {
  return <span className="arrow">→</span>;
}

export default function ArchitecturePage() {
  const [activeNode, setActiveNode] = useState<number>(0);

  const nodes = [
    {
      step: "01",
      name: "USER INPUT / SIGNATURE REQUEST",
      color: "#35d8ff",
      purpose: "Accepts user signature parameters, message payloads, and signer identity IDs.",
      input: "Message, SignerID, Nonce, Alpha/Beta Parameters",
      output: "Raw Signature Request Structure",
      role: "Entrypoint parameter validation"
    },
    {
      step: "02",
      name: "QDS SIMULATION ENGINE",
      color: "#35d8ff",
      purpose: "Initializes computational quantum state registers and configures channel noise parameters.",
      input: "Raw Signature Request Structure",
      output: "Prepared State Vector |Ψ⟩",
      role: "Quantum environment orchestrator"
    },
    {
      step: "03",
      name: "BELL-STATE ENTANGLEMENT",
      color: "#438dff",
      purpose: "Generates maximally entangled EPR Bell pairs |Φ⁺⟩ distributed across simulated channels.",
      input: "Prepared State Vector |Ψ⟩",
      output: "Entangled Qubit Pair State |Φ⁺⟩",
      role: "Physical quantum entanglement simulator"
    },
    {
      step: "04",
      name: "QUANTUM TELEPORTATION",
      color: "#438dff",
      purpose: "Transfers qubit states via joint Bell state measurement and 2-bit classical feedforward.",
      input: "Entangled Pair & Signature State",
      output: "2 Classical Bits (M₁, M₂)",
      role: "Disembodied quantum state transport"
    },
    {
      step: "05",
      name: "PAULI CORRECTION GATES",
      color: "#755cff",
      purpose: "Applies conditional Pauli operators (σ_x, σ_z) to reconstruct exact target state.",
      input: "Classical Bits (M₁, M₂)",
      output: "Reconstructed Receiver Qubit State",
      role: "Unitary quantum gate transformation"
    },
    {
      step: "06",
      name: "PROJECTIVE MEASUREMENT",
      color: "#755cff",
      purpose: "Collapses qubit state across N=1000 measurement shots in computational or Hadamard bases.",
      input: "Reconstructed Qubit State",
      output: "Sampled Discrete Outcome Frequencies (|0⟩, |1⟩)",
      role: "Quantum state collapse sampler"
    },
    {
      step: "07",
      name: "STATISTICAL ANALYSIS",
      color: "#a65cff",
      purpose: "Calculates empirical frequency deviations Z-scores against theoretical threshold η (0.050).",
      input: "Outcome Frequencies & Theoretical Expectation",
      output: "Empirical Deviation Z-Score Δ",
      role: "Statistical error bound calculator"
    },
    {
      step: "08",
      name: "THREAT DETECTION ENGINE",
      color: "#ff963f",
      purpose: "Evaluates multi-vector threats (Forgery, Impersonation, Replay, Channel Interference).",
      input: "Deviation Δ, SignerID, Nonce Ledger State",
      output: "Categorized Threat Vector & Risk Index",
      role: "Multi-vector security evaluator"
    },
    {
      step: "09",
      name: "VERDICT: ACCEPT / REJECT",
      color: "#ff963f",
      purpose: "Issues the final, authoritative binary security decision.",
      input: "Threat Evaluation & Verification Decision",
      output: "Authoritative ACCEPT / REJECT Verdict",
      role: "Final security decision gatekeeper"
    },
    {
      step: "10",
      name: "TELEMETRY LOGGING",
      color: "#35d8ff",
      purpose: "Streams structured event records to the encrypted SQLite audit ledger.",
      input: "Verdict, Deviation, Timestamp, Event Metadata",
      output: "Encrypted Ledger Event Transaction",
      role: "Audit log & persistence layer"
    },
    {
      step: "11",
      name: "PLATFORM DASHBOARDS & INTELLIGENCE",
      color: "#35d8ff",
      purpose: "Renders real-time telemetry analytics across platform tools and advisory models.",
      input: "Ledger Event Transactions",
      output: "Live Dashboard & Intelligence UI",
      role: "Presentation & visualization layer"
    }
  ];

  return (
    <main className="q-page">
      <QuantumField />

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {/* HEADER NAVIGATION */}
      <header className="topbar">
        <div className="brand">
          <Link href="/" className="brand flex items-center gap-3">
            <ShieldLogo />
            <span className="brand-name">Q-SHIELD</span>
          </Link>
        </div>

        <nav className="navigation">
          <Link href="/">Home</Link>
          <Link href="/technology">Technology</Link>
          <Link href="/security">Security</Link>
          <Link href="/threat-intelligence">Intelligence</Link>
          <Link href="/about">About</Link>
        </nav>

        <Link href="/login" className="platform-button">
          <span>ENTER PLATFORM</span>
          <Arrow />
        </Link>
      </header>

      {/* HERO SECTION */}
      <section className="hero" style={{ paddingBottom: "40px" }}>
        <div className="hero-content" style={{ width: "100%", maxWidth: "1150px" }}>
          <div className="eyebrow">
            <span>JUDGE PRESENTATION & SYSTEM SPECIFICATION</span>
            <i />
          </div>

          <h1 style={{ fontSize: "clamp(42px, 5vw, 76px)", lineHeight: 1.05 }}>
            End-to-End Technical Architecture
          </h1>

          <p className="hero-description" style={{ fontSize: "17px", maxWidth: "840px" }}>
            Explore Q-SHIELD's interactive 11-node architecture pipeline. Click or hover any system node to inspect its exact inputs, outputs, purpose, and security role.
          </p>

          <div className="hero-actions" style={{ marginTop: "32px" }}>
            <Link href="/about" className="primary-button">
              <span>PROJECT OVERVIEW & SPEC</span>
              <Arrow />
            </Link>

            <Link href="/login" className="secondary-button">
              <span>ENTER PLATFORM</span>
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE DIAGRAM SECTION */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 46px 120px", maxWidth: "1250px", margin: "0 auto" }}>
        
        {/* INTERACTIVE DIAGRAM PIPELINE */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
          border: "1px solid rgba(53, 216, 255, 0.3)",
          borderRadius: "10px",
          padding: "40px",
          marginBottom: "48px",
          backdropFilter: "blur(14px)"
        }}>
          <div style={{ color: "#35d8ff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "6px" }}>
            INTERACTIVE SYSTEM FLOW DIAGRAM
          </div>
          <h2 style={{ color: "#edf5ff", fontSize: "30px", fontWeight: "700", marginBottom: "28px" }}>
            11-Node Quantum &amp; Security Pipeline
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
            {nodes.map((node, idx) => {
              const isSel = activeNode === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveNode(idx)}
                  style={{
                    background: isSel ? "rgba(5, 14, 29, 0.95)" : "rgba(5, 14, 29, 0.6)",
                    border: `1px solid ${isSel ? node.color : "rgba(73, 104, 170, 0.3)"}`,
                    borderRadius: "6px",
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    boxShadow: isSel ? `0 0 20px ${node.color}25` : "none"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: node.color, fontFamily: "monospace" }}>
                      NODE {node.step}
                    </span>
                    {isSel && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: node.color }} />}
                  </div>
                  <div style={{ color: "#edf4ff", fontSize: "13px", fontWeight: "700" }}>
                    {node.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE NODE HUD INSPECTOR BOX */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.9), rgba(3, 9, 20, 0.8))",
          border: `1px solid ${nodes[activeNode].color}`,
          borderRadius: "10px",
          padding: "36px",
          marginBottom: "48px",
          backdropFilter: "blur(14px)",
          boxShadow: `0 0 35px ${nodes[activeNode].color}20`
        }}>
          <div style={{ color: nodes[activeNode].color, fontSize: "12px", fontWeight: "800", letterSpacing: "0.1em", marginBottom: "6px" }}>
            INSPECTING NODE {nodes[activeNode].step} // {nodes[activeNode].role.toUpperCase()}
          </div>
          <h3 style={{ color: "#edf4ff", fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
            {nodes[activeNode].name}
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div style={{ background: "rgba(5, 14, 29, 0.8)", padding: "20px", borderRadius: "6px", border: "1px solid rgba(73, 104, 170, 0.3)" }}>
              <div style={{ color: "rgba(176, 191, 221, 0.5)", fontSize: "11px", fontWeight: "800", marginBottom: "4px" }}>SYSTEM PURPOSE</div>
              <div style={{ color: "#edf4ff", fontSize: "14px", lineHeight: 1.6 }}>
                {nodes[activeNode].purpose}
              </div>
            </div>

            <div style={{ background: "rgba(5, 14, 29, 0.8)", padding: "20px", borderRadius: "6px", border: "1px solid rgba(73, 104, 170, 0.3)" }}>
              <div style={{ color: "rgba(176, 191, 221, 0.5)", fontSize: "11px", fontWeight: "800", marginBottom: "4px" }}>INPUT DATA</div>
              <div style={{ color: nodes[activeNode].color, fontSize: "13px", fontFamily: "monospace" }}>
                {nodes[activeNode].input}
              </div>
            </div>

            <div style={{ background: "rgba(5, 14, 29, 0.8)", padding: "20px", borderRadius: "6px", border: "1px solid rgba(73, 104, 170, 0.3)" }}>
              <div style={{ color: "rgba(176, 191, 221, 0.5)", fontSize: "11px", fontWeight: "800", marginBottom: "4px" }}>OUTPUT DATA</div>
              <div style={{ color: "#a65cff", fontSize: "13px", fontFamily: "monospace" }}>
                {nodes[activeNode].output}
              </div>
            </div>
          </div>
        </div>

        {/* SOFTWARE SIMULATION BOUNDARY DECLARATION PANEL FOR JUDGES */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.75), rgba(3, 9, 20, 0.6))",
          border: "1px solid rgba(53, 216, 255, 0.3)",
          borderRadius: "8px",
          padding: "36px",
          backdropFilter: "blur(12px)"
        }}>
          <h3 style={{ color: "#35d8ff", fontSize: "20px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>◈</span> Software Simulation Boundary Specification
          </h3>
          <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
            Q-SHIELD models the quantum protocol computationally. State vector transformations, Bell state density matrices, quantum teleportation, Pauli gate corrections, and quantum noise channels are calculated algorithmically on standard CPU runtimes. Q-SHIELD makes zero claims of physical quantum hardware execution, serving as a software simulation evaluation platform for SIH judges.
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: "1px solid rgba(73, 103, 170, 0.15)",
        padding: "40px 46px",
        textAlign: "center",
        color: "rgba(176, 191, 221, 0.5)",
        fontSize: "13px",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1250px", margin: "0 auto", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ShieldLogo />
            <span style={{ fontWeight: "700", color: "#edf4ff", letterSpacing: "0.1em" }}>Q-SHIELD TECHNICAL SPECIFICATION</span>
          </div>
          <div>11-Node Architecture &amp; System Execution Flow Diagram</div>
        </div>
      </footer>
    </main>
  );
}
