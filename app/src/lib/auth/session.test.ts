import { describe, expect, it } from "vitest";
import { classifySession } from "@/lib/auth/session";

describe("session classification", () => {
  it("treats a valid backend session as authenticated", () => {
    expect(classifySession(200)).toBe("authenticated");
  });

  it("treats an anonymous or expired backend session as anonymous", () => {
    expect(classifySession(401)).toBe("anonymous");
    expect(classifySession(403)).toBe("anonymous");
  });

  it("requires MFA when the BFF marks a pending challenge", () => {
    expect(classifySession(202, true)).toBe("mfa_required");
  });
});
