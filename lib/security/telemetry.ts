import {
  SecurityEvent,
  SecurityEventSeverity,
  SecurityEventType,
  SecurityTelemetry,
} from "./types";

import {
  SecurityExperimentResult,
} from "./experiment";

let eventCounter = 0;

/**
 * Generate a deterministic in-process event ID.
 *
 * This is intentionally simple for the prototype.
 * It is not a cryptographic identifier.
 */
function createEventId(
  timestamp: number,
): string {
  eventCounter += 1;

  return `EVT-${timestamp}-${eventCounter}`;
}

/**
 * Convert a threat result into an event severity.
 */
function getThreatSeverity(
  level: SecurityExperimentResult["threat"]["threatLevel"],
): SecurityEventSeverity {
  switch (level) {
    case "CRITICAL":
      return "CRITICAL";

    case "HIGH":
      return "HIGH";

    case "MEDIUM":
      return "MEDIUM";

    case "LOW":
      return "LOW";

    case "NONE":
    default:
      return "INFO";
  }
}

/**
 * Convert the experiment result into a security event.
 */
export function createSecurityEvent(
  result: SecurityExperimentResult,
): SecurityEvent {
  const {
    experimentId,
    session,
    threat,
    signature,
    latencyMs,
    createdAt,
  } = result;

  if (!experimentId.trim()) {
    throw new Error(
      "experimentId must not be empty",
    );
  }

  let type: SecurityEventType;

  if (
    threat.threatType === "REPLAY"
  ) {
    type = "REPLAY_DETECTED";
  } else if (
    threat.threatType ===
    "UNAUTHORIZED_VERIFICATION"
  ) {
    type =
      "UNAUTHORIZED_VERIFICATION";
  } else if (
    threat.threatType ===
    "QUANTUM_CHANNEL_ANOMALY"
  ) {
    type = "CHANNEL_ANOMALY";
  } else if (threat.detected) {
    type = "THREAT_DETECTED";
  } else if (
    session.verification?.valid
  ) {
    type = "SIGNATURE_VERIFIED";
  } else {
    type = "SIGNATURE_REJECTED";
  }

  const severity =
    getThreatSeverity(
      threat.threatLevel,
    );

  const message =
    threat.detected
      ? `Q-SHIELD detected ${threat.threatType} with risk score ${threat.riskScore.toFixed(3)}.`
      : "Q-SHIELD verification completed without a detected security threat.";

  return {
    id: createEventId(
      createdAt,
    ),

    type,

    severity,

    timestamp: createdAt,

    message,

    sessionId:
      session.sessionId,

    signatureId:
      signature.signatureId,

    signerId:
      signature.signerId,

    threatType:
      threat.threatType,

    riskScore:
      threat.riskScore,

    metadata: {
      experimentId,

      latencyMs,

      verificationAccepted:
        result.quantum.verification
          .accepted,

      deviation:
        result.quantum.verification
          .deviation,
    },
  };
}

/**
 * Convert an experiment result into dashboard telemetry.
 */
export function createSecurityTelemetry(
  result: SecurityExperimentResult,
): SecurityTelemetry {
  return {
    timestamp:
      result.createdAt,

    experimentId:
      result.experimentId,

    sessionId:
      result.session.sessionId,

    signatureId:
      result.signature.signatureId,

    verificationAccepted:
      result.quantum.verification
        .accepted,

    deviation:
      result.quantum.verification
        .deviation,

    riskScore:
      result.threat.riskScore,

    threatDetected:
      result.threat.detected,

    threatType:
      result.threat.threatType,

    latencyMs:
      result.latencyMs,
  };
}

/**
 * Create both event and telemetry records
 * from a single experiment.
 */
export function createExperimentTelemetry(
  result: SecurityExperimentResult,
): {
  event: SecurityEvent;
  telemetry: SecurityTelemetry;
} {
  return {
    event:
      createSecurityEvent(result),

    telemetry:
      createSecurityTelemetry(
        result,
      ),
  };
}

/**
 * Reset the in-process event counter.
 *
 * Useful for deterministic tests.
 */
export function resetTelemetryCounter(): void {
  eventCounter = 0;
}