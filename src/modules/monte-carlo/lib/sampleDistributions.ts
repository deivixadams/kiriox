/**
 * Reproducible Random Number Generator (Seedable)
 */
export class RandomGenerator {
  private m = 0x80000000; // 2**31
  private a = 1103515245;
  private c = 12345;
  private state: number;

  constructor(seed: string) {
    this.state = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  nextFloat(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state / (this.m - 1);
  }

  // Beta distribution (approximate via Irwin-Hall or Rejection sampling)
  // For V1, alpha=2, beta=2 (symmetric) or alpha=5, beta=2 (skewed high)
  beta(alpha: number, beta: number): number {
    // Simple implementation via Gamma (sum of exponentials)
    const u = this.gamma(alpha, 1);
    const v = this.gamma(beta, 1);
    return u / (u + v);
  }

  private gamma(alpha: number, beta: number): number {
    let sum = 0;
    for (let i = 0; i < alpha; i++) {
      sum += -Math.log(1 - this.nextFloat());
    }
    return sum * beta;
  }

  triangular(a: number, b: number, c: number): number {
    const u = this.nextFloat();
    if (u < (c - a) / (b - a)) {
      return a + Math.sqrt(u * (b - a) * (c - a));
    } else {
      return b - Math.sqrt((1 - u) * (b - a) * (b - c));
    }
  }

  bernoulli(p: number): boolean {
    return this.nextFloat() <= p;
  }
}

export function getControlEffectiveness(
  design: number,
  formalization: number,
  operating: number,
  evidence: number
): number {
  // Multiplicative weighted power model (Kiriox V1 Canon)
  return Math.pow(design, 0.4) * Math.pow(formalization, 0.2) * Math.pow(operating, 0.3) * Math.pow(evidence, 0.1);
}
