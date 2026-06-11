import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useGetResult, getGetResultQueryKey } from "@workspace/api-client-react";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  History as HistoryIcon,
  Sparkles,
  Globe,
  Quote,
  Star,
  Users,
  ThumbsUp,
  ClipboardList,
  Cpu,
  Rocket,
  ShoppingBag,
} from "lucide-react";
import type { QuizAnswer } from "@workspace/api-client-react";
import { LANGUAGES, TRANSLATIONS, type Language } from "@/lib/translations";

type Step = "welcome" | "quiz" | "loading" | "result";

const ECOM_KEYWORDS = [
  "dropshipping",
  "drop shipping",
  "print-on-demand",
  "print on demand",
  "e-commerce",
  "ecommerce",
  "boutique en ligne",
  "online store",
  "online shop",
  "reselling",
  "digital product",
  "etsy",
  "shopify",
  "amazon fba",
];

function isEcommerceBusiness(name?: string, description?: string): boolean {
  const haystack = `${name ?? ""} ${description ?? ""}`.toLowerCase();
  return ECOM_KEYWORDS.some((kw) => haystack.includes(kw));
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>("fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [step, setStep] = useState<Step>("welcome");
  const [userName, setUserName] = useState("");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [streamContent, setStreamContent] = useState("");
  const [resultId, setResultId] = useState<number | null>(null);
  const [hasError, setHasError] = useState(false);

  const t = TRANSLATIONS[lang];

  const { data: finalResult } = useGetResult(
    resultId as number,
    { query: { enabled: !!resultId, queryKey: getGetResultQueryKey(resultId as number) } },
  );

  const handleStart = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (userName.trim()) {
      setStep("quiz");
    }
  };

  const handleAnswer = async (choice: string) => {
    const q = t.questions[currentQuestionIdx];
    const newAnswers = [...answers, { questionId: q.id, question: q.question, answer: choice }];
    setAnswers(newAnswers);

    if (currentQuestionIdx < t.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      setStep("loading");
      await submitQuizData(newAnswers);
    }
  };

  const submitQuizData = async (finalAnswers: QuizAnswer[]) => {
    setHasError(false);
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, userName, language: lang }),
      });

      if (!response.body) throw new Error("No body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
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
            } catch {
              // Ignore malformed SSE frames.
            }
          }
        }
      }
    } catch {
      setHasError(true);
      setStep("welcome");
    }
  };

  const handleRestart = () => {
    setStep("welcome");
    setAnswers([]);
    setCurrentQuestionIdx(0);
    setResultId(null);
    setStreamContent("");
    setHasError(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-64 top-1/2 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <div className="flex items-center gap-2 font-serif text-2xl font-bold text-primary">
          <Sparkles className="h-6 w-6" />
          {t.appTitle}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="ghost" className="gap-2 text-sm" onClick={() => setShowLangMenu((v) => !v)}>
              <Globe className="h-4 w-4" />
              <span>{currentLang.flag} {currentLang.label}</span>
            </Button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border bg-card shadow-xl"
                >
                  {LANGUAGES.map((language) => (
                    <button
                      key={language.code}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-primary/5 ${lang === language.code ? "bg-primary/5 font-bold text-primary" : ""}`}
                      onClick={() => {
                        setLang(language.code);
                        setShowLangMenu(false);
                        handleRestart();
                      }}
                    >
                      <span className="text-lg">{language.flag}</span>
                      {language.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/pricing")}>Tarifs</Button>
          <Button variant="ghost" className="gap-2" onClick={() => setLocation("/history")}>
            <HistoryIcon className="h-4 w-4" />
            {t.history}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full space-y-8 text-center">
              {hasError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-4 text-sm font-medium text-destructive">
                  {t.errorMsg}
                </div>
              )}
              <h1 className="font-serif text-5xl font-black leading-tight tracking-tight md:text-7xl">
                {t.heroTitle} <span className="text-primary">{t.heroHighlight}</span>
              </h1>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">{t.heroSubtitle}</p>

              <div className="flex flex-wrap justify-center gap-6 pt-2">
                <Badge icon={<Users className="h-4 w-4 text-primary" />} label={t.statsUsers} />
                <Badge icon={<Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />} label={t.statsRating} />
                <Badge icon={<ThumbsUp className="h-4 w-4 text-green-500" />} label={t.statsSatisfied} />
              </div>

              <form onSubmit={handleStart} className="mx-auto max-w-md space-y-4 pt-8">
                <div className="space-y-2 text-left">
                  <label htmlFor="name" className="text-sm font-semibold">{t.nameLabel}</label>
                  <Input id="name" value={userName} onChange={(event) => setUserName(event.target.value)} placeholder={t.namePlaceholder} className="h-14 bg-white px-4 text-lg" autoFocus />
                </div>
                <Button type="submit" disabled={!userName.trim()} className="h-14 w-full text-lg font-bold shadow-xl">
                  {t.startButton} <ArrowRight className="ml-2" />
                </Button>
              </form>

              <InfoGrid title={t.howItWorksTitle} />
              <Testimonials title={t.reviewsTitle} testimonials={t.testimonials} />
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div key={`quiz-${currentQuestionIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-2xl">
              <div className="mb-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{currentQuestionIdx + 1}</span>
                    <span className="text-sm font-medium text-muted-foreground">/ {t.questions.length}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{Math.round(((currentQuestionIdx + 1) / t.questions.length) * 100)}%</span>
                </div>
                <Progress value={((currentQuestionIdx + 1) / t.questions.length) * 100} className="h-3 rounded-full" />
              </div>
              <h2 className="mb-10 font-serif text-3xl font-bold leading-tight md:text-4xl">{t.questions[currentQuestionIdx].question}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {t.questions[currentQuestionIdx].choices.map((choice, idx) => (
                  <Button key={idx} variant="outline" className="h-auto justify-start whitespace-normal bg-card p-6 text-left text-lg shadow-sm" onClick={() => handleAnswer(choice)}>
                    {choice}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl space-y-8 text-center">
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary" />
              <h2 className="font-serif text-3xl font-bold">{t.analysing}</h2>
              <Card className="min-h-[200px] bg-white/50 p-6 text-left backdrop-blur">
                <p className="animate-pulse text-lg text-muted-foreground">
                  {streamContent ? streamContent.slice(-200) + "…" : t.generatingMsg}
                </p>
              </Card>
            </motion.div>
          )}

          {step === "result" && finalResult && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl space-y-12 pb-16">
              <div className="space-y-4 text-center">
                <span className="text-sm font-bold uppercase tracking-wider text-primary">{t.recommendation}</span>
                <h1 className="font-serif text-5xl font-black text-foreground md:text-7xl">{finalResult.businessName}</h1>
              </div>
              <ResultSection title={t.conceptTitle} body={finalResult.businessDescription} icon />
              <ResultSection title={t.whyFitsTitle} body={finalResult.whyItFits} />
              <section className="rounded-2xl border bg-card p-8 shadow-lg">
                <h3 className="mb-8 text-2xl font-bold">{t.actionPlanTitle}</h3>
                <div className="space-y-6">
                  {finalResult.actionPlan.split("\n").filter(Boolean).map((line, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{idx + 1}</div>
                      <p className="pt-1.5 text-lg font-medium">{line.replace(/^\d+[\.\-\)]\s*/, "")}</p>
                    </div>
                  ))}
                </div>
              </section>

              {isEcommerceBusiness(finalResult.businessName, finalResult.businessDescription) && (
                <div className="space-y-4 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-8 text-center">
                  <ShoppingBag className="mx-auto h-8 w-8 text-primary" />
                  <h3 className="font-serif text-2xl font-bold">Lancez votre boutique en quelques minutes</h3>
                  <p className="mx-auto max-w-xl text-muted-foreground">
                    Votre profil est parfait pour l'e-commerce. Laissez l'IA créer une boutique complète : niche tendance, produits gagnants, marque et catalogue.
                  </p>
                  <Button size="lg" className="h-14 px-8 text-lg font-bold" onClick={() => setLocation(`/shop-builder?business=${encodeURIComponent(finalResult.businessName)}`)}>
                    <Sparkles className="mr-2" /> Générer ma boutique grâce à l'IA
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-4 pt-8 sm:flex-row">
                <Button size="lg" className="h-14 flex-1 text-lg" onClick={handleRestart}>
                  <ArrowLeft className="mr-2" /> {t.restartButton}
                </Button>
                <Button variant="outline" size="lg" className="h-14 flex-1 bg-white text-lg" onClick={() => setLocation("/history")}>
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

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/50 bg-white/80 px-5 py-2 shadow-sm">
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

function InfoGrid({ title }: { title: string }) {
  const steps = [
    { Icon: ClipboardList, title: "Répondez au quiz", desc: "Des questions rapides pour cerner votre profil." },
    { Icon: Cpu, title: "L'IA analyse", desc: "Elle identifie le business le plus cohérent." },
    { Icon: Rocket, title: "Passez à l'action", desc: "Recevez des étapes concrètes pour démarrer." },
  ];
  return (
    <div className="w-full pt-16">
      <Divider title={title} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {steps.map(({ Icon, title: stepTitle, desc }, idx) => (
          <div key={stepTitle} className="relative rounded-2xl border border-border/50 bg-white/70 p-6 text-center shadow-sm">
            <div className="absolute -top-3.5 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">{idx + 1}</div>
            <div className="mx-auto mb-3 mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mb-1 text-sm font-bold">{stepTitle}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Testimonials({ title, testimonials }: { title: string; testimonials: { name: string; role: string; quote: string }[] }) {
  return (
    <div className="w-full pt-10">
      <Divider title={title} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.name} className="flex h-full flex-col space-y-4 bg-white/70 p-6 text-left shadow-sm backdrop-blur">
            <Quote className="h-5 w-5 shrink-0 text-primary/40" />
            <p className="flex-1 text-sm italic leading-relaxed text-muted-foreground">"{testimonial.quote}"</p>
            <div className="border-t pt-4">
              <p className="text-sm font-bold">{testimonial.name}</p>
              <p className="text-xs text-muted-foreground">{testimonial.role}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Divider({ title }: { title: string }) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <p className="whitespace-nowrap text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function ResultSection({ title, body, icon = false }: { title: string; body: string; icon?: boolean }) {
  return (
    <section>
      <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold">
        {icon && <Sparkles className="h-6 w-6 text-primary" />} {title}
      </h3>
      <p className="text-xl leading-relaxed text-muted-foreground">{body}</p>
    </section>
  );
}
