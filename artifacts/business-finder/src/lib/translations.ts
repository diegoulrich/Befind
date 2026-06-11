export type Language = "fr" | "en" | "es" | "de" | "pt" | "it";

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

interface Translation {
  appTitle: string;
  history: string;
  pricing: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  nameLabel: string;
  namePlaceholder: string;
  startButton: string;
  questionLabel: (current: number, total: number) => string;
  analysing: string;
  generatingMsg: string;
  recommendation: string;
  conceptTitle: string;
  whyFitsTitle: string;
  actionPlanTitle: string;
  restartButton: string;
  historyButton: string;
  historyTitle: string;
  historySubtitle: string;
  noResults: string;
  startTest: string;
  backHome: string;
  anonymous: string;
  errorMsg: string;
  statsUsers: string;
  statsRating: string;
  statsSatisfied: string;
  howItWorksTitle: string;
  howItWorksSteps: { title: string; desc: string }[];
  reviewsTitle: string;
  testimonials: { name: string; role: string; quote: string }[];
  questions: { id: string; question: string; choices: string[] }[];
}

const fr: Translation = {
  appTitle: "befind",
  history: "Historique",
  pricing: "Tarifs",
  heroTitle: "Votre réussite commence",
  heroHighlight: "ici.",
  heroSubtitle:
    "Découvrez le business fait pour vous. Répondez à quelques questions et obtenez une recommandation sur-mesure et un plan d'action concret.",
  nameLabel: "Comment vous appelez-vous ?",
  namePlaceholder: "Votre prénom",
  startButton: "Commencer l'exploration",
  questionLabel: (current, total) => `Question ${current} sur ${total}`,
  analysing: "Analyse de votre profil en cours...",
  generatingMsg: "Génération de la meilleure opportunité...",
  recommendation: "Votre Recommandation",
  conceptTitle: "Le Concept",
  whyFitsTitle: "Pourquoi c'est fait pour vous",
  actionPlanTitle: "Votre Plan d'Action",
  restartButton: "Recommencer",
  historyButton: "Voir l'historique",
  historyTitle: "Historique des recommandations",
  historySubtitle: "Retrouvez toutes les idées de business générées précédemment.",
  noResults: "Aucun résultat pour le moment.",
  startTest: "Faire le test",
  backHome: "Retour à l'accueil",
  anonymous: "Anonyme",
  errorMsg: "Une erreur s'est produite. Réessayez.",
  statsUsers: "2 400+ utilisateurs",
  statsRating: "4.6/5 avis",
  statsSatisfied: "92% satisfaits",
  howItWorksTitle: "Comment ça marche ?",
  howItWorksSteps: [
    { title: "Répondez au quiz", desc: "20 questions rapides pour cerner votre profil, vos forces et vos ambitions." },
    { title: "L'IA analyse votre profil", desc: "Notre intelligence artificielle identifie le business idéal selon vos réponses." },
    { title: "Recevez votre plan d'action", desc: "Une recommandation personnalisée avec des étapes concrètes pour vous lancer." },
  ],
  reviewsTitle: "Avis clients",
  testimonials: [
    {
      name: "Sophie M.",
      role: "Ancienne salariée, maintenant freelance",
      quote: "En 3 minutes, befind m'a recommandé exactement le business que j'avais en tête sans oser me lancer.",
    },
    {
      name: "Karim T.",
      role: "22 ans, lancé dans l'entrepreneuriat",
      quote: "Je ne savais pas par où commencer. Befind m'a orienté vers une activité qui correspond à mes forces.",
    },
    {
      name: "Isabelle R.",
      role: "Maman entrepreneur",
      quote: "Le plan d'action est concret : des étapes réelles que j'ai pu suivre dès le lendemain.",
    },
  ],
  questions: [
    { id: "capital", question: "Quel est votre niveau de capital de départ disponible ?", choices: ["0€", "Moins de 100€", "Entre 100€ et 1 000€", "1 000€ et plus"] },
    { id: "hours", question: "Combien d'heures par semaine pouvez-vous consacrer à votre activité ?", choices: ["Moins de 10h", "10h à 25h", "25h à 40h", "Plus de 40h"] },
    { id: "goal", question: "Quel est votre objectif principal ?", choices: ["Liberté et flexibilité", "Revenu supplémentaire", "Remplacer mon salaire", "Bâtir un empire"] },
    { id: "skills", question: "Comment décririez-vous vos compétences principales ?", choices: ["Créatif et artistique", "Technique et analytique", "Commercial et relationnel", "Organisé et gestionnaire"] },
    { id: "work_type", question: "Quel type de travail vous attire le plus ?", choices: ["Travailler seul", "En équipe", "Avec des clients", "Un mix des deux"] },
    { id: "risk", question: "Quelle est votre tolérance au risque ?", choices: ["Très faible - je veux la sécurité", "Modérée - risque calculé", "Élevée - j'aime l'adrénaline", "Très élevée - tout ou rien"] },
    { id: "experience", question: "Avez-vous de l'expérience en entrepreneuriat ?", choices: ["Aucune", "Quelques tentatives", "Un business actif", "Plusieurs businesses"] },
    { id: "sector", question: "Dans quel secteur souhaitez-vous travailler ?", choices: ["Digital et tech", "Services aux personnes", "Commerce et vente", "Artisanat et création"] },
    { id: "selling_style", question: "Êtes-vous plus à l'aise avec la vente directe ou le contenu ?", choices: ["Vente directe", "Publicité & contenu", "Les deux", "Ni l'un ni l'autre"] },
    { id: "content_comfort", question: "Comment vous sentez-vous à l'idée de créer du contenu régulièrement ?", choices: ["J'adore ça", "Je peux le faire", "Si nécessaire seulement", "Je n'aime pas du tout"] },
    { id: "tech_autonomy", question: "Face à un problème technique, vous...", choices: ["Me débrouille seul(e)", "Cherche des tutos", "Demande de l'aide", "Paye quelqu'un"] },
    { id: "natural_role", question: "Dans un groupe, quel rôle jouez-vous naturellement ?", choices: ["Leader", "Créatif(ve)", "Expert(e) technique", "Médiateur(trice)"] },
    { id: "patience", question: "Combien de temps êtes-vous prêt(e) à attendre avant vos premiers revenus ?", choices: ["Quelques jours", "1 à 3 mois", "3 à 6 mois", "Plus d'un an"] },
    { id: "online_vs_physical", question: "Vous préférez un business qui se passe...", choices: ["100% en ligne", "En personne", "Un mix des deux", "Peu importe"] },
    { id: "social_media", question: "Quelle est votre relation avec les réseaux sociaux ?", choices: ["Très actif(ve)", "Je les utilise", "Je poste rarement", "Je n'aime pas"] },
    { id: "automation_affinity", question: "Que pensez-vous de l'automatisation et des outils IA ?", choices: ["J'adore", "Ça m'intéresse", "Neutre", "Je préfère l'humain"] },
    { id: "revenue_model", question: "Quel modèle de revenus vous attire le plus ?", choices: ["Abonnement", "Vente à la pièce", "Forfait prestation", "Plusieurs sources"] },
    { id: "specific_skill", question: "Avez-vous déjà une compétence précise à monétiser ?", choices: ["Tech", "Créative", "Service", "Pas encore"] },
    { id: "management_style", question: "Seriez-vous à l'aise pour gérer d'autres personnes ?", choices: ["Oui", "Peut-être", "Je préfère être solo", "Non"] },
    { id: "physical_effort", question: "Comment vous situez-vous par rapport au travail physique ?", choices: ["J'adore bouger", "Je l'accepte", "Je préfère le remote", "Je refuse"] },
  ],
};

const en: Translation = {
  ...fr,
  history: "History",
  pricing: "Pricing",
  heroTitle: "Your success starts",
  heroHighlight: "here.",
  heroSubtitle: "Discover the business made for you. Answer a few questions and get a tailored recommendation.",
  nameLabel: "What is your name?",
  namePlaceholder: "Your first name",
  startButton: "Start exploring",
  questionLabel: (current, total) => `Question ${current} of ${total}`,
  analysing: "Analysing your profile...",
  generatingMsg: "Generating the best opportunity...",
  recommendation: "Your Recommendation",
  conceptTitle: "The Concept",
  whyFitsTitle: "Why it fits you",
  actionPlanTitle: "Your Action Plan",
  restartButton: "Start over",
  historyButton: "View history",
  historyTitle: "Recommendation history",
  historySubtitle: "Find all previously generated business ideas.",
  noResults: "No results yet.",
  startTest: "Take the quiz",
  backHome: "Back home",
  anonymous: "Anonymous",
};

export const TRANSLATIONS: Record<Language, Translation> = {
  fr,
  en,
  es: { ...en, history: "Historial", pricing: "Precios", backHome: "Volver al inicio" },
  de: { ...en, history: "Verlauf", pricing: "Preise", backHome: "Zurück zur Startseite" },
  pt: { ...en, history: "Histórico", pricing: "Preços", backHome: "Voltar ao início" },
  it: { ...en, history: "Cronologia", pricing: "Prezzi", backHome: "Torna alla home" },
};
