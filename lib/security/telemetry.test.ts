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

import {
  createExperimentTelemetry,
  createSecurityEvent,
  createSecurityTelemetry,
  resetTelemetryCounter,
} from "./telemetry";

function createConfig(): SecurityExperimentConfig {
  return {
    experimentId:
      "EXP-TEL-001",

    sessionId:
      "SESSION-TEL-001",

    signatureId:
      "SIG-TEL-001",

    signerId:
      "SIGNER-TEL-001",

    message:
      "Telemetry test message",

    nonce:
      "NONCE-TEL-001",

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

function createExperiment() {
  const ledger =
    new ReplayLedger({
      memoryOnly: true,
    });

  return runSecurityExperiment(
    createConfig(),
    ledger,
  );
}

describe(
  "Q-SHIELD telemetry",
  () => {
    beforeEach(() => {
      resetTelemetryCounter();
    });

    it(
      "creates telemetry from an experiment",
      () => {
        const result =
          createExperiment();

        const telemetry =
          createSecurityTelemetry(
            result,
          );

        expect(
          telemetry.experimentId,
        ).toBe(
          "EXP-TEL-001",
        );

        expect(
          telemetry.sessionId,
        ).toBe(
          "SESSION-TEL-001",
        );

        expect(
          telemetry.signatureId,
        ).toBe(
          "SIG-TEL-001",
        );

        expect(
          telemetry.verificationAccepted,
        ).toBe(true);

        expect(
          telemetry.threatDetected,
        ).toBe(false);

        expect(
          telemetry.threatType,
        ).toBe("NONE");

        expect(
          telemetry.latencyMs,
        ).toBeGreaterThanOrEqual(0);
      },
    );

    it(
      "creates a security event",
      () => {
        const result =
          createExperiment();

        const event =
          createSecurityEvent(
            result,
          );

        expect(
          event.id,
        ).toMatch(
          /^EVT-\d+-1$/,
        );

        expect(
          event.type,
        ).toBe(
          "SIGNATURE_VERIFIED",
        );

        expect(
          event.severity,
        ).toBe("INFO");

        expect(
          event.sessionId,
        ).toBe(
          "SESSION-TEL-001",
        );

        expect(
          event.signatureId,
        ).toBe(
          "SIG-TEL-001",
        );

        expect(
          event.signerId,
        ).toBe(
          "SIGNER-TEL-001",
        );
      },
    );

    it(
      "includes experiment metadata in events",
      () => {
        const result =
          createExperiment();

        const event =
          createSecurityEvent(
            result,
          );

        expect(
          event.metadata,
        ).toBeDefined();

        expect(
          event.metadata?.experimentId,
        ).toBe(
          "EXP-TEL-001",
        );

        expect(
          event.metadata?.latencyMs,
        ).toBe(
          result.latencyMs,
        );

        expect(
          event.metadata
            ?.verificationAccepted,
        ).toBe(true);
      },
    );

    it(
      "creates event and telemetry together",
      () => {
        const result =
          createExperiment();

        const records =
          createExperimentTelemetry(
            result,
          );

        expect(
          records.event,
        ).toBeDefined();

        expect(
          records.telemetry,
        ).toBeDefined();

        expect(
          records.event.metadata
            ?.experimentId,
        ).toBe(
          "EXP-TEL-001",
        );

        expect(
          records.telemetry
            .experimentId,
        ).toBe(
          "EXP-TEL-001",
        );
      },
    );

    it(
      "generates unique event IDs",
      () => {
        const first =
          createExperiment();

        const secondConfig =
          createConfig();

        secondConfig.experimentId =
          "EXP-TEL-002";

        secondConfig.sessionId =
          "SESSION-TEL-002";

        secondConfig.signatureId =
          "SIG-TEL-002";

        secondConfig.nonce =
          "NONCE-TEL-002";

        const ledger =
          new ReplayLedger({
            memoryOnly: true,
          });

        const second =
          runSecurityExperiment(
            secondConfig,
            ledger,
          );

        const firstEvent =
          createSecurityEvent(
            first,
          );

        const secondEvent =
          createSecurityEvent(
            second,
          );

        expect(
          firstEvent.id,
        ).not.toBe(
          secondEvent.id,
        );
      },
    );

    it(
      "resets event ID counter",
      () => {
        const first =
          createExperiment();

        const firstEvent =
          createSecurityEvent(
            first,
          );

        expect(
          firstEvent.id,
        ).toMatch(
          /^EVT-\d+-1$/,
        );

        resetTelemetryCounter();

        const second =
          createExperiment();

        const secondEvent =
          createSecurityEvent(
            second,
          );

        expect(
          secondEvent.id,
        ).toMatch(
          /^EVT-\d+-1$/,
        );
      },
    );

    it(
      "creates a replay event",
      () => {
        const config =
          createConfig();

        const ledger =
          new ReplayLedger({
            memoryOnly: true,
          });

        runSecurityExperiment(
          config,
          ledger,
        );

        const replay =
          runSecurityExperiment(
            config,
            ledger,
          );

        const event =
          createSecurityEvent(
            replay,
          );

        expect(
          event.type,
        ).toBe(
          "REPLAY_DETECTED",
        );

        expect(
          event.severity,
        ).toBe(
          "CRITICAL",
        );

        expect(
          event.threatType,
        ).toBe("REPLAY");

        expect(
          event.riskScore,
        ).toBe(1);
      },
    );

    it(
      "creates an unauthorized verification event",
      () => {
        const config =
          createConfig();

        config.unauthorizedVerification =
          true;

        const ledger =
          new ReplayLedger({
            memoryOnly: true,
          });

        const result =
          runSecurityExperiment(
            config,
            ledger,
          );

        const event =
          createSecurityEvent(
            result,
          );

        expect(
          event.type,
        ).toBe(
          "UNAUTHORIZED_VERIFICATION",
        );

        expect(
          event.severity,
        ).toBe(
          "CRITICAL",
        );
      },
    );

    it(
      "rejects an empty experiment id",
      () => {
        const result =
          createExperiment();

        const invalidResult = {
          ...result,
          experimentId: "",
        };

        expect(() =>
          createSecurityEvent(
            invalidResult,
          ),
        ).toThrow();
      },
    );
  },
);