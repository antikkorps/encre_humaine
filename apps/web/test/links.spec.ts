// @vitest-environment node
//
// Un seul critère « lien externe » pour tout le site (nouvel onglet + rel).
import { describe, expect, it } from "vitest";
import { isExternalHref } from "~/utils/links";

describe("isExternalHref", () => {
  it.each([
    ["https://exemple.fr", true],
    ["http://exemple.fr", true],
    ["mailto:a@b.fr", true],
    ["/organisations/audit-rh", false],
    ["#faq", false],
  ])("%s → %s", (href, expected) => {
    expect(isExternalHref(href)).toBe(expected);
  });
});
