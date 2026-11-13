import type { Result } from "@mrfund/shared";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  type BorrowPools,
  borrowCardNumbers,
  maxBorrow,
  type OpenPositionInput,
  projectBorrow,
  quoteBorrow,
  quoteCollateralDeposit,
} from "../src/open-position";
import vectorsFixture from "./fixtures/rhea-borrow-vectors.json";
import { baseSnapshot, NOW, USDC, usdcPrice, WNEAR } from "./helpers";

const fixture = vectorsFixture as {
  vectors: {
    name: string;
    txHash: string;
    inputs: Record<string, string>;
    expected: Record<string, string>;
  }[];
};

function unwrap<T, E>(r: Result<T, E>): T {
  if (!r.ok) throw new Error(`expected ok, got ${JSON.stringify(r.error)}`);
  return r.value;
}

describe("projectBorrow reproduces real Rhea 0.11.0 borrows exactly", () => {
  it.each(fixture.vectors)("$name ($txHash)", (v) => {
    const i = v.inputs;
    const p = projectBorrow(
      {
        borrowedShares: BigInt(i.borrowedShares as string),
        borrowedBalance: BigInt(i.borrowedBalance as string),
        suppliedShares: BigInt(i.suppliedShares as string),
        suppliedBalance: BigInt(i.suppliedBalance as string),
      },
      BigInt(i.accountBorrowedShares as string),
      BigInt(i.amountInternal as string),
    );
    expect(p.issuedShares.toString()).toBe(v.expected.issuedShares);
    expect(p.debtAfterInternal.toString()).toBe(v.expected.debtAfterInternal);
    expect(p.creditedShares.toString()).toBe(v.expected.creditedShares);
    expect(p.deliveredInternal.toString()).toBe(v.expected.deliveredInternal);
  });

  it("an exact withdraw would need one share more than the borrow credited (the Gate 1 failure)", () => {
    // 0.5 REF credited as floor(A * S / B) shares; withdrawing exactly A needs ceil(A * S' / B').
    const v = fixture.vectors[0];
    if (!v) throw new Error("fixture");
    const i = v.inputs;
    const amount = BigInt(i.amountInternal as string);
    const Ss = BigInt(i.suppliedShares as string);
    const Bs = BigInt(i.suppliedBalance as string);
    const credit = (amount * Ss) / Bs;
    const needed =
      ((Ss + credit) * 0n + amount * (Ss + credit) + (Bs + amount) - 1n) / (Bs + amount);
    expect(needed).toBeGreaterThan(credit);
  });
});

// Hand-computed position (health.test.ts): 100 wNEAR at $5 x 60% = $300 adjusted collateral,
// 200 USDC at $1 / 95% = $210.526 adjusted debt, health 14250 bps.
const ONE_TO_ONE: BorrowPools = {
  borrowedShares: 10n ** 24n,
  borrowedBalance: 10n ** 24n,
  suppliedShares: 5n * 10n ** 24n,
  suppliedBalance: 5n * 10n ** 24n,
};
const DEBT_INTERNAL = 200n * 10n ** 6n * 10n ** 12n;
const input = (over: Partial<OpenPositionInput> = {}): OpenPositionInput => ({
  snapshot: baseSnapshot(),
  collateralTokenId: WNEAR,
  debtTokenId: USDC,
  lendingVersion: "0.11.0",
  pools: ONE_TO_ONE,
  accountBorrowedShares: DEBT_INTERNAL,
  availableInternal: 10n ** 24n,
  targetBps: 12_000,
  ...over,
});

describe("maxBorrow at a disclosed target", () => {
  it("1:1 pools: the worked maximum is 37.5 USDC, and max + 1 breaks the target", () => {
    // Target 12000 needs total adjusted debt <= $250, so debt <= $237.50: 37.5 USDC more.
    const m = unwrap(maxBorrow(input(), NOW));
    expect(m.value).toEqual({
      maxAtomic: 37_500_000n,
      bindingLimit: "target_health",
      targetBps: 12_000,
    });
    const atMax = unwrap(quoteBorrow(input(), 37_500_000n, NOW));
    expect(atMax.value.healthAfter).toBe(12_000);
    expect(atMax.value.healthBefore).toBe(14_250);
    const over = quoteBorrow(input(), 37_500_001n, NOW);
    expect(over).toMatchObject({ ok: false, error: { kind: "invalid_amount" } });
  });

  it("is limited by liquidity when the pool cannot supply the target amount", () => {
    const m = unwrap(maxBorrow(input({ availableInternal: 5n * 10n ** 18n }), NOW));
    // 5 * 10^18 internal / 10^12 = 5 USDC atomic = 5_000_000.
    expect(m.value).toMatchObject({ maxAtomic: 5_000_000n, bindingLimit: "liquidity" });
  });

  it("no collateral means a zero, non-executable maximum", () => {
    const m = unwrap(
      maxBorrow(
        input({
          snapshot: baseSnapshot({ collateral: [], borrowed: [] }),
          accountBorrowedShares: 0n,
        }),
        NOW,
      ),
    );
    expect(m.value).toMatchObject({ maxAtomic: 0n, bindingLimit: "no_collateral" });
    expect(
      quoteBorrow(
        input({
          snapshot: baseSnapshot({ collateral: [], borrowed: [] }),
          accountBorrowedShares: 0n,
        }),
        1n,
        NOW,
      ).ok,
    ).toBe(false);
  });

  it("an empty account (no debt) quotes from no_debt and still needs the debt price", () => {
    const snap = baseSnapshot({ borrowed: [] });
    const q = unwrap(
      quoteBorrow(input({ snapshot: snap, accountBorrowedShares: 0n }), 100_000_000n, NOW),
    );
    expect(q.value.healthBefore).toBe("no_debt");
    expect(q.value.debtBeforeInternal).toBe(0n);
    // 100 USDC borrowed against $300: B = 100 / 0.95, health = floor(300 / 105.2631.. x 10000) = 28500.
    expect(q.value.healthAfter).toBe(28_500);
    const { [USDC]: _drop, ...prices } = snap.prices;
    expect(
      quoteBorrow(
        input({ snapshot: { ...snap, prices }, accountBorrowedShares: 0n }),
        1_000_000n,
        NOW,
      ),
    ).toMatchObject({ ok: false, error: { kind: "missing_price", tokenId: USDC } });
  });

  it("a stale intended-debt price refuses, and the oracle window is the stricter limit", () => {
    const old = { ...usdcPrice, publishTimeMs: NOW - 90_000 };
    const snap = baseSnapshot({ prices: { ...baseSnapshot().prices, [USDC]: old } });
    // 90 s is inside the app's 120 s limit.
    expect(maxBorrow(input({ snapshot: snap }), NOW).ok).toBe(true);
    // The oracle's own 60 s window is stricter.
    expect(maxBorrow(input({ snapshot: snap, oracleValidityMs: 60_000 }), NOW)).toMatchObject({
      ok: false,
      error: { kind: "stale_price", tokenId: USDC, limitMs: 60_000 },
    });
  });

  it("a fixed default price keeps its fixed-price warning", () => {
    const fixed = { ...usdcPrice, publishTimeMs: null, source: "default_price" as const };
    const snap = baseSnapshot({ prices: { ...baseSnapshot().prices, [USDC]: fixed } });
    const m = unwrap(maxBorrow(input({ snapshot: snap }), NOW));
    expect(m.assumptions).toContain("USDC uses a fixed price");
  });
});

describe("refusals replace unsupported assumptions", () => {
  it.each([
    ["an unverified Rhea version", { lendingVersion: "0.16.2" }],
    ["a target at the liquidation line", { targetBps: 10_000 }],
    ["a fractional target", { targetBps: 12_000.5 }],
    ["the same token as collateral and debt", { debtTokenId: WNEAR }],
    ["debt shares above the pool total", { accountBorrowedShares: 2n * 10n ** 24n }],
    ["shares without a balance", { pools: { ...ONE_TO_ONE, borrowedBalance: 0n } }],
    ["a pool value above u128", { availableInternal: 1n << 128n }],
  ] as const)("%s", (_name, over) => {
    const r = maxBorrow(input(over as Partial<OpenPositionInput>), NOW);
    expect(r.ok).toBe(false);
  });

  it("a second collateral or debt token is refused, not ignored", () => {
    const snap = baseSnapshot({
      collateral: [
        { tokenId: WNEAR, internal: 100n * 10n ** 24n },
        { tokenId: "other.testnet", internal: 1n },
      ],
    });
    expect(maxBorrow(input({ snapshot: snap }), NOW)).toMatchObject({
      ok: false,
      error: { kind: "invalid_input" },
    });
    const snap2 = baseSnapshot({
      borrowed: [...baseSnapshot().borrowed, { tokenId: "other.testnet", internal: 1n }],
    });
    expect(maxBorrow(input({ snapshot: snap2 }), NOW).ok).toBe(false);
  });

  it("a supplied balance the amount-omitted withdraw would sweep is refused", () => {
    for (const id of [USDC, WNEAR]) {
      const snap = baseSnapshot({ supplied: [{ tokenId: id, internal: 5n }] });
      const r = maxBorrow(input({ snapshot: snap }), NOW);
      expect(r).toMatchObject({ ok: false, error: { kind: "invalid_input" } });
    }
  });

  it("an asset that cannot be borrowed or used as collateral is unsupported", () => {
    const snap = baseSnapshot();
    const usdc = snap.assets[USDC];
    const wnear = snap.assets[WNEAR];
    if (!usdc || !wnear) throw new Error("fixture");
    expect(
      maxBorrow(
        input({
          snapshot: { ...snap, assets: { ...snap.assets, [USDC]: { ...usdc, canBorrow: false } } },
        }),
        NOW,
      ),
    ).toMatchObject({ ok: false, error: { kind: "unsupported_asset", tokenId: USDC } });
    expect(
      maxBorrow(
        input({
          snapshot: {
            ...snap,
            assets: { ...snap.assets, [WNEAR]: { ...wnear, canUseAsCollateral: false } },
          },
        }),
        NOW,
      ),
    ).toMatchObject({ ok: false, error: { kind: "unsupported_asset", tokenId: WNEAR } });
  });

  it("zero, negative and non-bigint amounts", () => {
    for (const a of [0n, -1n, 5 as unknown as bigint])
      expect(quoteBorrow(input(), a, NOW)).toMatchObject({
        ok: false,
        error: { kind: "invalid_amount" },
      });
  });
});

describe("share-aware quotes on a non-1:1 pool", () => {
  // Debt shares are worth 1.0978 each, as in the recorded REF pool.
  const SKEWED: BorrowPools = {
    borrowedShares: 44_459_455_679_953_101_693_465n * 10_000n,
    borrowedBalance: 48_809_610_013_439_014_940_495n * 10_000n,
    suppliedShares: 370_481_008_160_211_288_092_408n * 10_000n,
    suppliedBalance: 377_384_649_352_991_856_987_876n * 10_000n,
  };
  // Shares that are worth about 200 USDC on this pool, and the debt they round up to.
  const SHARES = (DEBT_INTERNAL * SKEWED.borrowedShares) / SKEWED.borrowedBalance;
  const DEBT =
    (SHARES * SKEWED.borrowedBalance + SKEWED.borrowedShares - 1n) / SKEWED.borrowedShares;
  const skewed = (over: Partial<OpenPositionInput> = {}) =>
    input({
      snapshot: baseSnapshot({ borrowed: [{ tokenId: USDC, internal: DEBT }] }),
      pools: SKEWED,
      accountBorrowedShares: SHARES,
      ...over,
    });

  it("debt ceils and delivery floors: delivery never exceeds the principal", () => {
    const q = unwrap(quoteBorrow(skewed(), 20_000_000n, NOW));
    expect(q.value.deliveredAtomicEstimate).toBeLessThanOrEqual(20_000_000n);
    expect(q.value.deliveredAtomicEstimate).toBeGreaterThan(19_999_990n);
    expect(q.value.debtAfterInternal).toBeGreaterThanOrEqual(q.value.principalInternal);
    expect(q.value.healthAfter).toBeLessThan(unwrapHealth(q.value.healthBefore));
  });

  it("max satisfies the target and max + 1 does not", () => {
    const m = unwrap(maxBorrow(skewed(), NOW)).value;
    expect(m.bindingLimit).toBe("target_health");
    const atMax = unwrap(quoteBorrow(skewed(), m.maxAtomic, NOW)).value;
    expect(atMax.healthAfter).toBeGreaterThanOrEqual(12_000);
    expect(quoteBorrow(skewed(), m.maxAtomic + 1n, NOW).ok).toBe(false);
  });
});

function unwrapHealth(h: number | "no_debt"): number {
  if (h === "no_debt") throw new Error("expected a health value");
  return h;
}

describe("properties", () => {
  const pool = fc
    .record({
      borrowedShares: fc.bigInt({ min: 10n ** 20n, max: 10n ** 26n }),
      borrowedExtra: fc.bigInt({ min: 0n, max: 10n ** 24n }),
      suppliedShares: fc.bigInt({ min: 10n ** 24n, max: 10n ** 27n }),
      suppliedExtra: fc.bigInt({ min: 0n, max: 10n ** 26n }),
    })
    .map(
      (p): BorrowPools => ({
        borrowedShares: p.borrowedShares,
        borrowedBalance: p.borrowedShares + p.borrowedExtra,
        suppliedShares: p.suppliedShares,
        suppliedBalance: p.suppliedShares + p.suppliedExtra,
      }),
    );
  const accountShares = (pools: BorrowPools) => (pools.borrowedShares * 2n) / 3n / 10n ** 8n;

  const build = (pools: BorrowPools, target: number, collateralUnits: bigint) => {
    const shares = accountShares(pools);
    const debt =
      (shares * pools.borrowedBalance + pools.borrowedShares - 1n) / pools.borrowedShares;
    return input({
      snapshot: baseSnapshot({
        collateral: [{ tokenId: WNEAR, internal: collateralUnits * 10n ** 24n }],
        borrowed: [{ tokenId: USDC, internal: debt }],
      }),
      pools,
      accountBorrowedShares: shares,
      availableInternal: 10n ** 26n,
      targetBps: target,
    });
  };

  it("projected health never rises as the amount grows, so the binary search is sound", () => {
    fc.assert(
      fc.property(
        pool,
        fc.integer({ min: 10_100, max: 30_000 }),
        fc.bigInt({ min: 1n, max: 10n ** 9n }),
        fc.bigInt({ min: 1n, max: 10n ** 9n }),
        (pools, target, a, b) => {
          const inp = build(pools, target, 1_000n);
          const [lo, hi] = a < b ? [a, b] : [b, a];
          const qLo = healthOf(inp, lo);
          const qHi = healthOf(inp, hi);
          if (qLo === null || qHi === null) return true;
          return qHi <= qLo;
        },
      ),
      { numRuns: 200 },
    );
  });

  it("the maximum meets the target and max + 1 breaks the named limit", () => {
    fc.assert(
      fc.property(pool, fc.integer({ min: 10_100, max: 30_000 }), (pools, target) => {
        const inp = build(pools, target, 1_000n);
        const m = maxBorrow(inp, NOW);
        if (!m.ok) return true;
        const { maxAtomic, bindingLimit } = m.value.value;
        if (maxAtomic > 0n) {
          const h = healthOf(inp, maxAtomic);
          if (h === null || h < target) return false;
        }
        if (bindingLimit === "target_health") {
          const next = healthOf(inp, maxAtomic + 1n);
          return next !== null && next < target;
        }
        return true;
      }),
      { numRuns: 100 },
    );
  });

  it("more collateral cannot reduce the admissible maximum", () => {
    fc.assert(
      fc.property(
        pool,
        fc.integer({ min: 10_100, max: 30_000 }),
        fc.bigInt({ min: 100n, max: 5_000n }),
        fc.bigInt({ min: 1n, max: 5_000n }),
        (pools, target, base, extra) => {
          const m1 = maxBorrow(build(pools, target, base), NOW);
          const m2 = maxBorrow(build(pools, target, base + extra), NOW);
          if (!m1.ok || !m2.ok) return true;
          return m2.value.value.maxAtomic >= m1.value.value.maxAtomic;
        },
      ),
      { numRuns: 100 },
    );
  });
});

function healthOf(inp: OpenPositionInput, amount: bigint): number | null {
  const q = quoteBorrowUnbounded(inp, amount);
  return q;
}

/** Health after borrowing `amount`, ignoring the maximum: used to probe monotonicity. */
function quoteBorrowUnbounded(inp: OpenPositionInput, amount: bigint): number | null {
  const wide = { ...inp, targetBps: 10_001, availableInternal: 10n ** 30n };
  const m = maxBorrow(wide, NOW);
  if (!m.ok) return null;
  // Health at `amount` through the public quote requires amount <= max at target 10001.
  if (amount > m.value.value.maxAtomic) return 0;
  const q = quoteBorrow(wide, amount, NOW);
  return q.ok ? q.value.value.healthAfter : null;
}

describe("deposit quote and card numbers", () => {
  it("adds collateral, shows a conditional maximum and never an executable borrow", () => {
    const empty = input({
      snapshot: baseSnapshot({ collateral: [], borrowed: [] }),
      accountBorrowedShares: 0n,
    });
    const q = unwrap(quoteCollateralDeposit(empty, 10n * 10n ** 24n, 20n * 10n ** 24n, NOW));
    expect(q.value.collateralAfterInternal).toBe(10n * 10n ** 24n);
    // 10 wNEAR at $5 x 60% = $30; target 12000 allows $25 of adjusted debt = $23.75 USDC.
    expect(q.value.conditionalMaxBorrowAtomic).toBe(23_750_000n);
    expect(q.assumptions.join(" ")).toMatch(/conditional on this deposit settling/);
    // The unconditional quote on the same empty account has no collateral and no maximum.
    expect(unwrap(maxBorrow(empty, NOW)).value.maxAtomic).toBe(0n);
  });

  it("refuses a deposit above the wallet balance or of zero", () => {
    expect(quoteCollateralDeposit(input(), 5n, 4n, NOW)).toMatchObject({
      ok: false,
      error: { kind: "invalid_amount" },
    });
    expect(quoteCollateralDeposit(input(), 0n, 4n, NOW)).toMatchObject({
      ok: false,
      error: { kind: "invalid_amount" },
    });
  });

  it("formats exact decimal card numbers from the quote", () => {
    const q = unwrap(quoteBorrow(input(), 37_500_000n, NOW)).value;
    const nums = unwrap(borrowCardNumbers(input(), q));
    expect(nums).toEqual([
      { label: "Borrow", after: "37.5", unit: "USDC" },
      { label: "Estimated to your wallet", after: "37.5", unit: "USDC" },
      { label: "Debt", before: "200", after: "237.5", unit: "USDC" },
      { label: "Health factor", before: "142.5", after: "120", unit: "%" },
      { label: "Target health", after: "120", unit: "%" },
      { label: "Largest borrow at this target", after: "37.5", unit: "USDC" },
    ]);
  });
});
