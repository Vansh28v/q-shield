import {
  Complex,
  magnitudeSquared,
} from "../quantum/complex";

import {
  QuantumState,
  fidelity,
  normalize,
} from "../quantum/state";

import {
  PauliOperator,
  PauliEigenvalue,
  getPauliEigenstate,
} from "../quantum/pauli";

import {
  createRNG,
  RNG,
} from "../quantum/rng";

import {
  applyNoise,
  NoiseModel,
} from "../quantum/noise";

import {
  calculateHoeffdingMargin,
  calculateWilsonScoreInterval,
  WilsonInterval,
} from "../quantum/statistics";

export type SignatureRecord = {
  signatureId: string;
  message: string;
  signerId: string;
  sessionId: string;
  nonce: string;
  state: QuantumState;
  states?: QuantumState[];
  bases?: PauliOperator[];
  expectedEigenvalues?: PauliEigenvalue[];
  signatureLength?: number;
  createdAt: number;
};

export type SignatureVerification = {
  valid: boolean;
  accepted?: boolean;
  decision?: "ACCEPT" | "REJECT";
  fidelity: number;
  messageMatch: boolean;
  signerMatch: boolean;
  totalSamples?: number;
  observedErrors?: number;
  observedErrorRate?: number;
  threshold?: number;
  statisticalMargin?: number;
  confidenceInterval?: WilsonInterval;
  reason?: string;
  seed?: number;
};

/**
 * String hash function for deterministic seed generation.
 */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const SUPPORTED_BASES: PauliOperator[] = ["X", "Y", "Z"];

/**
 * Deterministically derives Pauli bases, expected eigenvalues, and signature states
 * from private key material, message digest, and signing context.
 */
export function deriveQDSMaterial(
  privateKey: string,
  message: string,
  signerId: string,
  nonce: string,
  length = 8,
  seed?: number,
): {
  bases: PauliOperator[];
  expectedEigenvalues: PauliEigenvalue[];
  states: QuantumState[];
  seed: number;
} {
  const context = `${privateKey}|${message}|${signerId}|${nonce}`;
  const baseSeed = ((seed ?? 12345) ^ hashString(context)) >>> 0;
  const rng = createRNG(baseSeed);

  const bases: PauliOperator[] = [];
  const expectedEigenvalues: PauliEigenvalue[] = [];
  const states: QuantumState[] = [];

  for (let i = 0; i < length; i++) {
    const basisIndex = rng.nextInt(3);
    const basis = SUPPORTED_BASES[basisIndex];

    const eigenValBit = rng.nextInt(2);
    const eigenvalue: PauliEigenvalue = eigenValBit === 0 ? 1 : -1;

    bases.push(basis);
    expectedEigenvalues.push(eigenvalue);
    states.push(getPauliEigenstate(basis, eigenvalue));
  }

  return {
    bases,
    expectedEigenvalues,
    states,
    seed: baseSeed,
  };
}

/**
 * Creates a formal multi-qubit QDS signature record bound to the message digest.
 */
export function createQDSSignature(
  signatureId: string,
  message: string,
  signerId: string,
  sessionId: string,
  nonce: string,
  privateKey = "DEFAULT_QDS_KEY",
  length = 8,
  seed?: number,
  createdAt = Date.now(),
): SignatureRecord {
  if (!signatureId.trim()) throw new Error("signatureId is required.");
  if (!message.trim()) throw new Error("message is required.");
  if (!signerId.trim()) throw new Error("signerId is required.");
  if (!sessionId.trim()) throw new Error("sessionId is required.");
  if (!nonce.trim()) throw new Error("nonce is required.");

  const derived = deriveQDSMaterial(
    privateKey,
    message,
    signerId,
    nonce,
    length,
    seed,
  );

  return {
    signatureId,
    message,
    signerId,
    sessionId,
    nonce,
    state: derived.states[0],
    states: derived.states,
    bases: derived.bases,
    expectedEigenvalues: derived.expectedEigenvalues,
    signatureLength: length,
    createdAt,
  };
}

/**
 * Creates a signature record from an already-generated
 * quantum signature state.
 */
export function createSignature(
  signatureId: string,
  message: string,
  signerId: string,
  sessionId: string,
  nonce: string,
  state: QuantumState,
  createdAt = Date.now(),
): SignatureRecord {
  if (!signatureId.trim()) {
    throw new Error("signatureId is required.");
  }

  if (!message.trim()) {
    throw new Error("message is required.");
  }

  if (!signerId.trim()) {
    throw new Error("signerId is required.");
  }

  if (!sessionId.trim()) {
    throw new Error("sessionId is required.");
  }

  if (!nonce.trim()) {
    throw new Error("nonce is required.");
  }

  if (!Number.isFinite(createdAt)) {
    throw new Error("createdAt must be finite.");
  }

  return {
    signatureId,
    message,
    signerId,
    sessionId,
    nonce,
    state: normalize(state),
    states: [normalize(state)],
    bases: ["Z"],
    expectedEigenvalues: [1],
    signatureLength: 1,
    createdAt,
  };
}

/**
 * Verifies whether a received quantum state matches the expected signature state.
 */
export function verifySignatureState(
  receivedState: QuantumState,
  expectedState: QuantumState,
  threshold = 0.99,
): boolean {
  if (
    !Number.isFinite(threshold) ||
    threshold < 0 ||
    threshold > 1
  ) {
    throw new Error(
      "threshold must be between 0 and 1.",
    );
  }

  return (
    fidelity(
      receivedState,
      expectedState,
    ) >= threshold
  );
}

/**
 * Verifies a QDS signature sequence against expected message and signer identity.
 */
export function verifyQDSSignature(
  signature: SignatureRecord,
  expectedMessage: string,
  expectedSignerId: string,
  options?: {
    privateKey?: string;
    shotsPerQubit?: number;
    noiseModel?: NoiseModel;
    noiseProbability?: number;
    epsilon?: number;
    legitimateNoiseRate?: number;
    seed?: number;
  },
): SignatureVerification {
  const messageMatch = signature.message === expectedMessage;
  const signerMatch = signature.signerId === expectedSignerId;

  const shots = options?.shotsPerQubit ?? 100;
  const epsilon = options?.epsilon ?? 0.01;
  const legitimateNoiseRate = options?.legitimateNoiseRate ?? 0.02;
  const seed = options?.seed ?? 12345;
  const rng = createRNG(seed);

  const states = signature.states ?? [signature.state];
  const length = states.length;
  const totalSamples = length * shots;

  // Derive expected signature states for verification context
  const expectedMaterial = deriveQDSMaterial(
    options?.privateKey ?? "DEFAULT_QDS_KEY",
    expectedMessage,
    expectedSignerId,
    signature.nonce,
    length,
    seed,
  );

  let totalFidelitySum = 0;
  let observedErrors = 0;

  for (let i = 0; i < length; i++) {
    const receivedState = states[i];
    const expectedState = expectedMaterial.states[i];

    // Apply channel noise if requested
    const noisyResult = applyNoise(
      receivedState,
      options?.noiseModel ?? "NONE",
      options?.noiseProbability ?? 0,
      rng,
    );

    const f = fidelity(noisyResult.state, expectedState);
    totalFidelitySum += f;

    // Measurement error sampling
    for (let s = 0; s < shots; s++) {
      const roll = rng.next();
      if (roll > f) {
        observedErrors++;
      }
    }
  }

  const avgFidelity = totalFidelitySum / length;
  const observedErrorRate = totalSamples > 0 ? observedErrors / totalSamples : 0;
  const statisticalMargin = calculateHoeffdingMargin(totalSamples, epsilon);
  const threshold = legitimateNoiseRate + statisticalMargin;
  const confidenceInterval = calculateWilsonScoreInterval(observedErrors, totalSamples);

  const valid = messageMatch && signerMatch && observedErrorRate <= threshold;
  const decision = valid ? "ACCEPT" : "REJECT";

  const reason = !messageMatch
    ? "Message mismatch."
    : !signerMatch
    ? "Signer identity mismatch."
    : valid
    ? `QDS verification accepted: observed error rate (${observedErrorRate.toFixed(4)}) <= threshold (${threshold.toFixed(4)}).`
    : `QDS verification rejected: observed error rate (${observedErrorRate.toFixed(4)}) > threshold (${threshold.toFixed(4)}).`;

  return {
    valid,
    accepted: valid,
    decision,
    fidelity: avgFidelity,
    messageMatch,
    signerMatch,
    totalSamples,
    observedErrors,
    observedErrorRate,
    threshold,
    statisticalMargin,
    confidenceInterval,
    reason,
    seed,
  };
}

/**
 * Verifies the complete signature record.
 *
 * Quantum-state fidelity is combined with the classical
 * message and signer identity checks.
 */
export function verifySignature(
  signature: SignatureRecord,
  expectedMessage: string,
  expectedSignerId: string,
  expectedState: QuantumState,
  fidelityThreshold = 0.99,
): SignatureVerification {
  const messageMatch =
    signature.message === expectedMessage;

  const signerMatch =
    signature.signerId === expectedSignerId;

  const signatureFidelity =
    fidelity(
      signature.state,
      expectedState,
    );

  const valid =
    messageMatch &&
    signerMatch &&
    signatureFidelity >=
      fidelityThreshold;

  return {
    valid,
    accepted: valid,
    decision: valid ? "ACCEPT" : "REJECT",
    fidelity: signatureFidelity,
    messageMatch,
    signerMatch,
    reason: valid
      ? "Signature state fidelity matches expected signature."
      : "Signature state verification failed.",
  };
}