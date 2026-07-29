import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Smartphone, ShieldAlert, Wrench, Users, ScanLine, ArrowRight, Activity,
} from "lucide-react";
import Layout from "../components/ui/Layout";
import { useAuthStore } from "../store/auth";
import { api } from "../lib/api";
import type { Stats } from "../types";
import { Spinner } from "../components/ui/Toast";

export default function Dashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    api
      .stats()
      .then(setStats)
      .catch((err) => setStatsError((err as Error).message))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const cards = stats
    ? [
        { label: t("dashboard.totalDevices"), value: stats.devices, icon: Smartphone, color: "primary" },
        { label: t("dashboard.reportedStolen"), value: stats.reported_stolen, icon: ShieldAlert, color: "error" },
        { label: t("dashboard.underMaintenance"), value: stats.under_maintenance, icon: Wrench, color: "warning" },
        { label: t("dashboard.totalUsers"), value: stats.users, icon: Users, color: "accent" },
        { label: t("dashboard.scansToday"), value: stats.scans_24h, icon: Activity, color: "success" },
      ]
    : [];

  const colorMap: Record<string, string> = {
    primary: "bg-primary-50 text-primary-700 ring-primary-600/20",
    error: "bg-error-50 text-error-700 ring-error-600/20",
    warning: "bg-warning-50 text-warning-700 ring-warning-600/20",
    accent: "bg-accent-50 text-accent-700 ring-accent-600/20",
    success: "bg-success-50 text-success-700 ring-success-600/20",
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("dashboard.welcome", { name: user?.full_name })}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("dashboard.overview")}</p>
      </div>

      {isAdmin ? (
        loading ? (
          <Spinner label={t("common.loading")} />
        ) : statsError ? (
          <div className="card p-6 mb-8 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{statsError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="card p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ring-1 ring-inset mb-3 ${colorMap[c.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{c.value}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{c.label}</p>
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {/* Quick actions */}
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t("dashboard.quickActions")}</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link to="/register" className="card p-6 group hover:shadow-card-hover hover:border-primary-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{t("dashboard.registerNew")}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Capture owner & device info with voice and image.</p>
        </Link>
        <Link to="/verify" className="card p-6 group hover:shadow-card-hover hover:border-primary-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-11 h-11 rounded-lg bg-accent-50 flex items-center justify-center">
              <ScanLine className="w-6 h-6 text-accent-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{t("dashboard.verifyDevice")}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Scan QR, enter serial, or search by owner name.</p>
        </Link>
      </div>
    </Layout>
  );
}
