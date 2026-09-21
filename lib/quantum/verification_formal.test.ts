import { describe, expect, it } from "vitest";
import { createQDSSignature, verifyQDSSignature } from "../security/signature";

describe("Verification Mechanics", () => {
  const privateKey = "SECRET_KEY_BOB";
  const message = "Authorize Payment";
  const signerId = "Bob";
  const sessionId = "SESS-500";
  const nonce = "NONCE-500";

  it("forged signature (wrong private key / bases) rejected with high probability", () => {
    const realSignature = createQDSSignature("SIG-REAL", message, signerId, sessionId, nonce, privateKey, 8, 100);

    const verification = verifyQDSSignature(realSignature, message, signerId, {
      privateKey: "ATTACKER_FAKE_KEY",
      shotsPerQubit: 100,
      seed: 100,
    });

    expect(verification.valid).toBe(false);
    expect(verification.decision).toBe("REJECT");
    expect(verification.observedErrorRate).toBeGreaterThan(0.15);
  });

  it("incorrect basis / eigenvalue produces measurable errors", () => {
    const signature = createQDSSignature("SIG-1", message, signerId, sessionId, nonce, privateKey, 8, 100);

    const verificationMismatch = verifyQDSSignature(signature, "Wrong Message Content", signerId, {
      privateKey,
      shotsPerQubit: 50,
      seed: 100,
    });

    expect(verificationMismatch.valid).toBe(false);
    expect(verificationMismatch.messageMatch).toBe(false);
    expect(verificationMismatch.reason).toContain("Message mismatch");
  });

  it("threshold changes actually affect decisions", () => {
    const signature = createQDSSignature("SIG-1", message, signerId, sessionId, nonce, privateKey, 8, 100);

    // Run with noise probability 0.15
    const strictVerification = verifyQDSSignature(signature, message, signerId, {
      privateKey,
      noiseModel: "BIT_FLIP",
      noiseProbability: 0.15,
      shotsPerQubit: 100,
      legitimateNoiseRate: 0.01,
      seed: 100,
    });

    const lenientVerification = verifyQDSSignature(signature, message, signerId, {
      privateKey,
      noiseModel: "BIT_FLIP",
      noiseProbability: 0.15,
      shotsPerQubit: 100,
      legitimateNoiseRate: 0.30,
      seed: 100,
    });

    expect(strictVerification.valid).toBe(false);
    expect(lenientVerification.valid).toBe(true);
  });
});
