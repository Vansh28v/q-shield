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

    const drawTriangle = (x: number, y: number, size: number, inverted: boolean, intensity: number) => {
      const triangleHeight = size * 0.866;
      const points = inverted
        ? [[x, y + triangleHeight], [x - size, y - triangleHeight], [x + size, y - triangleHeight]]
        : [[x, y - triangleHeight], [x - size, y + triangleHeight], [x + size, y + triangleHeight]];

      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      ctx.lineTo(points[1][0], points[1][1]);
      ctx.lineTo(points[2][0], points[2][1]);
      ctx.closePath();

      const alpha = 0.02 + intensity * 0.4;
      ctx.strokeStyle = `rgba(53, 216, 255, ${alpha})`;
      ctx.lineWidth = 0.7 + intensity * 1.2;

      if (intensity > 0.1) {
        ctx.shadowBlur = 8 + intensity * 25;
        ctx.shadowColor = "rgba(67, 141, 255, 0.6)";
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

      const spacingX = 80;
      const spacingY = 70;
      const columns = Math.ceil(width / spacingX) + 2;
      const rows = Math.ceil(height / spacingY) + 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < columns; c++) {
          const x = c * spacingX + (r % 2 === 0 ? 0 : spacingX / 2);
          const y = r * spacingY;
          const dx = x - mouseX;
          const dy = y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const intensity = dist < 260 ? Math.pow(1 - dist / 260, 2) : 0;
          drawTriangle(x, y, 42, (r + c) % 2 !== 0, intensity);
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

export default function TechnologyPage() {
  /* PROTOCOL PIPELINE INTERACTIVE STATE */
  const [activeStep, setActiveStep] = useState(0);

  /* QUANTUM STATE VECTOR INTERACTIVE STATE */
  const [alphaProb, setAlphaProb] = useState(0.8);
  const betaProb = Math.sqrt(Math.max(0, 1 - alphaProb * alphaProb));

  /* THRESHOLD VERIFICATION INTERACTIVE STATE */
  const [observedDeviation, setObservedDeviation] = useState(0.032);
  const threshold = 0.05;
  const isAccepted = observedDeviation <= threshold;

  const steps = [
    {
      id: "classical-threat",
      title: "Classical Threat & Initialization",
      subtitle: "Shor's Algorithm & Key Preparation",
      details: "Shor's algorithm breaks classical RSA/ECC in polynomial time. Q-SHIELD initializes quantum state signatures |Ψ⟩ = α|0⟩ + β|1⟩ over private quantum channels.",
      math: "|Ψ⟩ = α|0⟩ + β|1⟩, |α|² + |β|² = 1"
    },
    {
      id: "bell-state",
      title: "Bell-State Entanglement",
      subtitle: "Maximal Qubit Entanglement",
      details: "Generates maximally entangled EPR pairs |Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩) distributed between signing and verifying nodes.",
      math: "|Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)"
    },
    {
      id: "teleportation",
      title: "Quantum Teleportation",
      subtitle: "Disembodied Quantum State Transfer",
      details: "Transfers the unknown signature qubit state without physical transmission using joint Bell measurement and 2-bit classical feedforward.",
      math: "M₁M₂ ∈ {00, 01, 10, 11}"
    },
    {
      id: "pauli-correction",
      title: "Pauli Correction",
      subtitle: "Unitary Reconstruction Gates",
      details: "Applies conditional Pauli operators (σ_x, σ_z) based on classical measurement outcomes to reconstruct the exact original qubit state.",
      math: "U = σ_z^M₁ · σ_x^M₂"
    },
    {
      id: "projective-measurement",
      title: "Projective Measurement",
      subtitle: "Computational & Hadamard Basis Sampling",
      details: "Samples the quantum state across N=1000 measurement shots. Physical measurement collapses superposition into discrete outcomes.",
      math: "P(|0⟩) = |α|², P(|1⟩) = |β|²"
    },
    {
      id: "statistical-verification",
      title: "Statistical Verification",
      subtitle: "Non-Deterministic Error Thresholding",
      details: "Aggregates measurement statistics to compute empirical deviation Z-scores against configurable error threshold η. Rejects tampering and noise spikes.",
      math: "Δ = |f_obs - f_exp| ≤ η"
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
          <Link href="/technology" className="nav-active">Technology</Link>
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
            <span>CORE PROTOCOL & QUANTUM INFORMATION INSTRUMENT</span>
            <i />
          </div>

          <h1 style={{ fontSize: "clamp(42px, 5vw, 76px)", lineHeight: 1.05 }}>
            Quantum Security, Engineered for the Next Threat
          </h1>

          <p className="hero-description" style={{ fontSize: "17px", maxWidth: "840px" }}>
            Explore Q-SHIELD's interactive quantum digital signature (QDS) protocol pipeline.
            Simulate state vector superposition, entangled Bell states, Pauli gate corrections, and statistical verification thresholds in real time.
          </p>

          <div className="hero-actions" style={{ marginTop: "32px" }}>
            <Link href="/security" className="primary-button">
              <span>EXPLORE SECURITY MODEL</span>
              <Arrow />
            </Link>

            <Link href="/demo" className="secondary-button">
              <span>WATCH INTERACTIVE DEMO</span>
              <span className="play">▶</span>
            </Link>
          </div>
        </div>
      </section>

      {/* MAIN INTERACTIVE RESEARCH SECTION */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 46px 120px", maxWidth: "1250px", margin: "0 auto" }}>

        {/* 1. INTERACTIVE PROTOCOL PIPELINE */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
          border: "1px solid rgba(53, 216, 255, 0.3)",
          borderRadius: "10px",
          padding: "40px",
          marginBottom: "48px",
          backdropFilter: "blur(14px)",
          boxShadow: "0 0 40px rgba(43, 60, 175, 0.15)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ color: "#35d8ff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "6px" }}>
                INTERACTIVE PIPELINE INSTRUMENT
              </div>
              <h2 style={{ color: "#edf5ff", fontSize: "30px", fontWeight: "700" }}>
                Quantum Digital Signature Protocol Flow
              </h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "6px",
                    border: activeStep === i ? "1px solid #35d8ff" : "1px solid rgba(73, 104, 170, 0.3)",
                    background: activeStep === i ? "rgba(53, 216, 255, 0.2)" : "rgba(5, 14, 29, 0.6)",
                    color: activeStep === i ? "#35d8ff" : "rgba(176, 191, 221, 0.6)",
                    fontSize: "13px",
                    fontWeight: "700",
                    transition: "all 150ms ease"
                  }}
                >
                  0{i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* SVG FLOW DIAGRAM */}
          <div style={{ width: "100%", overflowX: "auto", padding: "10px 0 30px" }}>
            <svg viewBox="0 0 1100 120" style={{ width: "100%", minWidth: "900px", overflow: "visible" }}>
              <defs>
                <linearGradient id="lineGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#35d8ff" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#755cff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a65cff" stopOpacity="0.8" />
                </linearGradient>
                <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* CONNECTING LINES */}
              <line x1="90" y1="60" x2="1010" y2="60" stroke="url(#lineGlow)" strokeWidth="3" strokeDasharray="6 6" />

              {/* STAGES NODES */}
              {steps.map((step, idx) => {
                const cx = 90 + idx * 184;
                const isActive = activeStep === idx;
                return (
                  <g key={step.id} onClick={() => setActiveStep(idx)} style={{ cursor: "pointer" }}>
                    <circle
                      cx={cx}
                      cy={60}
                      r={isActive ? 28 : 22}
                      fill={isActive ? "rgba(53, 216, 255, 0.25)" : "rgba(5, 14, 29, 0.9)"}
                      stroke={isActive ? "#35d8ff" : "rgba(73, 104, 170, 0.5)"}
                      strokeWidth={isActive ? 3 : 1.5}
                      filter={isActive ? "url(#nodeGlow)" : undefined}
                      style={{ transition: "all 200ms ease" }}
                    />
                    <text
                      x={cx}
                      y={65}
                      textAnchor="middle"
                      fill={isActive ? "#edf4ff" : "rgba(176, 191, 221, 0.6)"}
                      fontSize="14"
                      fontWeight="800"
                      fontFamily="monospace"
                    >
                      0{idx + 1}
                    </text>
                    <text
                      x={cx}
                      y={105}
                      textAnchor="middle"
                      fill={isActive ? "#35d8ff" : "rgba(176, 191, 221, 0.7)"}
                      fontSize="11"
                      fontWeight={isActive ? "700" : "500"}
                    >
                      {step.title.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ACTIVE STEP HUD INSPECTOR BOX */}
          <div style={{
            background: "rgba(5, 14, 29, 0.85)",
            border: "1px solid rgba(53, 216, 255, 0.3)",
            borderRadius: "8px",
            padding: "28px 32px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "24px",
            alignItems: "center"
          }}>
            <div>
              <div style={{ color: "#35d8ff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.1em", marginBottom: "4px" }}>
                STAGE 0{activeStep + 1} // {steps[activeStep].subtitle.toUpperCase()}
              </div>
              <h3 style={{ color: "#edf4ff", fontSize: "22px", fontWeight: "700", marginBottom: "10px" }}>
                {steps[activeStep].title}
              </h3>
              <p style={{ color: "rgba(176, 191, 221, 0.85)", fontSize: "14.5px", lineHeight: 1.7, margin: 0 }}>
                {steps[activeStep].details}
              </p>
            </div>
            <div style={{
              background: "rgba(3, 9, 20, 0.9)",
              border: "1px solid rgba(117, 92, 255, 0.4)",
              borderRadius: "6px",
              padding: "16px 20px",
              textAlign: "right",
              minWidth: "220px"
            }}>
              <div style={{ color: "rgba(176, 191, 221, 0.5)", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>FORMAL MATHEMATICS</div>
              <div style={{ color: "#a65cff", fontSize: "15px", fontWeight: "700", fontFamily: "monospace" }}>
                {steps[activeStep].math}
              </div>
            </div>
          </div>
        </div>

        {/* 2. QUANTUM STATE & STATISTICAL MEASUREMENT INSTRUMENT */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(540px, 1fr))", gap: "32px", marginBottom: "48px" }}>
          
          {/* QUANTUM STATE VECTOR SIMULATOR */}
          <div style={{
            background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
            border: "1px solid rgba(117, 92, 255, 0.3)",
            borderRadius: "10px",
            padding: "36px",
            backdropFilter: "blur(14px)"
          }}>
            <div style={{ color: "#a65cff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "6px" }}>
              STATE VECTOR AMPLITUDE SIMULATOR
            </div>
            <h3 style={{ color: "#edf5ff", fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}>
              Qubit Superposition & Probability
            </h3>

            <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              Adjust state vector amplitude α to visualize quantum state collapse probability distributions across N=1000 measurement shots.
            </p>

            {/* SLIDER CONTROL */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#edf4ff", fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
                <span>Amplitude α: {alphaProb.toFixed(2)}</span>
                <span>Amplitude β: {betaProb.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={alphaProb}
                onChange={(e) => setAlphaProb(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#35d8ff", cursor: "pointer" }}
              />
            </div>

            {/* PROBABILITY HISTOGRAM */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "rgba(5, 14, 29, 0.8)", padding: "20px", borderRadius: "6px", border: "1px solid rgba(53, 216, 255, 0.2)" }}>
                <div style={{ color: "#35d8ff", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>STATE |0⟩ PROBABILITY</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#edf4ff", fontFamily: "monospace" }}>
                  {(alphaProb * alphaProb * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: "12px", color: "rgba(176, 191, 221, 0.5)", marginTop: "4px" }}>
                  Expected Shots: {Math.round(alphaProb * alphaProb * 1000)}
                </div>
              </div>

              <div style={{ background: "rgba(5, 14, 29, 0.8)", padding: "20px", borderRadius: "6px", border: "1px solid rgba(166, 92, 255, 0.2)" }}>
                <div style={{ color: "#a65cff", fontSize: "12px", fontWeight: "700", marginBottom: "4px" }}>STATE |1⟩ PROBABILITY</div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#edf4ff", fontFamily: "monospace" }}>
                  {(betaProb * betaProb * 100).toFixed(1)}%
                </div>
                <div style={{ fontSize: "12px", color: "rgba(176, 191, 221, 0.5)", marginTop: "4px" }}>
                  Expected Shots: {Math.round(betaProb * betaProb * 1000)}
                </div>
              </div>
            </div>
          </div>

          {/* STATISTICAL THRESHOLD & VERIFICATION SIMULATOR */}
          <div style={{
            background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
            border: "1px solid rgba(255, 150, 63, 0.3)",
            borderRadius: "10px",
            padding: "36px",
            backdropFilter: "blur(14px)"
          }}>
            <div style={{ color: "#ff963f", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "6px" }}>
              NON-DETERMINISTIC VERIFICATION SIMULATOR
            </div>
            <h3 style={{ color: "#edf5ff", fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}>
              Statistical Deviation vs. Threshold
            </h3>

            <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
              Test how observed channel deviation Δ compares against the error bound threshold η (0.050) to make the security decision.
            </p>

            {/* DEVIATION SLIDER */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#edf4ff", fontSize: "13px", fontWeight: "700", marginBottom: "8px" }}>
                <span>Observed Deviation (Δ): {(observedDeviation * 100).toFixed(1)}%</span>
                <span style={{ color: "#ff963f" }}>Threshold (η): {(threshold * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.12"
                step="0.001"
                value={observedDeviation}
                onChange={(e) => setObservedDeviation(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: isAccepted ? "#35d8ff" : "#ff5555", cursor: "pointer" }}
              />
            </div>

            {/* VERDICT CARD */}
            <div style={{
              background: isAccepted ? "rgba(53, 216, 255, 0.1)" : "rgba(255, 85, 85, 0.1)",
              border: `1px solid ${isAccepted ? "#35d8ff" : "#ff5555"}`,
              borderRadius: "8px",
              padding: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "800", color: isAccepted ? "#35d8ff" : "#ff5555", letterSpacing: "0.1em" }}>
                  VERIFICATION STATUS
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#edf4ff", marginTop: "2px" }}>
                  {isAccepted ? "ACCEPT SIGNATURE" : "REJECT SIGNATURE"}
                </div>
                <div style={{ fontSize: "13px", color: "rgba(176, 191, 221, 0.7)", marginTop: "4px" }}>
                  {isAccepted ? "Deviation within normal statistical tolerance." : "Deviation exceeds statistical threshold; potential attack."}
                </div>
              </div>

              <div style={{
                fontSize: "32px",
                fontWeight: "900",
                color: isAccepted ? "#35d8ff" : "#ff5555",
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(3, 9, 20, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {isAccepted ? "✓" : "!"}
              </div>
            </div>
          </div>

        </div>

        {/* 3. SIMULATION BOUNDARY & RATIONALE */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "32px" }}>
          
          <div style={{
            background: "linear-gradient(145deg, rgba(7, 17, 35, 0.75), rgba(3, 9, 20, 0.6))",
            border: "1px solid rgba(66, 96, 155, 0.3)",
            borderRadius: "8px",
            padding: "36px",
            backdropFilter: "blur(12px)"
          }}>
            <h3 style={{ color: "#35d8ff", fontSize: "20px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>◈</span> Software Simulation Boundary
            </h3>
            <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
              Q-SHIELD is a software-simulated quantum security evaluation platform. It models state vectors, density matrices, Pauli gate operations, and quantum channel noise algorithmically on CPU runtimes, rather than claiming physical quantum hardware execution.
            </p>
          </div>

          <div style={{
            background: "linear-gradient(145deg, rgba(7, 17, 35, 0.75), rgba(3, 9, 20, 0.6))",
            border: "1px solid rgba(117, 92, 255, 0.3)",
            borderRadius: "8px",
            padding: "36px",
            backdropFilter: "blur(12px)"
          }}>
            <h3 style={{ color: "#a65cff", fontSize: "20px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>✦</span> Why Statistical Verification Matters
            </h3>
            <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
              Because quantum measurement is non-deterministic, single-shot measurements cannot distinguish channel noise from forgery. Aggregating N measurement shots allows Q-SHIELD to calculate empirical Z-score deviations against theoretical bounds η with high confidence.
            </p>
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
            <span style={{ fontWeight: "700", color: "#edf4ff", letterSpacing: "0.1em" }}>Q-SHIELD RESEARCH INSTRUMENT</span>
          </div>
          <div>Interactive Quantum Digital Signature Protocol Simulator</div>
        </div>
      </footer>
    </main>
  );
}
