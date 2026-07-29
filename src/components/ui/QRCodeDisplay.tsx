import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "./Toast";

interface QRCodeDisplayProps {
  value: string;
  fileName?: string;
}

export default function QRCodeDisplay({ value, fileName = "device-qr" }: QRCodeDisplayProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const download = () => {
    const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error(t("register.qrNotReady"));
      return;
    }
    try {
      const padding = 40;
      const out = document.createElement("canvas");
      out.width = canvas.width + padding * 2;
      out.height = canvas.height + padding * 2;
      const ctx = out.getContext("2d");
      if (!ctx) {
        toast.error(t("register.downloadFailed"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, padding, padding);

      const dataUrl = out.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("register.qrDownloaded"));
    } catch {
      toast.error(t("register.downloadFailed"));
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={containerRef}
        className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm"
      >
        <QRCodeCanvas
          value={value || " "}
          size={200}
          level="M"
          fgColor="#18181b"
          bgColor="#ffffff"
        />
      </div>
      <button
        type="button"
        onClick={download}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        {t("register.downloadQr")}
      </button>
    </div>
  );
}
