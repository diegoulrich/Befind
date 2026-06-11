import { useState } from "react";
import { format } from "date-fns";
import { de, enUS, es, fr, it, pt, type Locale } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Globe, User } from "lucide-react";
import { useLocation } from "wouter";
import { useListResults } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LANGUAGES, TRANSLATIONS, type Language } from "@/lib/translations";

const DATE_LOCALES: Record<Language, Locale> = { fr, en: enUS, es, de, pt, it };

export default function History() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>("fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: results, isLoading } = useListResults();

  const t = TRANSLATIONS[lang];
  const currentLang = LANGUAGES.find((language) => language.code === lang)!;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.backHome}
        </Button>

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
                  }}
                >
                  <span>{language.flag}</span>
                  {language.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl p-6">
        <div className="mb-12">
          <h1 className="font-serif mb-4 text-4xl font-black md:text-5xl">{t.historyTitle}</h1>
          <p className="text-xl text-stone-600">{t.historySubtitle}</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((id) => (
              <Card key={id} className="h-48 animate-pulse bg-stone-100 p-6" />
            ))}
          </div>
        ) : !results?.length ? (
          <Card className="py-24 text-center">
            <p className="mb-6 text-xl text-stone-600">{t.noResults}</p>
            <Button onClick={() => setLocation("/")} size="lg">
              {t.startTest}
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {results.map((result) => {
              const isExpanded = expandedId === result.id;
              return (
                <Card key={result.id} className="overflow-hidden">
                  <button
                    className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-indigo-50"
                    onClick={() => setExpandedId(isExpanded ? null : result.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif mb-2 text-2xl font-bold">{result.businessName}</h3>
                      <p className="line-clamp-2 mb-4 text-stone-600">{result.businessDescription}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          {result.userName || t.anonymous}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(result.createdAt), "d MMMM yyyy", { locale: DATE_LOCALES[lang] })}
                        </span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-6 border-t p-6">
                          <div>
                            <h4 className="mb-2 text-lg font-bold">{t.whyFitsTitle}</h4>
                            <p className="text-stone-600">{result.whyItFits}</p>
                          </div>
                          <div>
                            <h4 className="mb-4 text-lg font-bold">{t.actionPlanTitle}</h4>
                            <div className="space-y-3">
                              {result.actionPlan.split("\n").filter(Boolean).map((step, idx) => (
                                <div key={idx} className="flex gap-3">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                                    {idx + 1}
                                  </div>
                                  <p className="pt-1 text-sm font-medium">{step.replace(/^\d+[\.\-\)]\s*/, "")}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
