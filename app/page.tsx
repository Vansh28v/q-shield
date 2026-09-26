"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
/* LIVE TELEMETRY (/api/events)   */
/* ============================== */

type RawEvent = Record<string, unknown>;

type LandingMetrics = {
  signaturesVerified: number;
  threatsDetected: number;
  attackTests: number;
  attacksDetected: number;
  verified: number;
  rejected: number;
  latencySamples: number;
  latencySum: number;
};

type TelemetryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; metrics: LandingMetrics };

const ATTACK_TYPES = [
  "FORGERY",
  "IMPERSONATION",
  "REPLAY",
  "CHANNEL_MANIPULATION",
];

function isRecord(value: unknown): value is RawEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

// Returns null when the payload shape is not recognised, so the page
// shows the safe error state instead of fake zeros.
function extractEvents(payload: unknown): RawEvent[] | null {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (isRecord(payload)) {
    for (const key of ["events", "data", "items", "results"]) {
      const candidate = payload[key];

      if (Array.isArray(candidate)) {
        return candidate.filter(isRecord);
      }
    }
  }

  return null;
}

function getMetadata(event: RawEvent): RawEvent {
  const raw = event.metadata;

  if (isRecord(raw)) {
    return raw;
  }

  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);

      if (isRecord(parsed)) {
        return parsed;
      }
    } catch {
      // malformed metadata is ignored
    }
  }

  return {};
}

function normalizeType(event: RawEvent): string {
  const candidates = [
    event.eventType,
    event.type,
    event.event_type,
    event.normalizedType,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");
    }
  }

  return "";
}

function readDetectedFlag(
  event: RawEvent,
  metadata: RawEvent,
): boolean | null {
  if (typeof event.detected === "boolean") {
    return event.detected;
  }

  if (typeof metadata.detected === "boolean") {
    return metadata.detected;
  }

  return null;
}

function hasThreatLabel(event: RawEvent, metadata: RawEvent): boolean {
  for (const value of [event.threatType, metadata.threatType]) {
    if (
      typeof value === "string" &&
      value.trim() &&
      value.trim().toUpperCase() !== "NONE"
    ) {
      return true;
    }
  }

  return false;
}

function isAttackEventType(type: string): boolean {
  return (
    ATTACK_TYPES.includes(type) ||
    type.includes("ATTACK") ||
    type.includes("THREAT")
  );
}

function readLatency(event: RawEvent, metadata: RawEvent): number | null {
  const candidates = [
    event.latencyMs,
    metadata.latencyMs,
    metadata.latency,
    metadata.simulatorTime,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "number" &&
      Number.isFinite(candidate) &&
      candidate >= 0
    ) {
      return candidate;
    }
  }

  return null;
}

function computeMetrics(events: RawEvent[]): LandingMetrics {
  const metrics: LandingMetrics = {
    signaturesVerified: 0,
    threatsDetected: 0,
    attackTests: 0,
    attacksDetected: 0,
    verified: 0,
    rejected: 0,
    latencySamples: 0,
    latencySum: 0,
  };

  for (const event of events) {
    const type = normalizeType(event);
    const metadata = getMetadata(event);

    if (type === "SIGNATURE_VERIFIED") {
      metrics.signaturesVerified += 1;
      metrics.verified += 1;
    } else if (type === "SIGNATURE_REJECTED") {
      metrics.rejected += 1;
    }

    const detectedFlag = readDetectedFlag(event, metadata);

    const attackRelated =
      isAttackEventType(type) ||
      hasThreatLabel(event, metadata) ||
      typeof metadata.attackType === "string";

    // A threat is an attack/threat record that was not explicitly
    // marked as undetected.
    if (attackRelated && detectedFlag !== false) {
      metrics.threatsDetected += 1;
    }

    // An attack test needs an explicit detected true/false result,
    // otherwise no detection rate can be computed honestly.
    if (attackRelated && detectedFlag !== null) {
      metrics.attackTests += 1;

      if (detectedFlag) {
        metrics.attacksDetected += 1;
      }
    }

    const latency = readLatency(event, metadata);

    if (latency !== null) {
      metrics.latencySamples += 1;
      metrics.latencySum += latency;
    }
  }

  return metrics;
}

/* ============================== */
/* HOME                           */
/* ============================== */

export default function Home() {
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch("/api/events?limit=1000", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Events request failed.");
        }

        const payload: unknown = await response.json();
        const events = extractEvents(payload);

        if (events === null) {
          throw new Error("Unrecognised events payload.");
        }

        setTelemetry({
          status: "ready",
          metrics: computeMetrics(events),
        });
      } catch {
        if (!controller.signal.aborted) {
          setTelemetry({ status: "error" });
        }
      }
    };

    load();

    return () => controller.abort();
  }, []);

  const show = (
    pick: (metrics: LandingMetrics) => string,
  ): string => {
    if (telemetry.status === "loading") return "...";
    if (telemetry.status === "error") return "—";

    return pick(telemetry.metrics);
  };

  const hasAttackTests =
    telemetry.status === "ready" &&
    telemetry.metrics.attackTests > 0;

  const thirdLabel = hasAttackTests
    ? "DETECTION RATE"
    : "VERIFICATION RATE";

  const thirdValue = show((m) => {
    if (m.attackTests > 0) {
      return `${((m.attacksDetected / m.attackTests) * 100).toFixed(1)}%`;
    }

    const total = m.verified + m.rejected;

    return total > 0
      ? `${((m.verified / total) * 100).toFixed(1)}%`
      : "—";
  });

  const signaturesValue = show((m) =>
    m.signaturesVerified.toLocaleString("en-US"),
  );

  const threatsValue = show((m) =>
    m.threatsDetected.toLocaleString("en-US"),
  );

  const latencyValue = show((m) =>
    m.latencySamples > 0
      ? `${(m.latencySum / m.latencySamples).toFixed(2)} ms`
      : "—",
  );

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
              href="/demo"
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
              {signaturesValue}
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
              {threatsValue}
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
              {thirdValue}
            </strong>

            <span>
              {thirdLabel}
            </span>

          </div>

        </div>

        <div className="metric">

          <div className="metric-line cyan" />

          <div>

            <strong>
              {latencyValue}
            </strong>

            <span>
              AVERAGE VERIFICATION
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