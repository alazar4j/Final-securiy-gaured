import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "./Toast";

interface QRCodeDisplayProps {
  value: string;
  fileName?: string;
}

export default function QRCodeDisplay({ value, fileName = "device-qr" }: QRCodeDisplayProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const getCanvasDataUrl = () => {
    const canvas = containerRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return null;

    const padding = 40;
    const out = document.createElement("canvas");
    out.width = canvas.width + padding * 2;
    out.height = canvas.height + padding * 2;
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, padding, padding);

    return out.toDataURL("image/png");
  };

  const download = () => {
    try {
      const dataUrl = getCanvasDataUrl();
      if (!dataUrl) {
        toast.error(t("register.qrNotReady"));
        return;
      }
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

  const print = () => {
    try {
      const dataUrl = getCanvasDataUrl();
      if (!dataUrl) {
        toast.error(t("register.qrNotReady"));
        return;
      }
      
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocker prevented printing. Please allow popups.");
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print QR Code - ${fileName}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: sans-serif;
              }
              img {
                max-width: 100%;
                height: auto;
                image-rendering: pixelated;
              }
              .label {
                margin-top: 20px;
                font-size: 24px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" alt="QR Code" />
            <div class="label">${fileName}</div>
            <script>
              window.onload = () => {
                window.focus();
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={print}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          {t("register.downloadQr")}
        </button>
      </div>
    </div>
  );
}
