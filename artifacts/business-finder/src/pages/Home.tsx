import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ClipboardList,
  Cpu,
  DollarSign,
  Globe,
  History as HistoryIcon,
  Loader2,
  Lock,
  LogIn,
  PlayCircle,
  RefreshCw,
  Rocket,
  Send,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  UserPlus,
  Users,
} from "lucide-react";
import { getGetResultQueryKey, useGetResult, type QuizAnswer } from "@workspace/api-client-react";

import BusinessWorkspace from "@/components/BusinessWorkspace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LANGUAGES, TRANSLATIONS, type Language } from "@/lib/translations";

type Step = "welcome" | "auth" | "quiz" | "loading" | "result";
type AuthMode = "login" | "signup";
type SubscriptionPlan = "starter" | "premium" | null;

interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone: string | null;
}

interface BusinessAgentMessage {
  role: "user" | "assistant";
  content: string;
}

const ECOM_KEYWORDS = [
  "dropshipping",
  "print-on-demand",
  "e-commerce",
  "ecommerce",
  "boutique en ligne",
  "online store",
  "shopify",
  "amazon fba",
  "etsy",
];

function isEcommerceBusiness(name?: string, description?: string): boolean {
  const haystack = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  return ECOM_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

const ONLYFANS_KEYWORDS = [
  "onlyfans",
  "only fans",
  "onlyfan",
  "management de createurs",
  "management créateurs",
  "agence de createurs",
  "agence de créateurs",
];

const ONLYFANS_RECOMMENDATION_VIDEOS = [
  {
    title: "OnlyFans Management - Formation recommandée 1",
    url: "https://www.youtube.com/embed/CO2r19gAjxw",
  },
  {
    title: "OnlyFans Management - Formation recommandée 2",
    url: "https://www.youtube.com/embed/pDz05OUeFGU",
  },
  {
    title: "OnlyFans Management - Formation recommandée 3",
    url: "https://www.youtube.com/embed/tVXctzQyp3c",
  },
];

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isOnlyFansManagement(name?: string, description?: string): boolean {
  const haystack = normalizeForSearch(`${name ?? ""} ${description ?? ""}`);
  return ONLYFANS_KEYWORDS.some((keyword) => haystack.includes(normalizeForSearch(keyword)));
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>("fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [streamContent, setStreamContent] = useState("");
  const [resultId, setResultId] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [subscriberUnlocked, setSubscriberUnlocked] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [alternativeError, setAlternativeError] = useState("");
  const [alternativeLoading, setAlternativeLoading] = useState(false);
  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentMessages, setAgentMessages] = useState<BusinessAgentMessage[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);

  const t = TRANSLATIONS[lang];
  const currentLang = LANGUAGES.find((language) => language.code === lang)!;

  const { data: finalResult } = useGetResult(resultId as number, {
    query: {
      enabled: !!resultId,
      queryKey: getGetResultQueryKey(resultId as number),
    },
  });

  useEffect(() => {
    const storedToken = window.localStorage.getItem("befind_auth_token");
    if (!storedToken) return;

    setAuthToken(storedToken);
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("invalid session");
        return response.json() as Promise<{ user: AuthUser }>;
      })
      .then(({ user }) => {
        setAuthUser(user);
        setUserName(user.name);
        setSubscriberEmail(user.email);
        setAuthPhone(user.phone ?? "");
      })
      .catch(() => {
        window.localStorage.removeItem("befind_auth_token");
        setAuthToken("");
        setAuthUser(null);
      });
  }, []);

  const handleRestart = () => {
    setStep("welcome");
    setAuthMode("login");
    setAnswers([]);
    setCurrentQuestionIdx(0);
    setResultId(null);
    setStreamContent("");
    setHasError(false);
    setSubscriberEmail(authUser?.email ?? "");
    setSubscriberUnlocked(false);
    setSubscriptionPlan(null);
    setSubscriptionError("");
    setAlternativeError("");
    setAlternativeLoading(false);
    setAgentQuestion("");
    setAgentMessages([]);
    setAgentLoading(false);
  };

  const handleStart = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const email = subscriberEmail.trim().toLowerCase();
    const displayName = userName.trim() || email.split("@")[0] || "Utilisateur";
    const alreadyAuthenticated = authUser?.email === email && !!authToken;
    if (!email || (!alreadyAuthenticated && !authPassword) || (authMode === "signup" && !userName.trim())) return;

    setSubscriptionLoading(true);
    setSubscriptionError("");

    try {
      let authenticatedUser = authUser;
      let nextToken = authToken;

      if (!alreadyAuthenticated) {
        const authResponse = await fetch(authMode === "signup" ? "/api/auth/register" : "/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            authMode === "signup"
              ? {
                  email,
                  password: authPassword,
                  name: displayName,
                  phone: authPhone.trim() || undefined,
                }
              : { email, password: authPassword },
          ),
        });

        const authData = (await authResponse.json()) as {
          user?: AuthUser;
          token?: string;
          message?: string;
          error?: string;
        };

        if (!authResponse.ok || !authData.user || !authData.token) {
          throw new Error(authData.message ?? authData.error ?? "Impossible de se connecter.");
        }

        authenticatedUser = authData.user;
        nextToken = authData.token;
        setAuthUser(authData.user);
        setAuthToken(authData.token);
        setUserName(authData.user.name);
        setSubscriberEmail(authData.user.email);
        setAuthPhone(authData.user.phone ?? "");
        window.localStorage.setItem("befind_auth_token", authData.token);
      }

      const response = await fetch(`/api/quiz/access/${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      });
      const data = (await response.json()) as {
        active?: boolean;
        plan?: SubscriptionPlan;
        canTakeQuiz?: boolean;
        canUsePremiumTools?: boolean;
        attemptsUsed?: number;
        limit?: number;
        message?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "subscription check failed");
      }

      if (!data.active || !data.canTakeQuiz) {
        setSubscriptionError(data.message ?? "Un abonnement Starter ou Premium actif est requis pour faire le questionnaire.");
        return;
      }

      setUserName(authenticatedUser?.name ?? displayName);
      setAuthToken(nextToken);
      setSubscriptionPlan(data.plan ?? null);
      setSubscriberUnlocked(!!data.canUsePremiumTools);
      setStep("quiz");
    } catch {
      setSubscriptionError("Impossible de vérifier l'abonnement. Vérifiez l'email ou réessayez.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const submitQuizData = async (finalAnswers: QuizAnswer[]) => {
    setHasError(false);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          answers: finalAnswers,
          email: subscriberEmail.trim().toLowerCase(),
          userName,
          language: lang,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
        setSubscriptionError(
          data?.message ?? "Un abonnement Starter ou Premium actif est requis pour faire le questionnaire.",
        );
        setHasError(true);
        setStep("welcome");
        return;
      }

      if (!response.body) throw new Error("No body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            fullContent += data.content;
            setStreamContent(fullContent);
          }
          if (data.done && data.resultId) {
            setResultId(data.resultId);
            setStep("result");
          }
          if (data.error) {
            setHasError(true);
            setStep("welcome");
          }
        }
      }
    } catch {
      setHasError(true);
      setStep("welcome");
    }
  };

  const handleAnswer = async (choice: string) => {
    const question = t.questions[currentQuestionIdx];
    const nextAnswers = [
      ...answers,
      { questionId: question.id, question: question.question, answer: choice },
    ];
    setAnswers(nextAnswers);

    if (currentQuestionIdx < t.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      return;
    }

    setStep("loading");
    await submitQuizData(nextAnswers);
  };

  const verifySubscriberAccess = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const email = subscriberEmail.trim().toLowerCase();
    if (!email) return;

    setSubscriptionLoading(true);
    setSubscriptionError("");

    try {
      const response = await fetch(`/api/shop/subscription/${encodeURIComponent(email)}`);
      const data = (await response.json()) as {
        active?: boolean;
        eligible?: boolean;
        plan?: SubscriptionPlan;
        canUsePremiumTools?: boolean;
        tier?: string | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "subscription check failed");
      }

      if (!data.active || !data.canUsePremiumTools) {
        setSubscriberUnlocked(false);
        setSubscriptionPlan(data.plan ?? null);
        setSubscriptionError("Un abonnement Premium actif est requis pour débloquer les outils avancés.");
        return;
      }

      setSubscriptionPlan(data.plan ?? "premium");
      setSubscriberUnlocked(true);
      setAgentMessages([]);
    } catch {
      setSubscriberUnlocked(false);
      setSubscriptionError("Impossible de vérifier l'abonnement. Vérifiez l'email ou réessayez.");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const sendAgentQuestion = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const question = agentQuestion.trim();
    const email = subscriberEmail.trim().toLowerCase();
    if (!question || !finalResult || !subscriberUnlocked || agentLoading) return;

    const nextMessages: BusinessAgentMessage[] = [...agentMessages, { role: "user", content: question }];
    setAgentMessages(nextMessages);
    setAgentQuestion("");
    setAgentLoading(true);

    try {
      const response = await fetch("/api/business-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          businessName: finalResult.businessName,
          businessDescription: finalResult.businessDescription,
          question,
          history: agentMessages,
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string; message?: string };
      if (response.status === 402) {
        setSubscriberUnlocked(false);
        setSubscriptionError(data.message ?? "Un abonnement Premium actif est requis.");
        return;
      }
      if (!response.ok || !data.answer) {
        throw new Error(data.error ?? "agent failed");
      }

      setAgentMessages([...nextMessages, { role: "assistant", content: data.answer }]);
    } catch {
      setAgentMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Désolé, l'agent IA n'arrive pas à répondre pour le moment. Réessayez dans un instant.",
        },
      ]);
    } finally {
      setAgentLoading(false);
    }
  };

  const requestAlternativeBusiness = async () => {
    if (!finalResult || !subscriberEmail.trim() || alternativeLoading) return;

    setAlternativeLoading(true);
    setAlternativeError("");

    try {
      const response = await fetch(`/api/quiz/results/${finalResult.id}/alternative`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          email: subscriberEmail.trim().toLowerCase(),
          language: lang,
        }),
      });

      const data = (await response.json()) as {
        resultId?: number;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.resultId) {
        throw new Error(data.message ?? data.error ?? "alternative failed");
      }

      setResultId(data.resultId);
      setAgentMessages([]);
      setAgentQuestion("");
    } catch (err) {
      setAlternativeError(
        err instanceof Error
          ? err.message
          : "Impossible de générer une autre proposition pour le moment.",
      );
    } finally {
      setAlternativeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <div className="font-serif flex items-center gap-2 text-2xl font-bold text-indigo-600">
          <Sparkles className="h-6 w-6" />
          {t.appTitle}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="ghost" className="gap-2" onClick={() => setShowLangMenu((value) => !value)}>
              <Globe className="h-4 w-4" />
              {currentLang.flag} {currentLang.label}
            </Button>
            {showLangMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-40 overflow-hidden rounded-xl border bg-white shadow-xl">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-stone-50"
                    onClick={() => {
                      setLang(language.code);
                      setShowLangMenu(false);
                      handleRestart();
                    }}
                  >
                    <span>{language.flag}</span>
                    {language.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={() => setLocation("/pricing")}>
            {t.pricing}
          </Button>
          <Button variant="ghost" className="gap-2" onClick={() => setLocation("/history")}>
            <HistoryIcon className="h-4 w-4" />
            {t.history}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-8 text-center"
            >
              {hasError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm font-medium text-red-700">
                  {t.errorMsg}
                </div>
              )}
              <h1 className="font-serif text-5xl font-black leading-tight md:text-7xl">
                {t.heroTitle} <span className="text-indigo-600">{t.heroHighlight}</span>
              </h1>
              <p className="mx-auto max-w-2xl text-xl text-stone-600">{t.heroSubtitle}</p>

              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { Icon: Users, label: t.statsUsers },
                  { Icon: Star, label: t.statsRating },
                  { Icon: ThumbsUp, label: t.statsSatisfied },
                ].map(({ Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-full border bg-white px-5 py-2 shadow-sm">
                    <Icon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-semibold">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mx-auto max-w-md space-y-4 pt-4">
                <Button
                  className="h-14 w-full text-lg"
                  onClick={() => {
                    setSubscriptionError("");
                    setAuthMode("login");
                    setStep("auth");
                  }}
                >
                  Faire le questionnaire <ArrowRight className="ml-2" />
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-sm text-stone-500">
                  <Lock className="h-4 w-4" />
                  Connexion requise : Starter pour le plan d'action, Premium pour les outils avancés.
                </p>
              </div>

              <section className="pt-10">
                <p className="mb-6 text-sm font-bold uppercase tracking-widest text-stone-500">
                  {t.howItWorksTitle}
                </p>
                <div className="grid gap-5 md:grid-cols-3">
                  {[
                    { Icon: ClipboardList, step: t.howItWorksSteps[0] },
                    { Icon: Cpu, step: t.howItWorksSteps[1] },
                    { Icon: Rocket, step: t.howItWorksSteps[2] },
                  ].map(({ Icon, step: item }, idx) => (
                    <Card key={item.title} className="p-6">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                        <Icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <p className="font-bold">{idx + 1}. {item.title}</p>
                      <p className="mt-1 text-sm text-stone-600">{item.desc}</p>
                    </Card>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {step === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md space-y-6"
            >
              <Button variant="ghost" className="gap-2" onClick={() => setStep("welcome")}>
                <ArrowLeft className="h-4 w-4" /> Retour
              </Button>

              <Card className="overflow-hidden">
                <div className="bg-stone-950 p-6 text-white">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    {authMode === "login" ? <LogIn className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
                  </div>
                  <h2 className="font-serif text-center text-3xl font-black">
                    {authMode === "login" ? "Connexion" : "Nouveau utilisateur"}
                  </h2>
                  <p className="mt-2 text-center text-sm text-white/70">
                    Connectez votre compte avec email et mot de passe pour accéder au questionnaire.
                  </p>
                </div>

                <div className="space-y-5 p-6">
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
                    <button
                      type="button"
                      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                        authMode === "login" ? "bg-white text-indigo-600 shadow-sm" : "text-stone-500"
                      }`}
                      onClick={() => {
                        setAuthMode("login");
                        setSubscriptionError("");
                      }}
                    >
                      Connexion
                    </button>
                    <button
                      type="button"
                      className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                        authMode === "signup" ? "bg-white text-indigo-600 shadow-sm" : "text-stone-500"
                      }`}
                      onClick={() => {
                        setAuthMode("signup");
                        setSubscriptionError("");
                      }}
                    >
                      Nouveau utilisateur
                    </button>
                  </div>

                  <form onSubmit={(event) => void handleStart(event)} className="space-y-4 text-left">
                    {authUser && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                        Connecté en tant que <strong>{authUser.email}</strong>. Vous pouvez continuer ou changer
                        d'email pour vous connecter avec un autre compte.
                      </div>
                    )}

                    {authMode === "signup" && (
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-semibold">
                          {t.nameLabel}
                        </label>
                        <Input
                          id="name"
                          value={userName}
                          onChange={(event) => setUserName(event.target.value)}
                          placeholder={t.namePlaceholder}
                          className="h-12"
                          autoFocus
                        />
                      </div>
                    )}

                    {authMode === "login" && userName.trim() && (
                      <div className="space-y-2">
                        <label htmlFor="login-name" className="text-sm font-semibold">
                          Prénom affiché
                        </label>
                        <Input
                          id="login-name"
                          value={userName}
                          onChange={(event) => setUserName(event.target.value)}
                          placeholder={t.namePlaceholder}
                          className="h-12"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="subscription-email" className="text-sm font-semibold">
                        Email
                      </label>
                      <Input
                        id="subscription-email"
                        type="email"
                        value={subscriberEmail}
                        onChange={(event) => setSubscriberEmail(event.target.value)}
                        placeholder="vous@exemple.com"
                        className="h-12"
                        autoFocus={authMode === "login"}
                      />
                      <p className="text-xs text-stone-500">
                        Utilisez le même email que votre abonnement Starter ou Premium.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="auth-password" className="text-sm font-semibold">
                        Mot de passe
                      </label>
                      <Input
                        id="auth-password"
                        type="password"
                        value={authPassword}
                        onChange={(event) => setAuthPassword(event.target.value)}
                        placeholder={authMode === "signup" ? "Minimum 8 caractères" : "Votre mot de passe"}
                        className="h-12"
                      />
                      {authMode === "signup" && (
                        <p className="text-xs text-stone-500">Choisissez un mot de passe d'au moins 8 caractères.</p>
                      )}
                    </div>

                    {authMode === "signup" && (
                      <div className="space-y-2">
                        <label htmlFor="auth-phone" className="text-sm font-semibold">
                          Numéro de téléphone <span className="font-normal text-stone-400">(optionnel)</span>
                        </label>
                        <Input
                          id="auth-phone"
                          type="tel"
                          value={authPhone}
                          onChange={(event) => setAuthPhone(event.target.value)}
                          placeholder="+41 79 000 00 00"
                          className="h-12"
                        />
                      </div>
                    )}

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">
                      <div className="flex items-start gap-2">
                        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                        <p>
                          Starter donne accès au questionnaire et au plan d'action. Premium ajoute les outils business,
                          l'agent IA et les recommandations avancées.
                        </p>
                      </div>
                    </div>

                    {subscriptionError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {subscriptionError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={
                        !subscriberEmail.trim() ||
                        (!(authUser?.email === subscriberEmail.trim().toLowerCase() && authToken) &&
                          !authPassword) ||
                        (authMode === "signup" && !userName.trim()) ||
                        subscriptionLoading
                      }
                      className="h-12 w-full"
                    >
                      {subscriptionLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Vérification...
                        </>
                      ) : (
                        <>
                          {authMode === "login" ? "Se connecter et commencer" : "Créer mon accès et commencer"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="text-center text-xs text-stone-500">
                    Pas encore abonné ?{" "}
                    <button type="button" className="font-bold text-indigo-600" onClick={() => setLocation("/pricing")}>
                      Voir les abonnements
                    </button>
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div
              key={`quiz-${currentQuestionIdx}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-2xl"
            >
              <div className="mb-10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-stone-500">
                    {t.questionLabel(currentQuestionIdx + 1, t.questions.length)}
                  </span>
                  <span className="text-sm font-semibold text-indigo-600">
                    {Math.round(((currentQuestionIdx + 1) / t.questions.length) * 100)}%
                  </span>
                </div>
                <Progress value={((currentQuestionIdx + 1) / t.questions.length) * 100} />
              </div>
              <h2 className="font-serif mb-10 text-3xl font-bold leading-tight md:text-4xl">
                {t.questions[currentQuestionIdx].question}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {t.questions[currentQuestionIdx].choices.map((choice) => (
                  <Button
                    key={choice}
                    variant="outline"
                    className="h-auto justify-start whitespace-normal p-6 text-left text-lg"
                    onClick={() => void handleAnswer(choice)}
                  >
                    {choice}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl space-y-8 text-center">
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-indigo-600" />
              <h2 className="font-serif text-3xl font-bold">{t.analysing}</h2>
              <Card className="min-h-48 p-6 text-left">
                <p className="text-lg text-stone-600">
                  {streamContent ? `${streamContent.slice(-220)}...` : t.generatingMsg}
                </p>
              </Card>
            </motion.div>
          )}

          {step === "result" && finalResult && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl space-y-10 pb-16">
              <div className="space-y-3 text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">{t.recommendation}</span>
                <h1 className="font-serif text-5xl font-black md:text-7xl">{finalResult.businessName}</h1>
              </div>

              <Card className="overflow-hidden border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                      Potentiel du business
                    </span>
                    <h2 className="font-serif mt-1 text-2xl font-black">Combien ça peut rapporter ?</h2>
                    <p className="mt-2 text-lg leading-relaxed text-stone-700">{finalResult.earningPotential}</p>
                    <p className="mt-3 text-xs text-stone-500">
                      Estimation réaliste mais non garantie : les résultats dépendent de l'exécution, du marché, de la
                      niche et de l'acquisition client.
                    </p>
                  </div>
                </div>
              </Card>

              {subscriberUnlocked && (
                <Card className="border-2 border-indigo-100 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
                        <RefreshCw className="h-3.5 w-3.5" /> Premium
                      </span>
                      <h3 className="font-serif mt-3 text-2xl font-black">Ce business ne vous plaît pas ?</h3>
                      <p className="mt-1 text-sm text-stone-600">
                        Demandez une autre proposition basée sur vos mêmes réponses. Vous pouvez le faire 2 fois maximum.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="h-12 shrink-0"
                      disabled={(finalResult.alternativeSuggestionsUsed ?? 0) >= 2 || alternativeLoading}
                      onClick={() => void requestAlternativeBusiness()}
                    >
                      {alternativeLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Génération...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" /> Proposer un autre business
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-semibold text-indigo-700">
                      Alternatives utilisées : {finalResult.alternativeSuggestionsUsed ?? 0}/2
                    </span>
                    {(finalResult.alternativeSuggestionsUsed ?? 0) >= 2 && (
                      <span className="text-stone-500">Limite Premium atteinte pour ce résultat.</span>
                    )}
                  </div>
                  {alternativeError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {alternativeError}
                    </div>
                  )}
                </Card>
              )}

              <section>
                <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                  {t.conceptTitle}
                </h3>
                <p className="text-xl leading-relaxed text-stone-600">{finalResult.businessDescription}</p>
              </section>

              <section>
                <h3 className="mb-4 text-2xl font-bold">{t.whyFitsTitle}</h3>
                <p className="text-xl leading-relaxed text-stone-600">{finalResult.whyItFits}</p>
              </section>

              <Card className="p-8">
                <h3 className="mb-6 text-2xl font-bold">{t.actionPlanTitle}</h3>
                <div className="space-y-4">
                  {finalResult.actionPlan.split("\n").filter(Boolean).map((stepText, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600">
                        {idx + 1}
                      </div>
                      <p className="pt-1 font-medium">{stepText.replace(/^\d+[\.\-\)]\s*/, "")}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {subscriberUnlocked && isEcommerceBusiness(finalResult.businessName, finalResult.businessDescription) && (
                <Card className="border-indigo-200 bg-indigo-50 p-8 text-center">
                  <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-indigo-600" />
                  <h3 className="font-serif text-2xl font-bold">Lancez votre boutique en quelques minutes</h3>
                  <p className="mx-auto mt-2 max-w-xl text-stone-600">
                    Votre profil est parfait pour l'e-commerce. Laissez l'IA créer une boutique complète.
                  </p>
                  <Button
                    size="lg"
                    className="mt-5 h-14 px-8 text-lg"
                    onClick={() =>
                      setLocation(
                        `/shop-builder?business=${encodeURIComponent(finalResult.businessName)}&email=${encodeURIComponent(
                          subscriberEmail.trim().toLowerCase(),
                        )}`,
                      )
                    }
                  >
                    <Sparkles className="mr-2" /> Générer ma boutique grâce à l'IA
                  </Button>
                </Card>
              )}

              <Card className="overflow-hidden border-2 border-indigo-100">
                <div className="bg-stone-950 p-6 text-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-100">
                        <Lock className="h-3.5 w-3.5" /> Outils Premium
                      </span>
                      <h3 className="font-serif mt-3 text-3xl font-black">Recommandations & agent IA business</h3>
                      <p className="mt-2 max-w-2xl text-sm text-white/75">
                        Les abonnés Premium débloquent les ressources avancées liées à leur recommandation, les outils
                        business et l'agent IA spécialisé dans "{finalResult.businessName}".
                      </p>
                    </div>
                    <Button variant="secondary" onClick={() => setLocation("/pricing")}>
                      Voir les abonnements
                    </Button>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {!subscriberUnlocked ? (
                    <form onSubmit={(event) => void verifySubscriberAccess(event)} className="space-y-4">
                      <div>
                        <label htmlFor="subscriber-email" className="text-sm font-semibold">
                          Email de votre abonnement
                        </label>
                        {subscriptionPlan === "starter" ? (
                          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            Votre abonnement Starter est actif : vous avez accès au questionnaire et au plan d'action.
                            Passez en Premium pour débloquer les outils du business recommandé.
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-stone-600">
                            Entrez l'email utilisé pour votre abonnement Premium afin de débloquer cet espace.
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Input
                          id="subscriber-email"
                          type="email"
                          value={subscriberEmail}
                          onChange={(event) => setSubscriberEmail(event.target.value)}
                          placeholder="vous@exemple.com"
                          className="h-12"
                        />
                        <Button type="submit" disabled={!subscriberEmail.trim() || subscriptionLoading} className="h-12">
                          {subscriptionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                          Débloquer
                        </Button>
                      </div>
                      {subscriptionError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {subscriptionError}
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="space-y-8">
                      <BusinessWorkspace
                        businessName={finalResult.businessName}
                        businessDescription={finalResult.businessDescription}
                        subscriberEmail={subscriberEmail.trim().toLowerCase()}
                      />

                      {isOnlyFansManagement(finalResult.businessName, finalResult.businessDescription) && (
                        <section className="space-y-4">
                          <div>
                            <h4 className="flex items-center gap-2 text-xl font-bold">
                              <PlayCircle className="h-5 w-5 text-indigo-600" />
                              Recommandations vidéo - OnlyFans Management
                            </h4>
                            <p className="mt-1 text-sm text-stone-600">
                              Ces vidéos complètent votre plan d'action pour comprendre l'acquisition, l'offre et les
                              opérations d'une agence de management de créateurs.
                            </p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            {ONLYFANS_RECOMMENDATION_VIDEOS.map((video) => (
                              <div key={video.url} className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                                <div className="aspect-video bg-stone-100">
                                  <iframe
                                    className="h-full w-full"
                                    src={video.url}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                </div>
                                <p className="p-3 text-sm font-semibold">{video.title}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className="space-y-4">
                        <div>
                          <h4 className="flex items-center gap-2 text-xl font-bold">
                            <Bot className="h-5 w-5 text-indigo-600" />
                            Agent IA spécialisé - {finalResult.businessName}
                          </h4>
                          <p className="mt-1 text-sm text-stone-600">
                            Posez vos questions sur le lancement, le marketing, les ventes, les risques ou les
                            prochaines étapes de ce business.
                          </p>
                        </div>

                        <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border bg-stone-50 p-4">
                          {agentMessages.length === 0 ? (
                            <div className="rounded-xl bg-white p-4 text-sm text-stone-600">
                              Exemple : "Quelles sont les 3 premières actions à faire cette semaine ?" ou "Comment
                              trouver mes premiers clients ?"
                            </div>
                          ) : (
                            agentMessages.map((message, idx) => (
                              <div
                                key={idx}
                                className={`rounded-xl p-3 text-sm ${
                                  message.role === "user"
                                    ? "ml-8 bg-indigo-600 text-white"
                                    : "mr-8 bg-white text-stone-800"
                                }`}
                              >
                                {message.content}
                              </div>
                            ))
                          )}
                          {agentLoading && (
                            <div className="mr-8 flex items-center gap-2 rounded-xl bg-white p-3 text-sm text-stone-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              L'agent réfléchit...
                            </div>
                          )}
                        </div>

                        <form onSubmit={(event) => void sendAgentQuestion(event)} className="flex flex-col gap-3 sm:flex-row">
                          <Input
                            value={agentQuestion}
                            onChange={(event) => setAgentQuestion(event.target.value)}
                            placeholder={`Question sur ${finalResult.businessName}...`}
                            className="h-12"
                          />
                          <Button type="submit" disabled={!agentQuestion.trim() || agentLoading} className="h-12">
                            <Send className="h-4 w-4" />
                            Envoyer
                          </Button>
                        </form>
                      </section>
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <Button size="lg" className="h-14 flex-1 text-lg" onClick={handleRestart}>
                  <ArrowLeft className="mr-2" /> {t.restartButton}
                </Button>
                <Button variant="outline" size="lg" className="h-14 flex-1 text-lg" onClick={() => setLocation("/history")}>
                  <HistoryIcon className="mr-2" /> {t.historyButton}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
