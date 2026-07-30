import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Smartphone, RotateCcw } from "lucide-react";
import Layout from "../components/ui/Layout";
import BackButton from "../components/ui/BackButton";
import DeviceForm from "../components/ui/DeviceForm";
import QRCodeDisplay from "../components/ui/QRCodeDisplay";
import { getDeviceImageUrl } from "../lib/imageUpload";
import { api } from "../lib/api";
import { toast } from "../components/ui/Toast";
import type { Device } from "../types";

export default function RegisterDevice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [created, setCreated] = useState<Device | null>(null);

  const handleSubmit = async (data: any) => {
    const { device } = await api.registerDevice(data);
    setCreated(device);
    toast.success(t("register.success"));
  };

  const reset = () => {
    setCreated(null);
  };

  return (
    <Layout>
      <BackButton to="/dashboard" />
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t("register.title")}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t("register.subtitle")}</p>
        </div>

        {created ? (
          <div className="card p-8 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-success-600" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{t("register.success")}</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t("register.qrReady")}</p>
            </div>

            <div className="flex flex-col items-center mb-6">
              <QRCodeDisplay value={created.qr_token} fileName={`guardian-${created.serial_number || created.id.slice(0, 8)}`} />
              {created.image_paths && created.image_paths.length > 0 && (
                <div className="flex gap-2 mt-4">
                  {created.image_paths.map((path, idx) => (
                    <img key={idx} src={getDeviceImageUrl(path) || ""} alt={`Device ${idx}`} className="w-16 h-16 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700" />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{t("verify.owner")}</p>
                  <p className="font-semibold text-neutral-950 dark:text-neutral-50">{created.owner_name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{t("verify.brandModel")}</p>
                  <p className="font-semibold text-neutral-950 dark:text-neutral-50">{created.brand} {created.model}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{t("verify.serial")}</p>
                  <p className="font-semibold text-neutral-950 dark:text-neutral-50 font-mono">{created.serial_number}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">{t("verify.status")}</p>
                  <p className="font-semibold text-neutral-950 dark:text-neutral-50">{t(`status.${created.status}`)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
              >
                <RotateCcw className="w-4 h-4" />
                {t("register.registerAnother")}
              </button>
              <button
                onClick={() => navigate("/verify")}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
              >
                <Smartphone className="w-4 h-4" />
                {t("nav.verify")}
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-6">
            <DeviceForm onSubmit={handleSubmit} />
          </div>
        )}
      </div>
    </Layout>
  );
}
