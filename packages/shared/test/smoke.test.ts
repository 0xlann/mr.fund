import { describe, expect, it } from "vitest";
import { packageName } from "../src/index";

describe("@mrfund/shared", () => {
  it("loads", () => {
    expect(packageName).toBe("@mrfund/shared");
  });
});
