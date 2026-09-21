import type { MeasurementStatistics } from "../quantum/measurement";
import type { StatisticalMetrics } from "../quantum/statistics";
import type { VerificationResult } from "../quantum/verification";
import type { CHSHResult } from "../quantum/chsh";
import type { NoiseModel } from "../quantum/noise";
import type {
  ThreatDetectorResult,
} from "./detector";
import type {
  SignatureRecord,
  SignatureVerification,
} from "./signature";
import type {
  LedgerCheckResult,
} from "./ledger";

export type SecurityEventType =
  | "SIGNATURE_CREATED"
  | "SIGNATURE_VERIFIED"
  | "SIGNATURE_REJECTED"
  | "THREAT_DETECTED"
  | "REPLAY_DETECTED"
  | "CHANNEL_ANOMALY"
  | "UNAUTHORIZED_VERIFICATION"
  | "ATTACK_SIMULATION"
  | "SYSTEM";

export type SecurityEventSeverity =
  | "INFO"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type SecurityEvent = {
  id: string;

  type: SecurityEventType;

  severity: SecurityEventSeverity;

  timestamp: number;

  message: string;

  sessionId?: string;

  signatureId?: string;

  signerId?: string;

  threatType?: ThreatDetectorResult["threatType"];

  riskScore?: number;

  metadata?: Record<
    string,
    string | number | boolean
  >;
};

export type ExperimentStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED";

export type ExperimentRecord = {
  experimentId: string;

  status: ExperimentStatus;

  startedAt: number;

  completedAt?: number;

  seed: number;

  shots: number;

  threshold: number;

  noiseModel: NoiseModel;

  noiseProbability: number;

  measurement?: MeasurementStatistics;

  statistics?: StatisticalMetrics;

  verification?: VerificationResult;

  chsh?: CHSHResult;

  error?: string;
};

export type SignatureSession = {
  sessionId: string;

  signature?: SignatureRecord;

  verification?: SignatureVerification;

  replay?: LedgerCheckResult;

  threat?: ThreatDetectorResult;

  createdAt: number;

  updatedAt: number;
};

export type AttackSimulationRecord = {
  simulationId: string;

  attackType:
    | "FORGERY"
    | "IMPERSONATION"
    | "REPLAY"
    | "CHANNEL_MANIPULATION";

  intensity: number;

  detected: boolean;

  riskScore: number;

  createdAt: number;

  experimentId?: string;

  message: string;
};

export type SecurityTelemetry = {
  timestamp: number;

  experimentId?: string;

  sessionId?: string;

  signatureId?: string;

  verificationAccepted?: boolean;

  deviation?: number;

  riskScore?: number;

  threatDetected?: boolean;

  threatType?: ThreatDetectorResult["threatType"];

  latencyMs?: number;

  attackType?: AttackSimulationRecord["attackType"];

  metadata?: Record<
    string,
    string | number | boolean
  >;
};