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
    let mouseX = window.innerWidth * 0.5;
    let mouseY = window.innerHeight * 0.4;
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

    const drawDiamond = (x: number, y: number, size: number, intensity: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      const alpha = 0.02 + intensity * 0.35;
      ctx.strokeStyle = `rgba(117, 92, 255, ${alpha})`;
      ctx.lineWidth = 0.8 + intensity * 1.2;

      if (intensity > 0.1) {
        ctx.shadowBlur = 10 + intensity * 20;
        ctx.shadowColor = "rgba(117, 92, 255, 0.5)";
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
          drawDiamond(x, y, 10, intensity);
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

export default function AboutPage() {
  const [hoveredCore, setHoveredCore] = useState<number | null>(null);

  const corePillars = [
    {
      num: "01",
      title: "Quantum Simulation Engine",
      color: "#35d8ff",
      desc: "Simulates state vector initializations, Bell state entanglement, quantum teleportation, Pauli corrections, and projective measurements."
    },
    {
      num: "02",
      title: "Statistical Verification",
      color: "#438dff",
      desc: "Aggregates N measurement shots to compute empirical deviation Z-scores against theoretical error bounds η."
    },
    {
      num: "03",
      title: "Multi-Vector Threat Detection",
      color: "#755cff",
      desc: "Discriminates between noise and active threats across Forgery, Impersonation, Replay, and Channel Manipulation."
    },
    {
      num: "04",
      title: "Encrypted Telemetry Ledger",
      color: "#a65cff",
      desc: "Streams event attributes into an encrypted SQLite ledger for auditability and session tracking."
    },
    {
      num: "05",
      title: "Optional AI Advisory Layer",
      color: "#ff963f",
      desc: "Provides secondary pattern classification and risk scoring while preserving the statistical core as 100% authoritative."
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
          <Link href="/about" className="nav-active">About</Link>
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
            <span>SIH PROBLEM STATEMENT SIH26141 PRESENTATION</span>
            <i />
          </div>

          <h1 style={{ fontSize: "clamp(42px, 5vw, 76px)", lineHeight: 1.05 }}>
            About Q-SHIELD
          </h1>

          <p className="hero-description" style={{ fontSize: "17px", maxWidth: "840px" }}>
            Quantum Digital Signature Security &amp; Threat Intelligence Platform.
            Addressing the critical challenge of securing digital identities against quantum-era cryptographic collapse.
          </p>

          <div className="hero-actions" style={{ marginTop: "32px" }}>
            <Link href="/demo" className="primary-button">
              <span>WATCH INTERACTIVE DEMO</span>
              <span className="play">▶</span>
            </Link>

            <Link href="/login" className="secondary-button">
              <span>ENTER PLATFORM</span>
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* SIH PROJECT OVERVIEW SECTION */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 46px 120px", maxWidth: "1250px", margin: "0 auto" }}>
        
        {/* PROBLEM STATEMENT & OBJECTIVES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "32px", marginBottom: "48px" }}>
          
          {/* SIH26141 CONTEXT */}
          <div style={{
            background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
            border: "1px solid rgba(53, 216, 255, 0.3)",
            borderRadius: "10px",
            padding: "36px",
            backdropFilter: "blur(14px)"
          }}>
            <div style={{ color: "#35d8ff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "8px" }}>
              SIH PROBLEM STATEMENT (SIH26141)
            </div>
            <h2 style={{ color: "#edf4ff", fontSize: "26px", fontWeight: "700", marginBottom: "16px" }}>
              The Quantum Cryptographic Challenge
            </h2>
            <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14.5px", lineHeight: 1.8, margin: 0 }}>
              Modern asymmetric infrastructure (RSA, ECC) relies on mathematical difficulty that Shor’s algorithm will render obsolete.
              Q-SHIELD tackles SIH26141 by modeling physical Quantum Digital Signature (QDS) protocols that rely on quantum laws (no-cloning theorem, state collapse) rather than classical computational assumptions.
            </p>
          </div>

          {/* SYSTEM GOALS */}
          <div style={{
            background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
            border: "1px solid rgba(117, 92, 255, 0.3)",
            borderRadius: "10px",
            padding: "36px",
            backdropFilter: "blur(14px)"
          }}>
            <div style={{ color: "#a65cff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "8px" }}>
              PROJECT OBJECTIVES &amp; PHILOSOPHY
            </div>
            <h2 style={{ color: "#edf4ff", fontSize: "26px", fontWeight: "700", marginBottom: "16px" }}>
              Deterministic Security Philosophy
            </h2>
            <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14.5px", lineHeight: 1.8, margin: 0 }}>
              Q-SHIELD maintains a strict security philosophy: primary security verdicts must remain 100% deterministic and statistical.
              Probabilistic AI models provide optional advisory context without having blocking authority over security verifications.
            </p>
          </div>

        </div>

        {/* VISUAL Q-SHIELD CORE MATRIX */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
          border: "1px solid rgba(73, 104, 170, 0.3)",
          borderRadius: "10px",
          padding: "40px",
          marginBottom: "48px",
          backdropFilter: "blur(14px)"
        }}>
          <div style={{ color: "#35d8ff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "6px" }}>
            VISUAL SYSTEM MATRIX
          </div>
          <h2 style={{ color: "#edf5ff", fontSize: "28px", fontWeight: "700", marginBottom: "24px" }}>
            The Five Pillars of Q-SHIELD CORE
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            {corePillars.map((pillar, idx) => {
              const isHov = hoveredCore === idx;
              return (
                <div
                  key={pillar.num}
                  onMouseEnter={() => setHoveredCore(idx)}
                  onMouseLeave={() => setHoveredCore(null)}
                  style={{
                    background: "rgba(5, 14, 29, 0.8)",
                    border: `1px solid ${isHov ? pillar.color : "rgba(73, 104, 170, 0.3)"}`,
                    borderRadius: "8px",
                    padding: "24px 20px",
                    transition: "all 150ms ease",
                    transform: isHov ? "translateY(-4px)" : "none",
                    boxShadow: isHov ? `0 0 25px ${pillar.color}20` : "none"
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: "800", color: pillar.color, fontFamily: "monospace", marginBottom: "8px" }}>
                    {pillar.num}
                  </div>
                  <h3 style={{ color: "#edf4ff", fontSize: "16px", fontWeight: "700", marginBottom: "8px" }}>
                    {pillar.title}
                  </h3>
                  <p style={{ color: "rgba(176, 191, 221, 0.7)", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SOFTWARE SIMULATION BOUNDARY STATEMENT */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.75), rgba(3, 9, 20, 0.6))",
          border: "1px solid rgba(53, 216, 255, 0.3)",
          borderRadius: "8px",
          padding: "36px",
          backdropFilter: "blur(12px)"
        }}>
          <h3 style={{ color: "#35d8ff", fontSize: "20px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>◈</span> Software Simulation Boundary Statement
          </h3>
          <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
            Q-SHIELD is a software-simulated evaluation platform developed to model quantum information protocols computationally.
            All quantum mechanics transformations, Bell states, channels, and noise operations are calculated algorithmically on standard server infrastructure.
            Q-SHIELD does not claim execution on physical quantum hardware.
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
            <span style={{ fontWeight: "700", color: "#edf4ff", letterSpacing: "0.1em" }}>Q-SHIELD PROJECT OVERVIEW</span>
          </div>
          <div>SIH Problem Statement SIH26141 Overview</div>
        </div>
      </footer>
    </main>
  );
}
