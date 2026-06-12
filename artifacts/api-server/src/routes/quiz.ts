import { Router, type IRouter } from "express";
import { db, quizResultsTable } from "@workspace/db";
import {
  GetResultParams,
  GetResultResponse,
  ListResultsResponse,
  SubmitQuizBody,
} from "@workspace/api-zod";
import { desc, eq } from "drizzle-orm";

import { openai } from "../lib/openai";
import { getActiveSubscription, getSubscriptionAccess } from "../lib/subscription";

const router: IRouter = Router();

const LANG_NAMES: Record<string, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
};

router.post("/quiz/submit", async (req, res): Promise<void> => {
  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { answers, email, userName, language } = parsed.data;
  const responseLang = LANG_NAMES[language ?? "fr"] ?? "French";
  const answersText = answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");

  try {
    const subscription = await getActiveSubscription(email.toLowerCase());
    const access = getSubscriptionAccess(subscription);
    if (!access.canTakeQuiz) {
      res.status(402).json({
        error: "subscription_required",
        message: "Un abonnement Starter ou Premium actif est requis pour faire le questionnaire.",
      });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "Error checking subscription before quiz");
    res.status(500).json({ error: "Erreur lors de la vérification de l'abonnement" });
    return;
  }

  const systemPrompt = `You are an expert in entrepreneurship and career guidance.
You analyse a user's quiz answers and recommend the best-fitting business type for their profile.
You MUST respond entirely in ${responseLang}.

You have access to a very wide and modern range of business ideas. Consider digital, creator, local service, tech, finance, education, coaching, manufacturing, resale, e-commerce and AI-assisted opportunities.
Creator business examples include UGC creator, faceless YouTube channel, influencer management, ghostwriting, personal branding consulting, and OnlyFans management agency for adult creators.

Choose the ONE business that best fits the user's profile based on their quiz answers. Be creative, specific, and modern.
If the best fit is OnlyFans management agency, the action plan must be specific to that business: define a compliant service offer, pick a creator niche, build outreach scripts, create content/calendar systems, set ethical boundaries and contracts, track creator revenue metrics, and respect platform rules and legal consent requirements.

Structure your response as JSON with exactly these fields:
{
  "businessName": "Short, catchy business type name (max 8 words, in ${responseLang})",
  "businessDescription": "Detailed description of the recommended business (3-4 sentences, in ${responseLang})",
  "earningPotential": "Realistic but attractive revenue potential for this specific business, in ${responseLang}. Give monthly ranges with stages, e.g. beginner, validated, strong execution. Avoid guarantees and explain that results depend on execution, niche and acquisition.",
  "whyItFits": "Personalised explanation of why this business fits the profile (3-4 sentences, reference the quiz answers, in ${responseLang})",
  "actionPlan": "Detailed numbered action plan (minimum 6 concrete, actionable steps, each step on its own line as '1. Step...', in ${responseLang})"
}
Respond ONLY with the JSON object, no text before or after.`;

  const userPrompt = `Here are the quiz answers${userName ? ` from ${userName}` : ""}:

${answersText}

Analyse this profile and recommend the ideal business with a personalised action plan. Respond in ${responseLang}.`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    let parsedResult: {
      businessName: string;
      businessDescription: string;
      earningPotential?: string;
      whyItFits: string;
      actionPlan: string;
    } | null = null;

    try {
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch {
      req.log.error("Failed to parse AI response as JSON");
    }

    if (parsedResult) {
      const [saved] = await db
        .insert(quizResultsTable)
        .values({
          userName: userName ?? null,
          businessName: parsedResult.businessName,
          businessDescription: parsedResult.businessDescription,
          earningPotential:
            parsedResult.earningPotential?.trim() ||
            "Potentiel réaliste : 500 à 2 000 €/mois au démarrage, 3 000 à 10 000 €/mois une fois l'offre validée, davantage avec une acquisition solide. Les résultats dépendent du marché, de l'exécution et de la régularité.",
          whyItFits: parsedResult.whyItFits,
          actionPlan: parsedResult.actionPlan,
          answersJson: JSON.stringify(answers),
        })
        .returning();

      res.write(`data: ${JSON.stringify({ done: true, resultId: saved.id })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
  } catch (err) {
    req.log.error({ err }, "Error calling OpenAI");
    res.write(`data: ${JSON.stringify({ error: "Erreur lors de la génération" })}\n\n`);
  }

  res.end();
});

router.get("/quiz/results", async (_req, res): Promise<void> => {
  const results = await db.select().from(quizResultsTable).orderBy(desc(quizResultsTable.createdAt));
  res.json(ListResultsResponse.parse(results));
});

router.get("/quiz/results/:id", async (req, res): Promise<void> => {
  const params = GetResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [result] = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Résultat introuvable" });
    return;
  }

  res.json(GetResultResponse.parse(result));
});

export default router;
