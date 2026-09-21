"use client";

import { useState } from "react";

type ExperimentResponse = {
  success: boolean;
  error?: string;
  experiment?: {
    quantum: {
      measurement: {
        shots: number;
        results: {
          outcome: string;
          count: number;
          probability: number;
        }[];
      };
      statistics: {
        totalVariationDistance: number;
        meanAbsoluteDeviation: number;
        chiSquare: number;
        maxDeviation: number;
      };
      verification: {
        decision: "ACCEPT" | "REJECT";
        accepted: boolean;
        threshold: number;
        deviation: number;
        riskIndicator: number;
        confidence: number;
      };
      teleportation: {
        measurementBits: [number, number];
        correction: string[];
        fidelity: number;
      };
    };
    signatureVerification: {
      valid: boolean;
      fidelity: number;
      messageMatch: boolean;
      signerMatch: boolean;
    };
    replay: {
      fresh: boolean;
      reason: string;
    };
    threat: {
      detected: boolean;
      threatLevel: string;
      threatType: string;
      riskScore: number;
      reasons: string[];
      recommendedAction: string;
    };
    latencyMs: number;
  };
};

type AttackResult = {
  detected: boolean;
  riskScore: number;
  message: string;
};

export default function SignaturePage() {
  const [message, setMessage] = useState(
    "Q-SHIELD TEST SIGNATURE",
  );

  const [signerId, setSignerId] =
    useState("SIGNER-001");

  const [loading, setLoading] =
    useState(false);

  const [attackLoading, setAttackLoading] =
    useState(false);

  const [result, setResult] =
    useState<
      ExperimentResponse["experiment"] | null
    >(null);

  const [attackResult, setAttackResult] =
    useState<AttackResult | null>(null);

  const [error, setError] = useState("");

  async function verifySignature() {
    setLoading(true);
    setError("");
    setResult(null);
    setAttackResult(null);

    try {
      const timestamp = Date.now();

      const response = await fetch(
        "/api/security/experiment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experimentId: `EXP-${timestamp}`,
            sessionId: `SESSION-${timestamp}`,
            signatureId: `SIG-${timestamp}`,
            signerId,
            message,
            nonce: `NONCE-${timestamp}`,

            alpha: Math.SQRT1_2,
            beta: Math.SQRT1_2,

            shots: 1000,
            threshold: 0.05,
            seed: 20260919,

            noise: {
              model: "NONE",
              probability: 0,
            },
          }),
        },
      );

      const data: ExperimentResponse =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Security experiment failed.",
        );
      }

      setResult(data.experiment ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unknown error.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function simulateForgery() {
    setAttackLoading(true);
    setError("");
    setAttackResult(null);

    try {
      const timestamp = Date.now();

      const response = await fetch(
        "/api/security/attack",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experiment: {
              experimentId: `ATTACK-${timestamp}`,
              sessionId: `SESSION-${timestamp}`,
              signatureId: `SIG-${timestamp}`,
              signerId,
              message,
              nonce: `NONCE-${timestamp}`,

             alpha: 0.8,
             beta: 0.6,

              shots: 1000,
              threshold: 0.05,
              seed: 20260919,

              noise: {
                model: "NONE",
                probability: 0,
              },
            },

            attack: {
              type: "FORGERY",
              intensity: 1,
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Forgery simulation failed.",
        );
      }

      setAttackResult({
        detected: data.attack.detected,
        riskScore: data.attack.riskScore,
        message: data.attack.message,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Forgery simulation failed.",
      );
    } finally {
      setAttackLoading(false);
    }
  }

  const verification =
    result?.quantum.verification;

  const signatureVerification =
    result?.signatureVerification;

  const accepted =
    verification?.accepted === true &&
    signatureVerification?.valid === true;

  return (
    <main className="min-h-screen bg-[#05060b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />

            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
              Q-SHIELD / SIGNATURE ENGINE
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight">
            Quantum Signature Verification
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Verify digital signatures using quantum-state
            simulation, teleportation, measurement
            statistics, and deterministic security
            thresholds.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">

          {/* INPUT PANEL */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">
                  Signature Input
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Submit a signature to the deterministic
                  QDS verification engine.
                </p>
              </div>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[10px] uppercase tracking-widest text-cyan-300">
                ENGINE ONLINE
              </span>
            </div>

            <div className="space-y-5">

              {/* MESSAGE */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-slate-500">
                  Message
                </label>

                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400/50"
                />
              </div>

              {/* SIGNER */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest text-slate-500">
                  Signer ID
                </label>

                <input
                  value={signerId}
                  onChange={(event) =>
                    setSignerId(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-cyan-400/50"
                />
              </div>

              {/* VERIFY BUTTON */}
              <button
                onClick={verifySignature}
                disabled={
                  loading ||
                  attackLoading ||
                  !message.trim() ||
                  !signerId.trim()
                }
                className="group relative w-full overflow-hidden rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300 transition hover:border-cyan-300/60 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="relative z-10">
                  {loading
                    ? "RUNNING QUANTUM VERIFICATION..."
                    : "VERIFY SIGNATURE"}
                </span>

                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>

              {/* FORGERY BUTTON */}
              <button
                onClick={simulateForgery}
                disabled={
                  attackLoading ||
                  loading ||
                  !message.trim() ||
                  !signerId.trim()
                }
                className="w-full rounded-xl border border-red-400/30 bg-red-400/5 px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-red-300 transition hover:border-red-300/60 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {attackLoading
                  ? "SIMULATING FORGERY..."
                  : "SIMULATE FORGERY"}
              </button>

            </div>
          </section>

          {/* DECISION PANEL */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl">

            <div className="mb-6">
              <h2 className="text-lg font-medium">
                Verification Decision
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Authoritative statistical verifier
              </p>
            </div>

            {/* INITIAL STATE */}
            {!result &&
              !loading &&
              !attackResult && (
                <div className="flex min-h-[250px] items-center justify-center text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/5 text-2xl text-cyan-300">
                      ◇
                    </div>

                    <p className="text-sm text-slate-400">
                      Awaiting signature verification
                    </p>

                    <p className="mt-2 text-xs text-slate-600">
                      Run the quantum verification engine
                    </p>
                  </div>
                </div>
              )}

            {/* LOADING */}
            {loading && (
              <div className="flex min-h-[250px] items-center justify-center text-center">
                <div>
                  <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />

                  <p className="text-sm text-cyan-300">
                    Executing QDS protocol...
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Teleportation → Measurement →
                    Statistics → Verification
                  </p>
                </div>
              </div>
            )}

            {/* NORMAL VERIFICATION RESULT */}
            {result &&
              verification &&
              !attackResult && (
                <div className="space-y-5">

                  <div
                    className={`rounded-xl border p-5 ${
                      accepted
                        ? "border-emerald-400/30 bg-emerald-400/5"
                        : "border-red-400/30 bg-red-400/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                          Final Decision
                        </p>

                        <p
                          className={`mt-2 text-3xl font-bold ${
                            accepted
                              ? "text-emerald-300"
                              : "text-red-300"
                          }`}
                        >
                          {accepted
                            ? "ACCEPTED"
                            : "REJECTED"}
                        </p>
                      </div>

                      <div className="text-4xl">
                        {accepted ? "✓" : "×"}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <Metric
                      label="Deviation"
                      value={`${(
                        verification.deviation * 100
                      ).toFixed(3)}%`}
                    />

                    <Metric
                      label="Threshold"
                      value={`${(
                        verification.threshold * 100
                      ).toFixed(2)}%`}
                    />

                    <Metric
                      label="Confidence"
                      value={`${(
                        verification.confidence * 100
                      ).toFixed(2)}%`}
                    />

                    <Metric
                      label="Fidelity"
                      value={`${(
                        (signatureVerification?.fidelity ??
                          0) * 100
                      ).toFixed(2)}%`}
                    />

                  </div>

                  <ProtocolTrace />

                  <div className="grid grid-cols-2 gap-3 text-xs">

                    <StatusRow
                      label="Message Match"
                      value={
                        signatureVerification
                          ?.messageMatch ?? false
                      }
                    />

                    <StatusRow
                      label="Signer Match"
                      value={
                        signatureVerification
                          ?.signerMatch ?? false
                      }
                    />

                    <StatusRow
                      label="Replay Status"
                      value={result.replay.fresh}
                    />

                    <StatusRow
                      label="Threat Detected"
                      value={!result.threat.detected}
                    />

                  </div>

                  <div className="text-right text-[10px] uppercase tracking-widest text-slate-600">
                    Verification latency{" "}
                    {result.latencyMs.toFixed(2)} ms
                  </div>
                </div>
              )}

            {/* FORGERY RESULT */}
            {attackResult && (
              <div className="space-y-5">

                <div
                  className={`rounded-xl border p-5 ${
                    attackResult.detected
                      ? "border-red-400/30 bg-red-400/5"
                      : "border-emerald-400/30 bg-emerald-400/5"
                  }`}
                >
                  <div className="flex items-center justify-between">

                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500">
                        Forgery Simulation
                      </p>

                      <p
                        className={`mt-2 text-3xl font-bold ${
                          attackResult.detected
                            ? "text-red-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {attackResult.detected
                          ? "ATTACK DETECTED"
                          : "NOT DETECTED"}
                      </p>
                    </div>

                    <div className="text-4xl">
                      {attackResult.detected
                        ? "⚠"
                        : "✓"}
                    </div>

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <Metric
                    label="Risk Score"
                    value={`${(
                      attackResult.riskScore * 100
                    ).toFixed(2)}%`}
                  />

                  <Metric
                    label="Attack Type"
                    value="FORGERY"
                  />

                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">

                  <p className="mb-2 text-xs uppercase tracking-widest text-slate-500">
                    Engine Response
                  </p>

                  <p className="text-sm leading-relaxed text-slate-400">
                    {attackResult.message}
                  </p>

                </div>

                <div className="rounded-xl border border-red-400/10 bg-red-400/[0.03] p-4 text-xs text-slate-500">
                  The authoritative security engine evaluated
                  the simulated forgery using the QDS statistical
                  verification pipeline.
                </div>

              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

          </section>
        </div>

        {/* SECURITY PRINCIPLE */}
        <section className="mt-6 rounded-2xl border border-violet-400/10 bg-violet-400/[0.025] p-5">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
                Security Principle
              </p>

              <p className="mt-2 text-sm text-slate-400">
                The deterministic quantum/statistical verifier
                is authoritative. AI advisory analysis does not
                replace the cryptographic verification decision.
              </p>
            </div>

            <div className="shrink-0 rounded-full border border-violet-400/20 bg-violet-400/5 px-4 py-2 text-[10px] uppercase tracking-widest text-violet-300">
              NON-AI CORE
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

function ProtocolTrace() {
  const stages = [
    "Message",
    "Quantum State",
    "Bell State",
    "Teleportation",
    "Pauli Correction",
    "Measurement",
    "Statistics",
    "Decision",
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">

      <p className="mb-3 text-xs uppercase tracking-widest text-slate-500">
        Protocol Trace
      </p>

      <div className="flex flex-wrap items-center gap-2 text-xs">

        {stages.map((stage, index) => (
          <div
            key={stage}
            className="flex items-center gap-2"
          >

            <span className="rounded-lg border border-cyan-400/15 bg-cyan-400/5 px-2 py-1 text-cyan-300">
              {stage}
            </span>

            {index < stages.length - 1 && (
              <span className="text-slate-700">
                →
              </span>
            )}

          </div>
        ))}

      </div>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">

      <p className="text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-slate-200">
        {value}
      </p>

    </div>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">

      <span className="text-slate-500">
        {label}
      </span>

      <span
        className={
          value
            ? "text-emerald-300"
            : "text-red-300"
        }
      >
        {value ? "PASS" : "FAIL"}
      </span>

    </div>
  );
}