import { expect, test } from "@playwright/test";

// Smoke de déploiement — docs/07 §1, §7. Prouve que l'app boote (validation d'env
// passée) et répond. Requête API pure : pas de navigateur requis.
test("GET /api/health renvoie { status: ok }", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
