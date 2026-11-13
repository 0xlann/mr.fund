import { describe, expect, it } from "vitest";
import { normalizeReplyDashes } from "../src/chat-output";
import { checkNumbers, extractNumbers } from "../src/numbers";

describe("reply dash normalization before provenance checking", () => {
  it.each([
    "Range 5–10 USDC",
    "Range 5—10 USDC",
    "Health — 150.25%; shock –20%",
    "Debt −10 USDC, or -10 USDC",
    "5–10.25 USDC; 1.234,5—2.345,6 USD",
  ])("preserves numeric readings of %s", (input) => {
    const normalized = normalizeReplyDashes(input);
    expect(normalized).not.toMatch(/[—–]/);
    const readings = (text: string) =>
      extractNumbers(text, ["USDC", "USD"]).map(({ neg, candidates, unit }) => ({
        neg,
        candidates,
        unit,
      }));
    expect(readings(normalized)).toEqual(readings(input));
  });
  it("keeps a range endpoint positive and requires its source", () => {
    const text = normalizeReplyDashes("5–10 USDC");
    expect(
      checkNumbers(text, [
        { value: "5", unit: null },
        { value: "10", unit: "USDC" },
      ]),
    ).toEqual({ ok: true });
    expect(checkNumbers(text, [{ value: "5", unit: null }])).toEqual({
      ok: false,
      violations: ["10 USDC"],
    });
  });
});
