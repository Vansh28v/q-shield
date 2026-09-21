import { describe, expect, it } from "vitest";
import {
  createQDSSignature,
  deriveQDSMaterial,
  verifyQDSSignature,
} from "./signature";

describe("Formal QDS Signature & Verification Protocol", () => {
  const privateKey = "SECRET_KEY_ALICE";
  const message = "Transfer 100 Q-Tokens";
  const signerId = "Alice";
  const sessionId = "SESSION-101";
  const nonce = "NONCE-999";

  it("deterministic key and signature generation", () => {
    const derived1 = deriveQDSMaterial(privateKey, message, signerId, nonce, 8, 123);
    const derived2 = deriveQDSMaterial(privateKey, message, signerId, nonce, 8, 123);

    expect(derived1.bases).toEqual(derived2.bases);
    expect(derived1.expectedEigenvalues).toEqual(derived2.expectedEigenvalues);
    expect(derived1.seed).toBe(derived2.seed);
  });

  it("same key + same message + same seed gives reproducible result", () => {
    const sig1 = createQDSSignature("SIG-1", message, signerId, sessionId, nonce, privateKey, 8, 100);
    const sig2 = createQDSSignature("SIG-2", message, signerId, sessionId, nonce, privateKey, 8, 100);

    expect(sig1.bases).toEqual(sig2.bases);
    expect(sig1.expectedEigenvalues).toEqual(sig2.expectedEigenvalues);
  });

  it("different messages produce different digest and signature material", () => {
    const derivedA = deriveQDSMaterial(privateKey, "Message A", signerId, nonce, 8, 100);
    const derivedB = deriveQDSMaterial(privateKey, "Message B", signerId, nonce, 8, 100);

    const isDifferent =
      JSON.stringify(derivedA.bases) !== JSON.stringify(derivedB.bases) ||
      JSON.stringify(derivedA.expectedEigenvalues) !== JSON.stringify(derivedB.expectedEigenvalues);

    expect(isDifferent).toBe(true);
  });

  it("honest signature accepted at zero noise", () => {
    const signature = createQDSSignature("SIG-1", message, signerId, sessionId, nonce, privateKey, 8, 100);

    const verification = verifyQDSSignature(signature, message, signerId, {
      privateKey,
      noiseModel: "NONE",
      noiseProbability: 0,
      shotsPerQubit: 50,
      seed: 100,
    });

    expect(verification.valid).toBe(true);
    expect(verification.accepted).toBe(true);
    expect(verification.decision).toBe("ACCEPT");
    expect(verification.observedErrorRate).toBe(0);
  });

  it("honest signature remains acceptable under configured legitimate noise", () => {
    const signature = createQDSSignature("SIG-1", message, signerId, sessionId, nonce, privateKey, 8, 100);

    const verification = verifyQDSSignature(signature, message, signerId, {
      privateKey,
      noiseModel: "BIT_FLIP",
      noiseProbability: 0.01,
      shotsPerQubit: 200,
      legitimateNoiseRate: 0.05,
      seed: 100,
    });

    expect(verification.valid).toBe(true);
    expect(verification.decision).toBe("ACCEPT");
    expect(verification.observedErrorRate).toBeLessThanOrEqual(verification.threshold!);
  });
});
