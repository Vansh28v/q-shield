import math
import sys
import io

# Force UTF-8 output encoding for Windows command line consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Optional NumPy import for clean matrix math
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

class ValidationReport:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []

    def check(self, name: str, condition: bool, message: str = ""):
        if condition:
            self.passed += 1
            self.tests.append((name, True, message))
            print(f"  [PASS] {name}")
        else:
            self.failed += 1
            self.tests.append((name, False, message))
            print(f"  [FAIL] {name}: {message}")

def complex_norm(c):
    return math.sqrt(c.real**2 + c.imag**2)

# --- A. BELL-STATE NORMALIZATION ---
def validate_bell_state_normalization(report: ValidationReport):
    print("\nA. Validating Bell State Normalization...")
    # |Φ+⟩ = (|00⟩ + |11⟩) / √2
    inv_sqrt2 = 1.0 / math.sqrt(2.0)
    bell_amplitudes = [inv_sqrt2, 0.0, 0.0, inv_sqrt2]
    
    total_prob = sum(abs(a)**2 for a in bell_amplitudes)
    norm = math.sqrt(total_prob)
    
    report.check(
        "Bell state |Φ+⟩ normalization equals 1.0",
        math.isclose(norm, 1.0, rel_tol=1e-9),
        f"Measured norm: {norm}"
    )

# --- B. TELEPORTATION FIDELITY ---
def validate_teleportation_fidelity(report: ValidationReport):
    print("\nB. Validating 3-Qubit Teleportation Fidelity...")
    s_half = 1.0 / math.sqrt(2.0)
    eigenstates = {
        "|0>": [1.0 + 0j, 0.0 + 0j],
        "|1>": [0.0 + 0j, 1.0 + 0j],
        "|+>": [s_half + 0j, s_half + 0j],
        "|->": [s_half + 0j, -s_half + 0j],
        "|+i>": [s_half + 0j, 1j * s_half],
        "|-i>": [s_half + 0j, -1j * s_half],
    }

    # Pauli gates
    def apply_pauli(state, op):
        if op == "I": return [state[0], state[1]]
        if op == "X": return [state[1], state[0]]
        if op == "Z": return [state[0], -state[1]]
        if op == "ZX": return [state[1], -state[0]]
        return state

    branches = ["00", "01", "10", "11"]
    corrections = {"00": ["I"], "01": ["X"], "10": ["Z"], "11": ["Z", "X"]}

    all_passed = True
    for state_name, in_state in eigenstates.items():
        alpha, beta = in_state[0], in_state[1]

        # 3-qubit state tensor product: |ψ⟩ ⊗ |Φ+⟩
        # Basis order: 000, 001, 010, 011, 100, 101, 110, 111
        # |Φ+⟩ = (|00⟩ + |11⟩)/√2
        psi = [
            alpha * s_half, 0j, 0j, alpha * s_half,
            beta * s_half, 0j, 0j, beta * s_half
        ]

        # CNOT(0 -> 1)
        psi_cnot = [
            psi[0], psi[1], psi[2], psi[3],
            psi[6], psi[7], psi[4], psi[5]
        ]

        # Hadamard(0)
        # |000> -> (|000> + |100>)/√2
        # |011> -> (|011> + |111>)/√2
        # |110> -> (|010> - |110>)/√2
        # |101> -> (|001> - |101>)/√2
        a0, a3 = psi_cnot[0], psi_cnot[3]
        b6, b5 = psi_cnot[6], psi_cnot[5]

        # Alice measures (q0, q1)
        bob_states = {
            "00": [a0 * s_half, b5 * s_half], # q2=0, q2=1
            "01": [b6 * s_half, a3 * s_half],
            "10": [a0 * s_half, -b5 * s_half],
            "11": [b6 * s_half, -a3 * s_half],
        }

        for branch in branches:
            raw_bob = bob_states[branch]
            prob = abs(raw_bob[0])**2 + abs(raw_bob[1])**2
            norm_bob = [raw_bob[0] / math.sqrt(prob), raw_bob[1] / math.sqrt(prob)]

            # Apply correction operators
            corrected = norm_bob
            for op in corrections[branch]:
                corrected = apply_pauli(corrected, op)

            # Calculate fidelity with original input state
            overlap = in_state[0].conjugate() * corrected[0] + in_state[1].conjugate() * corrected[1]
            fid = (abs(overlap))**2

            if not math.isclose(fid, 1.0, abs_tol=1e-5):
                all_passed = False

    report.check(
        "Teleportation fidelity F=1.0 for all 6 Pauli eigenstates across all 4 correction branches",
        all_passed,
        "Fidelity mismatch in teleportation branch"
    )

# --- C. NOISE STATISTICS ---
def validate_noise_statistics(report: ValidationReport):
    print("\nC. Validating Quantum Channel Noise Statistics...")
    probabilities = [0.0, 0.1, 0.25, 0.5, 1.0]
    shots = 10000
    all_within_margin = True

    # Seeded pseudo-random PRNG
    state = 123456789
    def lcg_next():
        nonlocal state
        state = (1664525 * state + 1013904223) & 0xFFFFFFFF
        return state / 4294967296.0

    for p in probabilities:
        errors = sum(1 for _ in range(shots) if lcg_next() < p)
        empirical_p = errors / shots
        margin = 3 * math.sqrt(p * (1 - p) / shots) if 0 < p < 1 else 0.0
        
        if p == 0.0 and empirical_p != 0.0:
            all_within_margin = False
        elif p == 1.0 and empirical_p != 1.0:
            all_within_margin = False
        elif 0 < p < 1 and abs(empirical_p - p) > margin:
            all_within_margin = False

    report.check(
        "Empirical noise error rate matches configured probability p across 10,000 trials",
        all_within_margin,
        "Empirical noise rate outside 3-sigma confidence margin"
    )

# --- D. STATISTICAL VERIFICATION ---
def validate_statistical_verification(report: ValidationReport):
    print("\nD. Validating Statistical Verification & Hoeffding/Wilson Bounds...")
    N = 1000
    epsilon = 0.01

    # Hoeffding margin: delta = sqrt( ln(1/epsilon) / (2N) )
    hoeffding_delta = math.sqrt(math.log(1.0 / epsilon) / (2.0 * N))
    expected_delta = 0.047985
    
    report.check(
        "Hoeffding statistical margin delta calculation",
        math.isclose(hoeffding_delta, expected_delta, rel_tol=1e-3),
        f"Calculated: {hoeffding_delta}, Expected: {expected_delta}"
    )

    # Wilson interval check
    z = 1.96
    p_hat = 0.05
    denom = 1.0 + z**2 / N
    center = (p_hat + z**2 / (2 * N)) / denom
    margin = (z / denom) * math.sqrt(p_hat * (1 - p_hat) / N + z**2 / (4 * N**2))
    lower = max(0.0, center - margin)
    upper = min(1.0, center + margin)

    report.check(
        "Wilson score interval contains point estimate (0.05)",
        lower < p_hat < upper and lower > 0.03 and upper < 0.07,
        f"Interval: [{lower:.4f}, {upper:.4f}]"
    )

# --- E. CHSH BELL TEST ---
def validate_chsh_bell_test(report: ValidationReport):
    print("\nE. Validating CHSH Bell Inequality Simulation...")
    # Theoretical expectation for maximally entangled Bell state: E(θA, θB) = cos(θA - θB)
    # Optimal CHSH angles: a=0, a'=π/2, b=π/4, b'=-π/4
    a, a_prime = 0.0, math.pi / 2.0
    b, b_prime = math.pi / 4.0, -math.pi / 4.0

    E_ab = math.cos(a - b)           # cos(-π/4) = 1/√2 ≈ 0.7071
    E_ab_prime = math.cos(a - b_prime) # cos(π/4)  = 1/√2 ≈ 0.7071
    E_aprime_b = math.cos(a_prime - b) # cos(π/4)  = 1/√2 ≈ 0.7071
    E_aprime_bprime = math.cos(a_prime - b_prime) # cos(3π/4) = -1/√2 ≈ -0.7071

    S_quantum = E_ab + E_ab_prime + E_aprime_b - E_aprime_bprime
    expected_quantum_S = 2.0 * math.sqrt(2.0) # 2.8284

    report.check(
        "Entangled Bell state violates classical CHSH bound S <= 2.0 with S ≈ 2.8284",
        math.isclose(S_quantum, expected_quantum_S, rel_tol=1e-5) and S_quantum > 2.0,
        f"Measured S: {S_quantum:.4f}"
    )

    # Separable control state |00>: E(θA, θB) = cos(θA) * cos(θB)
    S_classical = (
        math.cos(a)*math.cos(b) +
        math.cos(a)*math.cos(b_prime) +
        math.cos(a_prime)*math.cos(b) -
        math.cos(a_prime)*math.cos(b_prime)
    )

    report.check(
        "Separable classical control state satisfies classical bound S <= 2.0",
        S_classical <= 2.0,
        f"Measured classical S: {S_classical:.4f}"
    )

def main():
    print("==================================================")
    print("   Q-SHIELD Scientific Python Validation Suite")
    print("==================================================")
    
    report = ValidationReport()
    
    validate_bell_state_normalization(report)
    validate_teleportation_fidelity(report)
    validate_noise_statistics(report)
    validate_statistical_verification(report)
    validate_chsh_bell_test(report)

    print("\n--------------------------------------------------")
    print(f"Validation Summary: {report.passed} PASSED, {report.failed} FAILED.")
    print("--------------------------------------------------")

    if report.failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
