import { Router, type IRouter } from "express";
import { db, quizResultsTable } from "@workspace/db";
import {
  SubmitQuizBody,
  GetResultParams,
  GetResultResponse,
  ListResultsResponse,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";
import { openai } from "../lib/openai";

const router: IRouter = Router();

router.post("/quiz/submit", async (req, res): Promise<void> => {
  const parsed = SubmitQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { answers, userName, language } = parsed.data;

  const lang = language ?? "fr";

  const LANG_NAMES: Record<string, string> = {
    fr: "French",
    en: "English",
    es: "Spanish",
    de: "German",
    pt: "Portuguese",
    it: "Italian",
  };
  const responseLang = LANG_NAMES[lang] ?? "French";

  const answersText = answers
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");

  const systemPrompt = `You are an expert in entrepreneurship and career guidance.
You analyse a user's quiz answers and recommend the best-fitting business type for their profile.
You MUST respond entirely in ${responseLang}.

You have access to a very wide and modern range of business ideas. Do not limit yourself to classic suggestions. Consider all of the following categories (and more):

DIGITAL & ONLINE:
SaaS (Software as a Service), mobile app, Chrome extension, AI tool, newsletter paid, online course / formation, e-learning platform, membership site, dropshipping, AI dropshipping (automated with AI tools), print-on-demand, affiliate marketing, blogging/SEO monetized, YouTube channel monetized, podcast monetized, Twitch/streaming, reselling (sneakers, luxury, electronics), digital products (templates, presets, ebooks), stock photography/video, domain flipping, website flipping, copywriting agency, SEO agency, social media agency (SMMA), ads management, email marketing agency, virtual assistant agency, translation services, subtitling/captioning service, online tutoring, online coaching (business, fitness, life, dating, finance), therapy/counseling online, astrology/tarot online.

CREATOR & CONTENT:
OnlyFans management agency (manage creators, handle marketing/promotion), UGC (User Generated Content) creator, faceless YouTube channel, Instagram theme page, TikTok agency, influencer management, ghostwriting (Twitter/X, LinkedIn, books), personal branding consultant, podcast production agency.

LOCAL & SERVICE:
Car detailing / nettoyage automobile, mobile car wash, pressure washing, window cleaning, house cleaning / conciergerie, gardening/landscaping, handyman services, pet sitting / dog walking, babysitting / childcare, personal chef / meal prep, catering, food truck, home bakery, personal trainer (in-person), massage therapy, hair/beauty salon, nail salon, barbershop, tattoo studio, photography (events, weddings, portraits), videography, real estate agent, home staging, Airbnb management / conciergerie Airbnb, moving company, delivery service, laundry service, pool maintenance, pest control.

TECH & INNOVATION:
AI consulting, prompt engineering, automation consultant (Make/Zapier), web development freelance, app development, cybersecurity consulting, IT support, 3D printing service, drone photography, VR/AR experiences.

FINANCE & INVESTMENT:
Trading / prop trading, real estate investing (buy-to-let, flipping), crypto investing, peer-to-peer lending, financial coaching, bookkeeping service, tax consulting, insurance brokerage.

EDUCATION & COACHING:
Language school, tutoring agency, sports coaching, music lessons, coding bootcamp, exam prep service, career coaching, HR consulting, recruitment agency.

MANUFACTURING & RESALE:
Handmade crafts (Etsy), candle making, soap making, jewelry making, furniture upcycling, clothing brand / fashion label, custom merchandise, food production (jams, sauces, snacks), beekeeping, microgreens growing.

Choose the ONE business that best fits the user's profile based on their quiz answers. Be creative, specific, and modern — don't default to generic options if something more fitting and exciting exists.

Structure your response as JSON with exactly these fields:
{
  "businessName": "Short, catchy business type name (max 8 words, in ${responseLang})",
  "businessDescription": "Detailed description of the recommended business (3-4 sentences, in ${responseLang})",
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

    let parsedResponse: {
      businessName: string;
      businessDescription: string;
      whyItFits: string;
      actionPlan: string;
    } | null = null;

    try {
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      }
    } catch {
      req.log.error("Failed to parse AI response as JSON");
    }

    if (parsedResponse) {
      const [saved] = await db
        .insert(quizResultsTable)
        .values({
          userName: userName ?? null,
          businessName: parsedResponse.businessName,
          businessDescription: parsedResponse.businessDescription,
          whyItFits: parsedResponse.whyItFits,
          actionPlan: parsedResponse.actionPlan,
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
  const results = await db
    .select()
    .from(quizResultsTable)
    .orderBy(desc(quizResultsTable.createdAt));
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
