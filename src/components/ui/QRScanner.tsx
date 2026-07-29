import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, CameraOff, ScanLine, RefreshCw } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "./Toast";

interface QRScannerProps {
  onResult: (decoded: string) => void;
}

export default function QRScanner({ onResult }: QRScannerProps) {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
      } catch { /* ignore */ }
      try { scanner.clear(); } catch { /* ignore */ }
    }
    setScanning(false);
  };

  const start = async () => {
    setError(null);
    setStarting(true);
    await stop();
    try {
      // Set scanning true BEFORE start so the container is visible (not display:none)
      // when html5-qrcode injects the <video> element. Browsers won't render video
      // inside a display:none parent.
      setScanning(true);

      const scanner = new Html5Qrcode("qr-reader-container", { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          onResultRef.current(decoded);
          setTimeout(stop, 50);
        },
        () => { /* per-frame scan failure — ignore */ }
      );
    } catch (err) {
      setScanning(false);
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      let key = "verify.cameraError";
      if (/permission|denied|notallowed/.test(msg)) key = "verify.cameraPermissionDenied";
      else if (/notfound|no camera|overconstrained/.test(msg)) key = "verify.noCamera";
      setError(t(key));
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      {/*
        The scanner container is ALWAYS in the DOM and never display:none.
        When not scanning, the overlay sits on top of it (absolute positioned).
        This ensures html5-qrcode can render the <video> element at all times.
      */}
      <div className="relative w-full min-h-[260px] rounded-xl overflow-hidden bg-neutral-900">
        {/* The actual scanner container — always visible so video can render */}
        <div
          id="qr-reader-container"
          className="w-full rounded-xl overflow-hidden [&_video]:rounded-xl"
        />

        {/* Overlay on top when not actively scanning */}
        {(starting || !scanning) && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
            {starting ? (
              <div className="text-center text-neutral-400">
                <div className="w-8 h-8 border-2 border-neutral-600 border-t-primary-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs">{t("verify.startingCamera")}</p>
              </div>
            ) : (
              <div className="text-center text-neutral-400 px-4">
                <ScanLine className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">{error || t("verify.startCamera")}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {scanning ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-error-600 text-white hover:bg-error-700 transition-colors"
          >
            <CameraOff className="w-4 h-4" />
            {t("verify.stopCamera")}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={starting}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {error ? <RefreshCw className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {error ? t("verify.retryCamera") : t("verify.startCamera")}
          </button>
        )}
      </div>
    </div>
  );
}
