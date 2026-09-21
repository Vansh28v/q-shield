import {
  describe,
  expect,
  it,
} from "vitest";

import {
  detectThreat,
} from "./detector";

import {
  VerificationResult,
} from "../quantum/verification";

function createVerification(
  overrides: Partial<VerificationResult> = {},
): VerificationResult {
  return {
    decision: "ACCEPT",
    accepted: true,
    threshold: 0.02,
    deviation: 0,
    riskIndicator: 0,
    confidence: 1,
    metrics: {
      totalVariationDistance: 0,
      meanAbsoluteDeviation: 0,
      chiSquare: 0,
      maxDeviation: 0,
    },
    ...overrides,
  };
}

describe("Q-SHIELD threat detector", () => {
  it("allows a clean verification", () => {
    const result = detectThreat({
      verification:
        createVerification(),
    });

    expect(result.detected).toBe(false);
    expect(result.threatLevel).toBe(
      "NONE",
    );

    expect(result.threatType).toBe(
      "NONE",
    );

    expect(result.riskScore).toBe(0);

    expect(
      result.recommendedAction,
    ).toBe("ALLOW");
  });

  it("detects a statistical anomaly", () => {
    const result = detectThreat({
      verification:
        createVerification({
          decision: "REJECT",
          accepted: false,
          deviation: 0.1,
          riskIndicator: 0.8,
          confidence: 0,
        }),
    });

    expect(result.detected).toBe(true);

    expect(
      result.threatType,
    ).toBe("STATISTICAL_ANOMALY");

    expect(result.riskScore).toBe(0.8);

    expect(result.threatLevel).toBe(
      "CRITICAL",
    );

    expect(
      result.recommendedAction,
    ).toBe("BLOCK");
  });

  it("uses explicit attack context", () => {
    const result = detectThreat({
      verification:
        createVerification({
          decision: "REJECT",
          accepted: false,
          riskIndicator: 0.7,
        }),
      attackType: "FORGERY",
    });

    expect(result.detected).toBe(true);

    expect(result.threatType).toBe(
      "FORGERY",
    );

    expect(result.riskScore).toBe(0.7);
  });

  it("detects replay attacks", () => {
    const result = detectThreat({
      verification:
        createVerification(),
      replayDetected: true,
    });

    expect(result.detected).toBe(true);

    expect(result.threatType).toBe(
      "REPLAY",
    );

    expect(result.riskScore).toBe(1);

    expect(result.threatLevel).toBe(
      "CRITICAL",
    );

    expect(
      result.recommendedAction,
    ).toBe("BLOCK");
  });

  it("detects unauthorized verification", () => {
    const result = detectThreat({
      verification:
        createVerification(),
      unauthorizedVerification: true,
    });

    expect(result.detected).toBe(true);

    expect(
      result.threatType,
    ).toBe(
      "UNAUTHORIZED_VERIFICATION",
    );

    expect(result.riskScore).toBe(0.9);

    expect(
      result.recommendedAction,
    ).toBe("BLOCK");
  });

  it("detects a quantum channel anomaly from CHSH", () => {
    const result = detectThreat({
      verification:
        createVerification(),

      chsh: {
        correlationXX: 0.5,
        correlationXZ: 0.5,
        correlationZX: 0.5,
        correlationZZ: -0.5,
        S: 2,
        absoluteS: 2,
        passesQuantumThreshold: false,
      },
    });

    expect(result.detected).toBe(true);

    expect(
      result.threatType,
    ).toBe(
      "QUANTUM_CHANNEL_ANOMALY",
    );

    expect(result.riskScore).toBe(
      0.75,
    );
  });

  it("uses the highest risk signal", () => {
    const result = detectThreat({
      verification:
        createVerification({
          decision: "REJECT",
          accepted: false,
          riskIndicator: 0.6,
        }),

      replayDetected: true,

      unauthorizedVerification: true,
    });

    expect(result.riskScore).toBe(1);

    expect(result.threatType).toBe(
      "REPLAY",
    );

    expect(result.recommendedAction).toBe(
      "BLOCK",
    );
  });

  it("classifies medium risk correctly", () => {
    const result = detectThreat({
      verification:
        createVerification({
          decision: "REJECT",
          accepted: false,
          riskIndicator: 0.6,
        }),
    });

    expect(result.threatLevel).toBe(
      "HIGH",
    );

    expect(
      result.recommendedAction,
    ).toBe("REJECT");
  });

  it("classifies low risk correctly", () => {
    const result = detectThreat({
      verification:
        createVerification({
          decision: "REJECT",
          accepted: false,
          riskIndicator: 0.1,
        }),
    });

    expect(result.threatLevel).toBe(
      "LOW",
    );

    expect(
      result.recommendedAction,
    ).toBe("MONITOR");
  });

  it("clamps risk values above 1", () => {
    const result = detectThreat({
      verification:
        createVerification({
          decision: "REJECT",
          accepted: false,
          riskIndicator: 2,
        }),
    });

    expect(result.riskScore).toBe(1);
  });

  it("does not create risk from an accepted verification alone", () => {
    const result = detectThreat({
      verification:
        createVerification({
          riskIndicator: 0,
        }),
    });

    expect(result.detected).toBe(false);
    expect(result.riskScore).toBe(0);
  });
});