// @vitest-environment node
import { describe, expect, it } from "vitest";
import { analyticsScript } from "../utils/analytics";

describe("analyticsScript", () => {
  it("retourne le descripteur quand url + id sont fournis", () => {
    expect(analyticsScript("https://stats.encrehumaine.fr/script.js", "abc-123")).toEqual({
      src: "https://stats.encrehumaine.fr/script.js",
      defer: true,
      "data-website-id": "abc-123",
    });
  });

  it("retourne null si l'un des deux manque (non configuré)", () => {
    expect(analyticsScript("https://stats.encrehumaine.fr/script.js", "")).toBeNull();
    expect(analyticsScript("", "abc-123")).toBeNull();
    expect(analyticsScript(undefined, undefined)).toBeNull();
    expect(analyticsScript(null, null)).toBeNull();
  });
});
