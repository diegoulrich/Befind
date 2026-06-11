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
  prices: { id: string; unit_amount: number | null; currency: string }[];
  metadata: { tier?: string };
}

const FEATURES: Record<string, string[]> = {
  starter: [
    "Quiz illimité",
    "3 recommandations / mois",
    "Plan d'action personnalisé",
    "Historique des résultats",
    "Support par email",
  ],
  premium: [
    "Quiz illimité",
    "Recommandations illimitées",
    "Plan d'action avancé",
    "Accès au Chatbot Befind IA",
    "Générateur de boutique IA",
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

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
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

  const handleCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
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

  const staticPlans = [
    {
      tier: "starter",
      name: "Starter",
      price: "19€",
      period: "/mois",
      description: "Idéal pour démarrer et explorer vos opportunités business.",
      highlight: false,
      priceId: findPlan("starter")?.prices?.[0]?.id,
      dynamicPrice: findPlan("starter")?.prices?.[0],
    },
    {
      tier: "premium",
      name: "Premium",
      price: "29€",
      period: "/mois",
      description: "Pour aller plus loin avec un accompagnement complet par IA.",
      highlight: true,
      priceId: findPlan("premium")?.prices?.[0]?.id,
      dynamicPrice: findPlan("premium")?.prices?.[0],
    },
  ];

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
                      {plan.dynamicPrice?.unit_amount
                        ? formatPrice(plan.dynamicPrice.unit_amount, plan.dynamicPrice.currency)
                        : plan.price}
                    </span>
                    <span className="mb-1 text-stone-500">{plan.period}</span>
                  </div>
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
                    if (plan.priceId) {
                      void handleCheckout(plan.priceId);
                    } else {
                      toast({
                        title: "Bientôt disponible",
                        description: "Les plans seront disponibles très prochainement.",
                      });
                    }
                  }}
                >
                  {checkoutLoading === plan.priceId ? "Redirection..." : `Commencer avec ${plan.name}`}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
