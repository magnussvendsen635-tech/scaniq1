// Languages we have full translations for. Add more here only after adding
// a complete dictionary entry in src/i18n/translations.ts.
export interface Language {
  code: string;
  name: string; // English name
  native: string; // Native name
  flag: string; // emoji
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "da", name: "Danish", native: "Dansk", flag: "🇩🇰" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
];
