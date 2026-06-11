import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, ShoppingBag, Store, Pencil, Check, X, ExternalLink, Plus } from "lucide-react";

interface ShopProduct {
  id: number;
  name: string;
  description: string;
  price: string;
  imageEmoji: string;
  marginHint: string | null;
}

interface Shop {
  id: number;
  name: string;
  slogan: string;
  description: string;
  niche: string;
  primaryColor: string;
  accentColor: string;
  logoEmoji: string;
  shopifyConnected: boolean;
  products: ShopProduct[];
}

export default function MaBoutique() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const emailParam = params.get("email") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [shops, setShops] = useState<Shop[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlogan, setEditSlogan] = useState("");

  const loadShops = async (targetEmail: string) => {
    if (!targetEmail.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/shop/by-email/${encodeURIComponent(targetEmail.trim().toLowerCase())}`);
      const data = await res.json();
      setShops(data.shops ?? []);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger vos boutiques.", variant: "destructive" });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    if (emailParam) void loadShops(emailParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (shop: Shop) => {
    setEditingId(shop.id);
    setEditName(shop.name);
    setEditSlogan(shop.slogan);
  };

  const saveEdit = async (shop: Shop) => {
    try {
      const res = await fetch(`/api/shop/${shop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), name: editName, slogan: editSlogan }),
      });
      if (!res.ok) throw new Error();
      setShops((prev) => prev.map((item) => (item.id === shop.id ? { ...item, name: editName, slogan: editSlogan } : item)));
      setEditingId(null);
      toast({ title: "Enregistré", description: "Votre boutique a été mise à jour." });
    } catch {
      toast({ title: "Erreur", description: "La mise à jour a échoué.", variant: "destructive" });
    }
  };

  const connectShopify = async (shop: Shop) => {
    try {
      const res = await fetch(`/api/shop/${shop.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), shopifyConnected: true }),
      });
      if (!res.ok) throw new Error();
      setShops((prev) => prev.map((item) => (item.id === shop.id ? { ...item, shopifyConnected: true } : item)));
      toast({ title: "Shopify", description: "Connexion Shopify simulée. L'export réel sera bientôt disponible." });
    } catch {
      toast({ title: "Erreur", description: "La connexion a échoué.", variant: "destructive" });
    }
  };

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
          <Store className="h-5 w-5" /> Ma boutique
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 pb-20">
        {!emailParam && (
          <Card className="mx-auto mt-8 max-w-md space-y-4 bg-white/70 p-6">
            <h2 className="text-lg font-bold">Retrouver mes boutiques</h2>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" className="h-12 bg-white" />
            <Button className="h-12 w-full" disabled={!email.trim()} onClick={() => void loadShops(email)}>
              Afficher mes boutiques
            </Button>
          </Card>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement…</p>
          </div>
        )}

        {loaded && !loading && shops.length === 0 && (
          <div className="space-y-6 py-24 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold">Aucune boutique pour le moment</h2>
              <p className="text-muted-foreground">Lancez le générateur pour créer votre première boutique.</p>
            </div>
            <Button size="lg" className="h-14 px-8 text-lg font-bold" onClick={() => setLocation("/shop-builder")}>
              <Plus className="mr-2" /> Générer ma boutique grâce à l'IA
            </Button>
          </div>
        )}

        <div className="space-y-10">
          {shops.map((shop, idx) => (
            <motion.div key={shop.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
              <Card className="overflow-hidden border-2 bg-white/80 backdrop-blur">
                <div className="relative p-8 text-white" style={{ background: `linear-gradient(135deg, ${shop.primaryColor}, ${shop.accentColor})` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="text-5xl">{shop.logoEmoji}</div>
                      <div className="min-w-0">
                        {editingId === shop.id ? (
                          <Input value={editName} onChange={(event) => setEditName(event.target.value)} className="mb-1 h-9 bg-white/90 text-xl font-bold text-foreground" />
                        ) : (
                          <h2 className="truncate font-serif text-3xl font-black">{shop.name}</h2>
                        )}
                        {editingId === shop.id ? (
                          <Input value={editSlogan} onChange={(event) => setEditSlogan(event.target.value)} className="h-8 bg-white/90 text-sm text-foreground" />
                        ) : (
                          <p className="text-white/90">{shop.slogan}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {editingId === shop.id ? (
                        <>
                          <Button size="icon" variant="secondary" onClick={() => void saveEdit(shop)}><Check className="h-4 w-4" /></Button>
                          <Button size="icon" variant="secondary" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <Button size="icon" variant="secondary" onClick={() => startEdit(shop)}><Pencil className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/90">{shop.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">Niche : {shop.niche}</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{shop.products.length} produits</span>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="mb-4 text-lg font-bold">Catalogue</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {shop.products.map((product) => (
                      <div key={product.id} className="flex gap-4 rounded-xl border bg-card p-4">
                        <div className="shrink-0 text-3xl">{product.imageEmoji}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="truncate font-bold">{product.name}</h4>
                            <span className="shrink-0 font-bold">{product.price} CHF</span>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                          {product.marginHint && <span className="mt-1.5 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">{product.marginHint}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row">
                    <Button variant={shop.shopifyConnected ? "outline" : "default"} size="lg" className="h-12 flex-1" disabled={shop.shopifyConnected} onClick={() => void connectShopify(shop)}>
                      {shop.shopifyConnected ? <><Check className="mr-2 h-4 w-4" /> Shopify connecté</> : <><ExternalLink className="mr-2 h-4 w-4" /> Connecter à Shopify</>}
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 flex-1 bg-white" onClick={() => setLocation("/shop-builder")}>
                      <Plus className="mr-2 h-4 w-4" /> Nouvelle boutique
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
