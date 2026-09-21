export interface RNG {
  next(): number;
  nextInt(max: number): number;
}

export function createRNG(seed: number): RNG {
  let state = seed >>> 0;

  return {
    next(): number {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    },

    nextInt(max: number): number {
      if (!Number.isInteger(max) || max <= 0) {
        throw new Error("max must be a positive integer");
      }

      return Math.floor(this.next() * max);
    },
  };
}