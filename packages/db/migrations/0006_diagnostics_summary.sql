-- Questions et réponses en clair pour « Diagnostics reçus » (retour d'Éléonore du
-- 2026-10-27). Lisible par Directus via le GRANT SELECT de table (0005).
ALTER TABLE "app"."diagnostics" ADD COLUMN "summary" text;