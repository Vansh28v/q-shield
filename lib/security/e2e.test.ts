import { describe, expect, it, beforeEach } from "vitest";
import {
  createQDSSignature,
  verifyQDSSignature,
} from "./signature";
import { ReplayLedger } from "./ledger";
import { runSecurityExperiment } from "./experiment";
import { simulateAttack } from "../quantum/attacks";
import { simulateCHSH } from "../quantum/chsh";
import { DatabaseSync } from "node:sqlite";

describe("Q-SHIELD End-to-End Security & Protocol Integration Tests", () => {
  const privateKey = "ALICE_PRIVATE_KEY_E2E";
  const message = "Transfer 10,000 Q-Tokens";
  const signerId = "Alice_E2E";
  const sessionId = "SESSION-E2E-100";
  const nonce = "NONCE-E2E-100";

  it("1. HONEST FLOW: private key -> QDS signature -> teleportation/measurement -> verification -> ACCEPT", () => {
    const signature = createQDSSignature(
      "SIG-E2E-1",
      message,
      signerId,
      sessionId,
      nonce,
      privateKey,
      8,
      12345,
    );

    const verification = verifyQDSSignature(
      signature,
      message,
      signerId,
      {
        privateKey,
        noiseModel: "NONE",
        noiseProbability: 0,
        shotsPerQubit: 100,
        seed: 12345,
      },
    );

    expect(verification.valid).toBe(true);
    expect(verification.accepted).toBe(true);
    expect(verification.decision).toBe("ACCEPT");
    expect(verification.observedErrorRate).toBe(0);
  });

  it("2. FORGERY: forged signature -> verification -> REJECT", () => {
    const signature = createQDSSignature(
      "SIG-FORGED-1",
      message,
      signerId,
      sessionId,
      nonce,
      privateKey,
      8,
      12345,
    );

    const verification = verifyQDSSignature(
      signature,
      message,
      signerId,
      {
        privateKey: "ATTACKER_FAKE_PRIVATE_KEY",
        shotsPerQubit: 100,
        seed: 12345,
      },
    );

    expect(verification.valid).toBe(false);
    expect(verification.accepted).toBe(false);
    expect(verification.decision).toBe("REJECT");
    expect(verification.observedErrorRate).toBeGreaterThan(0.15);
  });

  it("3. REPLAY: first valid signature -> ACCEPT, same nonce/session again -> REJECT", () => {
    const ledger = new ReplayLedger({ memoryOnly: true });

    const check1 = ledger.check("SIG-R1", "SESS-R1", "NONCE-R1");
    expect(check1.fresh).toBe(true);

    ledger.record("SIG-R1", "SESS-R1", "NONCE-R1", "Alice", 1000);

    const check2 = ledger.check("SIG-R1", "SESS-R1", "NONCE-R1");
    expect(check2.fresh).toBe(false);
    expect(check2.reason).toBe("SIGNATURE_ALREADY_SEEN");

    expect(() =>
      ledger.record("SIG-R1", "SESS-R1", "NONCE-R1", "Alice", 1001),
    ).toThrow();
  });

  it("4. RESTART / PERSISTENCE TEST: record nonce -> recreate ledger/database connection -> same nonce -> REJECT", () => {
    // Create an isolated in-memory SQLite database instance
    const db = new DatabaseSync(":memory:");
    db.exec(`
      CREATE TABLE IF NOT EXISTS replay_ledger (
        signature_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        nonce TEXT NOT NULL,
        signer_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(session_id, nonce)
      );
    `);

    // First process connection
    const ledger1 = new ReplayLedger({ db });
    ledger1.record("SIG-PERSIST-1", "SESS-PERSIST-1", "NONCE-PERSIST-1", "Alice", 1000);

    // Simulate process restart by instantiating a new Ledger with the same database connection
    const ledger2 = new ReplayLedger({ db });
    const checkAfterRestart = ledger2.check("SIG-PERSIST-1", "SESS-PERSIST-1", "NONCE-PERSIST-1");

    expect(checkAfterRestart.fresh).toBe(false);
    expect(checkAfterRestart.reason).toBe("SIGNATURE_ALREADY_SEEN");

    const checkReplayedNonce = ledger2.check("NEW-SIG", "SESS-PERSIST-1", "NONCE-PERSIST-1");
    expect(checkReplayedNonce.fresh).toBe(false);
    expect(checkReplayedNonce.reason).toBe("SESSION_NONCE_ALREADY_SEEN");
  });

  it("5. CHANNEL ATTACK: Bell-state channel simulation -> CHSH degradation -> threat detection", () => {
    const cleanCHSH = simulateCHSH({
      noiseModel: "NONE",
      noiseProbability: 0,
      seed: 12345,
    });
    expect(cleanCHSH.violatesClassicalBound).toBe(true);
    expect(cleanCHSH.S).toBeGreaterThan(2.0);

    const noisyCHSH = simulateCHSH({
      noiseModel: "DEPOLARIZING",
      noiseProbability: 0.8,
      seed: 12345,
    });
    expect(noisyCHSH.violatesClassicalBound).toBe(false);
    expect(noisyCHSH.S).toBeLessThan(2.0);

    const attackRes = simulateAttack(
      {
        alpha: 1,
        beta: 0,
        shots: 1000,
        threshold: 0.05,
        seed: 12345,
      },
      { type: "CHANNEL_MANIPULATION", intensity: 0.8 },
    );

    expect(attackRes.detected).toBe(true);
    expect(attackRes.riskScore).toBeGreaterThan(0.5);
  });

  it("6. DETERMINISM: same seed + same parameters -> identical experiment result", () => {
    const config = {
      experimentId: "EXP-DET-1",
      sessionId: "SESS-DET-1",
      signatureId: "SIG-DET-1",
      signerId: "Alice",
      message: "Deterministic Test",
      nonce: "NONCE-DET-1",
      alpha: 1,
      beta: 0,
      shots: 1000,
      threshold: 0.05,
      seed: 99999,
    };

    const ledgerA = new ReplayLedger({ memoryOnly: true });
    const ledgerB = new ReplayLedger({ memoryOnly: true });

    const resA = runSecurityExperiment(config, ledgerA);
    const resB = runSecurityExperiment(config, ledgerB);

    expect(resA.quantum.verification.deviation).toBe(resB.quantum.verification.deviation);
    expect(resA.quantum.chsh.S).toBe(resB.quantum.chsh.S);
    expect(resA.threat.riskScore).toBe(resB.threat.riskScore);
  });

  it("7. DIFFERENT SEEDS: same parameters + different seeds -> capable of producing different sampled results", () => {
    const configBase = {
      experimentId: "EXP-DIFF-1",
      sessionId: "SESS-DIFF-1",
      signatureId: "SIG-DIFF-1",
      signerId: "Alice",
      message: "Different Seeds Test",
      nonce: "NONCE-DIFF-1",
      alpha: 0.7071,
      beta: 0.7071,
      shots: 50,
      threshold: 0.05,
    };

    const ledger1 = new ReplayLedger({ memoryOnly: true });
    const ledger2 = new ReplayLedger({ memoryOnly: true });

    const res1 = runSecurityExperiment({ ...configBase, seed: 11111 }, ledger1);
    const res2 = runSecurityExperiment({ ...configBase, seed: 99999 }, ledger2);

    expect(res1.quantum.measurement.results).not.toEqual(res2.quantum.measurement.results);
  });
});
