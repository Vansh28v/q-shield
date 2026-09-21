"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/* ============================== */
/* QUANTUM FIELD                  */
/* ============================== */

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

    let mouseX = window.innerWidth * 0.78;
    let mouseY = window.innerHeight * 0.48;

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

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseX = event.clientX;
      targetMouseY = event.clientY;
    };

    const drawTriangle = (
      x: number,
      y: number,
      size: number,
      inverted: boolean,
      intensity: number
    ) => {
      const triangleHeight = size * 0.866;

      const points = inverted
        ? [
            [x, y + triangleHeight],
            [x - size, y - triangleHeight],
            [x + size, y - triangleHeight],
          ]
        : [
            [x, y - triangleHeight],
            [x - size, y + triangleHeight],
            [x + size, y + triangleHeight],
          ];

      ctx.beginPath();

      ctx.moveTo(points[0][0], points[0][1]);
      ctx.lineTo(points[1][0], points[1][1]);
      ctx.lineTo(points[2][0], points[2][1]);

      ctx.closePath();

      /* Base outline */

      const alpha = 0.025 + intensity * 0.45;

      ctx.strokeStyle = `rgba(65, 89, 190, ${alpha})`;
      ctx.lineWidth = 0.7 + intensity * 1.2;

      /* Glow */

      if (intensity > 0.08) {
        ctx.shadowBlur = 8 + intensity * 38;

        ctx.shadowColor = `rgba(
          ${70 + intensity * 80},
          ${80 + intensity * 40},
          255,
          ${0.25 + intensity * 0.65}
        )`;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.stroke();

      /* Filled energy */

      if (intensity > 0.12) {
        const fill = ctx.createLinearGradient(
          x - size,
          y - triangleHeight,
          x + size,
          y + triangleHeight
        );

        fill.addColorStop(
          0,
          `rgba(38, 82, 255, ${intensity * 0.1})`
        );

        fill.addColorStop(
          0.45,
          `rgba(76, 49, 255, ${intensity * 0.22})`
        );

        fill.addColorStop(
          0.72,
          `rgba(125, 66, 255, ${intensity * 0.3})`
        );

        fill.addColorStop(
          1,
          `rgba(35, 165, 255, ${intensity * 0.1})`
        );

        ctx.fillStyle = fill;
        ctx.fill();
      }

      /* Bright edge */

      if (intensity > 0.35) {
        ctx.beginPath();

        ctx.moveTo(points[0][0], points[0][1]);
        ctx.lineTo(points[1][0], points[1][1]);
        ctx.lineTo(points[2][0], points[2][1]);

        ctx.closePath();

        ctx.strokeStyle = `rgba(
          115,
          135,
          255,
          ${intensity * 0.7}
        )`;

        ctx.lineWidth = 1 + intensity * 1.5;

        ctx.shadowBlur = 18 + intensity * 25;
        ctx.shadowColor = "rgba(80, 85, 255, 0.85)";

        ctx.stroke();
      }

      ctx.shadowBlur = 0;
    };

    const drawEnergyCore = (
      x: number,
      y: number,
      radius: number,
      alpha: number
    ) => {
      const gradient = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        radius
      );

      gradient.addColorStop(
        0,
        `rgba(135, 104, 255, ${alpha})`
      );

      gradient.addColorStop(
        0.18,
        `rgba(84, 110, 255, ${alpha * 0.72})`
      );

      gradient.addColorStop(
        0.45,
        `rgba(55, 88, 255, ${alpha * 0.28})`
      );

      gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
      );

      ctx.fillStyle = gradient;

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
      );

      ctx.fill();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      /* Smooth cursor movement */

      mouseX += (targetMouseX - mouseX) * 0.075;
      mouseY += (targetMouseY - mouseY) * 0.075;

      /* Main ambient energy */

      const coreX = width * 0.77;
      const coreY = height * 0.47;

      drawEnergyCore(
        coreX,
        coreY,
        430,
        0.17
      );

      /* Cursor energy */

      drawEnergyCore(
        mouseX,
        mouseY,
        310,
        0.28
      );

      /* Triangular field */

      const spacingX = 78;
      const spacingY = 67;

      const columns =
        Math.ceil(width / spacingX) + 4;

      const rows =
        Math.ceil(height / spacingY) + 4;

      const cursorRadius = 270;
      const coreRadius = 390;

      for (let row = -2; row < rows; row++) {
        for (let col = -2; col < columns; col++) {
          const x =
            col * spacingX +
            (row % 2 === 0
              ? 0
              : spacingX / 2);

          const y = row * spacingY;

          /* Cursor distance */

          const cursorDx = x - mouseX;
          const cursorDy = y - mouseY;

          const cursorDistance = Math.sqrt(
            cursorDx * cursorDx +
              cursorDy * cursorDy
          );

          /* Ambient core distance */

          const coreDx = x - coreX;
          const coreDy = y - coreY;

          const coreDistance = Math.sqrt(
            coreDx * coreDx +
              coreDy * coreDy
          );

          /* Cursor intensity */

          const cursorIntensity =
            cursorDistance < cursorRadius
              ? Math.pow(
                  1 -
                    cursorDistance /
                      cursorRadius,
                  2
                )
              : 0;

          /* Ambient intensity */

          const coreIntensity =
            coreDistance < coreRadius
              ? Math.pow(
                  1 -
                    coreDistance /
                      coreRadius,
                  2
                ) * 0.55
              : 0;

          /* Subtle animation */

          const wave =
            Math.sin(
              time * 0.0012 +
                x * 0.008 +
                y * 0.006
            ) * 0.018;

          const intensity = Math.min(
            1,
            cursorIntensity +
              coreIntensity +
              Math.max(0, wave)
          );

          drawTriangle(
            x,
            y,
            44,
            (row + col) % 2 !== 0,
            intensity
          );
        }
      }

      /* Bright cursor core */

      const pulse =
        1 +
        Math.sin(time * 0.003) * 0.12;

      drawEnergyCore(
        mouseX,
        mouseY,
        95 * pulse,
        0.25
      );

      /* Small bright center */

      const centerGlow =
        ctx.createRadialGradient(
          mouseX,
          mouseY,
          0,
          mouseX,
          mouseY,
          55
        );

      centerGlow.addColorStop(
        0,
        "rgba(220, 225, 255, 0.22)"
      );

      centerGlow.addColorStop(
        0.25,
        "rgba(112, 117, 255, 0.14)"
      );

      centerGlow.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
      );

      ctx.fillStyle = centerGlow;

      ctx.beginPath();

      ctx.arc(
        mouseX,
        mouseY,
        55,
        0,
        Math.PI * 2
      );

      ctx.fill();

      animationFrame =
        requestAnimationFrame(draw);
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    animationFrame =
      requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="quantum-field"
      aria-hidden="true"
    />
  );
}

/* ============================== */
/* SHIELD LOGO                    */
/* ============================== */

function ShieldLogo() {
  return (
    <div className="brand-mark">
      <div className="brand-diamond">
        <div className="brand-core" />
      </div>
    </div>
  );
}

/* ============================== */
/* ARROW                          */
/* ============================== */

function Arrow() {
  return (
    <span className="arrow">
      →
    </span>
  );
}

/* ============================== */
/* HOME                           */
/* ============================== */

export default function Home() {
  return (
    <main className="q-page">

      <QuantumField />

      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {/* ============================== */}
      {/* NAVIGATION                     */}
      {/* ============================== */}

      <header className="topbar">

        <div className="brand">

          <ShieldLogo />

          <span className="brand-name">
            Q-SHIELD
          </span>

        </div>

        <nav className="navigation">

          <Link
            className="nav-active"
            href="/"
          >
            Home
          </Link>

          <Link href="/quantum">
            Quantum
          </Link>

          <Link href="/signature">
            Security
          </Link>

          <Link href="/intelligence">
            Intelligence
          </Link>

          <Link href="/dashboard">
            About
          </Link>

        </nav>

        <Link
          href="/login"
          className="platform-button"
        >
          <span>
            ENTER PLATFORM
          </span>

          <Arrow />
        </Link>

      </header>

      {/* ============================== */}
      {/* HERO                           */}
      {/* ============================== */}

      <section className="hero">

        <div className="hero-content">

          <div className="eyebrow">

            <span>
              SECURE THE NEXT DIMENSION
            </span>

            <i />

          </div>

          <h1>
            Q-SHIELD
          </h1>

          <h2>
            QUANTUM DIGITAL SIGNATURE
            <br />
            THREAT INTELLIGENCE PLATFORM
          </h2>

          <p className="hero-description">
            Where quantum computing meets cybersecurity.
            <br />
            Verify. Detect. Analyze. Defend.
          </p>

          {/* HERO BUTTONS */}

          <div className="hero-actions">

            <Link
              href="/login"
              className="primary-button"
            >
              <span>
                ENTER PLATFORM
              </span>

              <Arrow />
            </Link>

            <Link
              href="/dashboard"
              className="secondary-button"
            >
              <span>
                WATCH DEMO
              </span>

              <span className="play">
                ▶
              </span>
            </Link>

          </div>

          {/* ============================== */}
          {/* ENGINE CARDS                   */}
          {/* ============================== */}

          <div className="engine-grid">

            {/* QUANTUM */}

            <Link
              href="/quantum"
              className="engine-card"
            >

              <div className="card-top">

                <div className="quantum-icon">
                  ◈
                </div>

                <span className="card-number">
                  01
                </span>

              </div>

              <div className="card-title">
                QUANTUM ENGINE
              </div>

              <div className="card-lines">

                <span>
                  Bell States
                </span>

                <span>
                  Teleportation
                </span>

                <span>
                  Pauli Correction
                </span>

              </div>

            </Link>

            {/* STATISTICAL */}

            <Link
              href="/signature"
              className="engine-card"
            >

              <div className="card-top">

                <div className="statistics-icon">

                  <span />
                  <span />
                  <span />
                  <span />

                </div>

                <span className="card-number">
                  02
                </span>

              </div>

              <div className="card-title">
                STATISTICAL ENGINE
              </div>

              <div className="card-lines">

                <span>
                  Threat Detection
                </span>

                <span>
                  Forgery Probability
                </span>

                <span>
                  Adaptive Thresholds
                </span>

              </div>

            </Link>

            {/* AI */}

            <Link
              href="/intelligence"
              className="engine-card"
            >

              <div className="card-top">

                <div className="ai-icon">
                  ✧
                </div>

                <span className="card-number orange">
                  03
                </span>

              </div>

              <div className="card-title">
                AI INTELLIGENCE
              </div>

              <div className="card-lines">

                <span>
                  Attack Prediction
                </span>

                <span>
                  Anomaly Detection
                </span>

                <span>
                  Risk Assessment
                </span>

              </div>

            </Link>

          </div>

        </div>

        {/* RIGHT LABEL */}

        <div className="side-label side-label-one">

          <span>
            QUANTUM
          </span>

          <span>
            SECURITY
          </span>

          <span>
            REAL IMPACT
          </span>

          <i />

        </div>

        <div className="side-label side-label-two">

          <span>
            BUILT
          </span>

          <span>
            FOR A SAFE
          </span>

          <span>
            TOMORROW
          </span>

          <i />

        </div>

      </section>

      {/* ============================== */}
      {/* BOTTOM METRICS                 */}
      {/* ============================== */}

      <section className="metrics">

        <div className="metric">

          <div className="metric-line purple" />

          <div>

            <strong>
              12.4K
            </strong>

            <span>
              SIGNATURES VERIFIED
            </span>

          </div>

        </div>

        <div className="metric">

          <div className="metric-line blue" />

          <div>

            <strong>
              158
            </strong>

            <span>
              THREATS DETECTED
            </span>

          </div>

        </div>

        <div className="metric">

          <div className="metric-line orange" />

          <div>

            <strong>
              98.7%
            </strong>

            <span>
              DETECTION RATE
            </span>

          </div>

        </div>

        <div className="metric">

          <div className="metric-line cyan" />

          <div>

            <strong>
              0.008%
            </strong>

            <span>
              FALSE ACCEPTANCE
            </span>

          </div>

        </div>

        {/* SYSTEM STATUS */}

        <div className="system-status">

          <div className="status-dot" />

          <div>

            <span>
              SYSTEM STATUS
            </span>

            <strong>
              ALL SYSTEMS OPERATIONAL
            </strong>

          </div>

        </div>

      </section>

    </main>
  );
}