import { getUncachableStripeClient } from "./stripeClient";

export interface ActiveSubscription {
  active: boolean;
  tier: string | null;
  customerId: string | null;
}

export async function getActiveSubscription(email: string): Promise<ActiveSubscription> {
  const stripe = await getUncachableStripeClient();
  const customers = await stripe.customers.list({ email, limit: 10 });

  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 10,
      expand: ["data.items.data.price.product"],
    });

    if (subs.data.length > 0) {
      const sub = subs.data[0];
      const product = sub.items.data[0]?.price?.product;
      let tier: string | null = null;
      if (product && typeof product !== "string" && !("deleted" in product && product.deleted)) {
        tier = product.metadata?.tier ?? product.name ?? null;
      }
      return { active: true, tier, customerId: customer.id };
    }
  }

  return { active: false, tier: null, customerId: customers.data[0]?.id ?? null };
}

export function isStarterOrPremium(subscription: ActiveSubscription): boolean {
  if (!subscription.active) return false;

  // Existing Stripe products are expected to be Starter/Premium. If metadata is
  // missing, keep active subscribers unblocked instead of failing closed.
  if (!subscription.tier) return true;

  const tier = subscription.tier.toLowerCase();
  return tier.includes("starter") || tier.includes("premium");
}
