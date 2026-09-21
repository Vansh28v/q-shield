import { describe, expect, it } from "vitest";
import { simulateAttack } from "./attacks";
import { ReplayLedger } from "../security/ledger";

const baseConfig = {
  alpha: 1,
  beta: 0,
  shots: 1000,
  threshold: 0.05,
  seed: 12345,
};

describe("Formal Attack Model Verification", () => {
  it("forgery attack is detected as adversarial manipulation", () => {
    const result = simulateAttack(baseConfig, {
      type: "FORGERY",
      intensity: 0.8,
    });

    expect(result.attackType).toBe("FORGERY");
    expect(result.detected).toBe(true);
    expect(result.riskScore).toBeGreaterThan(0.5);
    expect(result.message).toContain("FORGERY attack detected");
  });

  it("replay remains ledger/context based rather than quantum noise alone", () => {
    const ledger = new ReplayLedger();
    const sigId = "REPLAY-SIG-TEST";
    const sessId = "REPLAY-SESS-TEST";
    const nonce = "NONCE-TEST";

    const check1 = ledger.check(sigId, sessId, nonce);
    expect(check1.fresh).toBe(true);

    ledger.record(sigId, sessId, nonce, "Alice", 1000);

    const check2 = ledger.check(sigId, sessId, nonce);
    expect(check2.fresh).toBe(false);
    expect(check2.reason).toBe("SIGNATURE_ALREADY_SEEN");

    const attackRes = simulateAttack(baseConfig, {
      type: "REPLAY",
      intensity: 1,
    });
    expect(attackRes.detected).toBe(true);
    expect(attackRes.riskScore).toBe(1);
    expect(attackRes.experiment.noise.model).toBe("NONE");
  });

  it("channel manipulation uses stochastic noise model", () => {
    const result1 = simulateAttack(
      { ...baseConfig, seed: 100 },
      { type: "CHANNEL_MANIPULATION", intensity: 0.8 }
    );

    const result2 = simulateAttack(
      { ...baseConfig, seed: 200 },
      { type: "CHANNEL_MANIPULATION", intensity: 0.8 }
    );

    expect(result1.attackType).toBe("CHANNEL_MANIPULATION");
    expect(result1.experiment.noise.model).toBe("DEPOLARIZING");
    expect(result2.experiment.noise.model).toBe("DEPOLARIZING");
    expect(result1.detected).toBe(true);
  });
});
