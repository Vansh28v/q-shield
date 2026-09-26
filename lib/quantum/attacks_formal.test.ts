import { describe, expect, it } from "vitest";

import { simulateAttack } from "./attacks";

import { ReplayLedger } from "../security/ledger";

const uniqueId = Date.now();

const baseConfig = {
  alpha: 1,
  beta: 0,
  shots: 1000,
  threshold: 0.05,
  seed: 12345,

  signerId: "FORMAL-TEST-SIGNER",
  expectedSignerId: "FORMAL-TEST-LEGITIMATE",

  signatureId: `FORMAL-TEST-SIGNATURE-${uniqueId}`,
  sessionId: `FORMAL-TEST-SESSION-${uniqueId}`,
  nonce: `FORMAL-TEST-NONCE-${uniqueId}`,
};

describe("Formal Attack Model Verification", () => {
  it("forgery attack is detected as adversarial manipulation", () => {
    const result = simulateAttack(
      baseConfig,
      {
        type: "FORGERY",
        intensity: 0.8,
      },
    );

    expect(result.attackType).toBe(
      "FORGERY",
    );

    expect(result.detected).toBe(true);

    expect(result.riskScore).toBeGreaterThan(
      0.5,
    );

    expect(result.message).toContain(
      "FORGERY attack detected",
    );
  });

  it("replay remains ledger/context based rather than quantum noise alone", () => {
    /*
     * First verify the ReplayLedger itself.
     */
    const ledger = new ReplayLedger();

    const sigId = `FORMAL-LEDGER-SIG-${uniqueId}`;
    const sessId = `FORMAL-LEDGER-SESS-${uniqueId}`;
    const nonce = `FORMAL-LEDGER-NONCE-${uniqueId}`;

    const check1 = ledger.check(
      sigId,
      sessId,
      nonce,
    );

    expect(check1.fresh).toBe(true);

    ledger.record(
      sigId,
      sessId,
      nonce,
      "Alice",
      1000,
    );

    const check2 = ledger.check(
      sigId,
      sessId,
      nonce,
    );

    expect(check2.fresh).toBe(false);

    expect(check2.reason).toBe(
      "SIGNATURE_ALREADY_SEEN",
    );

    /*
     * Now verify the attack simulator.
     *
     * First occurrence = legitimate transaction.
     * Second occurrence = actual replay.
     */
    const firstAttack = simulateAttack(
      baseConfig,
      {
        type: "REPLAY",
        intensity: 1,
      },
    );

    expect(firstAttack.detected).toBe(false);
    expect(firstAttack.riskScore).toBe(0);
    expect(firstAttack.decision).toBe(
      "ACCEPT",
    );

    expect(
      firstAttack.experiment.noise.model,
    ).toBe("NONE");

    const replayAttack = simulateAttack(
      baseConfig,
      {
        type: "REPLAY",
        intensity: 1,
      },
    );

    expect(replayAttack.detected).toBe(true);

    expect(replayAttack.riskScore).toBe(1);

    expect(replayAttack.decision).toBe(
      "REJECT",
    );

    expect(
      replayAttack.experiment.noise.model,
    ).toBe("NONE");
  });

  it("channel manipulation uses stochastic noise model", () => {
    const result1 = simulateAttack(
      {
        ...baseConfig,
        seed: 100,
        signatureId: `CHANNEL-SIG-100-${uniqueId}`,
        sessionId: `CHANNEL-SESS-100-${uniqueId}`,
        nonce: `CHANNEL-NONCE-100-${uniqueId}`,
      },
      {
        type: "CHANNEL_MANIPULATION",
        intensity: 0.8,
      },
    );

    const result2 = simulateAttack(
      {
        ...baseConfig,
        seed: 200,
        signatureId: `CHANNEL-SIG-200-${uniqueId}`,
        sessionId: `CHANNEL-SESS-200-${uniqueId}`,
        nonce: `CHANNEL-NONCE-200-${uniqueId}`,
      },
      {
        type: "CHANNEL_MANIPULATION",
        intensity: 0.8,
      },
    );

    expect(result1.attackType).toBe(
      "CHANNEL_MANIPULATION",
    );

    expect(result1.experiment.noise.model).toBe(
      "DEPOLARIZING",
    );

    expect(result2.experiment.noise.model).toBe(
      "DEPOLARIZING",
    );

    expect(result1.detected).toBe(true);
  });
});