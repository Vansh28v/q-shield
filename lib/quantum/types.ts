export type Complex = {
  re: number;
  im: number;
};

export type QuantumState = {
  amplitudes: Complex[];
  basisStates: string[];
};

export type BellStateName = "PHI_PLUS" | "PHI_MINUS" | "PSI_PLUS" | "PSI_MINUS";

export type BellState = {
  name: BellStateName;
  state: QuantumState;
  equation: string;
};

export type MeasurementResult = {
  outcome: string;
  count: number;
  probability: number;
};

export type MeasurementStatistics = {
  shots: number;
  results: MeasurementResult[];
};