import { useTranslation } from "react-i18next";
import { Phone, User, Smartphone, Hash, Palette, Calendar, Fingerprint, Shield } from "lucide-react";
import type { Device } from "../../types";
import StatusBadge from "./StatusBadge";
import { getDeviceImageUrl } from "../../lib/imageUpload";

export default function DeviceCard({ device, onClick }: { device: Device; onClick?: () => void; key?: string }) {
  const { t } = useTranslation();
  const imageUrl = getDeviceImageUrl(device.image_path);

  const Field = ({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string | null }) => (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm text-neutral-900 dark:text-neutral-100 truncate">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div
      onClick={onClick}
      className={`card p-5 transition-all ${onClick ? "cursor-pointer hover:shadow-card-hover hover:border-primary-200" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <img src={imageUrl} alt={device.brand} className="w-14 h-14 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-neutral-400" />
            </div>
          )}
          <div>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{device.brand} {device.model}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t(`register.${device.owner_role === "student" ? "student" : "staff"}`)}</p>
          </div>
        </div>
        <StatusBadge status={device.status} size="sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field icon={User} label={t("verify.owner")} value={device.owner_name} />
        <Field icon={Phone} label={t("verify.phone")} value={device.owner_phone} />
        <Field icon={Fingerprint} label={t("verify.serial")} value={device.serial_number} />
        <Field icon={Palette} label={t("verify.color")} value={device.color} />
      </div>

      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(device.registered_at).toLocaleDateString()}
        </span>
        {device.registered_by_name && (
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {t("verify.registeredBy")}: {device.registered_by_name}
          </span>
        )}
        {device.serial_number && (
          <span className="flex items-center gap-1 font-mono">
            <Hash className="w-3 h-3" />
            {device.qr_token.slice(0, 8)}
          </span>
        )}
      </div>
    </div>
  );
}
