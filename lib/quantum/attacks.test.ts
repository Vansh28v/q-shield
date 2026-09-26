import { describe, expect, it } from "vitest";

import {
  simulateAttack,
} from "./attacks";

const baseConfig = {
  alpha: 1,
  beta: 0,
  shots: 1000,
  threshold: 0.02,
  seed: 12345,

  // Explicit identities for impersonation testing.
  signerId: "ATTACKER",
  expectedSignerId: "LEGITIMATE",

  // Explicit transaction identifiers for replay testing.
  // Use a unique set for this test file so persistent SQLite
  // state from an earlier run cannot collide.
  signatureId: `ATTACKS-TEST-SIGNATURE-${Date.now()}`,
  sessionId: `ATTACKS-TEST-SESSION-${Date.now()}`,
  nonce: `ATTACKS-TEST-NONCE-${Date.now()}`,
};

describe("Quantum attack simulation", () => {
  it("simulates a forgery attack", () => {
    const result = simulateAttack(
      baseConfig,
      {
        type: "FORGERY",
        intensity: 1,
      },
    );

    expect(result.attackType).toBe("FORGERY");

    expect(
      result.experiment.noise.appliedOperator,
    ).toBe("X");

    expect(result.detected).toBe(true);
    expect(result.riskScore).toBe(1);
  });

  it("simulates an impersonation attack", () => {
    const result = simulateAttack(
      baseConfig,
      {
        type: "IMPERSONATION",
        intensity: 1,
      },
    );

    expect(result.attackType).toBe(
      "IMPERSONATION",
    );

    // Impersonation is an identity/authentication
    // problem, not a quantum-channel noise attack.
    expect(
      result.experiment.noise.model,
    ).toBe("NONE");

    expect(result.detected).toBe(true);
    expect(result.riskScore).toBe(1);

    expect(result.mechanism).toBe(
      "IDENTITY_VERIFICATION",
    );

    expect(result.decision).toBe("REJECT");

    expect(result.evidence).toContain(
      "ATTACKER",
    );

    expect(result.evidence).toContain(
      "LEGITIMATE",
    );
  });

  it("simulates channel manipulation", () => {
    const result = simulateAttack(
      baseConfig,
      {
        type: "CHANNEL_MANIPULATION",
        intensity: 1,
      },
    );

    expect(result.attackType).toBe(
      "CHANNEL_MANIPULATION",
    );

    expect(["X", "Y", "Z"]).toContain(
      result.experiment.noise.appliedOperator,
    );

    expect(result.detected).toBe(true);
  });

  it("detects replay using the replay ledger", () => {
    /*
     * The first submission is a legitimate transaction.
     * The second submission of the exact same identifiers
     * is the actual replay.
     */
    const first = simulateAttack(
      baseConfig,
      {
        type: "REPLAY",
        intensity: 1,
      },
    );

    expect(first.attackType).toBe("REPLAY");

    expect(
      first.experiment.noise.model,
    ).toBe("NONE");

    expect(first.detected).toBe(false);
    expect(first.riskScore).toBe(0);
    expect(first.decision).toBe("ACCEPT");

    const second = simulateAttack(
      baseConfig,
      {
        type: "REPLAY",
        intensity: 1,
      },
    );

    expect(second.attackType).toBe("REPLAY");

    expect(
      second.experiment.noise.model,
    ).toBe("NONE");

    expect(second.detected).toBe(true);
    expect(second.riskScore).toBe(1);
    expect(second.decision).toBe("REJECT");

    expect(
      second.message,
    ).toContain(
      "session and nonce freshness",
    );
  });

  it("allows zero attack intensity", () => {
    const result = simulateAttack(
      baseConfig,
      {
        type: "FORGERY",
        intensity: 0,
      },
    );

    expect(result.detected).toBe(false);
    expect(result.riskScore).toBe(0);
  });

  it("rejects negative attack intensity", () => {
    expect(() =>
      simulateAttack(
        baseConfig,
        {
          type: "FORGERY",
          intensity: -0.1,
        },
      ),
    ).toThrow();
  });

  it("rejects attack intensity above 1", () => {
    expect(() =>
      simulateAttack(
        baseConfig,
        {
          type: "FORGERY",
          intensity: 1.1,
        },
      ),
    ).toThrow();
  });

  it("rejects non-finite attack intensity", () => {
    expect(() =>
      simulateAttack(
        baseConfig,
        {
          type: "FORGERY",
          intensity: Infinity,
        },
      ),
    ).toThrow();
  });
});