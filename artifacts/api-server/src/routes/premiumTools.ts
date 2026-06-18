import { Router, type IRouter, type Request } from "express";
import { db, premiumToolStatesTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";

import { getAuthPayloadFromRequest } from "../lib/auth";
import { openai } from "../lib/openai";
import { getActiveSubscription, getSubscriptionAccess } from "../lib/subscription";

const router: IRouter = Router();

const premiumToolBodySchema = z.object({
  businessName: z.string().trim().min(1),
  fieldValues: z.record(z.string(), z.string()).default({}),
  generatedOutput: z.string().default(""),
  savedNote: z.string().default(""),
  completedTasks: z.array(z.number()).default([]),
});

const premiumGenerateBodySchema = z.object({
  businessName: z.string().trim().min(1),
  workspaceLabel: z.string().trim().min(1),
  moduleTitle: z.string().trim().min(1),
  fieldValues: z.record(z.string(), z.string()).default({}),
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

router.post("/premium-tools/:workspace/:module/generate", async (req, res): Promise<void> => {
  try {
    const premium = await requirePremium(req);
    if (!premium.ok) {
      res.status(premium.status).json({ error: premium.error });
      return;
    }

    const parsed = premiumGenerateBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const fieldsText = Object.entries(parsed.data.fieldValues)
      .filter(([, value]) => value.trim().length > 0)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content: `Tu es l'agent Premium Befind. Tu génères des livrables opérationnels pour aider l'utilisateur à exécuter son business.

Règles:
- Réponds en français.
- Sois concret, actionnable et prêt à copier-coller.
- Adapte le livrable au module demandé.
- Ne promets jamais des résultats garantis.
- Si le sujet touche aux créateurs adultes/OnlyFans, reste légal, éthique, consentement-first, et évite toute manipulation ou spam.
- Structure avec titres courts, listes et étapes.`,
        },
        {
          role: "user",
          content: `Business recommandé: ${parsed.data.businessName}
Workspace: ${parsed.data.workspaceLabel}
Module: ${parsed.data.moduleTitle}

Informations fournies:
${fieldsText || "- Aucun contexte précis fourni."}

Génère maintenant le livrable le plus utile pour ce module. Il doit contenir:
1. Une synthèse claire
2. Un plan ou contenu prêt à utiliser
3. Les prochaines actions
4. Les points à suivre dans le dashboard`,
        },
      ],
    });

    const output = completion.choices[0]?.message?.content?.trim();
    if (!output) {
      res.status(500).json({ error: "Aucune sortie générée" });
      return;
    }

    res.json({ output });
  } catch (err) {
    req.log.error({ err }, "Error generating premium tool output");
    res.status(500).json({ error: "Erreur lors de la génération IA du module Premium" });
  }
});

export default router;
