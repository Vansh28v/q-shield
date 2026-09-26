import { describe, expect, it } from "vitest";
import {
  simulateAttack,
  AttackConfig,
} from "./attacks";
import {
  QDSExperimentConfig,
} from "./simulator";

/*
 * FIX #2 — IMPERSONATION
 *
 * These tests verify that impersonation detection is based on
 * signer identity comparison rather than attack intensity.
 *
 * IMPORTANT:
 * expectedSignerId is part of QDSExperimentConfig and is used
 * only by the security/identity layer.
 */

function baseConfig(
  overrides: Partial<QDSExperimentConfig> & {
    expectedSignerId?: string;
  },
): QDSExperimentConfig & {
  expectedSignerId?: string;
} {
  return {
    alpha: 0.8,
    beta: 0.6,
    shots: 200,
    threshold: 0.05,
    seed: 123456,
    ...overrides,
  };
}

describe(
  "IMPERSONATION attack detection (Fix #2)",
  () => {
    it(
      "A — different identities are detected",
      () => {
        const config = baseConfig({
          signerId: "ATTACKER",
          expectedSignerId: "LEGITIMATE",
        });

        const attack: AttackConfig = {
          type: "IMPERSONATION",
          intensity: 1,
        };

        const result = simulateAttack(
          config,
          attack,
        );

        expect(result.detected).toBe(true);
        expect(result.mechanism).toBe(
          "IDENTITY_VERIFICATION",
        );
        expect(result.decision).toBe("REJECT");
        expect(result.riskScore).toBeGreaterThan(0);

        expect(result.evidence).toContain(
          "ATTACKER",
        );

        expect(result.evidence).toContain(
          "LEGITIMATE",
        );

        expect(
          result.evidence.toLowerCase(),
        ).toContain("does not match");
      },
    );

    it(
      "B — matching identities are not detected",
      () => {
        const config = baseConfig({
          signerId: "LEGITIMATE",
          expectedSignerId: "LEGITIMATE",
        });

        const attack: AttackConfig = {
          type: "IMPERSONATION",
          intensity: 1,
        };

        const result = simulateAttack(
          config,
          attack,
        );

        expect(result.detected).toBe(false);

        expect(result.mechanism).toBe(
          "IDENTITY_VERIFICATION",
        );

        expect(result.decision).toBe("ACCEPT");

        expect(
          result.evidence.toLowerCase(),
        ).toContain("matches");
      },
    );

    it(
      "C — missing expectedSignerId throws a clear configuration error",
      () => {
        const config = baseConfig({
          signerId: "LEGITIMATE",
        });

        const attack: AttackConfig = {
          type: "IMPERSONATION",
          intensity: 1,
        };

        expect(
          () =>
            simulateAttack(
              config,
              attack,
            ),
        ).toThrow(
          "Impersonation detection requires signerId and expectedSignerId.",
        );
      },
    );

    it(
      "D — missing signerId throws a clear configuration error",
      () => {
        const config = baseConfig({
          expectedSignerId: "LEGITIMATE",
        });

        const attack: AttackConfig = {
          type: "IMPERSONATION",
          intensity: 1,
        };

        expect(
          () =>
            simulateAttack(
              config,
              attack,
            ),
        ).toThrow(
          "Impersonation detection requires signerId and expectedSignerId.",
        );
      },
    );

    it(
      "E — identity mismatch is detected even with intensity 0",
      () => {
        const config = baseConfig({
          signerId: "ATTACKER",
          expectedSignerId: "LEGITIMATE",
        });

        const attack: AttackConfig = {
          type: "IMPERSONATION",
          intensity: 0,
        };

        const result = simulateAttack(
          config,
          attack,
        );

        expect(result.detected).toBe(true);
        expect(result.decision).toBe("REJECT");
      },
    );

    it(
      "F — matching identity is accepted even with intensity 1",
      () => {
        const config = baseConfig({
          signerId: "LEGITIMATE",
          expectedSignerId: "LEGITIMATE",
        });

        const attack: AttackConfig = {
          type: "IMPERSONATION",
          intensity: 1,
        };

        const result = simulateAttack(
          config,
          attack,
        );

        expect(result.detected).toBe(false);
        expect(result.decision).toBe("ACCEPT");
      },
    );
  },
);