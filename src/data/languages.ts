// Languages we have full translations for. Add more here only after adding
// a complete dictionary entry in src/i18n/translations.ts.
export interface Language {
  code: string;
  name: string; // English name
  native: string; // Native name
  flag: string; // emoji
}

// Ordered by approximate number of native + secondary speakers worldwide
// (most popular first, least popular last).
export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "zh", name: "Mandarin Chinese", native: "中文", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇧🇩" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
];
