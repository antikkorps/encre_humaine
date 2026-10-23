import { eq, newsletterSubscribers } from "@encre/db";

/**
 * Demande d'inscription à la newsletter (double opt-in maison, docs/03 §3.1) :
 * UPSERT `pending` (jeton hashé + expiration) → contact Resend en UNSUBSCRIBED →
 * email de confirmation. Un abonné déjà confirmé ne reçoit rien (idempotent).
 * Partagé par `/api/newsletter/subscribe` et le déblocage des diagnostics : une
 * case cochée ne vaut jamais inscription directe. Lève si l'email de
 * confirmation ne part pas.
 */
export async function requestNewsletterOptIn(opts: {
  email: string;
  firstName?: string | null;
  ip: string | null;
  userAgent: string | null;
}): Promise<void> {
  const db = serverDb();
  const [existing] = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, opts.email))
    .limit(1);
  if (existing?.status === "confirmed") return;

  const { token, tokenHash } = generateConfirmationToken();
  const firstName = opts.firstName ?? null;
  const pending = {
    status: "pending" as const,
    firstName,
    tokenHash,
    expiresAt: new Date(Date.now() + CONFIRMATION_TTL_MS),
    consentIp: opts.ip, // preuve de consentement (légitime ici, docs/01 §7)
    consentUserAgent: opts.userAgent,
  };
  if (!existing) {
    await db.insert(newsletterSubscribers).values({ email: opts.email, ...pending });
  } else {
    // pending (renvoi du mail) ou unsubscribed (ré-opt-in) → régénère + repousse.
    await db
      .update(newsletterSubscribers)
      .set({ ...pending, requestedAt: new Date() })
      .where(eq(newsletterSubscribers.id, existing.id));
  }
  await syncPendingContact(opts.email, firstName);
  await sendNewsletterConfirmation({ email: opts.email, firstName, token });
}

/** Contact Resend en UNSUBSCRIBED : un pending ne reçoit aucun broadcast (best-effort). */
async function syncPendingContact(email: string, firstName: string | null): Promise<void> {
  try {
    const contactId = await upsertNewsletterContact({
      email,
      firstName: firstName ?? undefined,
      unsubscribed: true,
    });
    if (contactId) {
      await serverDb()
        .update(newsletterSubscribers)
        .set({ resendContactId: contactId })
        .where(eq(newsletterSubscribers.email, email));
    }
  } catch (err) {
    console.error(`[newsletter] sync contact Resend ${email} échouée :`, err);
  }
}
