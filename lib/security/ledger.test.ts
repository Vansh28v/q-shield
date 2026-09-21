import {
  describe,
  expect,
  it,
  beforeEach,
} from "vitest";

import {
  ReplayLedger,
} from "./ledger";

describe("Replay protection ledger", () => {
  let ledger: ReplayLedger;

  beforeEach(() => {
    ledger = new ReplayLedger();
    ledger.clear();
  });
  it("accepts a new signature", () => {
    const ledger = new ReplayLedger();

    const result = ledger.check(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
    );

    expect(result.fresh).toBe(true);
    expect(result.reason).toBe("NEW");
  });

  it("records a new signature", () => {
    const ledger = new ReplayLedger();

    const record = ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
      1000,
    );

    expect(record.signatureId).toBe(
      "SIG-001",
    );

    expect(record.sessionId).toBe(
      "SESSION-001",
    );

    expect(record.nonce).toBe(
      "NONCE-001",
    );

    expect(record.signerId).toBe(
      "Alice",
    );

    expect(record.createdAt).toBe(1000);
    expect(record.consumed).toBe(true);
  });

  it("detects replay of the same signature", () => {
    const ledger = new ReplayLedger();

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
    );

    const result = ledger.check(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
    );

    expect(result.fresh).toBe(false);

    expect(result.reason).toBe(
      "SIGNATURE_ALREADY_SEEN",
    );
  });

  it("detects reuse of a nonce", () => {
    const ledger = new ReplayLedger();

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
    );

    const result = ledger.check(
      "SIG-002",
      "SESSION-002",
      "NONCE-001",
    );

    expect(result.fresh).toBe(false);

    expect(result.reason).toBe(
      "NONCE_ALREADY_SEEN",
    );
  });

  it("detects reuse of a session nonce pair", () => {
    const ledger = new ReplayLedger();

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
    );

    const result = ledger.check(
      "SIG-002",
      "SESSION-001",
      "NONCE-001",
    );

    /*
     * The signature is different, but the
     * session + nonce pair has already appeared.
     */
    expect(result.fresh).toBe(false);

    expect(result.reason).toBe(
      "SESSION_NONCE_ALREADY_SEEN",
    );
  });

  it("retrieves a recorded signature", () => {
    const ledger = new ReplayLedger();

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
      1234,
    );

    const record = ledger.get(
      "SIG-001",
    );

    expect(record).toBeDefined();
    expect(record?.signerId).toBe(
      "Alice",
    );
    expect(record?.createdAt).toBe(1234);
  });

  it("reports whether a signature exists", () => {
    const ledger = new ReplayLedger();

    expect(
      ledger.has("SIG-001"),
    ).toBe(false);

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
    );

    expect(
      ledger.has("SIG-001"),
    ).toBe(true);
  });

  it("tracks ledger size", () => {
    const ledger = new ReplayLedger();

    expect(ledger.size()).toBe(0);

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
    );

    ledger.record(
      "SIG-002",
      "SESSION-002",
      "NONCE-002",
      "Bob",
    );

    expect(ledger.size()).toBe(2);
  });

  it("rejects recording the same signature twice", () => {
    const ledger = new ReplayLedger();

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
    );

    expect(() =>
      ledger.record(
        "SIG-001",
        "SESSION-002",
        "NONCE-002",
        "Alice",
      ),
    ).toThrow(
      "SIGNATURE_ALREADY_SEEN",
    );
  });

  it("clears all records", () => {
    const ledger = new ReplayLedger();

    ledger.record(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
      "Alice",
    );

    ledger.clear();

    expect(ledger.size()).toBe(0);
    expect(
      ledger.has("SIG-001"),
    ).toBe(false);

    const result = ledger.check(
      "SIG-001",
      "SESSION-001",
      "NONCE-001",
    );

    expect(result.fresh).toBe(true);
  });

  it("rejects empty signature IDs", () => {
    const ledger = new ReplayLedger();

    expect(() =>
      ledger.check(
        "",
        "SESSION-001",
        "NONCE-001",
      ),
    ).toThrow();
  });

  it("rejects empty session IDs", () => {
    const ledger = new ReplayLedger();

    expect(() =>
      ledger.check(
        "SIG-001",
        "",
        "NONCE-001",
      ),
    ).toThrow();
  });

  it("rejects empty nonces", () => {
    const ledger = new ReplayLedger();

    expect(() =>
      ledger.check(
        "SIG-001",
        "SESSION-001",
        "",
      ),
    ).toThrow();
  });

  it("rejects an empty signer ID when recording", () => {
    const ledger = new ReplayLedger();

    expect(() =>
      ledger.record(
        "SIG-001",
        "SESSION-001",
        "NONCE-001",
        "",
      ),
    ).toThrow();
  });

  it("rejects non-finite timestamps", () => {
    const ledger = new ReplayLedger();

    expect(() =>
      ledger.record(
        "SIG-001",
        "SESSION-001",
        "NONCE-001",
        "Alice",
        Infinity,
      ),
    ).toThrow();
  });
});