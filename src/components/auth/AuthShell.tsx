import { type ReactNode } from "react";
import LanguageToggle from "../ui/LanguageToggle";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "../../store/theme";
import { Moon, Sun, Shield } from "lucide-react";

export default function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const logoSrc = mode === "dark" ? "/logo_dark.svg" : "/logo_light.svg";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100 dark:bg-neutral-950">
      {/* Brand panel */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 relative overflow-hidden flex items-center justify-center p-8 lg:p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
          <div className="absolute bottom-0 -left-20 w-96 h-96 rounded-full bg-accent-400" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center p-1.5 ring-1 ring-white/20 shadow-sm overflow-hidden">
              <img src={logoSrc} alt="Selam Security" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-2xl font-bold">{t("app.name")}</p>
              <p className="text-sm text-white/70">{t("app.tagline")}</p>
            </div>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
            {t("auth.headline")}
          </h1>
          <p className="text-white/80 leading-relaxed">
            {t("auth.description")}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-white/70 text-sm font-medium">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-white" /> {t("auth.audit")}</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-white" /> {t("auth.qrVerify")}</div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex justify-end mb-6 gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              aria-label={t("theme.toggle")}
              title={t("theme.toggle")}
            >
              {mode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <LanguageToggle />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
