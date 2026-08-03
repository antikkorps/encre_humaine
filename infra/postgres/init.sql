-- ───────────────────────────────────────────────────────────────────────────
-- Init Postgres — docs/07-deploy.md §3, docs/06-security.md §9.
-- Exécuté UNE FOIS au premier boot du cluster (docker-entrypoint-initdb.d).
-- 3 schémas isolés + 3 rôles séparés : Directus ne peut PAS lire `app`.
--
-- Les mots de passe sont injectés via psql (variables :app_pw, etc.) — voir
-- l'entrypoint dans docker-compose.yml. Ne pas mettre de secrets en dur ici.
-- ───────────────────────────────────────────────────────────────────────────

-- Schémas
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS directus;
CREATE SCHEMA IF NOT EXISTS umami;

-- ── Rôles applicatifs (un par domaine, cloisonnés) ──────────────────────────
-- psql n'interpole PAS les variables `:'x'` à l'intérieur d'un bloc dollar-quoté
-- ($$...$$). On stocke donc les mots de passe en réglages de session (ici, hors
-- $$, l'interpolation a bien lieu) puis on les lit via current_setting() dans le
-- DO block, avec EXECUTE format(... %L ...) pour un échappement sûr.
SELECT set_config('encre.app_pw', :'app_pw', false);
SELECT set_config('encre.directus_pw', :'directus_pw', false);
SELECT set_config('encre.umami_pw', :'umami_pw', false);

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    EXECUTE format('CREATE ROLE app_user LOGIN PASSWORD %L', current_setting('encre.app_pw'));
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'directus_user') THEN
    EXECUTE format('CREATE ROLE directus_user LOGIN PASSWORD %L', current_setting('encre.directus_pw'));
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'umami_user') THEN
    EXECUTE format('CREATE ROLE umami_user LOGIN PASSWORD %L', current_setting('encre.umami_pw'));
  END IF;
END $$;

-- ── app_user : confiné au schéma `app` ──────────────────────────────────────
GRANT USAGE, CREATE ON SCHEMA app TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON SEQUENCES TO app_user;
ALTER ROLE app_user SET search_path = app;
REVOKE ALL ON SCHEMA directus, umami FROM app_user;

-- ── directus_user : confiné au schéma `directus` (NE VOIT PAS `app`) ─────────
-- Directus lit (et seulement lit) les messages du formulaire pour les afficher
-- dans l'admin : sans ça, Eléonore n'a aucun moyen de les consulter si l'email
-- de notification n'arrive pas. Un SELECT strict — la table reste la propriété
-- des migrations applicatives.
GRANT USAGE ON SCHEMA app TO directus_user;
GRANT SELECT ON app.contact_leads TO directus_user;

GRANT USAGE, CREATE ON SCHEMA directus TO directus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA directus GRANT ALL ON TABLES TO directus_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA directus GRANT ALL ON SEQUENCES TO directus_user;
ALTER ROLE directus_user SET search_path = directus;
REVOKE ALL ON SCHEMA app, umami FROM directus_user;

-- ── umami_user : confiné au schéma `umami` ──────────────────────────────────
GRANT USAGE, CREATE ON SCHEMA umami TO umami_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA umami GRANT ALL ON TABLES TO umami_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA umami GRANT ALL ON SEQUENCES TO umami_user;
ALTER ROLE umami_user SET search_path = umami;
REVOKE ALL ON SCHEMA app, directus FROM umami_user;

-- pgcrypto : requis par la migration Prisma `01_init` d'Umami (qui fait un
-- CREATE EXTENSION). Or créer une extension exige le SUPERUSER → on la pré-crée
-- ici (script d'init = superuser), dans le schéma `umami` (search_path d'umami_user).
-- Ainsi le `CREATE EXTENSION IF NOT EXISTS pgcrypto` d'Umami devient un no-op.
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA umami;

-- Empêcher la création d'objets dans `public` par les rôles applicatifs
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
