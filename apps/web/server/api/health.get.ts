// Healthcheck — utilisé par le healthcheck Docker (docs/07 §1, §7).
export default defineEventHandler(() => ({ status: "ok" }));
