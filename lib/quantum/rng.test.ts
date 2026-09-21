import { describe, expect, it } from "vitest";
import { createRNG } from "./rng";

describe("Seeded RNG", () => {
  it("produces the same sequence for the same seed", () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(12345);

    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
    expect(rng1.next()).toBe(rng2.next());
  });

  it("produces different sequences for different seeds", () => {
    const rng1 = createRNG(12345);
    const rng2 = createRNG(54321);

    expect(rng1.next()).not.toBe(rng2.next());
  });

  it("generates values between 0 and 1", () => {
    const rng = createRNG(42);

    for (let i = 0; i < 100; i++) {
      const value = rng.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("generates valid integers with nextInt", () => {
    const rng = createRNG(42);

    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(10);

      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
    }
  });

  it("rejects invalid nextInt limits", () => {
    const rng = createRNG(42);

    expect(() => rng.nextInt(0)).toThrow();
    expect(() => rng.nextInt(-1)).toThrow();
    expect(() => rng.nextInt(1.5)).toThrow();
  });
});