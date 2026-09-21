# Q-SHIELD Software Specification

## Quantum Digital Signature Security & Threat Intelligence Platform

Problem Statement: SIH26141  
Organization: Egreen Quanta  
Category: Software  
Theme: Blockchain & Cybersecurity

---

# 1. Specification Authority

`PROTOCOL.md` is the scientific and mathematical authority for Q-SHIELD.

This document translates that protocol into software architecture and implementation requirements.

If a conflict exists:

PROTOCOL.md
    ↓
SPEC.md
    ↓
Implementation
    ↓
Frontend

The implementation must not silently change mathematical definitions,
security assumptions, attack models, or statistical guarantees.

---

# 2. Core Architecture

Q-SHIELD shall be divided into the following layers:

```text
Quantum Mathematics
        ↓
Quantum Simulation
        ↓
QDS Signature Engine
        ↓
Statistical Verification
        ↓
Threat Detection
        ↓
Telemetry
        ↓
Persistence / Ledger
        ↓
API
        ↓
Frontend
        ↓
Optional AI Intelligence
The frontend must never become the source of truth for quantum or
security calculations.

# 3. Technology Requirements
3.1 Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
Existing frontend pages shall be retained.

3.2 Quantum Engine
Language:
TypeScript
Location:
lib/quantum/
The quantum engine must remain independent from:
- React
- Next.js UI
- API routes
- database
- AI layer
3.3 Testing
Use:
Vitest
Quantum mathematics shall be test-driven.
Every major quantum primitive must have known-answer tests.
3.4 Independent Validation
Python may be used as an offline validation environment.
Candidate tools:
- Python
- NumPy
- Qiskit
- QuTiP
Python validation must not become a second production backend.
4. Quantum Module Architecture
The target quantum directory is:
lib/quantum/

├── types.ts
├── complex.ts
├── rng.ts
├── state.ts
├── gates.ts
├── pauli.ts
├── bellState.ts
├── teleportation.ts
├── measurement.ts
├── noise.ts
├── statistics.ts
├── verification.ts
├── chsh.ts
├── simulator.ts
└── index.ts
Additional security/QDS modules:
lib/security/

├── signature.ts
├── attacks.ts
├── detector.ts
├── ledger.ts
├── metrics.ts
└── types.ts
5. Complex Number Module
File:
lib/quantum/complex.ts
Required type
export type Complex = {
  re: number;
  im: number;
};
Required operations
add(a, b)
sub(a, b)
mul(a, b)
conj(a)
magnitude(a)
magnitudeSquared(a)
scale(a, scalar)
Additional useful operations may include:
fromReal(x)
equalsApprox(a, b, tolerance)
All operations must be deterministic.
No UI dependency.
6. Random Number Generator
File:
lib/quantum/rng.ts
The quantum simulator must support deterministic seeded randomness.
Required interface:
export interface RNG {
  next(): number;
  nextInt(max: number): number;
}
Required constructor/function:
createRNG(seed: number): RNG
Requirements:
- Same seed → same sequence
- Different seeds → independent sequences
- No dependency on Math.random() inside the production quantum engine
- Seed must be recorded in experiment telemetry
7. Quantum State Module
File:
lib/quantum/state.ts
A quantum state shall contain:
export interface QuantumState {
  amplitudes: Complex[];
  basisStates: string[];
}
Invariants
For a normalized state:
Σ |amplitude_i|² = 1
within numerical tolerance.
The state module shall support:
normalize(state)
norm(state)
tensorProduct(a, b)
innerProduct(a, b)
fidelity(a, b)
8. Multi-Qubit State Representation
For n qubits:
number of amplitudes = 2^n
Example:
3 qubits:
|000>
|001>
|010>
|011>
|100>
|101>
|110>
|111>
Therefore:
2^3 = 8
Q-SHIELD shall primarily use small block-wise simulations.
The implementation must not create a global state vector for an arbitrarily
large signature.
9. Quantum Gates
File:
lib/quantum/gates.ts
Required single-qubit gates:
I
X
Y
Z
H
Required controlled gate:
CNOT
The gate module shall support application of gates to small quantum states.
Required operations:
applyGate(state, gate, targetQubit)
applyCNOT(state, controlQubit, targetQubit)
Gate operations must preserve normalization up to numerical tolerance.
10. Pauli Module
File:
lib/quantum/pauli.ts
Required operators:
I
X
Y
Z
Required eigenstates:
|0>
|1>
|+>
|->
|+i>
|-i>
Required functions:
getPauliEigenstate(operator, eigenvalue)
applyPauli(state, operator)
The implementation must verify:
Z|0> = +|0>
Z|1> = -|1>

X|+> = +|+>
X|-> = -|->

Y|+i> = +|+i>
Y|-i> = -|-i>
11. Bell State Module
File:
lib/quantum/bellState.ts
Required Bell state:
|Φ+> = (|00> + |11>) / √2
Expected amplitudes:
[1/√2, 0, 0, 1/√2]
Required function:
createBellState(): QuantumState
The returned state must be normalized.
Test:
norm(state) ≈ 1
12. Teleportation Module
File:
lib/quantum/teleportation.ts
Teleportation must be implemented as an actual three-qubit circuit simulation.
Initial state:
|ψ> ⊗ |Φ+>
Circuit:
CNOT(A → B)
H(A)
Measure A
Measure B
Measurement results:
00
01
10
11
Correction:
00 → I
01 → X
10 → Z
11 → ZX
Required function:
teleport(inputState, measurementBits)
The implementation must verify that the corrected output matches the input.
13. Teleportation Fidelity
Required function:
fidelity(inputState, outputState)
Definition:
F = |<ψ|φ>|²
Ideal noiseless teleportation:
F ≈ 1
Tests must cover all four Bell measurement branches.
14. Measurement Module
File:
lib/quantum/measurement.ts
Measurement must be based on Born probabilities.
For amplitude a:
P = |a|²
Required functions:
calculateProbabilities(state)
measureOnce(state, rng)
measure(state, shots, rng)
Measurement results must be reproducible when using the same seed.
15. Noise Module
File:
lib/quantum/noise.ts
Required noise types:
NONE
BIT_FLIP
PHASE_FLIP
BIT_PHASE_FLIP
DEPOLARIZING
Optional future model:
AMPLITUDE_DAMPING
Noise probability must be configurable.
Example:
applyNoise(
  state,
  {
    type: "BIT_FLIP",
    probability: 0.1
  },
  rng
)
Noise must influence measurement statistics.
16. Statistical Analysis
File:
lib/quantum/statistics.ts
Required calculations:
total variation distance
mean absolute deviation
chi-square statistic
error rate
Required function examples:
calculateTVD(observed, expected)
calculateChiSquare(observed, expected)
calculateErrorRate(mismatches, observations)
The statistical engine must return numerical evidence.
17. Statistical Verification
File:
lib/quantum/verification.ts
Required decision:
ACCEPT
REJECT
Inputs should include:
observed measurements
expected distribution
threshold
noise model
The verifier must use deterministic statistical rules.
AI must not modify the result.
18. Threshold Model
The system shall support:
p0 = expected legitimate error rate
δ = statistical margin
Possible threshold:
threshold = p0 + δ
Possible Hoeffding margin:
δ = √(ln(1/ε) / (2Nn))
The implementation must document the exact interpretation of:
ε
N
n
p0
δ
No statistical guarantee may be claimed without validation.
19. Confidence Intervals
The statistical layer should support:
Wilson interval
or:
Clopper-Pearson interval
The selected method must be documented.
20. QDS Signature Module
File:
lib/security/signature.ts
The signature model shall use Pauli eigenstates.
Conceptual flow:
Private Key
    ↓
Basis Selection
    ↓
Pauli Basis
    ↓
Message Information
    ↓
Eigenvalue Selection
    ↓
Quantum Signature
Required responsibilities:
generate signing material
generate signature states
derive expected verification states
verify signature structure
The exact mapping must be explicitly documented.
The system must not claim a cryptographic security proof unless the mapping
and security model support it.
21. Attack Module
File:
lib/security/attacks.ts
Required attack types:
FORGERY
IMPERSONATION
REPLAY
CHANNEL_MANIPULATION
UNAUTHORIZED_VERIFICATION
Attacks must be modeled according to their protocol meaning.
Important:
Replay must NOT simply be modeled as quantum noise.
Replay requires protocol/session state.
22. Forgery Model
Forgery represents:
Adversary attempts to create a valid signature without legitimate
signing information.
The implementation may use basis guessing as a simplified adversarial model.
The system must distinguish:
statistical deviation
from:
cryptographic forgery probability
No universal forgery probability may be hard-coded.
23. Impersonation Model
Impersonation may involve:
wrong signing material
wrong basis
wrong eigenvalue
invalid session
invalid authentication context
The detector must distinguish impersonation from ordinary channel noise.
24. Replay Protection
File:
lib/security/ledger.ts
Replay protection requires persistent protocol state.
Each verification session should contain:
nonce
sessionId
transcriptId
timestamp
consumedState
A previously consumed transcript must not be accepted again.
Replay detection is therefore:
Quantum Verification
        +
Protocol Freshness
25. Channel Manipulation
Channel attacks may include:
intercept-resend
Pauli injection
measurement disturbance
entanglement degradation
Detection evidence may include:
QBER
fidelity
measurement distribution
Bell correlation
CHSH score
26. CHSH Module
File:
lib/quantum/chsh.ts
Required calculation:
S = |E(a,b) - E(a,b') + E(a',b) + E(a',b')|
Expected bounds:
Classical: S ≤ 2

Ideal quantum:
S ≈ 2√2
CHSH must be treated as a channel-integrity experiment.
It must not automatically classify every anomaly.
27. Threat Detector
File:
lib/security/detector.ts
Required deterministic categories:
NORMAL
FORGERY
IMPERSONATION
REPLAY
CHANNEL_MANIPULATION
UNAUTHORIZED_VERIFICATION
UNKNOWN_ANOMALY
The detector consumes evidence from:
quantum engine
statistical engine
protocol ledger
attack simulation
It produces:
threat classification
evidence
confidence/strength indicators
Threat classification is separate from ACCEPT/REJECT.
28. Verification vs Threat Detection
These are two separate questions.
Verification:
"Is the signature/protocol execution valid?"
Threat detection:
"What abnormal behaviour is occurring?"
Therefore:
Verification → ACCEPT / REJECT

Detection → NORMAL / FORGERY / REPLAY / ...
One must not be substituted for the other.
29. AI Intelligence Layer
AI is optional.
Architecture:
QDS Verification
       ↓
Security Decision
       ↓
Telemetry
       ↓
Optional AI
       ↓
Threat Intelligence
AI may analyze:
QBER
measurement distributions
statistical deviation
CHSH
fidelity
noise
attack intensity
temporal behaviour
historical telemetry
AI must never override:
ACCEPT → REJECT
or:
REJECT → ACCEPT
AI is advisory.
30. Experiment Model
Every quantum/security experiment shall produce an experiment record.
Example:
interface ExperimentRecord {
  experimentId: string;
  seed: number;
  timestamp: string;

  signatureLength: number;
  shots: number;

  noiseType: string;
  noiseProbability: number;

  attackType?: string;
  attackIntensity?: number;

  threshold: number;

  observedCounts: Record<string, number>;
  expectedProbabilities: Record<string, number>;

  statistics: {
    errorRate: number;
    tvd: number;
    chiSquare: number;
  };

  decision: "ACCEPT" | "REJECT";
}
The actual type may be refined during implementation.
31. Reproducibility
Two experiments using:
same protocol
same inputs
same seed
same configuration
should produce equivalent stochastic results.
The seed must be recorded.
32. Metrics
Required metrics:
FAR
FRR
Attack Detection Rate
Verification Latency
Shots to Decision
Error Rate
Bell-State Fidelity
CHSH Score
Statistical Deviation
Additional metrics may include:
ROC
AUC
Noise vs Acceptance Rate
Threshold vs FAR/FRR
Signature Length vs Forgery Probability
33. API Layer
API routes shall be thin wrappers around the core engine.
Target routes:
app/api/quantum/simulate/route.ts
app/api/signature/verify/route.ts
app/api/attacks/simulate/route.ts
app/api/events/route.ts
The API must not duplicate quantum mathematics.
Example:
API Request
    ↓
Quantum/Security Engine
    ↓
Result
    ↓
API Response
34. Persistence
Persistence is required for:
replay protection
experiment history
events
telemetry
Initial local development may use:
SQLite
A deployed environment may later use:
PostgreSQL
Supabase
Neon
The persistence layer must not contain quantum calculations.
35. Frontend Integration
Existing pages:
/dashboard
/quantum
/signature
/attack-lab
/intelligence
/analytics
/events
shall consume real engine/API data progressively.
Frontend mock/random values must eventually be removed from security-critical displays.
The existing visual design shall be preserved.
The landing page remains the visual benchmark.
36. Dashboard Data
Dashboard metrics should eventually come from experiment telemetry.
Examples:
Detection Rate
FAR
FRR
Verification Latency
Active Threats
Quantum Fidelity
No fabricated security metrics should be presented as measured results.
Demo-mode data must be clearly identifiable if retained.
37. Signature Page Integration
The Signature page shall eventually call:
signature generation
signature verification
rather than using hard-coded demonstration values.
The verification result shall come from the authoritative engine.
38. Attack Lab Integration
The Attack Lab shall eventually call:
attack simulation engine
Required attacks:
Forgery
Impersonation
Replay
Channel Manipulation
The result must include:
attack type
detection result
statistical evidence
security decision
telemetry
39. Intelligence Page Integration
The Intelligence page must distinguish between:
Deterministic Threat Detection
and:
Optional AI Intelligence
The AI layer must not be presented as the authoritative QDS verifier.
40. Analytics Integration
Analytics shall visualize actual experiment records.
Possible visualizations:
Security Accuracy
Verification Outcomes
Attack Detection
Noise Impact
FAR / FRR
Threshold Curves
Fidelity
CHSH
Random values must not be used once real telemetry is available.
41. Events Integration
Events shall be generated from actual security experiments.
Event types may include:
THREAT
VERIFIED
QUANTUM
SYSTEM
Replay events must be generated from actual ledger violations.
42. Testing Strategy
Testing order:
Complex arithmetic
        ↓
State normalization
        ↓
Pauli operators
        ↓
Pauli eigenstates
        ↓
Quantum gates
        ↓
Bell state
        ↓
Measurement
        ↓
Teleportation
        ↓
Fidelity
        ↓
Noise
        ↓
Statistics
        ↓
CHSH
        ↓
QDS signature
        ↓
Attack models
        ↓
Replay ledger
        ↓
Threat detector
        ↓
Metrics
43. Required Known-Answer Tests
Bell State
Expected:
[1/√2, 0, 0, 1/√2]
Norm:
1
Pauli Eigenstates
Verify all six eigenstates.
Teleportation
Test:
|0>
|1>
|+>
|->
|+i>
|-i>
across all four correction branches.
Expected fidelity:
≈ 1
for noiseless simulation.
Measurement
Expected:
|0> → 0 ≈ 1
|1> → 1 ≈ 1
|+> → 0 ≈ 0.5
|+> → 1 ≈ 0.5
Noise
Verify:
p = 0 → no disturbance
and increasing noise produces expected statistical changes.
CHSH
Ideal Bell state:
S ≈ 2√2
within simulation tolerance.
44. Current Prototype
Existing prototype functionality includes:
Bell state
Teleportation abstraction
Measurement
Statistics
Threshold verification
Noise
Attack simulation
These components must be treated as transitional until replaced or validated
against this specification.
45. Immediate Implementation Order
The next implementation sequence is:
1. complex.ts
2. rng.ts
3. state.ts
4. gates.ts
5. pauli.ts
6. bellState.ts
7. measurement.ts
8. teleportation.ts
9. fidelity
10. tests
11. noise refinement
12. statistics refinement
13. CHSH
14. QDS signature
15. attack models
16. replay ledger
17. threat detector
18. metrics
19. persistence
20. API
21. frontend integration
22. optional AI
46. Coding Rules
Every implementation must follow these rules:
1. TypeScript strict typing.
2. No quantum calculations inside React components.
3. No security decisions inside UI code.
4. No AI dependency in the authoritative verifier.
5. No Math.random() in the production simulation engine.
6. Every major mathematical function must have tests.
7. Preserve deterministic seeded experiments.
8. Do not silently change protocol assumptions.
9. Do not label statistical deviation as cryptographic forgery probability.
10. Do not model replay as ordinary channel noise.
11. Do not claim security properties that have not been demonstrated or derived.
47. AI Coding Agent Rules
AI coding agents may modify the repository only according to:
PROTOCOL.md
SPEC.md
tests
Agents must:
- inspect existing code before modification
- make small modular changes
- run tests after each major module
- report failures
- never silently change mathematical definitions
- never remove tests to make the build pass
- never replace deterministic verification with AI
- never invent security guarantees
Recommended workflow:
One module
    ↓
Write tests
    ↓
Implement
    ↓
Run tests
    ↓
Review
    ↓
Commit
48. Definition of Done
The Q-SHIELD core is considered implementation-ready when:
- Bell state passes known-answer tests
- Pauli operators pass eigenstate tests
- quantum gates work
- teleportation works for all correction branches
- fidelity is measured
- measurement is seeded and reproducible
- noise is configurable
- statistical verification is deterministic
- CHSH is implemented
- QDS signature generation exists
- forgery model exists
- impersonation model exists
- replay ledger exists
- channel manipulation exists
- unauthorized verification exists
- threat detector exists
- experiment telemetry exists
- metrics are calculated from real experiments
- API exposes the engine
- frontend consumes real results
- optional AI remains downstream
- independent Python validation has been performed
Only after these requirements are satisfied should Q-SHIELD be considered
a complete protocol implementation rather than a UI prototype.
49. Final Architecture
                    Q-SHIELD
                        │
                        ▼
              QDS PROTOCOL ENGINE
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
      Quantum        QDS          Protocol
      Engine       Signature        State
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                 Channel Model
                        │
                 ┌──────┴──────┐
                 ▼             ▼
               Noise         Attack
                 │             │
                 └──────┬──────┘
                        ▼
                   Measurement
                        │
                        ▼
                Statistical Engine
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
         Verification          Detection
              │                   │
         ACCEPT/REJECT       Threat Type
              │                   │
              └─────────┬─────────┘
                        ▼
                    Telemetry
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
         Analytics          Optional AI
                                  │
                            Intelligence

                            
50. Specification Authority
PROTOCOL.md defines the scientific protocol.
SPEC.md defines the software implementation requirements.
Neither the frontend nor an AI coding agent may override them.
Any change to the protocol or security model must be explicitly documented,
reviewed, tested, and justified.