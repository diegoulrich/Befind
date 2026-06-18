import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Mail, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Contact() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Impossible d'envoyer le message.");
      }

      setSent(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <Button variant="ghost" className="gap-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Button>
        <div className="font-serif flex items-center gap-2 text-xl font-bold text-indigo-600">
          <Sparkles className="h-5 w-5" /> befind
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-5xl gap-8 px-6 pb-20 pt-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
        <section className="space-y-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
            <Mail className="h-3.5 w-3.5" /> Contact
          </span>
          <h1 className="font-serif text-4xl font-black md:text-5xl">Contactez-nous</h1>
          <p className="text-lg leading-relaxed text-stone-600">
            Une question sur Befind, les abonnements, les dashboards Premium ou votre compte ? Envoyez-nous un message,
            on vous répondra dès que possible.
          </p>
          <Card className="p-5">
            <p className="text-sm font-semibold text-stone-700">Vous pouvez nous écrire pour :</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li>• une question sur Starter ou Premium</li>
              <li>• un problème de paiement ou d'accès</li>
              <li>• une suggestion de business ou d'outil</li>
              <li>• une demande d'aide sur votre espace Befind</li>
            </ul>
          </Card>
        </section>

        <Card className="p-6">
          {sent && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
              Message envoyé avec succès. Merci, nous reviendrons vers vous rapidement.
            </div>
          )}

          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-semibold">
                  Prénom
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Votre prénom"
                  className="h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-semibold">
                  Nom
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Votre nom"
                  className="h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold">
                Adresse e-mail
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vous@exemple.com"
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-semibold">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Écrivez votre message ici..."
                className="min-h-40 w-full rounded-2xl border border-stone-300 bg-white p-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full"
              disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || !message.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer le message
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
