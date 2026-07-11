import { describe, expect, it } from "vitest";
import { formatMoney, maskAccount, titleCase } from "@/lib/formatters";

describe("formatters", () => {
  it("formats minor currency units as NGN", () => {
    expect(formatMoney(100000)).toContain("1,000");
  });

  it("masks account numbers", () => {
    expect(maskAccount("0123456789")).toBe("••••••6789");
  });

  it("turns snake case into title case", () => {
    expect(titleCase("pending_provider")).toBe("Pending Provider");
  });
});
