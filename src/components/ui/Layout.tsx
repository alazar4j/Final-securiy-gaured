import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Smartphone, ScanLine, Shield, LogOut, KeyRound,
  Menu, X, Users, ScrollText, ChevronDown, AlertTriangle, Moon, Sun,
} from "lucide-react";
import { useAuthStore } from "../../store/auth";
import { useThemeStore } from "../../store/theme";
import LanguageToggle from "./LanguageToggle";
import Modal from "./Modal";
import Button from "./Button";

export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { mode, toggle: toggleTheme } = useThemeStore();

  const isAdmin = user?.role === "admin";

  const navItems = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/register", label: t("nav.register"), icon: Smartphone },
    { to: "/verify", label: t("nav.verify"), icon: ScanLine },
  ];

  const adminItems = [
    { to: "/admin/devices", label: t("nav.devices"), icon: Smartphone },
    { to: "/admin/audit", label: t("nav.audit"), icon: ScrollText },
    { to: "/admin/users", label: t("nav.users"), icon: Users },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const requestLogout = () => {
    setUserMenuOpen(false);
    setLogoutOpen(true);
  };

  const logoSrc = mode === "dark" ? "/logo_dark.svg" : "/logo_light.svg";

  const confirmLogout = async () => {
    setLogoutOpen(false);
    await handleLogout();
  };

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  const SidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-200 dark:border-neutral-800">
        <div className="w-14 h-14 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
          <img src={logoSrc} alt="Selam Security" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight">{t("app.name")}</p>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">{t("app.tagline")}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all ${
                isActive(item.to)
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-semibold"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="px-3 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              {t("roles.admin")}
            </p>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 min-h-[44px] rounded-xl text-sm font-medium transition-all ${
                    isActive(item.to)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-semibold"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-3 py-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="px-2 mb-2 flex items-center gap-2">
          <LanguageToggle />
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label={t("theme.toggle")}
            title={t("theme.toggle")}
          >
            {mode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={requestLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-700 dark:hover:text-error-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          {t("nav.logout")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-col fixed inset-y-0 left-0 z-30">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-neutral-900 shadow-xl animate-slide-down">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between px-4 lg:px-8 h-14">
            <button
              className="lg:hidden text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-0.5 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={logoSrc} alt="Selam Security" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <span className="font-bold text-base text-neutral-900 dark:text-neutral-100">{t("app.name")}</span>
            </div>
            <div className="hidden lg:block" />

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold">
                  {user?.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">{user?.full_name}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">{t(`roles.${user?.role}`)}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 card shadow-card-hover animate-scale-in z-20">
                    <Link
                      to="/change-password"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-t-lg"
                    >
                      <KeyRound className="w-4 h-4" />
                      {t("nav.changePassword")}
                    </Link>
                    <button
                      onClick={requestLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error-700 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-b-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("nav.logout")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>

      {/* Close button for mobile when open */}
      {mobileOpen && (
        <button
          className="lg:hidden fixed top-4 right-4 z-50 text-white"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Logout confirmation modal */}
      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} size="sm">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-error-50 dark:bg-error-900/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">{t("logout.confirmTitle")}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">{t("logout.confirmMessage")}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setLogoutOpen(false)} className="flex-1">
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmLogout} className="flex-1">
              <LogOut className="w-4 h-4" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
