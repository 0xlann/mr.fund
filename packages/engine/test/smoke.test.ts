import { describe, expect, it } from "vitest";
import { packageName } from "../src/index";

describe("@mrfund/engine", () => {
  it("loads", () => {
    expect(packageName).toBe("@mrfund/engine");
  });
});
