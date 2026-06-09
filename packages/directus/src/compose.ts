// Helper docker compose (overlay dev) pour les scripts snapshot/apply.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(here, "../../..");

const baseArgs = [
  "compose",
  "--env-file",
  resolve(repoRoot, "infra/env/.env"),
  "-f",
  resolve(repoRoot, "infra/docker-compose.yml"),
  "-f",
  resolve(repoRoot, "infra/docker-compose.dev.yml"),
];

export function compose(args: string[]): void {
  const r = spawnSync("docker", [...baseArgs, ...args], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
