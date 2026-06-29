// @vitest-environment node
//
// Provider @nuxt/image Directus — transformations déléguées à Directus via les
// query params d'asset. On vérifie la construction d'URL (le rendu des images
// dépend de Directus, non testable ici, mais la logique d'URL l'est).
import { describe, expect, it } from "vitest";
import { getImage } from "../providers/directus";

// 3e arg = contexte @nuxt/image (ImageCTX), requis par le type ProviderGetImage
// mais ignoré par notre implémentation (transformations déléguées à Directus).
const call = (src: string, modifiers: Record<string, unknown>) =>
  getImage(src, { modifiers } as never, {} as never);

describe("provider image Directus", () => {
  it("ajoute les params de transformation à l'URL d'asset", () => {
    const { url } = call("https://cms.encrehumaine.fr/assets/abc", {
      width: 640,
      height: 480,
      quality: 80,
      format: "webp",
      fit: "cover",
    });
    expect(url).toBe(
      "https://cms.encrehumaine.fr/assets/abc?width=640&height=480&quality=80&format=webp&fit=cover",
    );
  });

  it("préserve un éventuel query string existant (séparateur &)", () => {
    const { url } = call("https://cms.encrehumaine.fr/assets/abc?v=2", { width: 320 });
    expect(url).toBe("https://cms.encrehumaine.fr/assets/abc?v=2&width=320");
  });

  it("ignore format 'auto' et renvoie l'URL nue sans modifier", () => {
    expect(call("https://cms.x/assets/abc", { format: "auto" }).url).toBe(
      "https://cms.x/assets/abc",
    );
    expect(call("https://cms.x/assets/abc", {}).url).toBe("https://cms.x/assets/abc");
  });
});
