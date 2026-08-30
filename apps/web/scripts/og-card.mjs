/**
 * Génère la carte de partage par défaut → `public/og-default.png` (1200×630).
 *
 * À rejouer si la signature de marque change : `pnpm --filter @encre/web og:card`.
 * Cette carte n'est qu'un DERNIER RECOURS (cf. `utils/seo.ts`) : dès qu'une image
 * est déposée dans `site_settings.default_og_image` ou dans l'`og_image` d'une
 * page, Directus l'emporte, sans toucher au code.
 *
 * Le rendu passe par Chromium (déjà présent pour les e2e) plutôt que par une
 * lib d'image : la carte réutilise ainsi la vraie typo (Fraunces/Inter) et les
 * tokens de `assets/css/main.css`, donc elle vieillit avec le design du site.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/og-default.png");

// Marque déposée INPI (poulpe seul, sans texte) — inlinée en data URI pour que
// le rendu ne dépende d'aucun serveur local.
const poulpe = readFileSync(resolve(ROOT, "assets/marque/Logo-marque.webp")).toString("base64");

// Reprise des tokens du thème (`assets/css/main.css`) : crème, marine, doré.
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;500;600&display=block">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#F5F2EB; font-family:Inter,sans-serif; }
  .card { position:relative; width:1200px; height:630px; overflow:hidden;
          display:grid; grid-template-columns:1fr 470px; align-items:center; }
  .edge { position:absolute; inset:0 auto 0 0; width:14px; background:#C9A84C; }
  .band { position:absolute; left:0; right:0; bottom:0; height:78px; background:#1C2B4A;
          display:flex; align-items:center; justify-content:space-between; padding:0 64px 0 78px; }
  .band .url { font-size:26px; font-weight:600; color:#F5F2EB; }
  .band .who { font-size:22px; font-weight:500; color:#E3CD82; letter-spacing:.02em; }
  .left { padding:0 40px 78px 78px; }
  .eyebrow { font-size:20px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:#8A6D24; }
  h1 { font-family:Fraunces,serif; font-size:67px; line-height:1.06; font-weight:700;
       color:#1C2B4A; letter-spacing:-0.02em; margin-top:20px; }
  .rule { width:96px; height:6px; background:#C9A84C; border-radius:3px; margin:34px 0 24px; }
  p { font-size:29px; line-height:1.35; color:#243758; }
  /* Même soulignement « encre » que l'utilitaire .ink-underline du thème. */
  .mark { font-weight:600; color:#1C2B4A;
          background:linear-gradient(to top, rgba(201,168,76,.62) 0 .34em, transparent .34em); }
  .right { display:flex; align-items:center; justify-content:center; padding-bottom:78px; }
  .right img { width:392px; height:auto; }
</style></head><body>
<div class="card">
  <div class="edge"></div>
  <div class="left">
    <div class="eyebrow">L'Encre Humaine</div>
    <h1>Structurer vos RH<br>sans perdre le sens<br>des parcours humains.</h1>
    <div class="rule"></div>
    <p>Conseil RH &amp; <span class="mark">accompagnement des PME</span></p>
  </div>
  <div class="right"><img src="data:image/webp;base64,${poulpe}" alt=""></div>
  <div class="band"><span class="url">encrehumaine.fr</span><span class="who">Eléonore Morée</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
// Sans ça, la capture peut partir avant que Fraunces/Inter soient posées.
await page.evaluate(() => document.fonts.ready);
writeFileSync(OUT, await page.screenshot({ type: "png" }));
await browser.close();
console.log(`✔ ${OUT}`);
