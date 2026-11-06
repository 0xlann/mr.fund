import { expect, it } from "vitest";
import fixture from "../../../fixtures/trigger-vectors.json";
import { healthBps } from "../src/health";
import { baseSnapshot, NOW, USDC, WNEAR, wnearAsset } from "./helpers";

it.each(fixture.cases)("matches the shared Rust trigger vector: $name", (vector) => {
  const s = baseSnapshot();
  s.assets[WNEAR] = {
    ...wnearAsset,
    token: { id: WNEAR, symbol: "COL", decimals: 6, extraDecimals: 0 },
  };
  s.prices[WNEAR] = { multiplier: 50000n, decimals: 10, source: "oracle", publishTimeMs: NOW };
  s.collateral = [{ tokenId: WNEAR, internal: BigInt(vector.collateralInternal) }];
  s.borrowed = [{ tokenId: USDC, internal: BigInt(vector.debtInternal) }];
  const result = healthBps(s, NOW);
  expect(result.ok && result.value.value).toBe(vector.healthBps);
});
