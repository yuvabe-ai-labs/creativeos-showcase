import { describe, expect, it } from "vitest";
import { canManageShowcase } from "./platform-role";

describe("canManageShowcase", () => {
  it("lets in CreativeOS super admins and showcase-only logins", () => {
    expect(canManageShowcase({ platform_role: "super_admin" })).toBe(true);
    expect(canManageShowcase({ showcase_admin: true })).toBe(true);
  });
  it("refuses everyone else, including near misses", () => {
    expect(canManageShowcase({ platform_role: "Super_Admin" })).toBe(false);
    expect(canManageShowcase({ platform_role: "member" })).toBe(false);
    expect(canManageShowcase({ showcase_admin: "true" })).toBe(false);
    expect(canManageShowcase({})).toBe(false);
    expect(canManageShowcase(null)).toBe(false);
    expect(canManageShowcase("super_admin")).toBe(false);
  });
});
