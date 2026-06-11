import { Router, type IRouter } from "express";

import { openai } from "../lib/openai";
import { getActiveSubscription, isStarterOrPremium } from "../lib/subscription";

const router: IRouter = Router();

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

function normalizeHistory(rawHistory: unknown): AgentMessage[] {
  if (!Array.isArray(rawHistory)) return [];

  return rawHistory
    .filter(
      (message): message is AgentMessage =>
        message != null &&
        typeof message === "object" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    )
    .slice(-12);
}

router.post("/business-agent/chat", async (req, res): Promise<void> => {
  const { email, businessName, businessDescription, question, history: rawHistory } = req.body as {
    email?: unknown;
    businessName?: unknown;
    businessDescription?: unknown;
    question?: unknown;
    history?: unknown;
  };

  if (
    typeof email !== "string" ||
    typeof businessName !== "string" ||
    typeof question !== "string" ||
    email.trim().length === 0 ||
    businessName.trim().length === 0 ||
    question.trim().length === 0
  ) {
    res.status(400).json({ error: "email, businessName and question are required" });
    return;
  }

  try {
    const subscription = await getActiveSubscription(email.trim().toLowerCase());
    if (!isStarterOrPremium(subscription)) {
      res.status(402).json({
        error: "subscription_required",
        message: "Un abonnement Starter ou Premium actif est requis.",
      });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "Error checking subscription for business agent");
    res.status(500).json({ error: "Erreur lors de la vérification de l'abonnement" });
    return;
  }

  const history = normalizeHistory(rawHistory);
  const safeDescription = typeof businessDescription === "string" ? businessDescription : "";

  const systemPrompt = `Tu es un agent IA spécialisé dans le business suivant : ${businessName}.
Description du business : ${safeDescription || "Aucune description fournie."}

Ton rôle :
- répondre uniquement aux questions liées à ce business, à son lancement, son positionnement, son marketing, ses ventes, ses opérations et ses risques;
- donner des réponses pratiques, structurées et actionnables;
- rester éthique, légal et prudent, surtout pour les activités liées aux créateurs de contenu et aux plateformes adultes;
- ne jamais encourager le spam, la manipulation, l'exploitation, la fraude ou le contournement des règles des plateformes.

Réponds dans la langue de l'utilisateur, en 4 à 8 phrases maximum sauf si l'utilisateur demande un plan détaillé.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 700,
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: question },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim() ?? "";
    res.json({ answer });
  } catch (err) {
    req.log.error({ err }, "Business agent error");
    res.status(500).json({ error: "Erreur lors de la génération de la réponse" });
  }
});

export default router;
