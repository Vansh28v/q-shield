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

    expect(
      result.experiment.noise.appliedOperator,
    ).toBe("Z");

    expect(result.detected).toBe(true);
    expect(result.riskScore).toBe(0.9);
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
    const result = simulateAttack(
      baseConfig,
      {
        type: "REPLAY",
        intensity: 1,
      },
    );

    expect(result.attackType).toBe("REPLAY");

    expect(
      result.experiment.noise.model,
    ).toBe("NONE");

    expect(result.detected).toBe(true);
    expect(result.riskScore).toBe(1);

    expect(
      result.message,
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