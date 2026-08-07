import { useState, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "./Toast";
import Tesseract from "tesseract.js";

interface OCRScannerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function OCRScanner({ value, onChange, disabled }: OCRScannerProps) {
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const enhanceImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context not supported");

        // Scale down to a reasonable size if it's too large to improve speed
        const MAX_WIDTH = 1024;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH * height) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Basic contrast enhancement & grayscale conversion
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Grayscale
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          let v = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          // Increase contrast
          const contrast = 100; // Contrast level (-255 to 255)
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          v = factor * (v - 128) + 128;
          
          if (v < 0) v = 0;
          if (v > 255) v = 255;

          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        }
        ctx.putImageData(imageData, 0, 0);

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const processImage = async (file: File) => {
    setProcessing(true);
    try {
      const enhancedImageDataUrl = await enhanceImage(file);
      
      const worker = await Tesseract.createWorker('eng');
      
      const result = await worker.recognize(enhancedImageDataUrl);
      await worker.terminate();

      // Extract alphanumeric characters and some punctuation often found in serials
      const text = result.data.text.replace(/[^a-zA-Z0-9-]/g, '').trim();
      
      if (text) {
        onChange(text);
        toast.success("Text extracted successfully");
      } else {
        toast.error("No clear text found in image");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Failed to extract text from image");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processImage(file);
          }
          if (e.target) {
            e.target.value = '';
          }
        }}
      />
      <button
        type="button"
        onClick={handleCapture}
        disabled={disabled || processing}
        title="Scan Serial Number"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
          processing
            ? "bg-amber-50 border-amber-300 text-amber-700"
            : "bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        {processing ? "Scanning..." : "Scan Serial"}
      </button>
    </>
  );
}
