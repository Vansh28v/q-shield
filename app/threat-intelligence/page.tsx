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

    const drawCircle = (x: number, y: number, radius: number, intensity: number) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      const alpha = 0.02 + intensity * 0.35;
      ctx.strokeStyle = `rgba(166, 92, 255, ${alpha})`;
      ctx.lineWidth = 0.8 + intensity * 1.2;

      if (intensity > 0.1) {
        ctx.shadowBlur = 10 + intensity * 20;
        ctx.shadowColor = "rgba(166, 92, 255, 0.5)";
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
          drawCircle(x, y, 6, intensity);
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

type SecurityEvent = {
  id?: string;
  eventType?: string;
  type?: string;
  timestamp?: string | number;
  message?: string;
  severity?: string;
};

export default function ThreatIntelligencePage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events?limit=100", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch events");
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvents(data);
        } else if (data && Array.isArray(data.events)) {
          setEvents(data.events);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    return () => controller.abort();
  }, []);

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
          <Link href="/threat-intelligence" className="nav-active">Intelligence</Link>
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
            <span>TELEMETRY-DRIVEN CYBER THREAT INTELLIGENCE CONSOLE</span>
            <i />
          </div>

          <h1 style={{ fontSize: "clamp(42px, 5vw, 76px)", lineHeight: 1.05 }}>
            Threat Intelligence Architecture
          </h1>

          <p className="hero-description" style={{ fontSize: "17px", maxWidth: "840px" }}>
            Q-SHIELD processes quantum verification telemetry into long-term threat intelligence.
            Statistical verification remains the strict, authoritative decision layer, while an optional AI advisory module aggregates pattern metrics for threat classification.
          </p>

          <div className="hero-actions" style={{ marginTop: "32px" }}>
            <Link href="/architecture" className="primary-button">
              <span>EXPLORE SYSTEM ARCHITECTURE</span>
              <Arrow />
            </Link>

            <Link href="/login" className="secondary-button">
              <span>ENTER PLATFORM</span>
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* INTELLIGENCE CONSOLE MAIN SECTION */}
      <section style={{ position: "relative", zIndex: 10, padding: "0 46px 120px", maxWidth: "1250px", margin: "0 auto" }}>
        
        {/* TOP STATUS BAR */}
        <div style={{
          background: "rgba(5, 14, 29, 0.85)",
          border: "1px solid rgba(166, 92, 255, 0.3)",
          borderRadius: "8px",
          padding: "20px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "36px",
          backdropFilter: "blur(12px)"
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "rgba(176, 191, 221, 0.5)", fontWeight: "700" }}>INTELLIGENCE ENGINE</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#35d8ff", display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#35d8ff", boxShadow: "0 0 8px #35d8ff" }} />
              ONLINE (QSI-1.0)
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "rgba(176, 191, 221, 0.5)", fontWeight: "700" }}>TELEMETRY EVENT STREAM</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#edf4ff", marginTop: "2px" }}>
              {loading ? "FETCHING..." : `${events.length} LOGGED EVENTS`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "rgba(176, 191, 221, 0.5)", fontWeight: "700" }}>AUTHORITATIVE CORE</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#a65cff", marginTop: "2px" }}>
              DETERMINISTIC STATISTICAL
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "rgba(176, 191, 221, 0.5)", fontWeight: "700" }}>ADVISORY LAYER</div>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#ff963f", marginTop: "2px" }}>
              OPTIONAL / NON-BLOCKING
            </div>
          </div>
        </div>

        {/* PIPELINE ARCHITECTURE (AUTHORITATIVE vs ADVISORY) */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
          border: "1px solid rgba(166, 92, 255, 0.3)",
          borderRadius: "10px",
          padding: "36px",
          marginBottom: "48px",
          backdropFilter: "blur(14px)"
        }}>
          <div style={{ color: "#a65cff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "6px" }}>
            INTELLIGENCE PIPELINE ARCHITECTURE
          </div>
          <h2 style={{ color: "#edf5ff", fontSize: "28px", fontWeight: "700", marginBottom: "24px" }}>
            Authoritative Core vs. Advisory AI Layer
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
            {/* AUTHORITATIVE */}
            <div style={{ background: "rgba(5, 14, 29, 0.9)", padding: "28px", borderRadius: "8px", border: "1px solid rgba(53, 216, 255, 0.4)" }}>
              <div style={{ background: "rgba(53, 216, 255, 0.15)", color: "#35d8ff", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", display: "inline-block", marginBottom: "12px" }}>
                100% AUTHORITATIVE CORE
              </div>
              <h3 style={{ color: "#edf4ff", fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>
                Quantum Statistical Verifier
              </h3>
              <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                Executes strict mathematical Z-score thresholding, Bell inequality checks, and nonce non-reuse verifications. Produces the definitive binary ACCEPT / REJECT security verdict.
              </p>
            </div>

            {/* ADVISORY */}
            <div style={{ background: "rgba(5, 14, 29, 0.9)", padding: "28px", borderRadius: "8px", border: "1px solid rgba(255, 150, 63, 0.4)" }}>
              <div style={{ background: "rgba(255, 150, 63, 0.15)", color: "#ff963f", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", display: "inline-block", marginBottom: "12px" }}>
                OPTIONAL ADVISORY LAYER
              </div>
              <h3 style={{ color: "#edf4ff", fontSize: "20px", fontWeight: "700", marginBottom: "10px" }}>
                AI Threat Intelligence (QSI-1.0)
              </h3>
              <p style={{ color: "rgba(176, 191, 221, 0.8)", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                Aggregates historical telemetry data to offer threat classification, anomaly pattern detection, and risk scoring. Advisory outputs are strictly non-blocking and do not alter verification decisions.
              </p>
            </div>
          </div>
        </div>

        {/* LIVE TELEMETRY STREAM STREAMING FEED */}
        <div style={{
          background: "linear-gradient(145deg, rgba(7, 17, 35, 0.85), rgba(3, 9, 20, 0.7))",
          border: "1px solid rgba(53, 216, 255, 0.3)",
          borderRadius: "10px",
          padding: "36px",
          backdropFilter: "blur(14px)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <div style={{ color: "#35d8ff", fontSize: "12px", fontWeight: "800", letterSpacing: "0.15em", marginBottom: "4px" }}>
                LIVE BACKEND AUDIT TELEMETRY
              </div>
              <h3 style={{ color: "#edf5ff", fontSize: "24px", fontWeight: "700" }}>
                Security Event Audit Stream
              </h3>
            </div>
            <span style={{ fontSize: "12px", color: "rgba(176, 191, 221, 0.5)", fontFamily: "monospace" }}>
              /api/events
            </span>
          </div>

          <div style={{
            background: "rgba(3, 9, 20, 0.9)",
            border: "1px solid rgba(73, 104, 170, 0.3)",
            borderRadius: "6px",
            padding: "16px",
            maxHeight: "320px",
            overflowY: "auto"
          }}>
            {loading ? (
              <div style={{ color: "rgba(176, 191, 221, 0.6)", padding: "20px", textAlign: "center", fontSize: "14px" }}>
                Streaming telemetry events...
              </div>
            ) : events.length === 0 ? (
              <div style={{ color: "rgba(176, 191, 221, 0.6)", padding: "20px", textAlign: "center", fontSize: "14px" }}>
                No telemetry events logged yet. Execute platform simulations to populate audit stream.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {events.slice(0, 10).map((ev, idx) => (
                  <div key={idx} style={{
                    background: "rgba(5, 14, 29, 0.7)",
                    borderLeft: "3px solid #35d8ff",
                    padding: "12px 16px",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                    fontFamily: "monospace"
                  }}>
                    <span style={{ color: "#35d8ff", fontWeight: "700" }}>
                      {String(ev.eventType || ev.type || "EVENT").toUpperCase()}
                    </span>
                    <span style={{ color: "rgba(176, 191, 221, 0.8)" }}>
                      {ev.message || "Security telemetry event recorded"}
                    </span>
                    <span style={{ color: "rgba(176, 191, 221, 0.4)", fontSize: "11px" }}>
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "LOGGED"}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            <span style={{ fontWeight: "700", color: "#edf4ff", letterSpacing: "0.1em" }}>Q-SHIELD INTELLIGENCE CONSOLE</span>
          </div>
          <div>Telemetry Aggregation &amp; Optional AI Advisory Architecture</div>
        </div>
      </footer>
    </main>
  );
}
