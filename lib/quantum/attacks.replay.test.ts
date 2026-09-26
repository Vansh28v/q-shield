import {
  describe,
  expect,
  test,
} from "vitest";

import {
  simulateAttack,
  AttackConfig,
} from "./attacks";

import {
  QDSExperimentConfig,
} from "./simulator";

import {
  ReplayLedger,
} from "../security/ledger";

function createConfig(
  overrides: Partial<QDSExperimentConfig> = {},
): QDSExperimentConfig {
  return {
    alpha: 0.8,
    beta: 0.6,
    shots: 1000,
    threshold: 0.05,

    seed: 20260919,

    experimentId:
      "REPLAY-TEST-EXPERIMENT",

    sessionId:
      "REPLAY-TEST-SESSION",

    signatureId:
      "REPLAY-TEST-SIGNATURE",

    signerId:
      "REPLAY-TEST-SIGNER",

    message:
      "Q-SHIELD REPLAY TEST",

    nonce:
      "REPLAY-TEST-NONCE",

    ...overrides,
  };
}

const replayAttack: AttackConfig = {
  type: "REPLAY",
  intensity: 1,
};

describe(
  "REPLAY attack detection",
  () => {
    test(
      "TEST 1 — a brand-new transaction is not detected as a replay",
      () => {
        const config =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-1",

            signatureId:
              "REPLAY-TEST-SIGNATURE-1",

            nonce:
              "REPLAY-TEST-NONCE-1",
          });

        const result =
          simulateAttack(
            config,
            replayAttack,
          );

        expect(
          result.detected,
        ).toBe(false);

        expect(
          result.decision,
        ).toBe("ACCEPT");

        expect(
          result.mechanism,
        ).toBe("REPLAY_LEDGER");
      },
    );

    test(
      "TEST 2 — resubmitting the exact same transaction is detected as a replay",
      () => {
        const config =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-2",

            signatureId:
              "REPLAY-TEST-SIGNATURE-2",

            nonce:
              "REPLAY-TEST-NONCE-2",
          });

        const first =
          simulateAttack(
            config,
            replayAttack,
          );

        expect(
          first.detected,
        ).toBe(false);

        expect(
          first.decision,
        ).toBe("ACCEPT");

        const second =
          simulateAttack(
            config,
            replayAttack,
          );

        expect(
          second.detected,
        ).toBe(true);

        expect(
          second.decision,
        ).toBe("REJECT");

        expect(
          second.mechanism,
        ).toBe("REPLAY_LEDGER");

        expect(
          second.riskScore,
        ).toBe(1);

        expect(
          second.evidence.toLowerCase(),
        ).toContain(
          "replay ledger",
        );
      },
    );

    test(
      "TEST 3 — same session and signature, different nonce, is fresh",
      () => {
        const firstConfig =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-3",

            signatureId:
              "REPLAY-TEST-SIGNATURE-3",

            nonce:
              "REPLAY-TEST-NONCE-3A",
          });

        const secondConfig =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-3",

            signatureId:
              "REPLAY-TEST-SIGNATURE-3",

            nonce:
              "REPLAY-TEST-NONCE-3B",
          });

        const first =
          simulateAttack(
            firstConfig,
            replayAttack,
          );

        expect(
          first.detected,
        ).toBe(false);

        const second =
          simulateAttack(
            secondConfig,
            replayAttack,
          );

        expect(
          second.detected,
        ).toBe(false);

        expect(
          second.decision,
        ).toBe("ACCEPT");
      },
    );

    test(
      "TEST 4 — same nonce and signature, different session, is fresh",
      () => {
        const firstConfig =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-4A",

            signatureId:
              "REPLAY-TEST-SIGNATURE-4",

            nonce:
              "REPLAY-TEST-NONCE-4",
          });

        const secondConfig =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-4B",

            signatureId:
              "REPLAY-TEST-SIGNATURE-4",

            nonce:
              "REPLAY-TEST-NONCE-4",
          });

        const first =
          simulateAttack(
            firstConfig,
            replayAttack,
          );

        expect(
          first.detected,
        ).toBe(false);

        const second =
          simulateAttack(
            secondConfig,
            replayAttack,
          );

        expect(
          second.detected,
        ).toBe(false);

        expect(
          second.decision,
        ).toBe("ACCEPT");
      },
    );

    test(
      "TEST 5 — same session and nonce, different signature, is fresh",
      () => {
        const firstConfig =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-5",

            signatureId:
              "REPLAY-TEST-SIGNATURE-5A",

            nonce:
              "REPLAY-TEST-NONCE-5",
          });

        const secondConfig =
          createConfig({
            sessionId:
              "REPLAY-TEST-SESSION-5",

            signatureId:
              "REPLAY-TEST-SIGNATURE-5B",

            nonce:
              "REPLAY-TEST-NONCE-5",
          });

        const first =
          simulateAttack(
            firstConfig,
            replayAttack,
          );

        expect(
          first.detected,
        ).toBe(false);

        const second =
          simulateAttack(
            secondConfig,
            replayAttack,
          );

        expect(
          second.detected,
        ).toBe(false);

        expect(
          second.decision,
        ).toBe("ACCEPT");
      },
    );

    test(
      "TEST 6 — persistence: replay is detected across separate ledger instances",
      () => {
        const signatureId =
          "REPLAY-PERSIST-SIGNATURE";

        const sessionId =
          "REPLAY-PERSIST-SESSION";

        const nonce =
          "REPLAY-PERSIST-NONCE";

        const signerId =
          "REPLAY-PERSIST-SIGNER";

        /*
         * Establish the transaction through one ledger instance.
         */
        const firstLedger =
          new ReplayLedger();

        const firstCheck =
          firstLedger.check(
            signatureId,
            sessionId,
            nonce,
          );

        expect(
          firstCheck.fresh,
        ).toBe(true);

        firstLedger.record(
          signatureId,
          sessionId,
          nonce,
          signerId,
          Date.now(),
        );

        /*
         * Create a completely separate ledger instance.
         *
         * If persistence works, this new instance must still
         * know that the transaction was already consumed.
         */
        const secondLedger =
          new ReplayLedger();

        const secondCheck =
          secondLedger.check(
            signatureId,
            sessionId,
            nonce,
          );

        expect(
          secondCheck.fresh,
        ).toBe(false);
      },
    );

    test(
      "does not gate replay detection on intensity",
      () => {
        const config =
          createConfig({
            sessionId:
              "REPLAY-INTENSITY-SESSION",

            signatureId:
              "REPLAY-INTENSITY-SIGNATURE",

            nonce:
              "REPLAY-INTENSITY-NONCE",
          });

        const zeroIntensityAttack:
          AttackConfig = {
            type: "REPLAY",
            intensity: 0,
          };

        const first =
          simulateAttack(
            config,
            zeroIntensityAttack,
          );

        expect(
          first.detected,
        ).toBe(false);

        const second =
          simulateAttack(
            config,
            zeroIntensityAttack,
          );

        expect(
          second.detected,
        ).toBe(true);

        expect(
          second.decision,
        ).toBe("REJECT");
      },
    );

    test(
      "throws a clear error when required identifiers are missing",
      () => {
        const config =
          createConfig({
            sessionId:
              undefined,

            signatureId:
              undefined,

            nonce:
              undefined,

            signerId:
              undefined,
          });

        expect(
          () =>
            simulateAttack(
              config,
              replayAttack,
            ),
        ).toThrow(
          /replay detection requires/i,
        );
      },
    );
  },
);