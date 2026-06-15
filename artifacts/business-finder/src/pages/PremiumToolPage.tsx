import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  Save,
  Sparkles,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AccessState = "checking" | "granted" | "denied";

interface ModuleTemplate {
  title: string;
  subtitle: string;
  kpis: { label: string; value: string; helper: string }[];
  pipeline: string[];
  tasks: string[];
  fields: { label: string; placeholder: string }[];
  outputTitle: string;
}

const WORKSPACE_LABELS: Record<string, string> = {
  "e-commerce": "E-commerce",
  "onlyfans-management": "OnlyFans Management",
  "agence-marketing-smma": "Agence marketing / SMMA",
  "ugc-creator": "UGC Creator",
  "coaching-formation": "Coaching / formation",
  "saas-outil-ia": "SaaS / outil IA",
  "freelance-no-code-ia": "Freelance / no-code / IA",
  "services-locaux": "Services locaux",
  "creation-de-contenu": "Création de contenu",
  "finance-trading-investissement": "Finance / trading / investissement",
  "business-personnalise": "Business personnalisé",
};

const MODULE_LABELS: Record<string, string> = {
  "produits-gagnants": "Produits gagnants",
  "generateur-boutique-ia": "Générateur boutique IA",
  "fiches-produits": "Fiches produits",
  "tracker-marge": "Tracker marge",
  "crm-createurs": "CRM créateurs",
  "scripts-dm": "Scripts DM",
  "calendrier-operations": "Calendrier opérations",
  "tracker-commissions": "Tracker commissions",
  "crm-prospects": "CRM prospects",
  "audit-ia": "Audit IA",
  propositions: "Propositions",
  "calendrier-client": "Calendrier client",
  "portfolio-ugc": "Portfolio UGC",
  "scripts-video": "Scripts vidéo",
  "tracker-marques": "Tracker marques",
  tarifs: "Tarifs",
  "programme-ia": "Programme IA",
  "crm-clients": "CRM clients",
  "scripts-d-appel": "Scripts d'appel",
  "plan-contenu": "Plan contenu",
  roadmap: "Roadmap",
  "validation-marche": "Validation marché",
  "landing-page": "Landing page",
  "feedback-utilisateurs": "Feedback utilisateurs",
  "offres-packagees": "Offres packagées",
  devis: "Devis",
  "pipeline-clients": "Pipeline clients",
  "suivi-projets": "Suivi projets",
  "mini-site-local": "Mini-site local",
  "google-business": "Google Business",
  "flyers-scripts": "Flyers/scripts",
  reservations: "Réservations",
  "idees-virales": "Idées virales",
  scripts: "Scripts",
  calendrier: "Calendrier",
  "tracker-vues-revenus": "Tracker vues/revenus",
  journal: "Journal",
  "checklist-risque": "Checklist risque",
  performance: "Performance",
  formation: "Formation",
  crm: "CRM",
  offre: "Offre",
  acquisition: "Acquisition",
  progression: "Progression",
};

function parsePath() {
  const [, , workspace = "business-personnalise", module = "progression"] =
    window.location.pathname.split("/");
  return { workspace, module };
}

function getTemplate(workspace: string, moduleLabel: string, business: string): ModuleTemplate {
  const lowerModule = moduleLabel.toLowerCase();
  const lowerWorkspace = workspace.toLowerCase();

  const base: ModuleTemplate = {
    title: moduleLabel,
    subtitle: `Module Premium pour piloter ${business || lowerWorkspace}.`,
    kpis: [
      { label: "Actions", value: "5", helper: "à faire cette semaine" },
      { label: "Objectif", value: "1", helper: "résultat prioritaire" },
      { label: "Pipeline", value: "12", helper: "éléments à suivre" },
      { label: "Revenus cible", value: "1k", helper: "CHF/mois" },
    ],
    pipeline: ["À créer", "En cours", "À relancer", "Terminé"],
    tasks: [
      "Définir l'objectif précis du module",
      "Ajouter 5 éléments dans le pipeline",
      "Générer un premier livrable avec l'IA",
      "Mettre à jour les notes après exécution",
    ],
    fields: [
      { label: "Contexte", placeholder: "Décris ta cible, ton offre, ton produit ou ton problème..." },
      { label: "Objectif", placeholder: "Ex: obtenir 3 prospects, créer une offre, générer une fiche..." },
    ],
    outputTitle: "Livrable généré",
  };

  if (lowerModule.includes("crm") || lowerModule.includes("pipeline") || lowerModule.includes("tracker")) {
    return {
      ...base,
      title: `${moduleLabel} opérationnel`,
      subtitle: "Suivez vos prospects, clients, créateurs, marques ou projets sans quitter Befind.",
      kpis: [
        { label: "Nouveaux", value: "10", helper: "à ajouter" },
        { label: "À relancer", value: "5", helper: "priorité" },
        { label: "Chauds", value: "3", helper: "proches conversion" },
        { label: "Signés", value: "1", helper: "objectif semaine" },
      ],
      pipeline: ["Nouveau", "Contacté", "Répondu", "Converti"],
      fields: [
        { label: "Nom / cible", placeholder: "Ex: marque, créateur, commerce local, prospect..." },
        { label: "Note de suivi", placeholder: "Besoin, objection, prochaine relance, potentiel..." },
      ],
      outputTitle: "Plan de relance",
    };
  }

  if (
    lowerModule.includes("script") ||
    lowerModule.includes("contenu") ||
    lowerModule.includes("fiches") ||
    lowerModule.includes("landing") ||
    lowerModule.includes("flyers")
  ) {
    return {
      ...base,
      title: `Générateur ${moduleLabel}`,
      subtitle: "Créez rapidement des contenus, pages, scripts, fiches ou messages prêts à utiliser.",
      kpis: [
        { label: "Variantes", value: "5", helper: "à générer" },
        { label: "Hooks", value: "10", helper: "à tester" },
        { label: "Canaux", value: "3", helper: "TikTok/email/site" },
        { label: "Version finale", value: "1", helper: "à publier" },
      ],
      pipeline: ["Idée", "Brouillon", "À améliorer", "Publié"],
      fields: [
        { label: "Sujet", placeholder: "Produit, service, niche ou message à créer..." },
        { label: "Ton souhaité", placeholder: "Direct, premium, drôle, expert, local, urgent..." },
      ],
      outputTitle: "Contenu prêt à utiliser",
    };
  }

  if (
    lowerModule.includes("produits") ||
    lowerModule.includes("boutique") ||
    lowerModule.includes("marge")
  ) {
    return {
      ...base,
      title: `Dashboard ${moduleLabel}`,
      subtitle: "Analysez opportunités, coûts, marges, positionnement et prochaines actions e-commerce.",
      kpis: [
        { label: "Produits", value: "12", helper: "à analyser" },
        { label: "Marge cible", value: "60%+", helper: "avant pub" },
        { label: "Prix test", value: "29-79", helper: "CHF" },
        { label: "Score tendance", value: "8/10", helper: "attractif" },
      ],
      pipeline: ["Idée", "Sourcé", "En test", "Gagnant"],
      fields: [
        { label: "Produit / niche", placeholder: "Ex: accessoires fitness, animaux, beauté..." },
        { label: "Contraintes", placeholder: "Budget pub, marge cible, pays, délai fournisseur..." },
      ],
      outputTitle: "Analyse e-commerce",
    };
  }

  if (lowerModule.includes("roadmap") || lowerModule.includes("validation") || lowerModule.includes("feedback")) {
    return {
      ...base,
      title: `Pilotage ${moduleLabel}`,
      subtitle: "Organisez MVP, validation marché, feedbacks et priorités produit.",
      kpis: [
        { label: "Interviews", value: "5", helper: "à faire" },
        { label: "Features", value: "3", helper: "MVP" },
        { label: "Feedbacks", value: "10", helper: "à classer" },
        { label: "Préventes", value: "1", helper: "signal fort" },
      ],
      pipeline: ["Problème", "Validé", "À construire", "Lancé"],
      fields: [
        { label: "Problème client", placeholder: "Quel problème exact veux-tu résoudre ?" },
        { label: "Hypothèse", placeholder: "Quelle solution ou feature veux-tu valider ?" },
      ],
      outputTitle: "Priorités produit",
    };
  }

  if (lowerModule.includes("risque") || lowerModule.includes("journal") || lowerModule.includes("performance")) {
    return {
      ...base,
      title: `Suivi ${moduleLabel}`,
      subtitle: "Journalisez décisions, discipline, erreurs et progression sans promesse de gain.",
      kpis: [
        { label: "Journal", value: "100%", helper: "objectif rempli" },
        { label: "Risque max", value: "1%", helper: "par décision" },
        { label: "Erreurs", value: "3", helper: "à réduire" },
        { label: "Leçons", value: "2", helper: "à revoir" },
      ],
      pipeline: ["Idée", "Checklist", "Décision", "Review"],
      fields: [
        { label: "Décision / hypothèse", placeholder: "Décris la décision ou situation à analyser..." },
        { label: "Risque et règles", placeholder: "Quel risque maximum ? Quelle règle ne pas dépasser ?" },
      ],
      outputTitle: "Analyse disciplinée",
    };
  }

  return base;
}

export default function PremiumToolPage() {
  const [, setLocation] = useLocation();
  const { workspace, module } = parsePath();
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") ?? "";
  const business = params.get("business") ?? WORKSPACE_LABELS[workspace] ?? "votre business";
  const workspaceLabel = WORKSPACE_LABELS[workspace] ?? "Business personnalisé";
  const moduleLabel = MODULE_LABELS[module] ?? module.replace(/-/g, " ");
  const template = useMemo(() => getTemplate(workspaceLabel, moduleLabel, business), [workspaceLabel, moduleLabel, business]);
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generatedOutput, setGeneratedOutput] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [generateStatus, setGenerateStatus] = useState<"idle" | "generating" | "error">("idle");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    const token = window.localStorage.getItem("befind_auth_token");
    if (!email || !token) {
      setAccessState("denied");
      return;
    }

    fetch(`/api/premium-tools/${encodeURIComponent(workspace)}/${encodeURIComponent(module)}?business=${encodeURIComponent(business)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.error) {
          setAccessState("denied");
          return;
        }

        if (data?.state) {
          setFieldValues((data.state.fieldValues ?? {}) as Record<string, string>);
          setGeneratedOutput(data.state.generatedOutput ?? "");
          setSavedNote(data.state.savedNote ?? "");
          setCompletedTasks(Array.isArray(data.state.completedTasks) ? data.state.completedTasks : []);
        }
        setAccessState("granted");
      })
      .catch(() => {
        if (!cancelled) setAccessState("denied");
      });

    return () => {
      cancelled = true;
    };
  }, [email, workspace, module, business]);

  const toggleTask = (idx: number) => {
    setCompletedTasks((current) =>
      current.includes(idx) ? current.filter((item) => item !== idx) : [...current, idx],
    );
    setSaveStatus("idle");
  };

  const saveToolState = async () => {
    const token = window.localStorage.getItem("befind_auth_token");
    if (!token) {
      setAccessState("denied");
      return;
    }

    setSaveStatus("saving");
    try {
      const response = await fetch(
        `/api/premium-tools/${encodeURIComponent(workspace)}/${encodeURIComponent(module)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessName: business,
            fieldValues,
            generatedOutput,
            savedNote,
            completedTasks,
          }),
        },
      );

      if (!response.ok) throw new Error("save failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  const generatePremiumOutput = async () => {
    const token = window.localStorage.getItem("befind_auth_token");
    if (!token) {
      setAccessState("denied");
      return;
    }

    setGenerateStatus("generating");
    try {
      const response = await fetch(
        `/api/premium-tools/${encodeURIComponent(workspace)}/${encodeURIComponent(module)}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessName: business,
            workspaceLabel,
            moduleTitle: template.title,
            fieldValues,
          }),
        },
      );

      const data = (await response.json()) as { output?: string; error?: string };
      if (!response.ok || !data.output) throw new Error(data.error ?? "generation failed");

      setGeneratedOutput(data.output);
      setGenerateStatus("idle");
      setSaveStatus("idle");
    } catch {
      setGenerateStatus("error");
    }
  };

  if (accessState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-3 text-stone-600">Vérification Premium...</p>
        </div>
      </div>
    );
  }

  if (accessState === "denied") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <Card className="max-w-md p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-indigo-600" />
          <h1 className="font-serif mt-4 text-3xl font-black">Premium requis</h1>
          <p className="mt-2 text-stone-600">
            Ce module fait partie des outils Befind Premium. Connectez-vous avec un abonnement Premium actif.
          </p>
          <Button className="mt-6 w-full" onClick={() => setLocation("/pricing")}>
            Voir les abonnements
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between p-6">
        <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
          Premium
        </span>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-8 px-6 pb-20">
        <section className="rounded-3xl bg-gradient-to-br from-indigo-600 to-stone-950 p-8 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" /> {workspaceLabel}
          </span>
          <h1 className="font-serif mt-4 text-4xl font-black md:text-5xl">{template.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{template.subtitle}</p>
        </section>

        <div className="grid gap-4 md:grid-cols-4">
          {template.kpis.map((kpi) => (
            <Card key={kpi.label} className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-stone-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-black">{kpi.value}</p>
              <p className="mt-1 text-sm text-stone-500">{kpi.helper}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              <h2 className="font-serif text-2xl font-bold">Pipeline du module</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {template.pipeline.map((step, idx) => (
                <div key={step} className="rounded-2xl border bg-stone-50 p-4">
                  <p className="text-sm font-bold">{step}</p>
                  <p className="mt-2 text-2xl font-black text-indigo-600">{idx === 0 ? "4" : idx === 1 ? "2" : "1"}</p>
                  <p className="mt-1 text-xs text-stone-500">éléments</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
              <h2 className="font-serif text-2xl font-bold">Actions à faire</h2>
            </div>
            <div className="space-y-3">
              {template.tasks.map((task) => (
                <label key={task} className="flex gap-3 rounded-xl border bg-white p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={completedTasks.includes(template.tasks.indexOf(task))}
                    onChange={() => toggleTask(template.tasks.indexOf(task))}
                  />
                  <span>{task}</span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h2 className="font-serif text-2xl font-bold">Générateur du module</h2>
            </div>
            <div className="space-y-4">
              {template.fields.map((field) => (
                <div key={field.label} className="space-y-2">
                  <label className="text-sm font-semibold">{field.label}</label>
                  <Input
                    value={fieldValues[field.label] ?? ""}
                    onChange={(event) => {
                      setFieldValues((current) => ({ ...current, [field.label]: event.target.value }));
                      setSaveStatus("idle");
                    }}
                    placeholder={field.placeholder}
                    className="h-12"
                  />
                </div>
              ))}
              <Button
                className="w-full"
                disabled={generateStatus === "generating"}
                onClick={() => void generatePremiumOutput()}
              >
                {generateStatus === "generating" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Générer avec l'IA
              </Button>
              {generateStatus === "error" && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  Impossible de générer ce livrable pour le moment. Réessayez.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              <h2 className="font-serif text-2xl font-bold">{template.outputTitle}</h2>
            </div>
            <pre className="min-h-48 whitespace-pre-wrap rounded-2xl border bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">
              {generatedOutput || "Remplissez les champs puis cliquez sur générer pour créer un premier livrable."}
            </pre>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <Save className="h-5 w-5 text-indigo-600" />
            <h2 className="font-serif text-2xl font-bold">Notes de travail</h2>
          </div>
          <textarea
            value={savedNote}
            onChange={(event) => {
              setSavedNote(event.target.value);
              setSaveStatus("idle");
            }}
            placeholder="Notez ici vos idées, retours clients, prochaines relances ou résultats..."
            className="min-h-36 w-full rounded-2xl border border-stone-300 bg-white p-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-stone-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Vos notes, tâches, champs et livrables sont sauvegardés sur votre compte.
            </p>
            <Button onClick={() => void saveToolState()} disabled={saveStatus === "saving"}>
              {saveStatus === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
          </div>
          {saveStatus === "saved" && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Module sauvegardé avec succès.
            </p>
          )}
          {saveStatus === "error" && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              Impossible de sauvegarder pour le moment. Réessayez.
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}
