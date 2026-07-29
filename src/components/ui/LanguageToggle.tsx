import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { useAuthStore } from "../../store/auth";
import type { Language } from "../../types";

export default function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setLanguage = useAuthStore((s) => s.setLanguage);

  const current = (i18n.language as Language) || "en";

  const switchTo = (lang: Language) => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    if (user) setLanguage(lang);
  };

  return (
    <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-neutral-200 dark:border-neutral-700">
      <Globe className="w-4 h-4 text-neutral-500 dark:text-neutral-400 ml-2 mr-1" />
      {(["en", "am"] as const).map((lang) => (
        <button
          key={lang}
          onClick={() => switchTo(lang)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            current === lang
              ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-300 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
          }`}
          aria-label={t(`language.${lang}`)}
        >
          {compact ? lang.toUpperCase() : t(`language.${lang}`)}
        </button>
      ))}
    </div>
  );
}
