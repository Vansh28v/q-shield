import { describe, expect, it } from "vitest";

import {
  createSignature,
  verifySignature,
  verifySignatureState,
} from "./signature";

import {
  createBasisState,
} from "../quantum/state";

describe("QDS signature", () => {
  const state = createBasisState(
    ["0", "1"],
    0,
  );

  const differentState = createBasisState(
    ["0", "1"],
    1,
  );

  const signature = createSignature(
    "SIG-001",
    "Hello Quantum",
    "Alice",
    "SESSION-001",
    "NONCE-001",
    state,
    1000,
  );

  it("creates a signature record", () => {
    expect(signature.signatureId).toBe(
      "SIG-001",
    );

    expect(signature.message).toBe(
      "Hello Quantum",
    );

    expect(signature.signerId).toBe(
      "Alice",
    );

    expect(signature.sessionId).toBe(
      "SESSION-001",
    );

    expect(signature.nonce).toBe(
      "NONCE-001",
    );

    expect(signature.createdAt).toBe(1000);
  });

  it("accepts an identical quantum state", () => {
    expect(
      verifySignatureState(
        state,
        state,
        0.99,
      ),
    ).toBe(true);
  });

  it("rejects a different quantum state", () => {
    expect(
      verifySignatureState(
        differentState,
        state,
        0.99,
      ),
    ).toBe(false);
  });

  it("accepts a valid complete signature", () => {
    const result = verifySignature(
      signature,
      "Hello Quantum",
      "Alice",
      state,
      0.99,
    );

    expect(result.valid).toBe(true);
    expect(result.messageMatch).toBe(true);
    expect(result.signerMatch).toBe(true);
    expect(result.fidelity).toBeCloseTo(1, 10);
  });

  it("rejects a modified message", () => {
    const result = verifySignature(
      signature,
      "Modified Message",
      "Alice",
      state,
      0.99,
    );

    expect(result.valid).toBe(false);
    expect(result.messageMatch).toBe(false);
    expect(result.signerMatch).toBe(true);
  });

  it("rejects an unexpected signer", () => {
    const result = verifySignature(
      signature,
      "Hello Quantum",
      "Mallory",
      state,
      0.99,
    );

    expect(result.valid).toBe(false);
    expect(result.messageMatch).toBe(true);
    expect(result.signerMatch).toBe(false);
  });

  it("rejects a different quantum state", () => {
    const result = verifySignature(
      signature,
      "Hello Quantum",
      "Alice",
      differentState,
      0.99,
    );

    expect(result.valid).toBe(false);
    expect(result.fidelity).toBeCloseTo(0, 10);
  });

  it("rejects an empty signature ID", () => {
    expect(() =>
      createSignature(
        "",
        "Hello",
        "Alice",
        "SESSION",
        "NONCE",
        state,
      ),
    ).toThrow();
  });

  it("rejects an empty message", () => {
    expect(() =>
      createSignature(
        "SIG",
        "",
        "Alice",
        "SESSION",
        "NONCE",
        state,
      ),
    ).toThrow();
  });

  it("rejects an empty signer ID", () => {
    expect(() =>
      createSignature(
        "SIG",
        "Hello",
        "",
        "SESSION",
        "NONCE",
        state,
      ),
    ).toThrow();
  });

  it("rejects an invalid fidelity threshold", () => {
    expect(() =>
      verifySignatureState(
        state,
        state,
        1.1,
      ),
    ).toThrow();

    expect(() =>
      verifySignatureState(
        state,
        state,
        -0.1,
      ),
    ).toThrow();
  });
});