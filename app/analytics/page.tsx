"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Verification = {
  accepted: boolean;
  threshold: number;
  deviation: number;
  confidence?: number;
};

type Attack = {
  attackType: string;
  detected: boolean;
  riskScore: number;
  message: string;
  mechanism?: string;
  evidence?: string[];
  decision?: string;
  intensity?: number;
  experiment?: {
    latencyMs?: number;
    verification?: Verification;
    threat?: {
      detected?: boolean;
      riskScore?: number;
    };
  };
};

type StoredRun = {
  cycleId: string;
  createdAt: number;
  seed: number;
  experimentId: string;
  latencyMs: number;
  verification: Verification;
  attacks: Attack[];
};

type AnalyticsData = {
  runs: StoredRun[];
  attackRows: {
    name: string;
    detected: number;
    risk: number;
  }[];
  detectionRate: number;
  falseAcceptanceRate: number;
  falseRejectionRate: number;
  averageLatency: number;
  accepted: number;
  rejected: number;
  cleanDeviation: number;
  threshold: number;
};

const STORAGE_KEY = "qshield:experiment-runs";

const attackDefinitions = [
  {
    name: "Signature Forgery",
    type: "FORGERY",
  },
  {
    name: "Impersonation",
    type: "IMPERSONATION",
  },
  {
    name: "Replay Attack",
    type: "REPLAY",
  },
  {
    name: "Quantum Channel",
    type: "CHANNEL_MANIPULATION",
  },
];

function readRuns(): StoredRun[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]",
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function saveRun(run: StoredRun) {
  const existing = readRuns().filter(
    (item) =>
      item.cycleId !== run.cycleId,
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      [run, ...existing].slice(0, 100),
    ),
  );
}

function buildAnalytics(
  runs: StoredRun[],
): AnalyticsData | null {
  if (!runs.length) {
    return null;
  }

  const acceptedRuns = runs.filter(
    (run) => run.verification.accepted,
  ).length;

  const rejectedRuns =
    runs.length - acceptedRuns;

  const attacks = runs.flatMap(
    (run) => run.attacks,
  );

  const detected = attacks.filter(
    (attack) => attack.detected,
  ).length;

  const falseAccepts =
    attacks.length - detected;

  const falseRejects = runs.filter(
    (run) =>
      !run.verification.accepted,
  ).length;

  const latency = runs
    .map((run) => run.latencyMs)
    .filter(
      (value) =>
        Number.isFinite(value) &&
        value > 0,
    );

  return {
    runs,

    attackRows:
      attackDefinitions.map(
        (definition) => {
          const matching =
            attacks.filter(
              (attack) =>
                attack.attackType ===
                definition.type,
            );

          return {
            name: definition.name,

            detected: matching.length
              ? (matching.filter(
                  (attack) =>
                    attack.detected,
                ).length /
                  matching.length) *
                100
              : 0,

            risk: matching.length
              ? (matching.reduce(
                  (sum, attack) =>
                    sum +
                    attack.riskScore,
                  0,
                ) /
                  matching.length) *
                100
              : 0,
          };
        },
      ),

    detectionRate: attacks.length
      ? (detected / attacks.length) *
        100
      : 0,

    falseAcceptanceRate:
      attacks.length
        ? (falseAccepts /
            attacks.length) *
          100
        : 0,

    falseRejectionRate:
      runs.length
        ? (falseRejects /
            runs.length) *
          100
        : 0,

    averageLatency: latency.length
      ? latency.reduce(
          (a, b) => a + b,
          0,
        ) / latency.length
      : 0,

    accepted: acceptedRuns,
    rejected: rejectedRuns,

    cleanDeviation:
      runs[0].verification.deviation,

    threshold:
      runs[0].verification.threshold,
  };
}

async function postJson(
  url: string,
  body: unknown,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (
    !response.ok ||
    !data.success
  ) {
    throw new Error(
      data.error ||
        `${url} failed.`,
    );
  }

  return data;
}

export default function AnalyticsPage() {
  const [windowName, setWindowName] =
    useState("24H");

  const [running, setRunning] =
    useState(false);

  const [runs, setRuns] =
    useState<StoredRun[]>([]);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setRuns(readRuns());
  }, []);

  const filteredRuns =
    useMemo(() => {
      const limits: Record<
        string,
        number
      > = {
        "1H":
          60 * 60 * 1000,

        "24H":
          24 *
          60 *
          60 *
          1000,

        "7D":
          7 *
          24 *
          60 *
          60 *
          1000,
      };

      const cutoff =
        Date.now() -
        limits[windowName];

      return runs.filter(
        (run) =>
          run.createdAt >= cutoff,
      );
    }, [runs, windowName]);

  const analytics = useMemo(
    () =>
      buildAnalytics(
        filteredRuns,
      ),
    [filteredRuns],
  );

  const runAnalytics = async () => {
    setRunning(true);
    setError("");

    try {
      const seed =
        Date.now() %
        2147483647;

      const timestamp =
        Date.now();

      const phase =
        ((seed % 100) / 100) *
        0.35;

      const alpha = Math.cos(
        Math.PI / 5 + phase,
      );

      const beta = Math.sin(
        Math.PI / 5 + phase,
      );

      const cycleId =
        `QSHIELD-${timestamp}`;

      const cleanId =
        `${cycleId}-BASELINE`;

      const cleanData =
        await postJson(
          "/api/security/experiment",
          {
            experimentId: cleanId,

            sessionId:
              `${cycleId}-SESSION`,

            signatureId:
              `${cycleId}-SIG`,

            signerId:
              "Q-SHIELD-DEMO-SIGNER",

            message:
              "Q-SHIELD SECURITY ANALYTICS",

            nonce:
              `${cycleId}-NONCE`,

            alpha,
            beta,

            shots: 1000,

            threshold: 0.05,

            seed,

            noise: {
              model: "NONE",
              probability: 0,
            },

            expectedSignerId:
              "Q-SHIELD-DEMO-SIGNER",

            expectedMessage:
              "Q-SHIELD SECURITY ANALYTICS",

            unauthorizedVerification:
              false,
          },
        );

      const attackResults: Attack[] =
        [];

      for (
        let i = 0;
        i <
        attackDefinitions.length;
        i++
      ) {
        const definition =
          attackDefinitions[i];

        const intensity = Math.min(
          1,
          0.35 +
            (((seed +
              i * 173) %
              61) /
              100),
        );

        const data =
          await postJson(
            "/api/security/attack",
            {
              experiment: {
  experimentId:
    `${cycleId}-${definition.type}`,

  sessionId:
    `${cycleId}-ATTACK-SESSION-${i}`,

  signatureId:
    `${cycleId}-ATTACK-SIG-${i}`,

  // For impersonation, simulate an attacker claiming a
  // different identity. Other attacks keep the legitimate signer.
  signerId:
    definition.type === "IMPERSONATION"
      ? "Q-SHIELD-DEMO-IMPOSTOR"
      : "Q-SHIELD-DEMO-SIGNER",

  // Trusted identity used by the impersonation detector.
  expectedSignerId:
    "Q-SHIELD-DEMO-SIGNER",

  message:
    "Q-SHIELD SECURITY ANALYTICS ATTACK",

  nonce:
    `${cycleId}-ATTACK-NONCE-${i}`,

  alpha,

  beta,

  shots: 1000,

  threshold: 0.05,

  seed:
    seed + i + 1,

  noise: {
    model: "NONE",
    probability: 0,
  },
},

              attack: {
                type:
                  definition.type,
                intensity,
              },
            },
          );

        attackResults.push(
          data.attack,
        );
      }

      const experiment =
        cleanData.experiment;

      const run: StoredRun = {
        cycleId,

        createdAt:
          Date.now(),

        seed,

        experimentId:
          experiment.experimentId,

        latencyMs:
          experiment.latencyMs,

        verification:
          experiment.quantum
            .verification,

        attacks:
          attackResults,
      };

      saveRun(run);

      setRuns(readRuns());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Analytics execution failed.",
      );
    } finally {
      setRunning(false);
    }
  };

  const clearTelemetry = () => {
    localStorage.removeItem(
      STORAGE_KEY,
    );

    setRuns([]);
    setError("");
  };

  const currentAccuracy =
    analytics?.detectionRate ?? 0;

  const acceptedPercentage =
    analytics
      ? (analytics.accepted /
          analytics.runs.length) *
        100
      : 0;

  const rejectedPercentage =
    analytics
      ? (analytics.rejected /
          analytics.runs.length) *
        100
      : 0;

  const latest =
    filteredRuns[0];

  const chartValues = analytics
    ? [
        analytics.accepted > 0
          ? 100
          : 0,

        ...analytics.attackRows.map(
          (attack) =>
            Math.max(
              0,
              100 - attack.risk,
            ),
        ),
      ]
    : [];

  const points =
    chartValues.map(
      (value, index) => ({
        x:
          chartValues.length <= 1
            ? 0
            : (index /
                (chartValues.length -
                  1)) *
              700,

        y:
          260 -
          (value / 100) *
            260,
      }),
    );

  const linePath =
    points
      .map(
        (point, index) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x} ${point.y}`,
      )
      .join(" ");

  return (
    <main className="analytics-page">
      <div className="analytics-grid-bg" />

      {/* SIDEBAR */}
      <aside className="analytics-sidebar">
        <Link
          href="/"
          className="analytics-brand"
        >
          <div className="analytics-brand-mark">
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

        <div className="analytics-nav-label">
          PLATFORM
        </div>

        <nav className="analytics-nav">
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

          <Link
            href="/analytics"
            className="active"
          >
            <span>◌</span>
            Analytics
          </Link>

          <Link href="/events">
            <span>≡</span>
            Events
          </Link>
        </nav>

        <div className="analytics-sidebar-bottom">
          <div className="analytics-engine">
            <div className="engine-dot" />

            <div>
              <strong>
                Quantum Engine
              </strong>

              <small>
                OPERATIONAL
              </small>
            </div>
          </div>

          <div className="analytics-version">
            Q-SHIELD // v0.1.0
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <section className="analytics-main">
        <header className="analytics-header">
          <div>
            <div className="analytics-eyebrow">
              <span />
              SECURITY TELEMETRY
            </div>

            <h1>
              Security Analytics
            </h1>

            <p>
              Controlled software
              evaluation of Q-SHIELD
              security behavior using
              simulated quantum
              measurements, attack
              models, and statistical
              verification.
            </p>
          </div>

          <div className="analytics-window">
            {[
              "1H",
              "24H",
              "7D",
            ].map((item) => (
              <button
                key={item}
                className={
                  windowName === item
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setWindowName(
                    item,
                  )
                }
              >
                {item}
              </button>
            ))}
          </div>
        </header>

        {/* STATUS */}
        <div className="analytics-status">
          <div>
            <span className="status-pulse" />

            {running
              ? "RUNNING MODELED EVALUATION"
              : "PERSISTED EVALUATION TELEMETRY"}
          </div>

          <div className="status-divider" />

          <span>
            {analytics
              ? `${filteredRuns.length} experiment cycles in window`
              : "No experiment cycles yet"}
          </span>

          <span>•</span>

          <span>
            {latest
              ? `Latest ${latest.cycleId}`
              : "Awaiting data"}
          </span>
        </div>

        {/* FIX 2 — MODELED EVALUATION NOTICE */}
        <section
          style={{
            marginBottom:
              "24px",

            padding:
              "16px 20px",

            border:
              "1px solid rgba(120, 150, 255, 0.18)",

            borderRadius:
              "12px",

            background:
              "rgba(20, 25, 55, 0.28)",

            display:
              "flex",

            alignItems:
              "flex-start",

            gap:
              "14px",
          }}
        >
          <div
            style={{
              fontSize:
                "18px",

              lineHeight:
                1,

              marginTop:
                "2px",
            }}
          >
            ◇
          </div>

          <div>
            <strong
              style={{
                display:
                  "block",

                fontSize:
                  "12px",

                letterSpacing:
                  "0.12em",

                textTransform:
                  "uppercase",

                marginBottom:
                  "6px",
              }}
            >
              MODELED SECURITY
              EVALUATION
            </strong>

            <p
              style={{
                margin:
                  0,

                fontSize:
                  "13px",

                lineHeight:
                  1.6,

                opacity:
                  0.65,
              }}
            >
              Results on this page
              come from controlled
              Q-SHIELD software
              experiments. Attack
              detection, statistical
              verification, and
              quantum-channel behavior
              are modeled and
              simulated; these results
              are not measurements from
              physical quantum hardware
              or production network
              traffic.
            </p>
          </div>
        </section>

        {/* CONTROLS */}
        <section
          style={{
            marginBottom:
              "24px",

            display:
              "flex",

            justifyContent:
              "flex-end",

            gap:
              "12px",
          }}
        >
          <button
            className="analysis-button"
            onClick={
              clearTelemetry
            }
            disabled={
              running ||
              !runs.length
            }
          >
            Clear Local Telemetry
          </button>

          <button
            className="analysis-button"
            onClick={
              runAnalytics
            }
            disabled={running}
          >
            {running
              ? "Running Modeled Evaluation..."
              : "◌ Run New Evaluation"}
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
                ANALYTICS ERROR
              </span>

              <strong>
                Analysis failed
              </strong>

              <p>
                {error}
              </p>
            </div>
          </section>
        )}

        {/* METRICS */}
        <section className="analytics-metrics">
          {[
            [
              "✓",
              analytics
                ? `${analytics.falseAcceptanceRate.toFixed(2)}%`
                : "—",
              "False Acceptance Rate",
              "Attack runs incorrectly accepted",
            ],

            [
              "×",
              analytics
                ? `${analytics.falseRejectionRate.toFixed(2)}%`
                : "—",
              "False Rejection Rate",
              "Baseline runs rejected",
            ],

            [
              "◎",
              analytics
                ? `${analytics.detectionRate.toFixed(1)}%`
                : "—",
              "Detection Rate",
              "Modeled threats detected",
            ],

            [
              "◷",
              analytics
                ? `${analytics.averageLatency.toFixed(2)} ms`
                : "—",
              "Avg Simulator Time",
              "Security engine execution",
            ],
          ].map(
            ([
              icon,
              value,
              label,
              detail,
            ]) => (
              <div
                className="analytics-metric-card"
                key={label}
              >
                <div className="metric-card-top">
                  <div className="metric-icon">
                    {icon}
                  </div>

                  <span className="metric-change">
                    MODELED
                  </span>
                </div>

                <div className="metric-value">
                  {value}
                </div>

                <div className="metric-label">
                  {label}
                </div>

                <div className="metric-detail">
                  {detail}
                </div>
              </div>
            ),
          )}
        </section>

        {/* PRIMARY */}
        <section className="analytics-primary-grid">
          <div className="analytics-panel performance-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  THREAT RESPONSE
                </span>

                <h2>
                  Security Response
                </h2>
              </div>

              <div className="panel-live">
                <span />
                MODELED DATA
              </div>
            </div>

            <div className="accuracy-chart">
              <div className="chart-y-axis">
                <span>
                  100%
                </span>

                <span>
                  75%
                </span>

                <span>
                  50%
                </span>

                <span>
                  25%
                </span>

                <span>
                  0%
                </span>
              </div>

              <div className="chart-area">
                <div className="chart-lines">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>

                {analytics ? (
                  <>
                    <svg
                      className="accuracy-line"
                      viewBox="0 0 700 260"
                      preserveAspectRatio="none"
                    >
                      <path
                        className="chart-fill"
                        d={`${linePath} L 700 260 L 0 260 Z`}
                      />

                      <path
                        className="chart-path"
                        d={linePath}
                      />

                      {points.map(
                        (
                          point,
                          index,
                        ) => (
                          <circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r="5"
                            className="chart-point"
                          />
                        ),
                      )}
                    </svg>

                    <div className="chart-x-axis">
                      <span>
                        BASELINE
                      </span>

                      <span>
                        FORGERY
                      </span>

                      <span>
                        IMPERSONATION
                      </span>

                      <span>
                        REPLAY
                      </span>

                      <span>
                        CHANNEL
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg
                      className="accuracy-line"
                      viewBox="0 0 700 260"
                      preserveAspectRatio="none"
                    >
                      <path
                        className="chart-fill"
                        d="M0 260 L700 260"
                      />

                      <path
                        className="chart-path"
                        d="M0 260 L700 260"
                      />
                    </svg>

                    <div className="chart-x-axis">
                      <span>
                        BASELINE
                      </span>

                      <span>
                        FORGERY
                      </span>

                      <span>
                        IMPERSONATION
                      </span>

                      <span>
                        REPLAY
                      </span>

                      <span>
                        CHANNEL
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="chart-summary">
              <div>
                <span>
                  Detection
                </span>

                <strong>
                  {analytics
                    ? `${currentAccuracy.toFixed(1)}%`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>
                  Threshold
                </span>

                <strong>
                  {analytics
                    ? `${(
                        analytics.threshold *
                        100
                      ).toFixed(2)}%`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>
                  Latest deviation
                </span>

                <strong>
                  {analytics
                    ? `${(
                        analytics.cleanDeviation *
                        100
                      ).toFixed(2)}%`
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          {/* DISTRIBUTION */}
          <div className="analytics-panel distribution-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  DECISION DISTRIBUTION
                </span>

                <h2>
                  Verification Outcomes
                </h2>
              </div>
            </div>

            <div className="donut-wrapper">
              <div className="donut">
                <div className="donut-inner">
                  <strong>
                    {analytics
                      ? analytics.runs.length
                      : "—"}
                  </strong>

                  <span>
                    RUNS
                  </span>
                </div>
              </div>
            </div>

            <div className="distribution-list">
              <div>
                <span className="legend-dot valid" />

                <label>
                  Accepted
                </label>

                <strong>
                  {analytics
                    ? `${acceptedPercentage.toFixed(1)}%`
                    : "—"}
                </strong>
              </div>

              <div>
                <span className="legend-dot rejected" />

                <label>
                  Rejected
                </label>

                <strong>
                  {analytics
                    ? `${rejectedPercentage.toFixed(1)}%`
                    : "—"}
                </strong>
              </div>

              <div>
                <span className="legend-dot review" />

                <label>
                  Threat runs
                </label>

                <strong>
                  {analytics
                    ? analytics.runs.reduce(
                        (
                          sum,
                          run,
                        ) =>
                          sum +
                          run.attacks
                            .length,
                        0,
                      )
                    : "—"}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* SECONDARY */}
        <section className="analytics-secondary-grid">
          <div className="analytics-panel attack-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  THREAT BENCHMARK
                </span>

                <h2>
                  Attack Detection
                </h2>
              </div>

              <span className="benchmark-label">
                MODELED
              </span>
            </div>

            <div className="attack-list">
              {(
                analytics?.attackRows ??
                attackDefinitions.map(
                  (attack) => ({
                    name: attack.name,
                    detected: 0,
                    risk: 0,
                  }),
                )
              ).map((attack) => (
                <div
                  className="attack-row"
                  key={attack.name}
                >
                  <div className="attack-name">
                    <span>
                      {attack.name}
                    </span>

                    <small>
                      {analytics
                        ? `${attack.detected.toFixed(
                            0,
                          )}% detected`
                        : "Not analyzed"}
                    </small>
                  </div>

                  <div className="attack-bar">
                    <div
                      style={{
                        width: `${attack.detected}%`,
                      }}
                    />
                  </div>

                  <strong>
                    {analytics
                      ? `${attack.detected.toFixed(
                          0,
                        )}%`
                      : "—"}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* RISK */}
          <div className="analytics-panel noise-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">
                  MODELED THREAT RISK
                </span>

                <h2>
                  Risk by Mechanism
                </h2>
              </div>

              <span className="noise-unit">
                RISK
              </span>
            </div>

            <div className="noise-chart">
              {analytics
                ? analytics.attackRows.map(
                    (attack) => (
                      <div
                        className="noise-column"
                        key={
                          attack.name
                        }
                      >
                        <div
                          className="noise-bar"
                          style={{
                            height: `${
                              Math.max(
                                5,
                                attack.risk,
                              ) *
                              0.72
                            }%`,
                          }}
                        >
                          <span>
                            {attack.risk.toFixed(
                              0,
                            )}
                            %
                          </span>
                        </div>

                        <small>
                          {
                            attack.name.split(
                              " ",
                            )[0]
                          }
                        </small>
                      </div>
                    ),
                  )
                : attackDefinitions.map(
                    (attack) => (
                      <div
                        className="noise-column"
                        key={attack.type}
                      >
                        <div
                          className="noise-bar"
                          style={{
                            height:
                              "8%",
                          }}
                        >
                          <span>
                            —
                          </span>
                        </div>

                        <small>
                          WAIT
                        </small>
                      </div>
                    ),
                  )}
            </div>
          </div>
        </section>

        {/* HISTORY */}
        <section className="analytics-panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">
                EXPERIMENT HISTORY
              </span>

              <h2>
                Recent Security Cycles
              </h2>
            </div>

            <Link href="/events">
              VIEW EVENTS →
            </Link>
          </div>

          <div className="activity-table">
            <div className="activity-head">
              <span>
                CYCLE
              </span>

              <span>
                EXPERIMENT
              </span>

              <span>
                DECISION
              </span>

              <span>
                MEASURE
              </span>
            </div>

            {filteredRuns
              .slice(0, 10)
              .map((run) => (
                <div
                  className="activity-row"
                  key={
                    run.cycleId
                  }
                >
                  <span className="activity-time">
                    {new Date(
                      run.createdAt,
                    ).toLocaleTimeString()}
                  </span>

                  <span>
                    {
                      run.experimentId
                    }
                  </span>

                  <span
                    className={`activity-type ${
                      run.verification
                        .accepted
                        ? "system"
                        : "threat"
                    }`}
                  >
                    {run.verification
                      .accepted
                      ? "ACCEPT"
                      : "REJECT"}
                  </span>

                  <strong>
                    {(
                      run
                        .verification
                        .deviation *
                      100
                    ).toFixed(2)}
                    % dev.
                  </strong>
                </div>
              ))}

            {!filteredRuns.length && (
              <div className="activity-row">
                <span className="activity-time">
                  —
                </span>

                <span>
                  Run a new modeled
                  evaluation to create
                  shared telemetry.
                </span>

                <span className="activity-type system">
                  WAITING
                </span>

                <strong>
                  —
                </strong>
              </div>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="analytics-footer">
          <span>
            Q-SHIELD ANALYTICS ENGINE
          </span>

          <span>
            MODELED SECURITY EVALUATION
          </span>

          <span>
            WINDOW: {windowName}
          </span>
        </footer>
      </section>
    </main>
  );
}