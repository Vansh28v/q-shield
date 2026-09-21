import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  runSecurityExperiment,
  SecurityExperimentConfig,
} from "./experiment";

import {
  ReplayLedger,
} from "./ledger";

function createConfig(): SecurityExperimentConfig {
  return {
    experimentId:
      "EXP-001",

    sessionId:
      "SESSION-001",

    signatureId:
      "SIG-001",

    signerId:
      "SIGNER-001",

    message:
      "Q-SHIELD test message",

    nonce:
      "NONCE-001",

    alpha:
      1,

    beta:
      0,

    shots:
      1000,

    threshold:
      0.1,

    seed:
      42,
  };
}

describe(
  "Q-SHIELD security experiment",
  () => {
    let ledger: ReplayLedger;

    beforeEach(() => {
      ledger =
        new ReplayLedger({
          memoryOnly: true,
        });
    });

    it(
      "runs a complete clean experiment",
      () => {
        const result =
          runSecurityExperiment(
            createConfig(),
            ledger,
          );

        expect(
          result.experimentId,
        ).toBe("EXP-001");

        expect(
          result.session.sessionId,
        ).toBe("SESSION-001");

        expect(
          result.signature.signatureId,
        ).toBe("SIG-001");

        expect(
          result.signatureVerification.valid,
        ).toBe(true);

        expect(
          result.replay.fresh,
        ).toBe(true);

        expect(
          result.threat.detected,
        ).toBe(false);

        expect(
          result.threat.threatType,
        ).toBe("NONE");

        expect(
          result.latencyMs,
        ).toBeGreaterThanOrEqual(0);
      },
    );

    it(
      "records a successful signature in the replay ledger",
      () => {
        const result =
          runSecurityExperiment(
            createConfig(),
            ledger,
          );

        expect(
          ledger.has("SIG-001"),
        ).toBe(true);

        expect(
          ledger.size(),
        ).toBe(1);

        expect(
          result.replay.reason,
        ).toBe("NEW");
      },
    );

    it(
      "detects a replay of the same signature",
      () => {
        const config =
          createConfig();

        const first =
          runSecurityExperiment(
            config,
            ledger,
          );

        const second =
          runSecurityExperiment(
            config,
            ledger,
          );

        expect(
          first.replay.fresh,
        ).toBe(true);

        expect(
          second.replay.fresh,
        ).toBe(false);

        expect(
          second.replay.reason,
        ).toBe(
          "SIGNATURE_ALREADY_SEEN",
        );

        expect(
          second.threat.detected,
        ).toBe(true);

        expect(
          second.threat.threatType,
        ).toBe("REPLAY");

        expect(
          second.threat.riskScore,
        ).toBe(1);
      },
    );

    it(
      "supports a different session and nonce",
      () => {
        const firstConfig =
          createConfig();

        const secondConfig =
          createConfig();

        secondConfig.experimentId =
          "EXP-002";

        secondConfig.sessionId =
          "SESSION-002";

        secondConfig.signatureId =
          "SIG-002";

        secondConfig.nonce =
          "NONCE-002";

        const first =
          runSecurityExperiment(
            firstConfig,
            ledger,
          );

        const second =
          runSecurityExperiment(
            secondConfig,
            ledger,
          );

        expect(
          first.replay.fresh,
        ).toBe(true);

        expect(
          second.replay.fresh,
        ).toBe(true);

        expect(
          second.threat.detected,
        ).toBe(false);

        expect(
          ledger.size(),
        ).toBe(2);
      },
    );

    it(
      "detects an unauthorized verification attempt",
      () => {
        const config =
          createConfig();

        config.unauthorizedVerification =
          true;

        const result =
          runSecurityExperiment(
            config,
            ledger,
          );

        expect(
          result.threat.detected,
        ).toBe(true);

        expect(
          result.threat.threatType,
        ).toBe(
          "UNAUTHORIZED_VERIFICATION",
        );

        expect(
          result.threat.riskScore,
        ).toBe(0.9);
      },
    );

    it(
      "uses the expected message when supplied",
      () => {
        const config =
          createConfig();

        config.expectedMessage =
          "different message";

        const result =
          runSecurityExperiment(
            config,
            ledger,
          );

        expect(
          result.signatureVerification
            .messageMatch,
        ).toBe(false);
      },
    );

    it(
      "uses the expected signer when supplied",
      () => {
        const config =
          createConfig();

        config.expectedSignerId =
          "different-signer";

        const result =
          runSecurityExperiment(
            config,
            ledger,
          );

        expect(
          result.signatureVerification
            .signerMatch,
        ).toBe(false);
      },
    );

    it(
      "keeps deterministic results with the same seed",
      () => {
        const firstLedger =
          new ReplayLedger({
            memoryOnly: true,
          });

        const secondLedger =
          new ReplayLedger({
            memoryOnly: true,
          });

        const first =
          runSecurityExperiment(
            createConfig(),
            firstLedger,
          );

        const second =
          runSecurityExperiment(
            createConfig(),
            secondLedger,
          );

        expect(
          first.quantum.measurement,
        ).toEqual(
          second.quantum.measurement,
        );

        expect(
          first.quantum.statistics,
        ).toEqual(
          second.quantum.statistics,
        );

        expect(
          first.quantum.verification,
        ).toEqual(
          second.quantum.verification,
        );
      },
    );

    it(
      "rejects an empty message",
      () => {
        const config =
          createConfig();

        config.message = "";

        expect(() =>
          runSecurityExperiment(
            config,
            ledger,
          ),
        ).toThrow();
      },
    );

    it(
      "rejects an empty nonce",
      () => {
        const config =
          createConfig();

        config.nonce = "";

        expect(() =>
          runSecurityExperiment(
            config,
            ledger,
          ),
        ).toThrow();
      },
    );

    it(
      "rejects an empty signer id",
      () => {
        const config =
          createConfig();

        config.signerId = "";

        expect(() =>
          runSecurityExperiment(
            config,
            ledger,
          ),
        ).toThrow();
      },
    );
  },
);