/**
 * Radar categories for UI. Mirrors runtime/atlas/taxonomy/radar_taxonomy.
 */
export const RADAR_CATEGORIES = [
  { id: "tech_breakthrough", label_zh: "技术突破", label_en: "Tech Breakthrough" },
  { id: "social_phenomenon", label_zh: "社会现象", label_en: "Social Phenomenon" },
  { id: "finance_capital", label_zh: "金融与资本", label_en: "Finance & Capital" },
  { id: "policy_governance", label_zh: "政策与治理", label_en: "Policy & Governance" },
  { id: "safety_incident", label_zh: "安全事故", label_en: "Safety & Incident" },
  { id: "energy_environment", label_zh: "能源/环境", label_en: "Energy & Environment" },
];

export const SOURCES_BY_CATEGORY = {
  tech_breakthrough: ["OpenAI Blog", "Anthropic News", "DeepMind Blog", "Stanford HAI", "HN AI"],
  social_phenomenon: ["Reuters Tech", "FT Tech", "Reddit r/ML", "Mollick Substack"],
  finance_capital: ["Reuters Business", "FT Markets", "WSJ Tech", "TechCrunch"],
  policy_governance: ["Reuters Politics", "FT Policy", "EU Commission", "Brookings"],
  safety_incident: ["OpenAI Blog", "Anthropic News", "Krebs", "AI Safety Institute"],
  energy_environment: ["Reuters Energy", "FT Climate", "Stanford HAI", "IEEE Spectrum"],
};

export const KOLS_BY_CATEGORY = {
  tech_breakthrough: ["Ethan Mollick", "Gary Marcus", "Geoffrey Hinton"],
  social_phenomenon: ["Ethan Mollick", "Kate Crawford", "Meredith Broussard"],
  finance_capital: ["Sam Altman"],
  policy_governance: ["Jan Leike", "Nick Bostrom", "Yoshua Bengio"],
  safety_incident: ["Gary Marcus", "Jan Leike", "Dario Amodei", "Geoffrey Hinton"],
  energy_environment: ["Kate Crawford"],
};
