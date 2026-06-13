import { useEffect, useState } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  description: string;
  prices: {
    id: string;
    unit_amount: number | null;
    currency: string;
    recurring?: { interval?: "month" | "year" | string } | null;
  }[];
  metadata: { tier?: string };
}

type BillingCycle = "monthly" | "annual";
type Tier = "starter" | "premium";

const FEATURES: Record<string, string[]> = {
  starter: [
    "1 passage du questionnaire",
    "1 recommandation business personnalisée",
    "Potentiel de revenus réaliste",
    "Plan d'action personnalisé",
    "Accès à l'historique des résultats",
    "Support par email",
  ],
  premium: [
    "Tout ce que Starter contient",
    "5 passages du questionnaire",
    "2 propositions alternatives si le business ne plaît pas",
    "Outils Befind selon le business recommandé",
    "Produits et niches gagnantes pour l'e-commerce",
    "Générateur de boutique IA pour l'e-commerce",
    "Agent IA spécialisé sur le business recommandé",
    "Support prioritaire",
  ],
};

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

const STATIC_PRICES: Record<Tier, Record<BillingCycle, { displayMonthly: number; checkoutAmount: number }>> = {
  starter: {
    monthly: { displayMonthly: 1900, checkoutAmount: 1900 },
    annual: { displayMonthly: 1500, checkoutAmount: 18000 },
  },
  premium: {
    monthly: { displayMonthly: 3900, checkoutAmount: 3900 },
    annual: { displayMonthly: 3000, checkoutAmount: 36000 },
  },
};

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/stripe/plans")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setPlans(data.data ?? []);
      })
      .catch(() => {
        // The static fallback remains visible when Stripe is not configured.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheckout = async (plan: { tier: Tier; name: string; priceId?: string }) => {
    const loadingKey = `${plan.tier}-${billingCycle}`;
    setCheckoutLoading(loadingKey);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          tier: plan.tier,
          billingCycle,
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Erreur", description: "Impossible de créer la session de paiement.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur s'est produite.", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const findPlan = (keyword: string) =>
    plans.find(
      (plan) =>
        plan.name.toLowerCase().includes(keyword) ||
        (plan.metadata?.tier ?? "").toLowerCase() === keyword,
    );

  const findPrice = (tier: Tier, cycle: BillingCycle) => {
    const interval = cycle === "annual" ? "year" : "month";
    return findPlan(tier)?.prices?.find((price) => price.recurring?.interval === interval);
  };

  const staticPlans = [
    {
      tier: "starter",
      name: "Starter",
      fallback: STATIC_PRICES.starter[billingCycle],
      description: "Idéal pour démarrer et explorer vos opportunités business.",
      highlight: false,
      priceId: findPrice("starter", billingCycle)?.id,
      dynamicPrice: findPrice("starter", billingCycle),
    },
    {
      tier: "premium",
      name: "Premium",
      fallback: STATIC_PRICES.premium[billingCycle],
      description: "Pour aller plus loin avec un accompagnement complet par IA.",
      highlight: true,
      priceId: findPrice("premium", billingCycle)?.id,
      dynamicPrice: findPrice("premium", billingCycle),
    },
  ] satisfies {
    tier: Tier;
    name: string;
    fallback: { displayMonthly: number; checkoutAmount: number };
    description: string;
    highlight: boolean;
    priceId?: string;
    dynamicPrice?: Plan["prices"][number];
  }[];

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            <Sparkles className="h-3 w-3" /> Abonnements
          </span>
          <h1 className="font-serif mt-2 mb-4 text-4xl font-bold md:text-5xl">Choisissez votre plan</h1>
          <p className="mx-auto max-w-xl text-lg text-stone-600">
            Débloquez votre potentiel entrepreneurial avec un abonnement befind.
          </p>
          <div className="mx-auto mt-8 inline-flex rounded-2xl bg-white p-1 shadow-sm border border-stone-200">
            <button
              type="button"
              className={`rounded-xl px-5 py-2 text-sm font-bold transition ${
                billingCycle === "monthly" ? "bg-indigo-600 text-white" : "text-stone-500"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Mensuel
            </button>
            <button
              type="button"
              className={`rounded-xl px-5 py-2 text-sm font-bold transition ${
                billingCycle === "annual" ? "bg-indigo-600 text-white" : "text-stone-500"
              }`}
              onClick={() => setBillingCycle("annual")}
            >
              Annuel
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                meilleur prix
              </span>
            </button>
          </div>
          {loading && <p className="mt-3 text-sm text-stone-500">Chargement des plans Stripe...</p>}
        </motion.div>

        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {staticPlans.map((plan, idx) => (
            <motion.div key={plan.tier} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className={`relative flex h-full flex-col p-8 ${plan.highlight ? "border-2 border-indigo-500 shadow-lg" : ""}`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                      <Zap className="h-3 w-3" /> Le plus populaire
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="font-serif mb-1 text-xl font-bold">{plan.name}</h2>
                  <p className="mb-4 text-sm text-stone-600">{plan.description}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold">
                      {formatPrice(
                        plan.dynamicPrice?.unit_amount
                          ? billingCycle === "annual"
                            ? Math.round(plan.dynamicPrice.unit_amount / 12)
                            : plan.dynamicPrice.unit_amount
                          : plan.fallback.displayMonthly,
                        plan.dynamicPrice?.currency ?? "chf",
                      )}
                    </span>
                    <span className="mb-1 text-stone-500">/mois</span>
                  </div>
                  {billingCycle === "annual" && (
                    <div className="mt-2 text-sm text-stone-500">
                      <span className="font-semibold">
                        x12 ={" "}
                        {formatPrice(
                          plan.dynamicPrice?.unit_amount ?? plan.fallback.checkoutAmount,
                          plan.dynamicPrice?.currency ?? "chf",
                        )}
                      </span>{" "}
                      facturés en une fois par an
                    </div>
                  )}
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {(FEATURES[plan.tier] ?? []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  size="lg"
                  disabled={checkoutLoading !== null}
                  onClick={() => {
                    void handleCheckout(plan);
                  }}
                >
                  {checkoutLoading === `${plan.tier}-${billingCycle}`
                    ? "Redirection..."
                    : billingCycle === "annual"
                      ? `Payer ${
                          plan.dynamicPrice?.unit_amount
                            ? formatPrice(plan.dynamicPrice.unit_amount, plan.dynamicPrice.currency)
                            : formatPrice(plan.fallback.checkoutAmount, "chf")
                        } / an`
                      : `Commencer avec ${plan.name}`}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
