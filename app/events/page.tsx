"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type EventType =
  | "THREAT"
  | "VERIFIED"
  | "QUANTUM"
  | "SYSTEM";

type EventStatus =
  | "BLOCKED"
  | "ACCEPTED"
  | "MEASURED"
  | "ACTIVE";

type ApiEvent = {
  id?: string;
  type?: string;
  severity?: string;
  timestamp?: number;
  message?: string;
  sessionId?: string;
  signatureId?: string;
  signerId?: string;
  threatType?: string;
  riskScore?: number;
  metadata?: {
    experimentId?: string;
    latencyMs?: number;
    verificationAccepted?: boolean;
    deviation?: number;
    threshold?: number;
    mechanism?: string;
    evidence?: string[];
    decision?: string;
  };
};

type EventItem = {
  id: string;
  time: string;
  timestamp: number;
  type: EventType;
  title: string;
  description: string;
  metric: string;
  status: EventStatus;
  experimentId: string;
  mechanism?: string;
  evidence?: string[];
  threatType?: string;
  riskScore?: number;
};

const filters = [
  "ALL",
  "THREAT",
  "VERIFIED",
  "QUANTUM",
  "SYSTEM",
] as const;

function normalizeType(event: ApiEvent): EventType {
  const raw = String(event.type ?? "").toUpperCase();
  const threatType = String(
    event.threatType ?? "",
  ).toUpperCase();

  if (
    threatType &&
    threatType !== "NONE"
  ) {
    return "THREAT";
  }

  if (
    raw.includes("THREAT") ||
    raw.includes("ATTACK") ||
    raw.includes("FORGERY") ||
    raw.includes("REPLAY") ||
    raw.includes("IMPERSONATION") ||
    raw.includes("CHANNEL")
  ) {
    return "THREAT";
  }

  if (
    raw === "SIGNATURE_VERIFIED" ||
    raw === "VERIFICATION_ACCEPTED" ||
    raw === "VERIFIED"
  ) {
    return "VERIFIED";
  }

  if (
    raw.includes("QUANTUM") ||
    raw.includes("MEASUREMENT") ||
    raw.includes("TELEPORTATION")
  ) {
    return "QUANTUM";
  }

  return "SYSTEM";
}

function normalizeStatus(
  event: ApiEvent,
  type: EventType,
): EventStatus {
  if (
    type === "THREAT" &&
    event.threatType &&
    event.threatType !== "NONE"
  ) {
    return "BLOCKED";
  }

  if (
    event.metadata?.verificationAccepted === true
  ) {
    return "ACCEPTED";
  }

  if (
    event.metadata?.verificationAccepted === false
  ) {
    return "BLOCKED";
  }

  const decision = String(
    event.metadata?.decision ?? "",
  ).toUpperCase();

  if (
    decision.includes("REJECT") ||
    decision.includes("BLOCK") ||
    decision.includes("DENY")
  ) {
    return "BLOCKED";
  }

  if (
    decision.includes("ACCEPT") ||
    decision.includes("ALLOW")
  ) {
    return "ACCEPTED";
  }

  if (type === "THREAT") {
    return "BLOCKED";
  }

  if (type === "VERIFIED") {
    return "ACCEPTED";
  }

  if (type === "QUANTUM") {
    return "MEASURED";
  }

  return "ACTIVE";
}

function formatTime(timestamp?: number): string {
  if (
    timestamp === undefined ||
    timestamp === null
  ) {
    return "—";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString();
}

function normalizeEvidence(
  evidence?: string[],
): string[] {
  if (!Array.isArray(evidence)) {
    return [];
  }

  return evidence
    .filter(Boolean)
    .map(String);
}

function formatThreatName(
  threatType?: string,
): string {
  if (!threatType) {
    return "Security threat";
  }

  return threatType
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );
}

function normalizeEvent(
  event: ApiEvent,
  index: number,
): EventItem {
  const type = normalizeType(event);

  const status = normalizeStatus(
    event,
    type,
  );

  const metadata = event.metadata;

  const experimentId =
    metadata?.experimentId ??
    "UNASSIGNED";

  const mechanism =
    metadata?.mechanism ??
    (
      type === "VERIFIED"
        ? "STATISTICAL_VERIFICATION"
        : undefined
    );

  const evidence = normalizeEvidence(
    metadata?.evidence,
  );

  let title =
    "Security event recorded";

  if (type === "VERIFIED") {
    title =
      status === "ACCEPTED"
        ? "Quantum signature verified"
        : "Quantum signature rejected";
  }

  if (type === "THREAT") {
    title =
      `${formatThreatName(
        event.threatType,
      )} detected`;
  }

  if (type === "QUANTUM") {
    title =
      "Quantum measurement completed";
  }

  if (type === "SYSTEM") {
    title =
      "Security system event";
  }

  let metric =
    "Telemetry recorded";

  if (
    typeof metadata?.deviation ===
    "number"
  ) {
    metric =
      `${(
        metadata.deviation * 100
      ).toFixed(2)}% deviation`;

    if (
      typeof metadata.threshold ===
      "number"
    ) {
      metric +=
        ` / ${(
          metadata.threshold * 100
        ).toFixed(2)}% threshold`;
    }
  }

  if (
    type === "THREAT" &&
    typeof event.riskScore ===
      "number"
  ) {
    metric =
      `${(
        event.riskScore * 100
      ).toFixed(2)}% risk`;
  }

  if (
    metric === "Telemetry recorded" &&
    typeof metadata?.latencyMs ===
      "number"
  ) {
    metric =
      `${metadata.latencyMs.toFixed(
        2,
      )} ms simulator time`;
  }

  return {
    id:
      event.id ??
      `${experimentId}-${index}`,

    time: formatTime(
      event.timestamp,
    ),

    timestamp:
      event.timestamp ?? 0,

    type,

    title,

    description:
      event.message ??
      evidence[0] ??
      "Security telemetry recorded by the Q-SHIELD backend.",

    metric,

    status,

    experimentId,

    mechanism,

    evidence,

    threatType:
      event.threatType,

    riskScore:
      event.riskScore,
  };
}

async function fetchEvents(): Promise<
  EventItem[]
> {
  const response =
    await fetch(
      "/api/events?limit=100",
      {
        method: "GET",
        cache: "no-store",
      },
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.success
  ) {
    throw new Error(
      data.error ??
        "Unable to load security events.",
    );
  }

  const rawEvents: ApiEvent[] =
    Array.isArray(data.events)
      ? data.events
      : [];

  return rawEvents
    .map(normalizeEvent)
    .sort(
      (a, b) =>
        b.timestamp -
        a.timestamp,
    );
}

export default function EventsPage() {
  const [filter, setFilter] =
    useState<
      (typeof filters)[number]
    >("ALL");

  const [events, setEvents] =
    useState<EventItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadEvents =
    useCallback(
      async (
        showLoading = true,
      ) => {
        if (showLoading) {
          setLoading(true);
        }

        setError("");

        try {
          const nextEvents =
            await fetchEvents();

          setEvents(nextEvents);

          setLastUpdated(
            new Date(),
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load security events.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadEvents(true);
  }, [loadEvents]);

  const filteredEvents =
    useMemo(() => {
      if (filter === "ALL") {
        return events;
      }

      return events.filter(
        (event) =>
          event.type === filter,
      );
    }, [
      events,
      filter,
    ]);

  const threatsBlocked =
    events.filter(
      (event) =>
        event.type ===
          "THREAT" &&
        event.status ===
          "BLOCKED",
    ).length;

  const verifications =
    events.filter(
      (event) =>
        event.type ===
        "VERIFIED",
    ).length;

  const quantumEvents =
    events.filter(
      (event) =>
        event.type ===
        "QUANTUM",
    ).length;

  const latestEvent =
    events[0];

  const latestExperiment =
    latestEvent?.experimentId ??
    "—";

  return (
    <main className="events-page">
      <div className="events-grid-bg" />

      {/* SIDEBAR */}
      <aside className="events-sidebar">
        <Link
          href="/"
          className="events-brand"
        >
          <div className="events-brand-mark">
            <span />
            <span />
            <span />
          </div>

          <div>
            <strong>
              Q-SHIELD
            </strong>

            <small>
              QUANTUM SECURITY
            </small>
          </div>
        </Link>

        <div className="events-nav-label">
          PLATFORM
        </div>

        <nav className="events-nav">
          <Link href="/dashboard">
            <span>⌂</span>
            Overview
          </Link>

          <Link href="/quantum">
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

          <Link
            href="/events"
            className="active"
          >
            <span>≡</span>
            Events
          </Link>
        </nav>

        <div className="events-sidebar-bottom">
          <div className="events-engine">
            <div className="events-engine-dot" />

            <div>
              <strong>
                Quantum Engine
              </strong>

              <small>
                OPERATIONAL
              </small>
            </div>
          </div>

          <div className="events-version">
            Q-SHIELD // v0.1.0
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <section className="events-main">
        <header className="events-header">
          <div>
            <div className="events-eyebrow">
              <span />
              SECURITY EVENT STREAM
            </div>

            <h1>
              Security Events
            </h1>

            <p>
              Persistent security
              telemetry generated
              by the Q-SHIELD
              verification and
              threat detection
              engine.
            </p>
          </div>

          <div className="events-live">
            <span />

            {loading
              ? "SYNCING"
              : error
                ? "ERROR"
                : "LIVE TELEMETRY"}
          </div>
        </header>

        {/* REFRESH */}
        <section
          style={{
            display: "flex",
            justifyContent:
              "flex-end",
            alignItems:
              "center",
            gap: "16px",
            marginBottom:
              "24px",
            flexWrap: "wrap",
          }}
        >
          {lastUpdated && (
            <span
              style={{
                fontSize:
                  "11px",
                letterSpacing:
                  "0.08em",
                textTransform:
                  "uppercase",
                opacity: 0.45,
              }}
            >
              Updated{" "}
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            className="analysis-button"
            onClick={() =>
              loadEvents(true)
            }
            disabled={loading}
            style={{
              minWidth:
                "230px",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    display:
                      "inline-block",
                    marginRight:
                      "8px",
                    animation:
                      "qshield-spin 1s linear infinite",
                  }}
                >
                  ◌
                </span>

                Syncing Telemetry...
              </>
            ) : (
              <>
                ◌ Refresh Event Stream
              </>
            )}
          </button>
        </section>

        {/* ERROR */}
        {error && (
          <section
            className="analysis-result"
            style={{
              marginBottom:
                "24px",
            }}
          >
            <div className="result-symbol">
              !
            </div>

            <div>
              <span>
                EVENT ENGINE ERROR
              </span>

              <strong>
                Unable to load telemetry
              </strong>

              <p>
                {error}
              </p>
            </div>
          </section>
        )}

        {/* STATISTICS */}
        <section className="events-overview">
          <div className="event-stat">
            <span className="event-stat-icon">
              ◎
            </span>

            <div>
              <small>
                TOTAL EVENTS
              </small>

              <strong>
                {loading
                  ? "—"
                  : events.length}
              </strong>
            </div>
          </div>

          <div className="event-stat">
            <span className="event-stat-icon threat">
              ⚠
            </span>

            <div>
              <small>
                THREATS BLOCKED
              </small>

              <strong>
                {loading
                  ? "—"
                  : threatsBlocked}
              </strong>
            </div>
          </div>

          <div className="event-stat">
            <span className="event-stat-icon valid">
              ✓
            </span>

            <div>
              <small>
                VERIFICATIONS
              </small>

              <strong>
                {loading
                  ? "—"
                  : verifications}
              </strong>
            </div>
          </div>

          <div className="event-stat">
            <span className="event-stat-icon quantum">
              ◇
            </span>

            <div>
              <small>
                QUANTUM EVENTS
              </small>

              <strong>
                {loading
                  ? "—"
                  : quantumEvents}
              </strong>
            </div>
          </div>
        </section>

        {/* ACTIVITY */}
        <section className="events-panel">
          <div className="events-panel-top">
            <div>
              <span className="events-kicker">
                EVENT TELEMETRY
              </span>

              <h2>
                Activity Stream
              </h2>
            </div>

            <div className="events-filters">
              {filters.map(
                (item) => (
                  <button
                    key={item}
                    className={
                      filter === item
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setFilter(
                        item,
                      )
                    }
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* LATEST EXPERIMENT */}
          {latestEvent && (
            <div
              style={{
                marginBottom:
                  "18px",
                padding:
                  "14px 18px",
                border:
                  "1px solid rgba(85,220,255,.18)",
                borderRadius:
                  "12px",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "16px",
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <span
                  style={{
                    opacity:
                      0.55,
                    marginRight:
                      "8px",
                  }}
                >
                  Latest experiment:
                </span>

                <strong>
                  {
                    latestExperiment
                  }
                </strong>
              </div>

              <Link href="/analytics">
                OPEN ANALYTICS →
              </Link>
            </div>
          )}

          {/* EVENTS */}
          <div className="events-list">
            {filteredEvents.map(
              (event) => (
                <div
                  className="event-item"
                  key={event.id}
                >
                  <div className="event-time">
                    {event.time}
                  </div>

                  <div
                    className={`event-symbol ${event.type.toLowerCase()}`}
                  >
                    {event.type ===
                      "THREAT" &&
                      "⚠"}

                    {event.type ===
                      "VERIFIED" &&
                      "✓"}

                    {event.type ===
                      "QUANTUM" &&
                      "◇"}

                    {event.type ===
                      "SYSTEM" &&
                      "◈"}
                  </div>

                  <div className="event-content">
                    <div className="event-title-row">
                      <strong>
                        {
                          event.title
                        }
                      </strong>

                      <span
                        className={`event-status ${event.status.toLowerCase()}`}
                      >
                        {
                          event.status
                        }
                      </span>
                    </div>

                    <p>
                      {
                        event.description
                      }
                    </p>

                    <span className="event-metric">
                      {
                        event.metric
                      }

                      {event.mechanism &&
                        ` · ${event.mechanism}`}
                    </span>

                    {/* EVIDENCE */}
                    {event.evidence &&
                      event.evidence
                        .length >
                        0 && (
                        <small
                          style={{
                            display:
                              "block",
                            marginTop:
                              "8px",
                            opacity:
                              0.55,
                          }}
                        >
                          Evidence:{" "}
                          {event.evidence.join(
                            " · ",
                          )}
                        </small>
                      )}

                    {/* EXPERIMENT */}
                    <small
                      style={{
                        display:
                          "block",
                        marginTop:
                          "8px",
                        opacity:
                          0.55,
                      }}
                    >
                      Experiment{" "}
                      {
                        event.experimentId
                      }
                    </small>
                  </div>

                  <div className="event-arrow">
                    →
                  </div>
                </div>
              ),
            )}
          </div>

          {/* EMPTY STATE */}
          {!loading &&
            !filteredEvents.length && (
              <div className="events-empty">
                <span>
                  ◇
                </span>

                {events.length ===
                0
                  ? "No persistent security events have been recorded yet. Run a verification or attack experiment to populate the event stream."
                  : "No events found for this filter."}
              </div>
            )}
        </section>

        {/* FOOTER */}
        <footer className="events-footer">
          <span>
            Q-SHIELD EVENT ENGINE
          </span>

          <span>
            PERSISTENT EXPERIMENT TELEMETRY
          </span>

          <span>
            STREAM STATUS:{" "}
            {loading
              ? "SYNCING"
              : error
                ? "ERROR"
                : events.length
                  ? "ACTIVE"
                  : "WAITING"}
          </span>
        </footer>
      </section>

      <style jsx global>{`
        @keyframes qshield-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}