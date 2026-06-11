import { Router, type IRouter } from "express";
import { getUncachableStripeClient } from "../lib/stripeClient";

const router: IRouter = Router();

router.get("/stripe/plans", async (req, res): Promise<void> => {
  try {
    const stripe = await getUncachableStripeClient();

    const products = await stripe.products.list({ active: true, limit: 10 });
    const prices = await stripe.prices.list({ active: true, limit: 20, expand: ["data.product"] });

    const productsMap = new Map<string, {
      id: string;
      name: string;
      description: string;
      metadata: Record<string, string>;
      prices: { id: string; unit_amount: number | null; currency: string; recurring: unknown }[];
    }>();

    for (const product of products.data) {
      productsMap.set(product.id, {
        id: product.id,
        name: product.name,
        description: product.description ?? "",
        metadata: product.metadata ?? {},
        prices: [],
      });
    }

    for (const price of prices.data) {
      const productId = typeof price.product === "string" ? price.product : price.product?.id;
      if (productId && productsMap.has(productId)) {
        productsMap.get(productId)!.prices.push({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          recurring: price.recurring,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err) {
    req.log.error({ err }, "Error fetching plans");
    res.status(500).json({ error: "Failed to load plans" });
  }
});

router.post("/stripe/checkout", async (req, res): Promise<void> => {
  const { priceId, email } = req.body as { priceId?: string; email?: string };

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "link"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      customer_email: email || undefined,
      success_url: `${baseUrl}/?checkout=success`,
      cancel_url: `${baseUrl}/?checkout=cancel`,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Error creating checkout session");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default router;
