import { useState } from "react";
import { useLocation } from "wouter";
import { useListResults } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, User, ChevronDown, ChevronUp, Globe } from "lucide-react";
import { format } from "date-fns";
import { fr, enUS, es, de, pt, it, type Locale } from "date-fns/locale";
import { LANGUAGES, TRANSLATIONS, type Language } from "@/lib/translations";
import { motion, AnimatePresence } from "framer-motion";

const DATE_LOCALES: Record<Language, Locale> = { fr, en: enUS, es, de, pt, it };

export default function History() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>("fr");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: results, isLoading } = useListResults();

  const t = TRANSLATIONS[lang];
  const currentLang = LANGUAGES.find((l) => l.code === lang)!;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between p-6">
        <Button variant="ghost" onClick={() => setLocation("/")} className="-ml-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t.backHome}
        </Button>
        <div className="relative">
          <Button variant="ghost" className="gap-2 text-sm" onClick={() => setShowLangMenu((v) => !v)}>
            <Globe className="h-4 w-4" />
            <span>{currentLang.flag} {currentLang.label}</span>
          </Button>
          <AnimatePresence>
            {showLangMenu && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-xl border bg-card shadow-xl">
                {LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-primary/5 ${lang === language.code ? "bg-primary/5 font-bold text-primary" : ""}`}
                    onClick={() => {
                      setLang(language.code);
                      setShowLangMenu(false);
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
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6">
        <div className="mb-12">
          <h1 className="mb-4 font-serif text-4xl font-black tracking-tight md:text-5xl">{t.historyTitle}</h1>
          <p className="text-xl text-muted-foreground">{t.historySubtitle}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted/50 p-6" />
            ))}
          </div>
        ) : !results?.length ? (
          <div className="rounded-2xl border bg-card py-24 text-center shadow-sm">
            <p className="mb-6 text-xl text-muted-foreground">{t.noResults}</p>
            <Button onClick={() => setLocation("/")} size="lg">{t.startTest}</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {results.map((result) => {
              const isExpanded = expandedId === result.id;
              return (
                <Card key={result.id} className="overflow-hidden border-border/50 bg-card">
                  <button className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-primary/5" onClick={() => setExpandedId(isExpanded ? null : result.id)}>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 font-serif text-2xl font-bold leading-tight">{result.businessName}</h3>
                      <p className="mb-4 line-clamp-2 text-muted-foreground">{result.businessDescription}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{result.userName || t.anonymous}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(result.createdAt), "d MMMM yyyy", { locale: DATE_LOCALES[lang] })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 shrink-0 text-muted-foreground">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-6 border-t border-border/50 px-6 pb-8 pt-6">
                          <div>
                            <h4 className="mb-2 text-lg font-bold">{t.whyFitsTitle}</h4>
                            <p className="text-muted-foreground">{result.whyItFits}</p>
                          </div>
                          <div>
                            <h4 className="mb-4 text-lg font-bold">{t.actionPlanTitle}</h4>
                            <div className="space-y-3">
                              {result.actionPlan.split("\n").filter(Boolean).map((line, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{idx + 1}</div>
                                  <p className="pt-1 text-sm font-medium">{line.replace(/^\d+[\.\-\)]\s*/, "")}</p>
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
