import { describe, expect, it } from "vitest";

import {
  runQDSExperiment,
} from "./simulator";

describe("QDS experiment simulator", () => {
  it("runs a clean experiment", () => {
    const result = runQDSExperiment({
      alpha: 1,
      beta: 0,
      shots: 1000,
      threshold: 0.02,
      seed: 12345,
      noise: {
        model: "NONE",
        probability: 0,
      },
    });

    expect(result.inputState).toBeDefined();
    expect(result.bellState.name).toBe(
      "PHI_PLUS",
    );

    expect(
      result.teleportation.fidelity,
    ).toBeCloseTo(1, 10);

    expect(
      result.measurement.shots,
    ).toBe(1000);

    expect(
      result.verification,
    ).toBeDefined();
  });

  it("produces deterministic results with the same seed", () => {
    const config = {
      alpha: 1,
      beta: 0,
      shots: 1000,
      threshold: 0.02,
      seed: 42,
      noise: {
        model: "NONE" as const,
        probability: 0,
      },
    };

    const first =
      runQDSExperiment(config);

    const second =
      runQDSExperiment(config);

    expect(
      first.measurement.results,
    ).toEqual(
      second.measurement.results,
    );

    expect(
      first.statistics,
    ).toEqual(
      second.statistics,
    );

    expect(
      first.verification,
    ).toEqual(
      second.verification,
    );
  });

  it("supports a bit-flip noise experiment", () => {
    const result = runQDSExperiment({
      alpha: 1,
      beta: 0,
      shots: 1000,
      threshold: 0.02,
      seed: 12345,
      noise: {
        model: "BIT_FLIP",
        probability: 1,
      },
    });

    expect(
      result.noise.appliedOperator,
    ).toBe("X");

    expect(
      result.noise.model,
    ).toBe("BIT_FLIP");

    expect(
      result.verification.decision,
    ).toBe("REJECT");
  });

  it("supports a clean experiment without explicitly supplying noise", () => {
    const result = runQDSExperiment({
      alpha: 1,
      beta: 0,
      shots: 1000,
      threshold: 0.02,
      seed: 12345,
    });

    expect(
      result.noise.model,
    ).toBe("NONE");
  });

  it("supports arbitrary normalized input states", () => {
    const result = runQDSExperiment({
      alpha: 1,
      beta: 1,
      shots: 1000,
      threshold: 0.05,
      seed: 99,
      noise: {
        model: "NONE",
        probability: 0,
      },
    });

    expect(
      result.teleportation.fidelity,
    ).toBeCloseTo(1, 10);

    expect(
      result.measurement.shots,
    ).toBe(1000);
  });
});