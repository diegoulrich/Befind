import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Megaphone,
  MessageSquareText,
  Rocket,
  Search,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";

interface BusinessWorkspaceProps {
  businessName: string;
  businessDescription: string;
}

interface WorkspaceTool {
  title: string;
  description: string;
  cadence: string;
  retention: string;
}

interface WorkspaceConfig {
  label: string;
  description: string;
  tools: WorkspaceTool[];
  weeklyChecklist: string[];
  prompts: string[];
}

const BASE_TOOLS: WorkspaceTool[] = [
  {
    title: "Plan d'exécution hebdomadaire",
    description: "Découpe le plan d'action en tâches concrètes à faire cette semaine.",
    cadence: "Chaque lundi",
    retention: "L'utilisateur revient pour savoir quoi faire maintenant.",
  },
  {
    title: "Tracker revenus & objectifs",
    description: "Suit les objectifs, les revenus, les actions faites et les prochaines priorités.",
    cadence: "Chaque semaine",
    retention: "Befind devient le tableau de bord du business.",
  },
  {
    title: "Agent IA spécialisé",
    description: "Répond aux questions du business recommandé avec le contexte du profil.",
    cadence: "À la demande",
    retention: "L'utilisateur garde l'abonnement pour être accompagné pendant l'exécution.",
  },
];

const WORKSPACES: WorkspaceConfig[] = [
  {
    label: "E-commerce",
    description: "Workspace pour trouver des produits gagnants, lancer une boutique et optimiser les marges.",
    tools: [
      {
        title: "Produits gagnants du moment",
        description: "Liste Premium de niches, produits, prix, fournisseurs et marges à surveiller.",
        cadence: "Chaque semaine",
        retention: "Les tendances changent : il faut revenir pour trouver les prochains produits.",
      },
      {
        title: "Générateur de boutique IA",
        description: "Création de marque, catalogue, couleurs, slogan et fiches produits.",
        cadence: "À chaque nouvelle niche",
        retention: "La boutique et les produits restent dans Befind.",
      },
      {
        title: "Angles publicitaires TikTok/Meta",
        description: "Génère hooks, scripts UGC, titres, objections et offres promotionnelles.",
        cadence: "2 à 3 fois par semaine",
        retention: "L'utilisateur garde Befind pour produire ses pubs en continu.",
      },
      {
        title: "Tracker marge & fournisseur",
        description: "Compare prix de vente, coût produit, coût pub estimé et marge nette.",
        cadence: "À chaque produit testé",
        retention: "Le business dépend du suivi des marges.",
      },
    ],
    weeklyChecklist: [
      "Analyser 3 nouveaux produits gagnants",
      "Créer 5 angles de pub différents",
      "Tester 1 nouvelle fiche produit",
      "Suivre marge, coût fournisseur et coût pub estimé",
    ],
    prompts: [
      "Trouve-moi 10 angles TikTok pour ce produit avec promesse, douleur et preuve.",
      "Compare ces 3 produits et dis-moi lequel tester en premier avec un budget réduit.",
    ],
  },
  {
    label: "OnlyFans Management",
    description: "Workspace pour recruter des créateurs, suivre le pipeline et structurer l'agence.",
    tools: [
      {
        title: "CRM créateurs",
        description: "Pipeline : prospecté, répondu, appel prévu, signé, actif.",
        cadence: "Chaque jour",
        retention: "La prospection et le suivi créateur se font en continu.",
      },
      {
        title: "Scripts DM & email",
        description: "Messages personnalisés pour recruter des créateurs sans spam ni promesses douteuses.",
        cadence: "Chaque campagne",
        retention: "L'utilisateur revient pour générer des messages adaptés.",
      },
      {
        title: "Calendrier contenu & opérations",
        description: "Planifie contenus, promotions, relances et routines de gestion.",
        cadence: "Chaque semaine",
        retention: "Befind devient l'espace opérationnel de l'agence.",
      },
      {
        title: "Tracker commissions",
        description: "Suit revenus créateurs, commissions, objectifs et tâches par compte.",
        cadence: "Chaque semaine",
        retention: "Le suivi financier justifie l'abonnement.",
      },
    ],
    weeklyChecklist: [
      "Ajouter 30 nouveaux créateurs qualifiés au CRM",
      "Envoyer 20 messages personnalisés",
      "Préparer 1 proposition d'offre claire",
      "Suivre réponses, appels et signatures",
    ],
    prompts: [
      "Écris un DM éthique pour proposer mes services à une créatrice débutante.",
      "Crée une checklist de contrat et limites opérationnelles pour une agence de management.",
    ],
  },
  {
    label: "Agence marketing / SMMA",
    description: "Workspace pour prospecter, auditer et gérer des clients marketing.",
    tools: [
      {
        title: "CRM prospects locaux",
        description: "Pipeline de commerces à contacter, statut, besoin et prochaine relance.",
        cadence: "Chaque jour",
        retention: "La vente se fait sur la durée avec relances.",
      },
      {
        title: "Audit IA Instagram/TikTok/site",
        description: "Génère un audit rapide et une opportunité claire à envoyer au prospect.",
        cadence: "Pour chaque prospect",
        retention: "Chaque nouveau prospect nécessite un audit.",
      },
      {
        title: "Proposition commerciale",
        description: "Structure offre, livrables, prix, garanties raisonnables et prochaines étapes.",
        cadence: "Chaque lead chaud",
        retention: "Befind aide à transformer les prospects en clients.",
      },
      {
        title: "Calendrier contenu client",
        description: "Planifie posts, scripts vidéos, campagnes et KPI client.",
        cadence: "Chaque semaine",
        retention: "Les clients demandent du contenu en continu.",
      },
    ],
    weeklyChecklist: [
      "Identifier 25 prospects dans une niche locale",
      "Envoyer 15 messages personnalisés",
      "Créer 3 mini-audits gratuits",
      "Relancer tous les prospects en attente",
    ],
    prompts: [
      "Fais un audit rapide de ce restaurant pour lui vendre une offre TikTok locale.",
      "Crée une proposition à 1 000 €/mois pour gérer les réseaux d'un salon de beauté.",
    ],
  },
  {
    label: "UGC Creator",
    description: "Workspace pour trouver des marques, créer des scripts et suivre les collaborations.",
    tools: [
      {
        title: "Portfolio UGC IA",
        description: "Structure les vidéos exemples, offres, tarifs et preuves sociales.",
        cadence: "À chaque nouveau contenu",
        retention: "Le portfolio évolue avec l'expérience.",
      },
      {
        title: "Scripts vidéo UGC",
        description: "Hooks, storytelling, démonstration produit, CTA et variations courtes.",
        cadence: "Chaque collaboration",
        retention: "Les scripts sont nécessaires à chaque tournage.",
      },
      {
        title: "Tracker marques",
        description: "Suit marques contactées, réponses, briefs, dates de livraison et paiements.",
        cadence: "Chaque jour",
        retention: "Le pipeline de collaborations doit rester actif.",
      },
      {
        title: "Calculateur de tarifs",
        description: "Aide à fixer prix par vidéo, pack, usage ads et droits d'utilisation.",
        cadence: "Chaque devis",
        retention: "L'utilisateur revient avant chaque négociation.",
      },
    ],
    weeklyChecklist: [
      "Créer 2 vidéos portfolio",
      "Contacter 20 marques ciblées",
      "Préparer 5 scripts UGC",
      "Mettre à jour tarifs et pipeline",
    ],
    prompts: [
      "Écris 5 scripts UGC pour une marque skincare avec hook fort en 3 secondes.",
      "Aide-moi à fixer mes tarifs pour un pack de 3 vidéos avec usage publicitaire.",
    ],
  },
  {
    label: "Coaching / formation",
    description: "Workspace pour construire une offre, trouver des clients et suivre les accompagnements.",
    tools: [
      {
        title: "Programme coaching IA",
        description: "Structure modules, séances, exercices, livrables et progression client.",
        cadence: "À chaque offre",
        retention: "L'offre se complète avec les retours clients.",
      },
      {
        title: "CRM prospects & clients",
        description: "Suit appels découverte, objections, paiements et progression client.",
        cadence: "Chaque semaine",
        retention: "Befind devient le suivi commercial et client.",
      },
      {
        title: "Scripts d'appel découverte",
        description: "Questions, diagnostic, reformulation, offre et closing éthique.",
        cadence: "Avant chaque appel",
        retention: "L'utilisateur revient pour préparer ses ventes.",
      },
      {
        title: "Plan contenu expert",
        description: "Idées TikTok/LinkedIn, posts éducatifs, stories et CTA.",
        cadence: "Chaque semaine",
        retention: "Le contenu nourrit l'acquisition en continu.",
      },
    ],
    weeklyChecklist: [
      "Publier 3 contenus experts",
      "Proposer 5 appels découverte",
      "Améliorer 1 module de l'offre",
      "Suivre progression et résultats clients",
    ],
    prompts: [
      "Crée un programme de coaching en 6 semaines pour cette cible.",
      "Écris un script d'appel découverte pour vendre une offre à 500 €.",
    ],
  },
  {
    label: "SaaS / outil IA",
    description: "Workspace pour valider l'idée, construire la roadmap et suivre les utilisateurs.",
    tools: [
      {
        title: "Roadmap produit",
        description: "Backlog, MVP, features prioritaires, bugs et prochaines itérations.",
        cadence: "Chaque semaine",
        retention: "Le produit évolue en continu dans Befind.",
      },
      {
        title: "Validation marché",
        description: "Questions d'interview, personas, concurrents et signaux d'achat.",
        cadence: "Avant chaque feature",
        retention: "Chaque décision produit demande validation.",
      },
      {
        title: "Landing page IA",
        description: "Promesse, bénéfices, pricing, FAQ et emails d'attente.",
        cadence: "À chaque repositionnement",
        retention: "L'acquisition se travaille en continu.",
      },
      {
        title: "Feedback utilisateurs",
        description: "Centralise retours, demandes, objections et priorités.",
        cadence: "Chaque semaine",
        retention: "Befind devient le cockpit produit.",
      },
    ],
    weeklyChecklist: [
      "Interviewer 5 utilisateurs potentiels",
      "Prioriser 3 features MVP",
      "Améliorer la landing page",
      "Analyser feedbacks et objections",
    ],
    prompts: [
      "Transforme cette idée SaaS en MVP avec 5 fonctionnalités essentielles.",
      "Écris 10 questions d'interview pour valider ce problème client.",
    ],
  },
  {
    label: "Freelance / no-code / IA",
    description: "Workspace pour packager l'offre, prospecter et gérer les projets clients.",
    tools: [
      {
        title: "Offres packagées",
        description: "Crée packs clairs avec livrables, prix, délai et résultat attendu.",
        cadence: "À chaque niche",
        retention: "L'offre se raffine avec le marché.",
      },
      {
        title: "Devis & contrats",
        description: "Génère structures de devis, périmètre, conditions et étapes projet.",
        cadence: "Chaque prospect chaud",
        retention: "Chaque vente nécessite un document.",
      },
      {
        title: "Pipeline clients",
        description: "Suit prospects, appels, devis envoyés, signés et projets actifs.",
        cadence: "Chaque semaine",
        retention: "Le business dépend du pipeline.",
      },
      {
        title: "Suivi projets",
        description: "Tâches, deadlines, validations client et prochaines livraisons.",
        cadence: "Chaque jour",
        retention: "Befind devient l'espace projet.",
      },
    ],
    weeklyChecklist: [
      "Contacter 15 prospects ciblés",
      "Créer 1 nouveau cas portfolio",
      "Envoyer 3 propositions",
      "Mettre à jour les projets actifs",
    ],
    prompts: [
      "Crée une offre packagée no-code à 1 500 € pour commerces locaux.",
      "Écris un devis clair pour automatiser le suivi client d'une PME.",
    ],
  },
  {
    label: "Services locaux",
    description: "Workspace pour créer une présence locale, trouver des clients et gérer les réservations.",
    tools: [
      {
        title: "Mini-site local IA",
        description: "Génère page de service, tarifs, FAQ, zones desservies et CTA WhatsApp.",
        cadence: "À chaque service",
        retention: "Le site et les offres restent à mettre à jour.",
      },
      {
        title: "Fiche Google Business",
        description: "Optimise description, catégories, posts, mots-clés et demande d'avis.",
        cadence: "Chaque semaine",
        retention: "La visibilité locale demande entretien.",
      },
      {
        title: "Flyers & scripts WhatsApp",
        description: "Textes de flyers, SMS, WhatsApp et messages de relance clients.",
        cadence: "Chaque campagne",
        retention: "L'acquisition locale se relance régulièrement.",
      },
      {
        title: "Réservations & avis",
        description: "Suit demandes, rendez-vous, prestations, paiements et avis clients.",
        cadence: "Chaque jour",
        retention: "Befind devient le carnet d'activité.",
      },
    ],
    weeklyChecklist: [
      "Distribuer ou envoyer 50 messages locaux",
      "Publier 1 post Google Business",
      "Demander 5 avis clients",
      "Relancer tous les anciens clients",
    ],
    prompts: [
      "Crée une offre locale irrésistible pour un service de nettoyage auto mobile.",
      "Écris un SMS de relance pour récupérer d'anciens clients.",
    ],
  },
  {
    label: "Création de contenu",
    description: "Workspace pour produire idées, scripts, titres et suivre les performances.",
    tools: [
      {
        title: "Idées vidéos virales",
        description: "Génère angles, titres, hooks et séries de contenu dans la niche.",
        cadence: "Chaque semaine",
        retention: "Le créateur a besoin d'idées en continu.",
      },
      {
        title: "Scripts & thumbnails",
        description: "Structure intro, déroulé, rétention, CTA et concepts de miniatures.",
        cadence: "Chaque vidéo",
        retention: "Chaque publication passe par Befind.",
      },
      {
        title: "Calendrier publication",
        description: "Planifie vidéos, shorts, posts, réutilisation et dates de sortie.",
        cadence: "Chaque semaine",
        retention: "La régularité garde l'utilisateur actif.",
      },
      {
        title: "Tracker vues & revenus",
        description: "Suit vues, CTR, rétention, abonnés, revenus et contenus gagnants.",
        cadence: "Chaque semaine",
        retention: "Le suivi performance crée une habitude.",
      },
    ],
    weeklyChecklist: [
      "Générer 20 idées de contenu",
      "Écrire 3 scripts complets",
      "Publier selon le calendrier",
      "Analyser les 3 meilleurs contenus",
    ],
    prompts: [
      "Donne-moi 20 idées de vidéos faceless dans cette niche avec titres accrocheurs.",
      "Transforme cette idée en script YouTube de 8 minutes avec forte rétention.",
    ],
  },
  {
    label: "Finance / trading / investissement",
    description: "Workspace prudent pour journaliser, suivre la discipline et éviter les décisions impulsives.",
    tools: [
      {
        title: "Journal de décisions",
        description: "Note hypothèse, risque, montant, émotion, résultat et apprentissage.",
        cadence: "À chaque décision",
        retention: "La discipline se travaille tous les jours.",
      },
      {
        title: "Checklist risque",
        description: "Rappelle limites, scénario d'invalidation et règles personnelles.",
        cadence: "Avant chaque action",
        retention: "Befind sert de garde-fou.",
      },
      {
        title: "Dashboard performance",
        description: "Suit objectifs, pertes, gains, erreurs fréquentes et progression.",
        cadence: "Chaque semaine",
        retention: "L'utilisateur revient pour analyser ses résultats.",
      },
      {
        title: "Plan de formation",
        description: "Organise notions à apprendre, exercices, lectures et tests.",
        cadence: "Chaque semaine",
        retention: "Le progrès demande accompagnement continu.",
      },
    ],
    weeklyChecklist: [
      "Remplir le journal après chaque décision",
      "Respecter la checklist de risque",
      "Analyser les erreurs de la semaine",
      "Étudier une notion avant d'augmenter l'exposition",
    ],
    prompts: [
      "Crée une checklist de discipline avant une décision d'investissement risquée.",
      "Analyse ce journal de trading et identifie mes erreurs récurrentes.",
    ],
  },
];

const GENERIC_WORKSPACE: WorkspaceConfig = {
  label: "Business personnalisé",
  description: "Workspace adaptable pour transformer la recommandation en activité suivie chaque semaine.",
  tools: [
    {
      title: "CRM prospects",
      description: "Suit qui contacter, statut, prochaines relances et conversions.",
      cadence: "Chaque jour",
      retention: "Tout business a besoin d'un pipeline vivant.",
    },
    {
      title: "Générateur d'offres",
      description: "Transforme l'idée en offres simples, prix, livrables et promesses raisonnables.",
      cadence: "Chaque nouvelle cible",
      retention: "L'offre évolue avec le marché.",
    },
    {
      title: "Calendrier acquisition",
      description: "Planifie contenu, prospection, partenariats et relances.",
      cadence: "Chaque semaine",
      retention: "L'acquisition doit être régulière.",
    },
    {
      title: "Dashboard progression",
      description: "Suit actions, revenus, prospects, obstacles et prochaines priorités.",
      cadence: "Chaque semaine",
      retention: "Befind devient le cockpit du business.",
    },
  ],
  weeklyChecklist: [
    "Définir 1 cible prioritaire",
    "Contacter 10 prospects ou partenaires",
    "Créer 1 contenu ou support de vente",
    "Suivre revenus, retours et prochaines actions",
  ],
  prompts: [
    "Transforme ce business en offre claire avec cible, prix et livrables.",
    "Crée-moi un plan d'acquisition sur 7 jours pour obtenir mes premiers clients.",
  ],
};

const WORKSPACE_KEYWORDS: Record<string, string[]> = {
  "E-commerce": [
    "e-commerce",
    "ecommerce",
    "dropshipping",
    "shopify",
    "amazon fba",
    "etsy",
    "print-on-demand",
    "boutique",
    "produit",
  ],
  "OnlyFans Management": ["onlyfans", "only fans", "onlyfan", "management createur", "management créateur"],
  "Agence marketing / SMMA": ["smma", "agence", "marketing", "tiktok agency", "seo", "ads", "social media"],
  "UGC Creator": ["ugc", "creator", "créateur ugc", "createur ugc"],
  "Coaching / formation": ["coaching", "coach", "formation", "course", "tutor", "mentorat"],
  "SaaS / outil IA": ["saas", "outil ia", "ai tool", "application", "software", "logiciel"],
  "Freelance / no-code / IA": ["freelance", "no-code", "nocode", "automatisation", "web development", "développeur"],
  "Services locaux": ["local", "nettoyage", "airbnb", "jardinage", "photographie", "detailing", "service"],
  "Création de contenu": ["youtube", "faceless", "podcast", "newsletter", "contenu", "content"],
  "Finance / trading / investissement": ["trading", "finance", "investissement", "crypto", "bourse"],
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getWorkspaceConfig(businessName: string, businessDescription: string): WorkspaceConfig {
  const haystack = normalize(`${businessName} ${businessDescription}`);
  const match = WORKSPACES.find((workspace) =>
    (WORKSPACE_KEYWORDS[workspace.label] ?? []).some((keyword) => haystack.includes(normalize(keyword))),
  );

  return match ?? GENERIC_WORKSPACE;
}

export default function BusinessWorkspace({ businessName, businessDescription }: BusinessWorkspaceProps) {
  const workspace = getWorkspaceConfig(businessName, businessDescription);
  const tools = [...workspace.tools, ...BASE_TOOLS];

  return (
    <section className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-700">
          <Briefcase className="h-3.5 w-3.5" /> Workspace Befind
        </span>
        <h4 className="font-serif mt-3 text-2xl font-black">{workspace.label}</h4>
        <p className="mt-1 text-sm text-stone-600">{workspace.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.title} className="p-5">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {getToolIcon(tool.title)}
              </div>
              <div>
                <h5 className="font-bold">{tool.title}</h5>
                <p className="mt-1 text-sm text-stone-600">{tool.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
                    {tool.cadence}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                    Rétention : {tool.retention}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-indigo-600" />
            <h5 className="font-bold">Checklist hebdomadaire</h5>
          </div>
          <div className="space-y-3">
            {workspace.weeklyChecklist.map((item, idx) => (
              <label key={item} className="flex items-start gap-3 rounded-xl border bg-white p-3 text-sm">
                <input type="checkbox" className="mt-1" />
                <span>
                  <span className="font-bold text-indigo-600">Semaine {idx + 1 <= 1 ? "en cours" : ""}</span>{" "}
                  {item}
                </span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-indigo-600" />
            <h5 className="font-bold">Prompts à demander à l'agent IA</h5>
          </div>
          <div className="space-y-3">
            {workspace.prompts.map((prompt) => (
              <div key={prompt} className="rounded-xl border bg-stone-50 p-3 text-sm text-stone-700">
                "{prompt}"
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function getToolIcon(title: string) {
  const normalizedTitle = normalize(title);
  if (normalizedTitle.includes("crm") || normalizedTitle.includes("prospect")) return <Users className="h-5 w-5" />;
  if (normalizedTitle.includes("contenu") || normalizedTitle.includes("script")) return <FileText className="h-5 w-5" />;
  if (normalizedTitle.includes("tracker") || normalizedTitle.includes("dashboard")) return <BarChart3 className="h-5 w-5" />;
  if (normalizedTitle.includes("calendrier") || normalizedTitle.includes("roadmap")) return <CalendarDays className="h-5 w-5" />;
  if (normalizedTitle.includes("audit") || normalizedTitle.includes("validation")) return <Search className="h-5 w-5" />;
  if (normalizedTitle.includes("offre") || normalizedTitle.includes("proposition")) return <Target className="h-5 w-5" />;
  if (normalizedTitle.includes("pub") || normalizedTitle.includes("acquisition")) return <Megaphone className="h-5 w-5" />;
  return <Rocket className="h-5 w-5" />;
}
