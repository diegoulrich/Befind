import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Lock,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface NicheProduct {
  name: string;
  description: string;
  price: string;
  category: string;
  imageEmoji: string;
  marginHint?: string;
  supplierHint?: string;
}

interface Niche {
  id: string;
  name: string;
  emoji: string;
  description: string;
  trend: string;
  products: NicheProduct[];
}

type Step = "email" | "niche" | "products" | "generating";

export default function ShopBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const businessType = params.get("business") ?? "";
  const emailParam = params.get("email") ?? "";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(emailParam);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [nichesLoading, setNichesLoading] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});

  const loadNiches = async () => {
    setNichesLoading(true);
    try {
      const response = await fetch(
        `/api/shop/niches?lang=fr&business=${encodeURIComponent(businessType)}&email=${encodeURIComponent(
          email.trim().toLowerCase(),
        )}`,
      );
      const data = await response.json();
      if (response.status === 402) {
        toast({
          title: "Premium requis",
          description: data.message ?? "Un abonnement Premium est nécessaire pour accéder aux produits gagnants.",
          variant: "destructive",
        });
        setLocation("/pricing");
        return;
      }
      if (!response.ok) throw new Error("niches failed");
      setNiches(data.niches ?? []);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les niches tendances.",
        variant: "destructive",
      });
    } finally {
      setNichesLoading(false);
    }
  };

  const handleEmailSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStep("niche");
    if (niches.length === 0) await loadNiches();
  };

  const handleSelectNiche = (niche: Niche) => {
    setSelectedNiche(niche);
    setSelectedProducts(Object.fromEntries(niche.products.map((product) => [product.name, true])));
    setStep("products");
  };

  const toggleProduct = (name: string) => {
    setSelectedProducts((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleGenerate = async () => {
    if (!selectedNiche) return;
    const products = selectedNiche.products.filter((product) => selectedProducts[product.name]);
    if (products.length === 0) {
      toast({ title: "Sélection vide", description: "Choisissez au moins un produit.", variant: "destructive" });
      return;
    }

    setStep("generating");
    try {
      const response = await fetch("/api/shop/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          niche: selectedNiche.name,
          businessType,
          language: "fr",
          products,
        }),
      });

      if (response.status === 402) {
        toast({
          title: "Premium requis",
          description: "Un abonnement Premium est nécessaire pour générer votre boutique.",
          variant: "destructive",
        });
        setLocation("/pricing");
        return;
      }

      if (!response.ok) throw new Error("generate failed");

      await response.json();
      toast({ title: "Boutique générée 🎉", description: "Votre boutique est prête !" });
      setLocation(`/ma-boutique?email=${encodeURIComponent(email.trim())}`);
    } catch {
      toast({ title: "Erreur", description: "La génération a échoué. Réessayez.", variant: "destructive" });
      setStep("products");
    }
  };

  const selectedCount = selectedNiche
    ? selectedNiche.products.filter((product) => selectedProducts[product.name]).length
    : 0;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <Button variant="ghost" className="gap-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Button>
        <div className="font-serif flex items-center gap-2 text-xl font-bold text-indigo-600">
          <ShoppingBag className="h-5 w-5" /> Générateur de boutique IA
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="mb-12 flex items-center justify-center gap-2">
          {["Email", "Niche", "Produits"].map((label, i) => {
            const order: Step[] = ["email", "niche", "products"];
            const active = order.indexOf(step) >= i || step === "generating";
            return (
              <div key={label} className="flex items-center gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-indigo-600 text-white" : "bg-stone-200 text-stone-500"}`}>
                  {i + 1}
                </span>
                <span className={active ? "font-medium" : "text-stone-500"}>{label}</span>
                {i < 2 && <span className="mx-1 h-px w-8 bg-stone-300" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md space-y-8 pt-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-indigo-600" />
              <div>
                <h1 className="font-serif text-4xl font-black">Créons votre boutique</h1>
                <p className="mt-3 text-stone-600">Entrez l'email associé à votre abonnement befind pour démarrer.</p>
              </div>
              <form onSubmit={(event) => void handleEmailSubmit(event)} className="space-y-4 text-left">
                <label htmlFor="email" className="text-sm font-semibold">Email</label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" className="h-14 text-lg" autoFocus />
                <Button type="submit" disabled={!email.trim()} className="h-14 w-full text-lg">
                  Continuer <ArrowRight className="ml-2" />
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500">
                  <Lock className="h-3 w-3" /> Les outils boutique nécessitent un abonnement Premium.
                </p>
              </form>
            </motion.div>
          )}

          {step === "niche" && (
            <motion.div key="niche" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center">
                <h2 className="font-serif text-3xl font-black">Choisissez une niche tendance</h2>
                <p className="mt-2 text-stone-600">Niches sélectionnées par l'IA selon les tendances actuelles.</p>
              </div>
              {nichesLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                  <p className="text-stone-600">L'IA analyse le marché...</p>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {niches.map((niche) => (
                    <Card key={niche.id} className="flex h-full cursor-pointer flex-col p-6 transition hover:border-indigo-500 hover:shadow-xl" onClick={() => handleSelectNiche(niche)}>
                      <div className="mb-3 text-4xl">{niche.emoji}</div>
                      <h3 className="mb-1 text-lg font-bold">{niche.name}</h3>
                      <p className="mb-4 flex-1 text-sm text-stone-600">{niche.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                          <TrendingUp className="h-3 w-3" /> {niche.trend}
                        </span>
                        <span className="text-xs text-stone-500">{niche.products.length} produits</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === "products" && selectedNiche && (
            <motion.div key="products" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="text-center">
                <span className="text-4xl">{selectedNiche.emoji}</span>
                <h2 className="font-serif mt-2 text-3xl font-black">Produits gagnants - {selectedNiche.name}</h2>
                <p className="mt-2 text-stone-600">Sélectionnez les produits à inclure dans votre boutique.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {selectedNiche.products.map((product) => {
                  const checked = !!selectedProducts[product.name];
                  return (
                    <Card key={product.name} className={`cursor-pointer p-5 ${checked ? "border-2 border-indigo-500 bg-indigo-50" : ""}`} onClick={() => toggleProduct(product.name)}>
                      <div className="flex gap-4">
                        <div className="text-3xl">{product.imageEmoji}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold">{product.name}</h4>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${checked ? "border-indigo-600 bg-indigo-600" : "border-stone-300"}`}>
                              {checked && <Check className="h-3.5 w-3.5 text-white" />}
                            </span>
                          </div>
                          <p className="mb-2 text-sm text-stone-600">{product.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold">{product.price} CHF</span>
                            {product.marginHint && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">{product.marginHint}</span>}
                            {product.supplierHint && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500">{product.supplierHint}</span>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Button variant="outline" size="lg" className="h-14 flex-1" onClick={() => setStep("niche")}>
                  <ArrowLeft className="mr-2" /> Changer de niche
                </Button>
                <Button size="lg" className="h-14 flex-1 text-lg" disabled={selectedCount === 0} onClick={() => void handleGenerate()}>
                  <Sparkles className="mr-2" /> Générer ma boutique grâce à l'IA
                </Button>
              </div>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-6 py-24 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-indigo-600" />
              <h2 className="font-serif text-3xl font-bold">L'IA construit votre boutique...</h2>
              <p className="max-w-md text-stone-600">Création de la marque, du logo, des couleurs et de votre catalogue produits.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
