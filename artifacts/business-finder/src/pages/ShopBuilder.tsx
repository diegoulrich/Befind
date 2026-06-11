import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  TrendingUp,
  ShoppingBag,
  Lock,
} from "lucide-react";

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

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [niches, setNiches] = useState<Niche[]>([]);
  const [nichesLoading, setNichesLoading] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<Niche | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});

  const loadNiches = async () => {
    setNichesLoading(true);
    try {
      const res = await fetch(`/api/shop/niches?lang=fr&business=${encodeURIComponent(businessType)}`);
      const data = await res.json();
      setNiches(data.niches ?? []);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les niches tendances.", variant: "destructive" });
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

  const handleGenerate = async () => {
    if (!selectedNiche) return;
    const products = selectedNiche.products.filter((product) => selectedProducts[product.name]);
    if (products.length === 0) {
      toast({ title: "Sélection vide", description: "Choisissez au moins un produit.", variant: "destructive" });
      return;
    }

    setStep("generating");
    try {
      const res = await fetch("/api/shop/generate", {
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

      if (res.status === 402) {
        toast({ title: "Abonnement requis", description: "Un abonnement actif est nécessaire pour générer votre boutique.", variant: "destructive" });
        setLocation("/pricing");
        return;
      }

      if (!res.ok) throw new Error("generate failed");
      await res.json();
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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-64 top-1/2 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <Button variant="ghost" className="gap-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Button>
        <div className="flex items-center gap-2 font-serif text-xl font-bold text-primary">
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
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                {i < 2 && <span className="mx-1 h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mx-auto max-w-md space-y-8 pt-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-primary" />
              <div>
                <h1 className="font-serif text-3xl font-black md:text-4xl">Créons votre boutique</h1>
                <p className="mt-3 text-muted-foreground">Entrez l'email associé à votre abonnement befind pour démarrer.</p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4 text-left">
                <label htmlFor="email" className="text-sm font-semibold">Email</label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" className="h-14 bg-white text-lg" autoFocus />
                <Button type="submit" disabled={!email.trim()} className="h-14 w-full text-lg font-bold">
                  Continuer <ArrowRight className="ml-2" />
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> La génération nécessite un abonnement actif.
                </p>
              </form>
            </motion.div>
          )}

          {step === "niche" && (
            <motion.div key="niche" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="font-serif text-3xl font-black">Choisissez une niche tendance</h2>
                <p className="text-muted-foreground">Niches sélectionnées par l'IA selon les tendances actuelles du marché.</p>
              </div>
              {nichesLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-muted-foreground">L'IA analyse le marché…</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {niches.map((niche) => (
                    <Card key={niche.id} className="flex h-full cursor-pointer flex-col border-2 bg-white/70 p-6 backdrop-blur transition-all hover:border-primary hover:shadow-xl" onClick={() => handleSelectNiche(niche)}>
                      <div className="mb-3 text-4xl">{niche.emoji}</div>
                      <h3 className="mb-1 text-lg font-bold">{niche.name}</h3>
                      <p className="mb-4 flex-1 text-sm text-muted-foreground">{niche.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-600">
                          <TrendingUp className="h-3 w-3" /> {niche.trend}
                        </span>
                        <span className="text-xs text-muted-foreground">{niche.products.length} produits</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {step === "products" && selectedNiche && (
            <motion.div key="products" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="space-y-2 text-center">
                <span className="text-4xl">{selectedNiche.emoji}</span>
                <h2 className="font-serif text-3xl font-black">Produits gagnants — {selectedNiche.name}</h2>
                <p className="text-muted-foreground">Sélectionnez les produits à inclure dans votre boutique.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {selectedNiche.products.map((product) => {
                  const checked = !!selectedProducts[product.name];
                  return (
                    <Card key={product.name} className={`cursor-pointer border-2 p-5 transition-all ${checked ? "border-primary bg-primary/5" : "border-border bg-white/70"}`} onClick={() => setSelectedProducts((prev) => ({ ...prev, [product.name]: !prev[product.name] }))}>
                      <div className="flex gap-4">
                        <div className="shrink-0 text-3xl">{product.imageEmoji}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold">{product.name}</h4>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${checked ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                              {checked && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                            </span>
                          </div>
                          <p className="mb-2 text-sm text-muted-foreground">{product.description}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold">{product.price} CHF</span>
                            {product.marginHint && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-600">{product.marginHint}</span>}
                            {product.supplierHint && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{product.supplierHint}</span>}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Button variant="outline" size="lg" className="h-14 flex-1 bg-white" onClick={() => setStep("niche")}>
                  <ArrowLeft className="mr-2" /> Changer de niche
                </Button>
                <Button size="lg" className="h-14 flex-1 text-lg font-bold" disabled={selectedCount === 0} onClick={handleGenerate}>
                  <Sparkles className="mr-2" /> Générer ma boutique grâce à l'IA
                </Button>
              </div>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center gap-6 py-24 text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <h2 className="font-serif text-3xl font-bold">L'IA construit votre boutique…</h2>
              <p className="max-w-md text-muted-foreground">Création de la marque, du logo, des couleurs et de votre catalogue produits.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
