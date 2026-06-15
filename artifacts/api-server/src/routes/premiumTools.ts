import { Router, type IRouter, type Request } from "express";
import { db, premiumToolStatesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { getAuthPayloadFromRequest } from "../lib/auth";
import { getActiveSubscription, getSubscriptionAccess } from "../lib/subscription";

const router: IRouter = Router();

const premiumToolBodySchema = z.object({
  businessName: z.string().trim().min(1),
  fieldValues: z.record(z.string(), z.string()).default({}),
  generatedOutput: z.string().default(""),
  savedNote: z.string().default(""),
  completedTasks: z.array(z.number()).default([]),
});

async function requirePremium(req: Request) {
  const auth = getAuthPayloadFromRequest(req);
  if (!auth) return { ok: false as const, status: 401, error: "Connexion requise" };

  const subscription = await getActiveSubscription(auth.email.toLowerCase());
  const access = getSubscriptionAccess(subscription);
  if (!access.canUsePremiumTools) {
    return { ok: false as const, status: 402, error: "Un abonnement Premium actif est requis." };
  }

  return { ok: true as const, auth };
}

router.get("/premium-tools/:workspace/:module", async (req, res): Promise<void> => {
  try {
    const premium = await requirePremium(req);
    if (!premium.ok) {
      res.status(premium.status).json({ error: premium.error });
      return;
    }

    const businessName = (req.query.business as string | undefined)?.trim() ?? "";
    const [state] = await db
      .select()
      .from(premiumToolStatesTable)
      .where(
        and(
          eq(premiumToolStatesTable.userId, premium.auth.userId),
          eq(premiumToolStatesTable.workspace, req.params.workspace),
          eq(premiumToolStatesTable.module, req.params.module),
          eq(premiumToolStatesTable.businessName, businessName),
        ),
      )
      .orderBy(desc(premiumToolStatesTable.updatedAt))
      .limit(1);

    res.json({ state: state ?? null });
  } catch (err) {
    req.log.error({ err }, "Error loading premium tool state");
    res.status(500).json({ error: "Erreur lors du chargement du module Premium" });
  }
});

router.put("/premium-tools/:workspace/:module", async (req, res): Promise<void> => {
  try {
    const premium = await requirePremium(req);
    if (!premium.ok) {
      res.status(premium.status).json({ error: premium.error });
      return;
    }

    const parsed = premiumToolBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [existing] = await db
      .select()
      .from(premiumToolStatesTable)
      .where(
        and(
          eq(premiumToolStatesTable.userId, premium.auth.userId),
          eq(premiumToolStatesTable.workspace, req.params.workspace),
          eq(premiumToolStatesTable.module, req.params.module),
          eq(premiumToolStatesTable.businessName, parsed.data.businessName),
        ),
      )
      .limit(1);

    const values = {
      email: premium.auth.email.toLowerCase(),
      workspace: req.params.workspace,
      module: req.params.module,
      businessName: parsed.data.businessName,
      fieldValues: parsed.data.fieldValues,
      generatedOutput: parsed.data.generatedOutput,
      savedNote: parsed.data.savedNote,
      completedTasks: parsed.data.completedTasks,
      updatedAt: new Date(),
    };

    const [state] = existing
      ? await db
          .update(premiumToolStatesTable)
          .set(values)
          .where(eq(premiumToolStatesTable.id, existing.id))
          .returning()
      : await db
          .insert(premiumToolStatesTable)
          .values({
            ...values,
            userId: premium.auth.userId,
          })
          .returning();

    res.json({ state });
  } catch (err) {
    req.log.error({ err }, "Error saving premium tool state");
    res.status(500).json({ error: "Erreur lors de la sauvegarde du module Premium" });
  }
});

export default router;
