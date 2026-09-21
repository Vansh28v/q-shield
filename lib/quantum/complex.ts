export type Complex = {
  re: number;
  im: number;
};

export function add(a: Complex, b: Complex): Complex {
  return {
    re: a.re + b.re,
    im: a.im + b.im,
  };
}

export function sub(a: Complex, b: Complex): Complex {
  return {
    re: a.re - b.re,
    im: a.im - b.im,
  };
}

export function mul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function conj(a: Complex): Complex {
  return {
    re: a.re,
    im: -a.im,
  };
}

export function magnitude(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function magnitudeSquared(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function scale(a: Complex, scalar: number): Complex {
  return {
    re: a.re * scalar,
    im: a.im * scalar,
  };
}

export function fromReal(value: number): Complex {
  return {
    re: value,
    im: 0,
  };
}

export function equalsApprox(
  a: Complex,
  b: Complex,
  tolerance = 1e-10
): boolean {
  return (
    Math.abs(a.re - b.re) <= tolerance &&
    Math.abs(a.im - b.im) <= tolerance
  );
}