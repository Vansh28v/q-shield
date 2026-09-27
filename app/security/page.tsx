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
    let mouseX = window.innerWidth * 0.3;
    let mouseY = window.innerHeight * 0.5;
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

    const drawSquare = (x: number, y: number, size: number, intensity: number) => {
      ctx.beginPath();
      ctx.rect(x - size / 2, y - size / 2, size, size);
      const alpha = 0.02 + intensity * 0.35;
      ctx.strokeStyle = `rgba(255, 150, 63, ${alpha})`;
      ctx.lineWidth = 0.8 + intensity * 1.2;

      if (intensity > 0.1) {
        ctx.shadowBlur = 10 + intensity * 20;
        ctx.shadowColor = "rgba(255, 150, 63, 0.5)";
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

      const spacingX = 85;
      const spacingY = 85;
      const columns = Math.ceil(width / spacingX) + 2;
      const rows = Math.ceil(height / spacingY) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
          const x = c * spacingX;
          const y = r * spacingY;
          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const intensity = dist < 240 ? Math.pow(1 - dist / 240, 2) : 0;
          drawSquare(x, y, 14, intensity);
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

export default function SecurityPage() {
  /* SELECTED THREAT VECTOR MODULE */
  const [selectedThreat, setSelectedThreat] = useState<number>(0);

  const threatModules = [
    {
      id: "forgery",
      name: "Signature Forgery",
      tag: "QUANTUM STATISTICAL",
      icon: "⚡",
      color: "#ff963f",
      risk: "HIGH",
      riskScore: 0.88,
      mechanism: "Adversary creates fake signature states without holding private key qubits.",
      detection: "Empirical state measurement frequency deviation Δ = |f_obs - f_exp| > η (0.050).",
      action: "REJECT signature immediately & flag anomalous state deviation event."
    },
    {
      id: "impersonation",
      name: "Signer Impersonation",
      tag: "IDENTITY VERIFICATION",
      icon: "◈",
      color: "#35d8ff",
      risk: "CRITICAL",
      riskScore: 0.95,
      mechanism: "Unauthorized party submits message under legitimate user's public identity.",
      detection: "Asymmetric public key & identity verification mismatch: SignerID ≠ ExpectedSignerID.",
      action: "REJECT transaction & trigger identity mismatch security alert."
    },
    {
      id: "replay",
      name: "Replay Attack",
      tag: "SESSION LEDGER STATE",
      icon: "↺",
      color: "#a65cff",
      risk: "MEDIUM",
      riskScore: 0.65,
      mechanism: "Attacker captures valid historical signature exchange and attempts retransmission.",
      detection: "Single-use nonce freshness & session ledger check. Nonce reuse detected.",
      action: "REJECT retransmitted packet. (Note: Replay is caught via session state, not quantum stats alone)."
    },
    {
      id: "channel",
      name: "Quantum Channel Interference",
      tag: "NOISE & FIDELITY MODEL",
      icon: "✦",
      color: "#438dff",
      risk: "HIGH",
      riskScore: 0.78,
      mechanism: "Eavesdropping (man-in-the-middle) or environmental noise degrades Bell pair entanglement.",
      detection: "State fidelity F < 0.95 & depolarizing quantum channel noise spike.",
      action: "REJECT packet & initiate quantum channel recalibration protocol."
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
          <Link href="/security" className="nav-active">Security</Link>
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
            <span>MULTI-VECTOR THREAT EVALUATION CONSOLE</span>
            <i />
          </div>

          <h1 style={{ fontSize: "clamp(42px, 5vw, 76px)", lineHeight: 1.05 }}>
            Rigorous Threat Evaluation Architecture
          </h1>

          <p className="hero-description" style={{ fontSize: "17px", maxWidth: "840px" }}>
            Q-SHIELD evaluates incoming quantum digital signatures across four distinct threat vectors.
            Isolating quantum statistical verification from classical session state guarantees unyielding security decisions.
          </p>

          <div className="hero-actions" style={{ marginTop: "32px" }}>
            <Link href="/demo" className="primary-button">
              <span>WATCH INTERACTIVE DEMO</span>
              <span className="play">▶</span>
            </Link>

            <Link href="/technology" className="secondary-button">
              <span>VIEW TECHNOLOGY PIPELINE</span>
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* THREAT ANALYSIS CONSOLE */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 46px 120px", maxWidth: "1250px", margin: "0 auto" }}>
        
        {/* INTERACTIVE MODULE SELECTOR */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ color: "#ff963f", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "8px" }}>
            INTERACTIVE THREAT DISCRIMINATOR
          </div>
          <h2 style={{ color: "#edf5ff", fontSize: "30px", fontWeight: "700" }}>
            Four Core Threat Evaluation Vectors
          </h2>
        </div>

        {/* THREAT MODULE CARDS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "20px", marginBottom: "36px" }}>
          {threatModules.map((item, idx) => {
            const isSel = selectedThreat === idx;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedThreat(idx)}
                style={{
                  background: isSel ? "linear-gradient(145deg, rgba(7, 17, 35, 0.95), rgba(3, 9, 20, 0.8))" : "rgba(5, 14, 29, 0.75)",
                  border: isSel ? `1px solid ${item.color}` : "1px solid rgba(73, 104, 170, 0.25)",
                  borderRadius: "8px",
                  padding: "24px",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  boxShadow: isSel ? `0 0 25px ${item.color}25` : "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "24px" }}>{item.icon}</span>
                  <span style={{
                    background: `${item.color}20`,
                    color: item.color,
                    border: `1px solid ${item.color}40`,
                    fontSize: "10px",
                    fontWeight: "800",
                    padding: "3px 8px",
                    borderRadius: "4px"
                  }}>
                    {item.tag}
                  </span>
                </div>
                <h3 style={{ color: "#edf4ff", fontSize: "18px", fontWeight: "700", marginBottom: "6px" }}>
                  {item.name}
                </h3>
                <div style={{ fontSize: "12px", color: "rgba(176, 191, 221, 0.6)" }}>
                  Risk Score: {(item.riskScore * 100).toFixed(0)}% ({item.risk})
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTIVE THREAT VECTOR HUD INSPECTOR BOX */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
          border: `1px solid ${threatModules[selectedThreat].color}`,
          borderRadius: "10px",
          padding: "36px",
          marginBottom: "48px",
          backdropFilter: "blur(14px)",
          boxShadow: `0 0 35px ${threatModules[selectedThreat].color}20`
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "24px", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <div style={{ color: threatModules[selectedThreat].color, fontSize: "12px", fontWeight: "800", letterSpacing: "0.1em" }}>
                ACTIVE EVALUATION // VECTOR 0{selectedThreat + 1}
              </div>
              <h3 style={{ color: "#edf4ff", fontSize: "28px", fontWeight: "700", marginTop: "4px" }}>
                {threatModules[selectedThreat].name}
              </h3>
            </div>
            <div style={{
              background: "rgba(3, 9, 20, 0.9)",
              border: `1px solid ${threatModules[selectedThreat].color}`,
              padding: "12px 24px",
              borderRadius: "6px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "11px", color: "rgba(176, 191, 221, 0.5)", fontWeight: "700" }}>SEVERITY GAUGE</div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: threatModules[selectedThreat].color }}>
                {threatModules[selectedThreat].risk}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            <div style={{ background: "rgba(5, 14, 29, 0.8)", padding: "20px", borderRadius: "6px", border: "1px solid rgba(73, 104, 170, 0.3)" }}>
              <div style={{ color: "rgba(176, 191, 221, 0.6)", fontSize: "11px", fontWeight: "800", marginBottom: "6px" }}>ATTACK MECHANISM</div>
              <div style={{ color: "#edf4ff", fontSize: "14px", lineHeight: 1.6 }}>
                {threatModules[selectedThreat].mechanism}
              </div>
            </div>

            <div style={{ background: "rgba(5, 14, 29, 0.8)", padding: "20px", borderRadius: "6px", border: "1px solid rgba(73, 104, 170, 0.3)" }}>
              <div style={{ color: "rgba(176, 191, 221, 0.6)", fontSize: "11px", fontWeight: "800", marginBottom: "6px" }}>DETECTION RULE</div>
              <div style={{ color: threatModules[selectedThreat].color, fontSize: "14px", fontFamily: "monospace", lineHeight: 1.6 }}>
                {threatModules[selectedThreat].detection}
              </div>
            </div>
          </div>
        </div>

        {/* DECISION ENGINE ARCHITECTURE (QUANTUM VERIFICATION vs FINAL DECISION) */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.75), rgba(3, 9, 20, 0.6))",
          border: "1px solid rgba(73, 104, 170, 0.3)",
          borderRadius: "10px",
          padding: "40px",
          backdropFilter: "blur(12px)"
        }}>
          <h2 style={{ color: "#edf5ff", fontSize: "28px", fontWeight: "700", marginBottom: "16px" }}>
            Quantum Verification vs. Final Security Decision
          </h2>
          <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "15px", lineHeight: 1.7, marginBottom: "28px" }}>
            Separating physical quantum statistics from final policy decisions ensures each threat vector is evaluated against its exact domain:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            <div style={{ background: "rgba(5, 14, 29, 0.85)", padding: "24px", borderRadius: "6px", border: "1px solid rgba(53, 216, 255, 0.3)" }}>
              <div style={{ color: "#35d8ff", fontWeight: "800", fontSize: "16px", marginBottom: "8px" }}>
                1. Quantum / Statistical Verification Layer
              </div>
              <div style={{ color: "rgba(176, 191, 221, 0.75)", fontSize: "13.5px", lineHeight: 1.6 }}>
                Measures state frequencies across N shots, calculates empirical Z-scores against theoretical threshold η, and evaluates quantum channel fidelity.
              </div>
            </div>

            <div style={{ background: "rgba(5, 14, 29, 0.85)", padding: "24px", borderRadius: "6px", border: "1px solid rgba(166, 92, 255, 0.3)" }}>
              <div style={{ color: "#a65cff", fontWeight: "800", fontSize: "16px", marginBottom: "8px" }}>
                2. Classical Session &amp; Policy Decision Layer
              </div>
              <div style={{ color: "rgba(176, 191, 221, 0.75)", fontSize: "13.5px", lineHeight: 1.6 }}>
                Validates session freshness, single-use nonces (Replay protection), signer identity matching, and outputs the final authoritative ACCEPT or REJECT verdict.
              </div>
            </div>
          </div>
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
            <span style={{ fontWeight: "700", color: "#edf4ff", letterSpacing: "0.1em" }}>Q-SHIELD THREAT EVALUATION</span>
          </div>
          <div>Multi-Vector Threat Analysis &amp; Security Decision Instrument</div>
        </div>
      </footer>
    </main>
  );
}
