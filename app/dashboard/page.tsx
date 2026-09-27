"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SecurityEvent = {
  id?: string;
  eventId?: string;
  type?: string;
  eventType?: string;
  timestamp?: string | number;
  createdAt?: string | number;
  severity?: string;
  message?: string;
  description?: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
};

type ApiResponse = {
  success?: boolean;
  count?: number;
  events?: SecurityEvent[];
  error?: string;
};

const navItems = [
  { label: "Overview", path: "/dashboard", icon: "⌂" },
  { label: "Quantum Lab", path: "/quantum", icon: "◇" },
  { label: "Signatures", path: "/signature", icon: "✦" },
  { label: "Attack Lab", path: "/attack-lab", icon: "⚡" },
  { label: "Intelligence", path: "/intelligence", icon: "◈" },
  { label: "Analytics", path: "/analytics", icon: "◌" },
  { label: "Events", path: "/events", icon: "≡" },
];

function getEventType(event: SecurityEvent): string {
  return String(event.eventType ?? event.type ?? "UNKNOWN").toUpperCase();
}

function getEventTime(event: SecurityEvent): number {
  const value = event.timestamp ?? event.createdAt;

  if (typeof value === "number") {
    return value < 10_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getEventMessage(event: SecurityEvent): string {
  return (
    event.message ??
    event.description ??
    getEventType(event).replaceAll("_", " ")
  );
}

function isThreat(event: SecurityEvent): boolean {
  const type = getEventType(event);

  return (
    type.includes("THREAT") ||
    type.includes("REPLAY") ||
    type.includes("ANOMALY") ||
    type.includes("UNAUTHORIZED") ||
    type.includes("CHANNEL") ||
    type.includes("ATTACK")
  );
}

function isVerified(event: SecurityEvent): boolean {
  return getEventType(event) === "SIGNATURE_VERIFIED";
}

function isRejected(event: SecurityEvent): boolean {
  return getEventType(event) === "SIGNATURE_REJECTED";
}

function getLatency(event: SecurityEvent): number | null {
  if (typeof event.latencyMs === "number") {
    return event.latencyMs;
  }

  const metadata = event.metadata;

  if (!metadata) {
    return null;
  }

  const possibleValues = [
    metadata.latencyMs,
    metadata.latency,
    metadata.processingTime,
    metadata.processingTimeMs,
  ];

  for (const value of possibleValues) {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function formatTime(timestamp: number): string {
  if (!timestamp) {
    return "--";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatEventType(type: string): string {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DashboardPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadEvents(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/events?limit=1000", {
        cache: "no-store",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.error ?? "Unable to load security events.");
      }

      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load security telemetry.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents();

    const interval = setInterval(() => {
      loadEvents(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => getEventTime(b) - getEventTime(a));
  }, [events]);

  const verifiedCount = useMemo(
    () => events.filter(isVerified).length,
    [events],
  );

  const rejectedCount = useMemo(
    () => events.filter(isRejected).length,
    [events],
  );

  const threatCount = useMemo(
    () => events.filter(isThreat).length,
    [events],
  );

  const verificationAttempts = verifiedCount + rejectedCount;

  const verificationRate =
    verificationAttempts > 0
      ? (verifiedCount / verificationAttempts) * 100
      : null;

  const averageLatency = useMemo(() => {
    const latencies = events
      .map(getLatency)
      .filter((value): value is number => value !== null);

    if (latencies.length === 0) {
      return null;
    }

    return (
      latencies.reduce((total, value) => total + value, 0) / latencies.length
    );
  }, [events]);

  const recentEvents = sortedEvents.slice(0, 6);

  const last24Hours = useMemo(() => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    return sortedEvents.filter((event) => {
      const timestamp = getEventTime(event);
      return timestamp >= dayAgo && timestamp <= now;
    });
  }, [sortedEvents]);

  const recentThreats = last24Hours.filter(isThreat).length;

  const systemState =
    loading
      ? "SYNCING"
      : error
        ? "UNAVAILABLE"
        : recentThreats > 0
          ? "THREATS OBSERVED"
          : "CLEAR";

  const stateDescription =
    loading
      ? "Synchronizing security telemetry"
      : error
        ? "Telemetry service unavailable"
        : recentThreats > 0
          ? `${recentThreats} threat event${recentThreats === 1 ? "" : "s"} observed in the last 24 hours`
          : "No threat events observed in the last 24 hours";

  const activityBuckets = useMemo(() => {
    const buckets = Array.from({ length: 12 }, (_, index) => ({
      label: `${index * 2}h`,
      total: 0,
      threats: 0,
    }));

    const now = Date.now();

    for (const event of last24Hours) {
      const timestamp = getEventTime(event);

      if (!timestamp) {
        continue;
      }

      const ageHours = (now - timestamp) / (60 * 60 * 1000);
      const bucketIndex = Math.min(
        11,
        Math.max(0, 11 - Math.floor(ageHours / 2)),
      );

      buckets[bucketIndex].total += 1;

      if (isThreat(event)) {
        buckets[bucketIndex].threats += 1;
      }
    }

    return buckets;
  }, [last24Hours]);

  const maxActivity = Math.max(
    1,
    ...activityBuckets.map((bucket) => bucket.total),
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 75% 10%, rgba(90,60,180,0.16), transparent 28%), radial-gradient(circle at 15% 85%, rgba(0,210,255,0.07), transparent 30%), #050711",
        color: "#eef2ff",
        display: "flex",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: 250,
          minHeight: "100vh",
          borderRight: "1px solid rgba(140,150,210,0.12)",
          background: "rgba(5,7,17,0.88)",
          padding: "28px 18px",
          position: "sticky",
          top: 0,
          height: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "4px 10px 30px",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: "1px solid rgba(83,225,255,0.7)",
              transform: "rotate(45deg)",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 0 22px rgba(42,211,255,0.2)",
            }}
          >
            <span
              style={{
                transform: "rotate(-45deg)",
                fontSize: 15,
                color: "#6ee7ff",
              }}
            >
              ◇
            </span>
          </div>

          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: "0.16em",
              }}
            >
              Q-SHIELD
            </div>

            <div
              style={{
                fontSize: 9,
                color: "rgba(200,210,240,0.45)",
                letterSpacing: "0.16em",
                marginTop: 3,
              }}
            >
              QUANTUM SECURITY
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.18em",
              color: "rgba(180,190,220,0.35)",
              padding: "0 12px 10px",
            }}
          >
            PLATFORM
          </div>

          {navItems.map((item) => {
            const active = item.path === "/dashboard";

            return (
              <Link
                key={item.path}
                href={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "12px 13px",
                  marginBottom: 4,
                  borderRadius: 8,
                  textDecoration: "none",
                  color: active
                    ? "#dffbff"
                    : "rgba(190,200,225,0.58)",
                  background: active
                    ? "linear-gradient(90deg, rgba(46,208,255,0.12), rgba(110,80,255,0.08))"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(66,211,255,0.15)"
                    : "1px solid transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  style={{
                    width: 22,
                    textAlign: "center",
                    color: active ? "#62e6ff" : "rgba(180,190,220,0.5)",
                    fontSize: 17,
                  }}
                >
                  {item.icon}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.03em",
                  }}
                >
                  {item.label}
                </span>

                {item.label === "Events" && events.length > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 9,
                      minWidth: 20,
                      padding: "3px 5px",
                      textAlign: "center",
                      borderRadius: 10,
                      background: "rgba(75,220,255,0.1)",
                      color: "#69eaff",
                    }}
                  >
                    {events.length > 999 ? "999+" : events.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Engine status */}
        <div
          style={{
            marginTop: 34,
            padding: 14,
            borderRadius: 9,
            border: "1px solid rgba(100,110,160,0.12)",
            background: "rgba(255,255,255,0.018)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#57e7a1",
                boxShadow: "0 0 10px rgba(87,231,161,0.8)",
              }}
            />

            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                color: "rgba(210,220,240,0.55)",
              }}
            >
              QUANTUM ENGINE
            </span>
          </div>

          <div
            style={{
              fontSize: 11,
              color: "rgba(220,230,250,0.4)",
              lineHeight: 1.5,
            }}
          >
            Statistical verification active
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <section
        style={{
          flex: 1,
          minWidth: 0,
          padding: "28px 34px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "rgba(110,225,255,0.65)",
                marginBottom: 8,
              }}
            >
              Q-SHIELD / SECURITY CONSOLE
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 500,
                letterSpacing: "-0.025em",
              }}
            >
              Security Overview
            </h1>

            <p
              style={{
                margin: "7px 0 0",
                fontSize: 12,
                color: "rgba(190,200,225,0.46)",
              }}
            >
              Live telemetry from the quantum digital signature security
              engine.
            </p>
          </div>

          <button
            onClick={() => loadEvents(true)}
            disabled={refreshing}
            style={{
              border: "1px solid rgba(83,220,255,0.25)",
              background: "rgba(60,210,255,0.06)",
              color: "#8deaff",
              borderRadius: 7,
              padding: "10px 15px",
              fontSize: 10,
              letterSpacing: "0.12em",
              cursor: refreshing ? "wait" : "pointer",
              opacity: refreshing ? 0.55 : 1,
            }}
          >
            {refreshing ? "SYNCING..." : "↻  SYNC TELEMETRY"}
          </button>
        </header>

        {/* SECURITY STATE */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 14,
            border: "1px solid rgba(103,113,170,0.16)",
            background:
              "linear-gradient(135deg, rgba(20,25,48,0.75), rgba(9,12,26,0.72))",
            padding: 28,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              right: -100,
              top: -180,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(70,210,255,0.1), transparent 68%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,
              position: "relative",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background:
                      systemState === "THREATS OBSERVED"
                        ? "#ffb86b"
                        : systemState === "UNAVAILABLE"
                          ? "#ff667d"
                          : "#57e7a1",
                    boxShadow:
                      systemState === "THREATS OBSERVED"
                        ? "0 0 12px rgba(255,184,107,0.7)"
                        : systemState === "UNAVAILABLE"
                          ? "0 0 12px rgba(255,102,125,0.7)"
                          : "0 0 12px rgba(87,231,161,0.7)",
                  }}
                />

                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.18em",
                    color: "rgba(190,205,230,0.5)",
                  }}
                >
                  CURRENT SECURITY STATE
                </span>
              </div>

              <div
                style={{
                  fontSize: 32,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                {systemState}
              </div>

              <div
                style={{
                  marginTop: 8,
                  color: "rgba(190,200,225,0.48)",
                  fontSize: 12,
                }}
              >
                {stateDescription}
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
                minWidth: 170,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "rgba(190,200,225,0.35)",
                  marginBottom: 7,
                }}
              >
                EVENTS IN TELEMETRY
              </div>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 500,
                }}
              >
                {loading ? "—" : events.length}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: "rgba(190,200,225,0.35)",
                  marginTop: 4,
                }}
              >
                persisted security events
              </div>
            </div>
          </div>
        </section>

        {/* METRICS */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          {[
            {
              label: "SIGNATURES VERIFIED",
              value: loading ? "—" : String(verifiedCount),
              sub: "successful verification events",
            },
            {
              label: "THREATS DETECTED",
              value: loading ? "—" : String(threatCount),
              sub: "security threat events",
            },
            {
              label: "VERIFICATION RATE",
              value:
                verificationRate === null
                  ? "—"
                  : `${verificationRate.toFixed(1)}%`,
              sub:
                verificationAttempts > 0
                  ? `${verificationAttempts} verification attempts`
                  : "no verification attempts",
            },
            {
              label: "AVG. VERIFICATION",
              value:
                averageLatency === null
                  ? "—"
                  : `${averageLatency.toFixed(2)} ms`,
              sub: "reported simulator latency",
            },
          ].map((metric) => (
            <div
              key={metric.label}
              style={{
                border: "1px solid rgba(105,115,165,0.14)",
                background: "rgba(13,17,34,0.72)",
                borderRadius: 11,
                padding: "19px 18px",
                minHeight: 105,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.15em",
                  color: "rgba(180,195,225,0.42)",
                  marginBottom: 13,
                }}
              >
                {metric.label}
              </div>

              <div
                style={{
                  fontSize: 25,
                  fontWeight: 500,
                  color: "#eef5ff",
                }}
              >
                {metric.value}
              </div>

              <div
                style={{
                  fontSize: 9,
                  color: "rgba(180,195,225,0.32)",
                  marginTop: 6,
                }}
              >
                {metric.sub}
              </div>
            </div>
          ))}
        </section>

        {/* ACTIVITY + PIPELINE */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: 18,
            marginBottom: 18,
          }}
        >
          {/* ACTIVITY */}
          <div
            style={{
              border: "1px solid rgba(105,115,165,0.14)",
              background: "rgba(13,17,34,0.72)",
              borderRadius: 12,
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 22,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    color: "rgba(180,195,225,0.42)",
                  }}
                >
                  SECURITY TELEMETRY
                </div>

                <div
                  style={{
                    fontSize: 17,
                    marginTop: 6,
                  }}
                >
                  Verification Activity
                </div>
              </div>

              <div
                style={{
                  fontSize: 9,
                  color: "rgba(180,195,225,0.3)",
                }}
              >
                LAST 24 HOURS
              </div>
            </div>

            <div
              style={{
                height: 190,
                display: "flex",
                alignItems: "flex-end",
                gap: 9,
                padding: "10px 4px 0",
                borderBottom: "1px solid rgba(130,140,180,0.12)",
              }}
            >
              {activityBuckets.map((bucket, index) => {
                const height =
                  bucket.total === 0
                    ? 3
                    : Math.max(8, (bucket.total / maxActivity) * 150);

                return (
                  <div
                    key={`${bucket.label}-${index}`}
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      alignItems: "flex-end",
                      position: "relative",
                    }}
                    title={`${bucket.total} events, ${bucket.threats} threats`}
                  >
                    <div
                      style={{
                        width: "100%",
                        height,
                        borderRadius: "4px 4px 0 0",
                        background:
                          bucket.threats > 0
                            ? "linear-gradient(180deg, rgba(255,133,150,0.9), rgba(255,133,150,0.18))"
                            : "linear-gradient(180deg, rgba(83,220,255,0.85), rgba(83,220,255,0.12))",
                        boxShadow:
                          bucket.total > 0
                            ? bucket.threats > 0
                              ? "0 0 12px rgba(255,133,150,0.12)"
                              : "0 0 12px rgba(83,220,255,0.12)"
                            : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 9,
                color: "rgba(180,195,225,0.25)",
                fontSize: 8,
              }}
            >
              {activityBuckets.map((bucket) => (
                <span key={bucket.label}>{bucket.label}</span>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 18,
                marginTop: 18,
                fontSize: 9,
                color: "rgba(190,200,225,0.38)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    background: "#53dcff",
                  }}
                />
                SECURITY EVENTS
              </span>

              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    background: "#ff8596",
                  }}
                />
                THREAT EVENTS
              </span>
            </div>
          </div>

          {/* SECURITY PIPELINE */}
          <div
            style={{
              border: "1px solid rgba(105,115,165,0.14)",
              background: "rgba(13,17,34,0.72)",
              borderRadius: 12,
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.16em",
                color: "rgba(180,195,225,0.42)",
              }}
            >
              Q-SHIELD PIPELINE
            </div>

            <div
              style={{
                fontSize: 17,
                marginTop: 6,
                marginBottom: 22,
              }}
            >
              Verification Flow
            </div>

            <div>
              {[
                ["01", "Signature Input"],
                ["02", "Bell-State Entanglement"],
                ["03", "Quantum Teleportation"],
                ["04", "Pauli Correction"],
                ["05", "Projective Measurement"],
                ["06", "Statistical Verification"],
                ["07", "Threat Decision"],
              ].map(([number, label], index, array) => (
                <div
                  key={number}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 13,
                    position: "relative",
                    paddingBottom: index === array.length - 1 ? 0 : 15,
                  }}
                >
                  {index !== array.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        top: 23,
                        width: 1,
                        height: 22,
                        background:
                          "linear-gradient(to bottom, rgba(70,220,255,0.35), rgba(70,220,255,0.02))",
                      }}
                    />
                  )}

                  <div
                    style={{
                      width: 21,
                      height: 21,
                      borderRadius: "50%",
                      border: "1px solid rgba(77,220,255,0.35)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 7,
                      color: "#65dcf7",
                      background: "rgba(50,210,255,0.05)",
                      zIndex: 1,
                    }}
                  >
                    {number}
                  </div>

                  <div
                    style={{
                      fontSize: 10,
                      color:
                        index === 6
                          ? "#e7edff"
                          : "rgba(205,215,235,0.56)",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 23,
                padding: 12,
                borderRadius: 7,
                border: "1px solid rgba(88,230,255,0.1)",
                background: "rgba(60,210,255,0.025)",
                fontSize: 9,
                color: "rgba(185,205,225,0.4)",
                lineHeight: 1.6,
              }}
            >
              The statistical verifier remains the authoritative security
              decision layer. AI is not required for acceptance or rejection.
            </div>
          </div>
        </section>

        {/* RECENT EVENTS */}
        <section
          style={{
            border: "1px solid rgba(105,115,165,0.14)",
            background: "rgba(13,17,34,0.72)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 22px",
              borderBottom: "1px solid rgba(105,115,165,0.1)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  color: "rgba(180,195,225,0.42)",
                }}
              >
                LIVE TELEMETRY
              </div>

              <div
                style={{
                  fontSize: 17,
                  marginTop: 6,
                }}
              >
                Recent Security Events
              </div>
            </div>

            <Link
              href="/events"
              style={{
                color: "#6de4ff",
                textDecoration: "none",
                fontSize: 9,
                letterSpacing: "0.12em",
              }}
            >
              VIEW ALL →
            </Link>
          </div>

          {error && (
            <div
              style={{
                padding: "18px 22px",
                color: "#ff9aaa",
                fontSize: 11,
                borderBottom: "1px solid rgba(255,120,140,0.1)",
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && recentEvents.length === 0 && (
            <div
              style={{
                padding: "40px 22px",
                textAlign: "center",
                color: "rgba(190,200,225,0.35)",
                fontSize: 11,
              }}
            >
              No security events have been recorded yet.
              <br />
              Run an experiment or attack simulation to generate telemetry.
            </div>
          )}

          {loading && (
            <div
              style={{
                padding: "40px 22px",
                textAlign: "center",
                color: "rgba(190,200,225,0.35)",
                fontSize: 11,
              }}
            >
              Synchronizing security telemetry...
            </div>
          )}

          {!loading &&
            recentEvents.map((event, index) => {
              const type = getEventType(event);
              const threat = isThreat(event);
              const verified = isVerified(event);

              return (
                <div
                  key={
                    event.id ??
                    event.eventId ??
                    `${type}-${getEventTime(event)}-${index}`
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns: "110px 1fr 150px 90px",
                    alignItems: "center",
                    gap: 18,
                    padding: "15px 22px",
                    borderBottom:
                      index === recentEvents.length - 1
                        ? "none"
                        : "1px solid rgba(105,115,165,0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgba(180,195,225,0.32)",
                      fontFamily: "monospace",
                    }}
                  >
                    {formatTime(getEventTime(event))}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(225,232,250,0.75)",
                        marginBottom: 4,
                      }}
                    >
                      {formatEventType(type)}
                    </div>

                    <div
                      style={{
                        fontSize: 9,
                        color: "rgba(180,195,225,0.32)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {getEventMessage(event)}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 9,
                      color: threat
                        ? "#ff9aaa"
                        : verified
                          ? "#68e8ad"
                          : "rgba(190,200,225,0.42)",
                    }}
                  >
                    {threat
                      ? "THREAT"
                      : verified
                        ? "VERIFIED"
                        : "SECURITY EVENT"}
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      fontSize: 9,
                      color: "rgba(180,195,225,0.3)",
                    }}
                  >
                    {getLatency(event) !== null
                      ? `${getLatency(event)?.toFixed(2)} ms`
                      : "—"}
                  </div>
                </div>
              );
            })}
        </section>

        {/* FOOTER */}
        <footer
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 24,
            padding: "0 4px",
            color: "rgba(170,185,215,0.25)",
            fontSize: 8,
            letterSpacing: "0.12em",
          }}
        >
          <span>Q-SHIELD SECURITY ENGINE</span>

          <span>
            SOFTWARE SIMULATION · STATISTICAL VERIFICATION CORE · TELEMETRY
            ACTIVE
          </span>
        </footer>
      </section>
    </main>
  );
}