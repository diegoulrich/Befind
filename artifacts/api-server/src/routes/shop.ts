import { Router, type IRouter } from "express";
import { db, shopProductsTable, shopsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

import { openai } from "../lib/openai";
import { getActiveSubscription, isStarterOrPremium } from "../lib/subscription";

const router: IRouter = Router();

const LANG_NAMES: Record<string, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  de: "German",
  pt: "Portuguese",
  it: "Italian",
};

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "boutique"}-${suffix}`;
}

router.get("/shop/subscription/:email", async (req, res): Promise<void> => {
  const email = req.params.email?.trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Email requis" });
    return;
  }

  try {
    const sub = await getActiveSubscription(email);
    res.json({ active: sub.active, tier: sub.tier, eligible: isStarterOrPremium(sub) });
  } catch (err) {
    req.log.error({ err }, "Error checking subscription");
    res.status(500).json({ error: "Erreur lors de la vérification de l'abonnement" });
  }
});

router.get("/shop/niches", async (req, res): Promise<void> => {
  const lang = (req.query.lang as string) ?? "fr";
  const business = (req.query.business as string) ?? "";
  const responseLang = LANG_NAMES[lang] ?? "French";

  const systemPrompt = `You are an expert e-commerce market analyst specialised in dropshipping, print-on-demand and online retail.
You identify trending, profitable niches and the current winning products within them.
You MUST respond entirely in ${responseLang}.

Return JSON with this exact shape:
{
  "niches": [
    {
      "id": "kebab-case-id",
      "name": "Niche name",
      "emoji": "single emoji",
      "description": "1 short sentence on why this niche is trending and profitable",
      "trend": "short trend label e.g. '+220% this year'",
      "products": [
        {
          "name": "Winning product name",
          "description": "1 punchy selling sentence",
          "price": "29.90",
          "category": "Product category",
          "imageEmoji": "single emoji",
          "marginHint": "e.g. 'Cost ~6 CHF · Margin ~75%'",
          "supplierHint": "e.g. 'AliExpress / CJ Dropshipping'"
        }
      ]
    }
  ]
}

Rules:
- Exactly 6 niches.
- Exactly 4 products per niche.
- Prices are realistic retail prices as plain decimal strings, assume CHF.
- Be modern, specific and realistic. No generic filler.`;

  const userPrompt = `Suggest 6 trending e-commerce niches with winning products${
    business ? ` for an entrepreneur whose recommended business is: "${business}"` : ""
  }. Respond in ${responseLang}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2500,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { niches?: unknown };
    res.json({ niches: Array.isArray(parsed.niches) ? parsed.niches : [] });
  } catch (err) {
    req.log.error({ err }, "Error generating niches");
    res.status(500).json({ error: "Erreur lors de la génération des niches" });
  }
});

interface GenerateBody {
  email?: string;
  niche?: string;
  businessType?: string;
  language?: string;
  products?: {
    name: string;
    description: string;
    price: string;
    category: string;
    imageEmoji?: string;
    marginHint?: string;
    supplierHint?: string;
  }[];
}

router.post("/shop/generate", async (req, res): Promise<void> => {
  const body = req.body as GenerateBody;
  const email = body.email?.trim().toLowerCase();
  const niche = body.niche?.trim();
  const products = Array.isArray(body.products) ? body.products : [];
  const responseLang = LANG_NAMES[body.language ?? "fr"] ?? "French";

  if (!email || !niche || products.length === 0) {
    res.status(400).json({ error: "Email, niche et produits requis" });
    return;
  }

  let subscription: { active: boolean; tier: string | null; customerId: string | null };
  try {
    subscription = await getActiveSubscription(email);
  } catch (err) {
    req.log.error({ err }, "Error checking subscription before generate");
    res.status(500).json({ error: "Erreur lors de la vérification de l'abonnement" });
    return;
  }

  if (!isStarterOrPremium(subscription)) {
    res.status(402).json({
      error: "subscription_required",
      message: "Un abonnement actif est requis pour générer votre boutique.",
    });
    return;
  }

  const systemPrompt = `You are an expert e-commerce brand designer.
You create a complete, professional online boutique brand from a niche and a list of products.
You MUST respond entirely in ${responseLang}.

Return JSON with this exact shape:
{
  "name": "Brand name (catchy, brandable, max 3 words)",
  "slogan": "Short memorable slogan",
  "description": "2-3 sentence brand story / value proposition",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "logoEmoji": "single emoji that represents the brand"
}

Rules:
- The brand must fit the niche "${niche}".
- Colors must be tasteful and on-brand (valid hex).
- Be creative and premium, not generic.`;

  const userPrompt = `Create a boutique brand for the niche "${niche}"${
    body.businessType ? ` (business model: ${body.businessType})` : ""
  }. Products sold: ${products.map((p) => p.name).join(", ")}. Respond in ${responseLang}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const brand = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as {
      name?: string;
      slogan?: string;
      description?: string;
      primaryColor?: string;
      accentColor?: string;
      logoEmoji?: string;
    };

    const name = brand.name?.trim() || niche;
    const [shop] = await db
      .insert(shopsTable)
      .values({
        email,
        stripeCustomerId: subscription.customerId,
        name,
        slogan: brand.slogan?.trim() || "",
        description: brand.description?.trim() || "",
        niche,
        primaryColor: brand.primaryColor?.trim() || "#6366f1",
        accentColor: brand.accentColor?.trim() || "#f59e0b",
        logoEmoji: brand.logoEmoji?.trim() || "🛍️",
        publicSlug: slugify(name),
      })
      .returning();

    const insertedProducts = await db
      .insert(shopProductsTable)
      .values(
        products.map((p) => ({
          shopId: shop.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          imageEmoji: p.imageEmoji || "📦",
          supplierHint: p.supplierHint ?? null,
          marginHint: p.marginHint ?? null,
        })),
      )
      .returning();

    res.json({ shop, products: insertedProducts });
  } catch (err) {
    req.log.error({ err }, "Error generating shop");
    res.status(500).json({ error: "Erreur lors de la génération de la boutique" });
  }
});

router.get("/shop/by-email/:email", async (req, res): Promise<void> => {
  const email = req.params.email?.trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: "Email requis" });
    return;
  }

  try {
    const shops = await db.select().from(shopsTable).where(eq(shopsTable.email, email));
    const result = await Promise.all(
      shops.map(async (shop) => {
        const products = await db
          .select()
          .from(shopProductsTable)
          .where(eq(shopProductsTable.shopId, shop.id));
        return { ...shop, products };
      }),
    );
    res.json({ shops: result });
  } catch (err) {
    req.log.error({ err }, "Error fetching shops");
    res.status(500).json({ error: "Erreur lors du chargement des boutiques" });
  }
});

router.get("/shop/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Identifiant invalide" });
    return;
  }

  try {
    const [shop] = await db.select().from(shopsTable).where(eq(shopsTable.id, id));
    if (!shop) {
      res.status(404).json({ error: "Boutique introuvable" });
      return;
    }
    const products = await db
      .select()
      .from(shopProductsTable)
      .where(eq(shopProductsTable.shopId, id));
    res.json({ shop, products });
  } catch (err) {
    req.log.error({ err }, "Error fetching shop");
    res.status(500).json({ error: "Erreur lors du chargement de la boutique" });
  }
});

router.put("/shop/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Identifiant invalide" });
    return;
  }

  const body = req.body as Partial<{
    email: string;
    name: string;
    slogan: string;
    description: string;
    primaryColor: string;
    accentColor: string;
    logoEmoji: string;
    shopifyConnected: boolean;
    shopifyDomain: string;
  }>;

  const callerEmail = body.email?.trim().toLowerCase();
  if (!callerEmail) {
    res.status(400).json({ error: "Email requis pour modifier la boutique" });
    return;
  }

  try {
    const [existing] = await db.select().from(shopsTable).where(eq(shopsTable.id, id));
    if (!existing) {
      res.status(404).json({ error: "Boutique introuvable" });
      return;
    }
    if (existing.email !== callerEmail) {
      res.status(403).json({ error: "Accès non autorisé à cette boutique" });
      return;
    }

    const { email: _ignored, ...updates } = body;
    const [updated] = await db
      .update(shopsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shopsTable.id, id))
      .returning();
    res.json({ shop: updated });
  } catch (err) {
    req.log.error({ err }, "Error updating shop");
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

export default router;
