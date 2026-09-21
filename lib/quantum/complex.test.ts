import { describe, expect, it } from "vitest";

import {
  add,
  sub,
  mul,
  conj,
  magnitude,
  magnitudeSquared,
  scale,
  fromReal,
  equalsApprox,
} from "./complex";

describe("Complex arithmetic", () => {
  it("adds complex numbers", () => {
    expect(add({ re: 2, im: 3 }, { re: 4, im: 5 })).toEqual({
      re: 6,
      im: 8,
    });
  });

  it("subtracts complex numbers", () => {
    expect(sub({ re: 5, im: 7 }, { re: 2, im: 3 })).toEqual({
      re: 3,
      im: 4,
    });
  });

  it("multiplies complex numbers", () => {
    expect(mul({ re: 2, im: 3 }, { re: 4, im: 5 })).toEqual({
      re: -7,
      im: 22,
    });
  });

  it("calculates conjugate", () => {
    expect(conj({ re: 2, im: 3 })).toEqual({
      re: 2,
      im: -3,
    });
  });

  it("calculates magnitude", () => {
    expect(magnitude({ re: 3, im: 4 })).toBe(5);
  });

  it("calculates magnitude squared", () => {
    expect(magnitudeSquared({ re: 3, im: 4 })).toBe(25);
  });

  it("scales a complex number", () => {
    expect(scale({ re: 2, im: 3 }, 2)).toEqual({
      re: 4,
      im: 6,
    });
  });

  it("creates a real complex number", () => {
    expect(fromReal(5)).toEqual({
      re: 5,
      im: 0,
    });
  });

  it("compares approximately", () => {
    expect(
      equalsApprox(
        { re: 1, im: 2 },
        { re: 1.00000000001, im: 2.00000000001 }
      )
    ).toBe(true);
  });
});