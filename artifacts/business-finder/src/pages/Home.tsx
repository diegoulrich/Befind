import { useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Cpu,
  Globe,
  History as HistoryIcon,
  Loader2,
  Rocket,
  ShoppingBag,
  Sparkles,
  Star,
  ThumbsUp,
  Users,
} from "lucide-react";
import { getGetResultQueryKey, useGetResult, type QuizAnswer } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LANGUAGES, TRANSLATIONS, type Language } from "@/lib/translations";

type Step = "welcome" | "quiz" | "loading" | "result";

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
  const currentLang = LANGUAGES.find((language) => language.code === lang)!;

  const { data: finalResult } = useGetResult(resultId as number, {
    query: {
      enabled: !!resultId,
      queryKey: getGetResultQueryKey(resultId as number),
    },
  });

  const handleRestart = () => {
    setStep("welcome");
    setAnswers([]);
    setCurrentQuestionIdx(0);
    setResultId(null);
    setStreamContent("");
    setHasError(false);
  };

  const handleStart = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (userName.trim()) setStep("quiz");
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

              <form onSubmit={handleStart} className="mx-auto max-w-md space-y-4 pt-4 text-left">
                <label htmlFor="name" className="text-sm font-semibold">
                  {t.nameLabel}
                </label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder={t.namePlaceholder}
                  className="h-14 text-lg"
                  autoFocus
                />
                <Button type="submit" disabled={!userName.trim()} className="h-14 w-full text-lg">
                  {t.startButton} <ArrowRight className="ml-2" />
                </Button>
              </form>

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

              {isEcommerceBusiness(finalResult.businessName, finalResult.businessDescription) && (
                <Card className="border-indigo-200 bg-indigo-50 p-8 text-center">
                  <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-indigo-600" />
                  <h3 className="font-serif text-2xl font-bold">Lancez votre boutique en quelques minutes</h3>
                  <p className="mx-auto mt-2 max-w-xl text-stone-600">
                    Votre profil est parfait pour l'e-commerce. Laissez l'IA créer une boutique complète.
                  </p>
                  <Button
                    size="lg"
                    className="mt-5 h-14 px-8 text-lg"
                    onClick={() => setLocation(`/shop-builder?business=${encodeURIComponent(finalResult.businessName)}`)}
                  >
                    <Sparkles className="mr-2" /> Générer ma boutique grâce à l'IA
                  </Button>
                </Card>
              )}

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
