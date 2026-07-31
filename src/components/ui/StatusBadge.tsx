import { useTranslation } from "react-i18next";
import type { DeviceStatus } from "../../types";
import { CheckCircle2, AlertTriangle, Wrench } from "lucide-react";

const config: Record<DeviceStatus, { key: string; classes: string; icon: typeof CheckCircle2 }> = {
  active: {
    key: "status.active",
    classes: "bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400 ring-success-600/20",
    icon: CheckCircle2,
  },
  reported_stolen: {
    key: "status.reported_stolen",
    classes: "bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-400 ring-error-600/20",
    icon: AlertTriangle,
  },
  under_maintenance: {
    key: "status.under_maintenance",
    classes: "bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 ring-warning-600/20",
    icon: Wrench,
  },
};

export default function StatusBadge({ status, size = "md" }: { status: DeviceStatus; size?: "sm" | "md" }) {
  const { t } = useTranslation();
  const { key, classes, icon: Icon } = config[status];
  const sizing = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center whitespace-nowrap font-medium rounded-full ring-1 ring-inset ${classes} ${sizing}`}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      <span>{t(key)}</span>
    </span>
  );
}
