import { Router, type IRouter } from "express";
import { db, quizResultsTable } from "@workspace/db";
import {
  AlternativeQuizBody,
  GetResultParams,
  GetResultResponse,
  ListResultsResponse,
  SubmitQuizBody,
} from "@workspace/api-zod";
import { and, count, desc, eq } from "drizzle-orm";

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

const STARTER_QUIZ_LIMIT = 1;
const PREMIUM_QUIZ_LIMIT = 5;
const PREMIUM_ALTERNATIVE_LIMIT = 2;

type ParsedQuizResult = {
  businessName: string;
  businessDescription: string;
  earningPotential?: string;
  whyItFits: string;
  actionPlan: string;
};

function fallbackEarningPotential(): string {
  return "Potentiel réaliste : 500 à 2 000 €/mois au démarrage, 3 000 à 10 000 €/mois une fois l'offre validée, davantage avec une acquisition solide. Les résultats dépendent du marché, de l'exécution et de la régularité.";
}

function buildSystemPrompt(responseLang: string): string {
  return `You are an expert in entrepreneurship and career guidance.
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
}

async function getPrimaryQuizAttemptCount(email: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(quizResultsTable)
    .where(and(eq(quizResultsTable.email, email), eq(quizResultsTable.isAlternative, false)));

  return row?.value ?? 0;
}

async function getAlternativeSuggestionCount(email: string, originResultId: number): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(quizResultsTable)
    .where(
      and(
        eq(quizResultsTable.email, email),
        eq(quizResultsTable.isAlternative, true),
        eq(quizResultsTable.originResultId, originResultId),
      ),
    );

  return row?.value ?? 0;
}

async function enrichResult<T extends typeof quizResultsTable.$inferSelect>(result: T) {
  const originResultId = result.originResultId ?? result.id;
  const alternativeSuggestionsUsed = result.email
    ? await getAlternativeSuggestionCount(result.email, originResultId)
    : 0;

  return { ...result, alternativeSuggestionsUsed };
}

router.get("/quiz/access/:email", async (req, res): Promise<void> => {
  const email = req.params.email?.trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Email requis" });
    return;
  }

  try {
    const subscription = await getActiveSubscription(email);
    const access = getSubscriptionAccess(subscription);
    const attemptsUsed = await getPrimaryQuizAttemptCount(email);
    const limit = access.plan === "premium" ? PREMIUM_QUIZ_LIMIT : STARTER_QUIZ_LIMIT;
    const canTakeQuiz = access.canTakeQuiz && attemptsUsed < limit;

    res.json({
      active: access.active,
      tier: access.tier,
      plan: access.plan,
      canUsePremiumTools: access.canUsePremiumTools,
      canTakeQuiz,
      attemptsUsed,
      limit,
      message: canTakeQuiz
        ? null
        : !access.canTakeQuiz
          ? "Un abonnement Starter ou Premium actif est requis pour faire le questionnaire."
          : access.plan === "premium"
            ? "Votre abonnement Premium permet de passer le questionnaire 5 fois maximum."
            : "Votre abonnement Starter permet de passer le questionnaire une seule fois.",
    });
  } catch (err) {
    req.log.error({ err }, "Error checking quiz access");
    res.status(500).json({ error: "Erreur lors de la vérification de l'accès au questionnaire" });
  }
});

router.post("/quiz/submit", async (req, res): Promise<void> => {
  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { answers, email, userName, language } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const responseLang = LANG_NAMES[language ?? "fr"] ?? "French";
  const answersText = answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");

  let plan: "starter" | "premium";
  try {
    const subscription = await getActiveSubscription(normalizedEmail);
    const access = getSubscriptionAccess(subscription);
    if (!access.canTakeQuiz) {
      res.status(402).json({
        error: "subscription_required",
        message: "Un abonnement Starter ou Premium actif est requis pour faire le questionnaire.",
      });
      return;
    }

    plan = access.plan ?? "starter";
    const attemptsUsed = await getPrimaryQuizAttemptCount(normalizedEmail);
    const limit = plan === "premium" ? PREMIUM_QUIZ_LIMIT : STARTER_QUIZ_LIMIT;
    if (attemptsUsed >= limit) {
      res.status(403).json({
        error: "quiz_limit_reached",
        message:
          plan === "premium"
            ? "Votre abonnement Premium permet de passer le questionnaire 5 fois maximum."
            : "Votre abonnement Starter permet de passer le questionnaire une seule fois.",
        attemptsUsed,
        limit,
      });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "Error checking subscription before quiz");
    res.status(500).json({ error: "Erreur lors de la vérification de l'abonnement" });
    return;
  }

  const systemPrompt = buildSystemPrompt(responseLang);

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

    let parsedResult: ParsedQuizResult | null = null;

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
          email: normalizedEmail,
          userName: userName ?? null,
          businessName: parsedResult.businessName,
          businessDescription: parsedResult.businessDescription,
          earningPotential: parsedResult.earningPotential?.trim() || fallbackEarningPotential(),
          whyItFits: parsedResult.whyItFits,
          actionPlan: parsedResult.actionPlan,
          answersJson: JSON.stringify(answers),
          isAlternative: false,
          originResultId: null,
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

router.post("/quiz/results/:id/alternative", async (req, res): Promise<void> => {
  const params = GetResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsedBody = AlternativeQuizBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const normalizedEmail = parsedBody.data.email.toLowerCase();
  const responseLang = LANG_NAMES[parsedBody.data.language ?? "fr"] ?? "French";

  const [currentResult] = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.id, params.data.id));

  if (!currentResult) {
    res.status(404).json({ error: "Résultat introuvable" });
    return;
  }

  if (currentResult.email && currentResult.email !== normalizedEmail) {
    res.status(403).json({ error: "Accès non autorisé à ce résultat" });
    return;
  }

  try {
    const subscription = await getActiveSubscription(normalizedEmail);
    const access = getSubscriptionAccess(subscription);
    if (!access.canUsePremiumTools) {
      res.status(402).json({
        error: "premium_required",
        message: "Un abonnement Premium actif est requis pour demander un autre business.",
      });
      return;
    }
  } catch (err) {
    req.log.error({ err }, "Error checking subscription before alternative quiz result");
    res.status(500).json({ error: "Erreur lors de la vérification de l'abonnement" });
    return;
  }

  const originResultId = currentResult.originResultId ?? currentResult.id;
  const alternativesUsed = await getAlternativeSuggestionCount(normalizedEmail, originResultId);
  if (alternativesUsed >= PREMIUM_ALTERNATIVE_LIMIT) {
    res.status(403).json({
      error: "alternative_limit_reached",
      message: "Votre abonnement Premium permet de demander 2 autres propositions maximum pour ce résultat.",
      alternativesUsed,
      limit: PREMIUM_ALTERNATIVE_LIMIT,
    });
    return;
  }

  const relatedResults = await db
    .select()
    .from(quizResultsTable)
    .where(eq(quizResultsTable.email, normalizedEmail));
  const avoidedBusinesses = relatedResults
    .filter((result) => (result.originResultId ?? result.id) === originResultId)
    .map((result) => result.businessName);

  let answers: { question?: string; answer?: string }[] = [];
  try {
    answers = JSON.parse(currentResult.answersJson) as { question?: string; answer?: string }[];
  } catch {
    answers = [];
  }

  const answersText = answers
    .map((answer) => `Q: ${answer.question ?? ""}\nA: ${answer.answer ?? ""}`)
    .join("\n\n");

  const systemPrompt = `${buildSystemPrompt(responseLang)}

This is an alternative suggestion request. You MUST suggest a different business from these already suggested businesses: ${avoidedBusinesses.join(", ")}.
Keep the recommendation aligned with the same quiz profile, but explore a different credible opportunity.`;

  const userPrompt = `Here are the same quiz answers:

${answersText}

The user did not like the previous business suggestion. Recommend a different business, with a realistic earning potential and a concrete action plan. Respond in ${responseLang}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsedResult = JSON.parse(raw) as ParsedQuizResult;

    const [saved] = await db
      .insert(quizResultsTable)
      .values({
        email: normalizedEmail,
        userName: currentResult.userName,
        businessName: parsedResult.businessName,
        businessDescription: parsedResult.businessDescription,
        earningPotential: parsedResult.earningPotential?.trim() || fallbackEarningPotential(),
        whyItFits: parsedResult.whyItFits,
        actionPlan: parsedResult.actionPlan,
        answersJson: currentResult.answersJson,
        isAlternative: true,
        originResultId,
      })
      .returning();

    res.json({
      resultId: saved.id,
      alternativeSuggestionsUsed: alternativesUsed + 1,
      limit: PREMIUM_ALTERNATIVE_LIMIT,
    });
  } catch (err) {
    req.log.error({ err }, "Error generating alternative quiz result");
    res.status(500).json({ error: "Erreur lors de la génération d'une autre proposition" });
  }
});

router.get("/quiz/results", async (_req, res): Promise<void> => {
  const results = await db.select().from(quizResultsTable).orderBy(desc(quizResultsTable.createdAt));
  const enriched = await Promise.all(results.map((result) => enrichResult(result)));
  res.json(ListResultsResponse.parse(enriched));
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

  res.json(GetResultResponse.parse(await enrichResult(result)));
});

export default router;
