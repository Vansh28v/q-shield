"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Stage =
  | "SIGN"
  | "ENTANGLE"
  | "TELEPORT"
  | "CORRECT"
  | "MEASURE"
  | "VERIFY"
  | "DECISION";

type AttackType =
  | "FORGERY"
  | "IMPERSONATION"
  | "REPLAY"
  | "CHANNEL_MANIPULATION";

type DemoExperiment = Record<string, unknown>;
type DemoAttack = Record<string, unknown>;
type ExperimentConfig = Record<string, unknown>;

interface ExperimentResponse {
  success: boolean;
  experiment?: DemoExperiment;
  event?: Record<string, unknown>;
  telemetry?: Record<string, unknown>;
  error?: string;
}

interface AttackResponse {
  success: boolean;
  attack?: DemoAttack;
  error?: string;
}

const stages: {
  id: Stage;
  number: string;
  label: string;
  description: string;
}[] = [
  {
    id: "SIGN",
    number: "01",
    label: "SIGN",
    description: "Create quantum signature",
  },
  {
    id: "ENTANGLE",
    number: "02",
    label: "ENTANGLE",
    description: "Establish Bell state",
  },
  {
    id: "TELEPORT",
    number: "03",
    label: "TELEPORT",
    description: "Transmit signature state",
  },
  {
    id: "CORRECT",
    number: "04",
    label: "CORRECT",
    description: "Apply Pauli correction",
  },
  {
    id: "MEASURE",
    number: "05",
    label: "MEASURE",
    description: "Projective measurement",
  },
  {
    id: "VERIFY",
    number: "06",
    label: "VERIFY",
    description: "Statistical verification",
  },
  {
    id: "DECISION",
    number: "07",
    label: "DECISION",
    description: "Security decision",
  },
];

const attacks: {
  id: AttackType;
  label: string;
  description: string;
}[] = [
  {
    id: "FORGERY",
    label: "FORGERY",
    description: "Altered signature state",
  },
  {
    id: "REPLAY",
    label: "REPLAY",
    description: "Previously accepted transcript",
  },
  {
    id: "CHANNEL_MANIPULATION",
    label: "CHANNEL",
    description: "Quantum channel disturbance",
  },
  {
    id: "IMPERSONATION",
    label: "IMPERSONATION",
    description: "Unauthorized signer",
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getString(
  object: unknown,
  key: string,
  fallback = "—",
): string {
  const value = asRecord(object)[key];

  return typeof value === "string" ? value : fallback;
}

function getNumber(
  object: unknown,
  key: string,
): number | null {
  const value = asRecord(object)[key];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function getBoolean(
  object: unknown,
  key: string,
): boolean | null {
  const value = asRecord(object)[key];

  return typeof value === "boolean" ? value : null;
}

function getObject(
  object: unknown,
  key: string,
): Record<string, unknown> {
  return asRecord(asRecord(object)[key]);
}

function formatPercent(
  value: number | null,
): string {
  if (value === null) {
    return "—";
  }

  const normalized = value <= 1 ? value * 100 : value;

  return `${normalized.toFixed(2)}%`;
}

function formatNumber(
  value: number | null,
  digits = 3,
): string {
  return value === null ? "—" : value.toFixed(digits);
}

function getStageContent(stage: Stage) {
  switch (stage) {
    case "SIGN":
      return {
        title: "Quantum Signature",
        text:
          "A signature state is prepared for the message and signer identity.",
        symbol: "⟨ψ|",
      };

    case "ENTANGLE":
      return {
        title: "Bell-State Entanglement",
        text:
          "The verification path establishes an entangled Bell pair before teleportation.",
        symbol: "Φ⁺",
      };

    case "TELEPORT":
      return {
        title: "Quantum Teleportation",
        text:
          "The signature state is transferred through the simulated teleportation protocol.",
        symbol: "→",
      };

    case "CORRECT":
      return {
        title: "Pauli Correction",
        text:
          "Classical Bell-measurement outcomes determine the required Pauli correction.",
        symbol: "X · Z",
      };

    case "MEASURE":
      return {
        title: "Projective Measurement",
        text:
          "The corrected state is measured and the resulting outcomes become the statistical evidence.",
        symbol: "M",
      };

    case "VERIFY":
      return {
        title: "Statistical Verification",
        text:
          "Observed deviation is compared against the configured verification threshold.",
        symbol: "Σ",
      };

    case "DECISION":
      return {
        title: "Security Decision",
        text:
          "The Q-SHIELD statistical verifier produces the authoritative verification result.",
        symbol: "✓",
      };
  }
}

export default function DemoPage() {
  const [stage, setStage] = useState<Stage>("SIGN");

  const [experiment, setExperiment] =
    useState<DemoExperiment | null>(null);

  /*
   * IMPORTANT:
   * This stores the ORIGINAL QDSExperimentConfig.
   *
   * /api/security/attack expects:
   *
   * {
   *   experiment: QDSExperimentConfig,
   *   attack: AttackConfig
   * }
   *
   * It must NOT receive the complete SecurityExperimentResult.
   */
  const [experimentConfig, setExperimentConfig] =
    useState<ExperimentConfig | null>(null);

  const [attackResult, setAttackResult] =
    useState<DemoAttack | null>(null);

  const [activeAttack, setActiveAttack] =
    useState<AttackType | null>(null);

  const [loading, setLoading] = useState(false);

  const [attackLoading, setAttackLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [seed, setSeed] =
    useState<number | null>(null);

  const experimentId = useMemo(
    () =>
      experiment
        ? getString(experiment, "experimentId")
        : "—",
    [experiment],
  );

  /*
   * SecurityExperimentResult
   *
   * quantum
   * ├── measurement
   * ├── statistics
   * ├── verification
   * └── chsh
   */
  const quantum = experiment
    ? getObject(experiment, "quantum")
    : {};

  const measurement = getObject(
    quantum,
    "measurement",
  );

  const statistics = getObject(
    quantum,
    "statistics",
  );

  const quantumVerification = getObject(
    quantum,
    "verification",
  );

  const chsh = getObject(
    quantum,
    "chsh",
  );

  const signatureVerification = experiment
    ? getObject(
        experiment,
        "signatureVerification",
      )
    : {};

  const replay = experiment
    ? getObject(experiment, "replay")
    : {};

  const threat = experiment
    ? getObject(experiment, "threat")
    : {};

  const telemetry = experiment
    ? getObject(experiment, "telemetry")
    : {};

  /*
   * Authoritative verification result.
   *
   * SecurityExperimentResult.signatureVerification.valid
   * is the signature-level result.
   *
   * quantum.verification.accepted is the
   * statistical quantum verification result.
   */
  const accepted =
    getBoolean(
      quantumVerification,
      "accepted",
    ) ??
    getBoolean(
      quantumVerification,
      "valid",
    ) ??
    getBoolean(
      signatureVerification,
      "valid",
    ) ??
    getBoolean(
      signatureVerification,
      "accepted",
    );

  /*
   * statistics.ts returns:
   *
   * observedErrorRate
   * hoeffdingMargin
   * wilsonInterval
   *
   * It does NOT return threshold.
   *
   * The actual threshold is the original
   * experiment configuration threshold.
   */
  const observedDeviation =
    getNumber(
      statistics,
      "observedErrorRate",
    ) ??
    getNumber(
      statistics,
      "totalVariationDistance",
    ) ??
    getNumber(
      statistics,
      "maxDeviation",
    );

  const threshold =
    experimentConfig
      ? getNumber(
          experimentConfig,
          "threshold",
        )
      : null;

  /*
   * CHSH is returned by runQDSExperiment()
   * inside quantum.chsh.
   */
  const chshScore = getNumber(
    chsh,
    "S",
  );

  const latency = experiment
    ? getNumber(
        experiment,
        "latencyMs",
      )
    : null;

  const decision =
    accepted === true
      ? "ACCEPT"
      : accepted === false
        ? "REJECT"
        : "—";

  const attackDetected =
    attackResult
      ? getBoolean(
          attackResult,
          "detected",
        )
      : null;

  const attackRisk =
    attackResult
      ? getNumber(
          attackResult,
          "riskScore",
        )
      : null;

  const attackMechanism =
    attackResult
      ? getString(
          attackResult,
          "mechanism",
          "—",
        )
      : "—";

  const attackEvidence =
    attackResult
      ? getString(
          attackResult,
          "evidence",
          getString(
            attackResult,
            "message",
            "—",
          ),
        )
      : "—";

  const attackDecision =
    attackResult
      ? getString(
          attackResult,
          "decision",
          attackDetected
            ? "REJECT"
            : "ACCEPT",
        )
      : "—";

  /*
   * MeasurementStatistics contains:
   *
   * results: [
   *   {
   *     outcome,
   *     count,
   *     probability
   *   }
   * ]
   *
   * Display the real measured distribution.
   */
  const measurementResults =
    Array.isArray(
      asRecord(measurement).results,
    )
      ? (
          asRecord(measurement)
            .results as unknown[]
        )
      : [];

  const measurementSummary =
    measurementResults.length > 0
      ? measurementResults
          .map((item) => {
            const result =
              asRecord(item);

            const outcome =
              getString(
                result,
                "outcome",
                "?",
              );

            const count =
              getNumber(
                result,
                "count",
              );

            return `${outcome}: ${
              count === null
                ? "—"
                : Math.round(count)
            }`;
          })
          .join(" · ")
      : "—";

  async function runExperiment() {
    setLoading(true);
    setError("");
    setAttackResult(null);
    setActiveAttack(null);
    setStage("SIGN");

    const generatedSeed = Math.floor(
      Date.now() % 2147483647,
    );

    setSeed(generatedSeed);

    const suffix =
      generatedSeed.toString(36);

    const config: ExperimentConfig = {
      experimentId:
        `DEMO-${Date.now()}`,

      sessionId:
        `SESSION-DEMO-${suffix}`,

      signatureId:
        `SIG-DEMO-${suffix}`,

      signerId:
        "Q-SHIELD-DEMO-SIGNER",

      message:
        "Q-SHIELD live demonstration",

      nonce:
        `NONCE-${suffix}`,

      alpha: 1,

      beta: 0,

      shots: 1000,

      /*
       * Statistical verification threshold.
       *
       * 0.1 = 10%
       */
      threshold: 0.1,

      seed: generatedSeed,
    };

    /*
     * Preserve the original configuration.
     * Attack simulations use this later.
     */
    setExperimentConfig(config);

    try {
      const response =
        await fetch(
          "/api/security/experiment",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(config),
          },
        );

      const data =
        (await response.json()) as ExperimentResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.experiment
      ) {
        throw new Error(
          data.error ??
            "Security experiment failed.",
        );
      }

      setExperiment(
        data.experiment,
      );

      /*
       * Walk through the QDS protocol stages.
       */
      setStage("ENTANGLE");

      window.setTimeout(
        () => setStage("TELEPORT"),
        350,
      );

      window.setTimeout(
        () => setStage("CORRECT"),
        700,
      );

      window.setTimeout(
        () => setStage("MEASURE"),
        1050,
      );

      window.setTimeout(
        () => setStage("VERIFY"),
        1400,
      );

      window.setTimeout(
        () => setStage("DECISION"),
        1750,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to run experiment.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAttack(
    attackType: AttackType,
  ) {
    if (
      !experiment ||
      !experimentConfig
    ) {
      setError(
        "Run a legitimate verification first.",
      );

      return;
    }

    setAttackLoading(true);
    setError("");
    setActiveAttack(attackType);
    setAttackResult(null);

    /*
     * Controlled attack intensities.
     *
     * These are inputs to the attack simulator,
     * not hardcoded attack results.
     */
    const intensity =
      attackType === "REPLAY"
        ? 1
        : attackType ===
            "CHANNEL_MANIPULATION"
          ? 0.8
          : attackType ===
              "IMPERSONATION"
            ? 0.9
            : 0.65;

    try {
      const response =
        await fetch(
          "/api/security/attack",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              /*
               * CRITICAL:
               *
               * Send the original QDS configuration.
               */
              experiment:
                experimentConfig,

              attack: {
                type: attackType,
                intensity,
              },
            }),
          },
        );

      const data =
        (await response.json()) as AttackResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.attack
      ) {
        throw new Error(
          data.error ??
            "Attack simulation failed.",
        );
      }

      setAttackResult(
        data.attack,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to simulate attack.",
      );
    } finally {
      setAttackLoading(false);
    }
  }

  function clearDemo() {
    setExperiment(null);
    setExperimentConfig(null);
    setAttackResult(null);
    setActiveAttack(null);
    setError("");
    setSeed(null);
    setStage("SIGN");
  }

  const stageIndex =
    stages.findIndex(
      (item) =>
        item.id === stage,
    );

  const stageContent =
    getStageContent(stage);

  return (
    <main className="min-h-screen overflow-hidden bg-[#05050b] text-white">
      {/* Ambient quantum field */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[12%] h-80 w-80 rounded-full bg-cyan-500/5 blur-[120px]" />

        <div className="absolute right-[10%] top-[25%] h-96 w-96 rounded-full bg-violet-600/7 blur-[140px]" />

        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(130,120,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(130,120,255,.15) 1px, transparent 1px)",
            backgroundSize:
              "72px 72px",
            maskImage:
              "radial-gradient(circle at center, black, transparent 75%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex h-20 items-center justify-between border-b border-white/8 px-6 lg:px-10">
        <Link
          href="/"
          className="group flex items-center gap-3"
        >
          <div className="relative flex h-9 w-9 items-center justify-center">
            <div className="absolute inset-0 rotate-45 border border-cyan-300/60 shadow-[0_0_18px_rgba(34,211,238,.25)]" />

            <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
          </div>

          <div>
            <div className="text-sm font-semibold tracking-[0.28em] text-white">
              Q-SHIELD
            </div>

            <div className="text-[9px] tracking-[0.24em] text-white/35">
              LIVE SECURITY DEMO
            </div>
          </div>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/45">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.9)]" />
            Security Engine Operational
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/60 transition hover:border-cyan-400/30 hover:text-white"
          >
            Platform
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Title */}
        <section className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <span className="h-px w-8 bg-cyan-400/70" />

            <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-cyan-300/70">
              Judge-Facing Simulation
            </span>
          </div>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Quantum Signature
                <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                  {" "}
                  Security Proof
                </span>
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Execute a real Q-SHIELD security experiment,
                inspect the quantum verification path, then
                subject the verified transcript to modeled
                cyber attacks.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearDemo}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/45 transition hover:border-white/20 hover:text-white"
              >
                Reset
              </button>

              <button
                onClick={runExperiment}
                disabled={loading}
                className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-cyan-200 shadow-[0_0_25px_rgba(34,211,238,.08)] transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Running..."
                  : "Run Verification"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Main instrument panel */}
        <section className="grid gap-4 xl:grid-cols-[230px_minmax(0,1fr)_310px]">
          {/* Pipeline */}
          <aside className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 backdrop-blur-xl">
            <div className="mb-5">
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/30">
                Verification Pipeline
              </div>

              <div className="mt-1 text-sm text-white/75">
                QDS protocol
              </div>
            </div>

            <div className="space-y-1">
              {stages.map(
                (item, index) => {
                  const active =
                    item.id === stage;

                  const completed =
                    experiment &&
                    index < stageIndex;

                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        experiment &&
                        setStage(item.id)
                      }
                      disabled={!experiment}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        active
                          ? "border border-cyan-300/20 bg-cyan-300/[0.07]"
                          : "border border-transparent hover:bg-white/[0.025]"
                      } disabled:cursor-default`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] ${
                          active
                            ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                            : completed
                              ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                              : "border-white/8 bg-white/[0.02] text-white/30"
                        }`}
                      >
                        {completed
                          ? "✓"
                          : item.number}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`text-[10px] font-medium tracking-[0.16em] ${
                            active
                              ? "text-cyan-200"
                              : "text-white/55"
                          }`}
                        >
                          {item.label}
                        </div>

                        <div className="mt-0.5 truncate text-[9px] text-white/25">
                          {item.description}
                        </div>
                      </div>

                      {active && (
                        <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.9)]" />
                      )}
                    </button>
                  );
                },
              )}
            </div>

            <div className="mt-6 border-t border-white/6 pt-4">
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                Engine
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[10px] text-white/50">
                  Statistical verifier
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

                <span className="text-[10px] text-white/35">
                  AI advisory optional
                </span>
              </div>
            </div>
          </aside>

          {/* Center */}
          <section className="min-h-[570px] rounded-2xl border border-white/8 bg-white/[0.025] p-5 backdrop-blur-xl sm:p-7">
            <div className="flex items-center justify-between border-b border-white/6 pb-4">
              <div>
                <div className="text-[9px] uppercase tracking-[0.25em] text-white/30">
                  Live Protocol State
                </div>

                <div className="mt-1 text-sm font-medium text-white/80">
                  {stageContent.title}
                </div>
              </div>

              <div className="rounded-md border border-white/8 bg-black/20 px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] text-white/35">
                {stage}
              </div>
            </div>

            <div className="relative flex min-h-[285px] items-center justify-center overflow-hidden">
              <div className="absolute h-48 w-48 rounded-full border border-cyan-300/10" />

              <div className="absolute h-32 w-32 rounded-full border border-violet-400/10" />

              <div className="absolute h-20 w-20 rounded-full border border-cyan-300/15" />

              <div className="absolute h-px w-[75%] bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent" />

              <div className="relative flex h-32 w-32 items-center justify-center">
                <div className="absolute inset-0 rotate-45 border border-cyan-300/35 shadow-[0_0_35px_rgba(34,211,238,.08)]" />

                <div className="absolute inset-5 rotate-45 border border-violet-400/25" />

                <div className="relative text-4xl font-light text-cyan-200/80">
                  {stageContent.symbol}
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-xl text-center">
              <div className="text-lg font-medium text-white/85">
                {stageContent.title}
              </div>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/40">
                {stageContent.text}
              </p>
            </div>

            {experiment && (
              <div className="mt-7 grid gap-2 sm:grid-cols-4">
                <Metric
                  label="Decision"
                  value={decision}
                  highlight={
                    accepted === true
                      ? "positive"
                      : accepted === false
                        ? "negative"
                        : "neutral"
                  }
                />

                <Metric
                  label="Deviation"
                  value={formatPercent(
                    observedDeviation,
                  )}
                />

                <Metric
                  label="Threshold"
                  value={formatPercent(
                    threshold,
                  )}
                />

                <Metric
                  label="Simulator Time"
                  value={
                    latency === null
                      ? "—"
                      : `${latency.toFixed(2)} ms`
                  }
                />
              </div>
            )}

            {!experiment && (
              <div className="mt-8 rounded-xl border border-dashed border-white/10 bg-black/10 p-6 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-white/30">
                  Awaiting experiment
                </div>

                <p className="mt-2 text-xs text-white/25">
                  Run the verification above to populate
                  real quantum and statistical evidence.
                </p>
              </div>
            )}
          </section>

          {/* Evidence */}
          <aside className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 backdrop-blur-xl">
            <div className="border-b border-white/6 pb-4">
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/30">
                Evidence
              </div>

              <div className="mt-1 text-sm text-white/75">
                Security telemetry
              </div>
            </div>

            <div className="space-y-4 pt-5">
              <EvidenceRow
                label="Experiment"
                value={experimentId}
              />

              <EvidenceRow
                label="Seed"
                value={
                  seed === null
                    ? "—"
                    : String(seed)
                }
              />

              <EvidenceRow
                label="Observed deviation"
                value={formatPercent(
                  observedDeviation,
                )}
              />

              <EvidenceRow
                label="Threshold"
                value={formatPercent(
                  threshold,
                )}
              />

              <EvidenceRow
                label="CHSH S"
                value={formatNumber(
                  chshScore,
                  4,
                )}
              />

              <EvidenceRow
                label="Replay"
                value={
                  getBoolean(
                    replay,
                    "fresh",
                  ) === true
                    ? "FRESH"
                    : getBoolean(
                          replay,
                          "fresh",
                        ) === false
                      ? "REPLAY"
                      : "—"
                }
              />

              <EvidenceRow
                label="Threat"
                value={getString(
                  threat,
                  "threatType",
                  "NONE",
                )}
              />
            </div>

            {/* Measurement */}
            <div className="mt-6 border-t border-white/6 pt-5">
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                Measurement
              </div>

              <div className="mt-3 rounded-xl border border-white/6 bg-black/20 p-3">
                <div className="flex items-start justify-between gap-4">
                  <span className="shrink-0 text-[10px] text-white/35">
                    Outcomes
                  </span>

                  <span className="text-right font-mono text-[10px] text-cyan-200/70">
                    {measurementSummary}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-white/35">
                    Samples
                  </span>

                  <span className="font-mono text-xs text-white/60">
                    {getNumber(
                      measurement,
                      "shots",
                    ) ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            {Object.keys(telemetry).length > 0 && (
              <div className="mt-5 text-[9px] text-white/20">
                Telemetry record generated from this experiment.
              </div>
            )}
          </aside>
        </section>

        {/* Attack Lab */}
        <section className="mt-5 rounded-2xl border border-white/8 bg-white/[0.025] p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-6 bg-violet-400/60" />

                <span className="text-[9px] uppercase tracking-[0.25em] text-violet-300/60">
                  Controlled Threat Simulation
                </span>
              </div>

              <h2 className="mt-2 text-lg font-medium text-white/80">
                Subject the verified transcript to attack
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-white/35">
                These are modeled attacks executed by the
                Q-SHIELD security engine. The authoritative
                decision remains outside the optional AI layer.
              </p>
            </div>

            <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">
              {experiment
                ? "Experiment loaded"
                : "Run verification first"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {attacks.map(
              (attack) => {
                const active =
                  activeAttack ===
                  attack.id;

                return (
                  <button
                    key={attack.id}
                    onClick={() =>
                      runAttack(
                        attack.id,
                      )
                    }
                    disabled={
                      !experiment ||
                      attackLoading
                    }
                    className={`group rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-violet-300/25 bg-violet-300/[0.06]"
                        : "border-white/8 bg-black/10 hover:border-white/15 hover:bg-white/[0.035]"
                    } disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-medium tracking-[0.18em] text-white/65">
                        {attack.label}
                      </div>

                      <div className="h-1.5 w-1.5 rounded-full bg-violet-400/60" />
                    </div>

                    <div className="mt-2 text-[10px] leading-5 text-white/25">
                      {attack.description}
                    </div>
                  </button>
                );
              },
            )}
          </div>

          {attackLoading && (
            <div className="mt-5 rounded-xl border border-violet-300/15 bg-violet-300/[0.025] px-5 py-4 text-xs text-violet-200/60">
              Executing modeled attack through the Q-SHIELD
              security engine...
            </div>
          )}

          {attackResult && (
            <div
              className={`mt-5 grid gap-4 rounded-xl border p-5 lg:grid-cols-[1fr_1.4fr_1fr] ${
                attackDetected
                  ? "border-red-400/15 bg-red-400/[0.025]"
                  : "border-emerald-400/15 bg-emerald-400/[0.025]"
              }`}
            >
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                  Attack result
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                      attackDetected
                        ? "border-red-400/25 bg-red-400/10 text-red-300"
                        : "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"
                    }`}
                  >
                    {attackDetected
                      ? "!"
                      : "✓"}
                  </div>

                  <div>
                    <div className="text-sm font-medium text-white/80">
                      {attackDetected
                        ? "THREAT DETECTED"
                        : "NO THREAT"}
                    </div>

                    <div className="mt-1 text-[10px] text-white/30">
                      Risk{" "}
                      {formatPercent(
                        attackRisk,
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-y border-white/6 py-4 lg:border-y-0 lg:border-x lg:px-5 lg:py-0">
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                  Detection mechanism
                </div>

                <div className="mt-2 text-sm text-cyan-200/75">
                  {attackMechanism}
                </div>

                <div className="mt-3 text-[10px] leading-5 text-white/40">
                  {attackEvidence}
                </div>
              </div>

              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/25">
                  Security decision
                </div>

                <div
                  className={`mt-3 text-2xl font-semibold tracking-[0.12em] ${
                    attackDetected
                      ? "text-red-300"
                      : "text-emerald-300"
                  }`}
                >
                  {attackDecision}
                </div>

                <div className="mt-2 text-[10px] leading-5 text-white/30">
                  Decision generated by the Q-SHIELD security
                  engine.
                </div>
              </div>
            </div>
          )}
        </section>

        <footer className="flex flex-col gap-2 px-1 py-6 text-[9px] uppercase tracking-[0.18em] text-white/20 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Q-SHIELD · Quantum Digital Signature Security
          </span>

          <span>
            Software simulation · Not quantum hardware
          </span>
        </footer>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  highlight = "neutral",
}: {
  label: string;
  value: string;
  highlight?:
    | "positive"
    | "negative"
    | "neutral";
}) {
  const valueClass =
    highlight === "positive"
      ? "text-emerald-300"
      : highlight === "negative"
        ? "text-red-300"
        : "text-white/75";

  return (
    <div className="rounded-xl border border-white/6 bg-black/15 px-4 py-3">
      <div className="text-[8px] uppercase tracking-[0.2em] text-white/25">
        {label}
      </div>

      <div
        className={`mt-1 font-mono text-sm ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}

function EvidenceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] text-white/30">
        {label}
      </span>

      <span className="truncate font-mono text-[10px] text-white/60">
        {value}
      </span>
    </div>
  );
}