import { useState, useRef, type ChangeEvent } from "react";
import { Upload, Camera, X, ImageIcon, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { compressAndUploadImage } from "../../lib/imageUpload";
import { toast } from "./Toast";

interface ImageUploadProps {
  deviceId: string;
  value: string[];
  onChange: (paths: string[]) => void;
  max?: number;
}

export default function ImageUpload({ deviceId, value, onChange, max = 3 }: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [paths, setPaths] = useState<string[]>(value);

  const slots = Math.max(max, value.length);
  const canAdd = paths.length < max;

  const sync = (nextPaths: string[], nextPreviews: string[]) => {
    setPaths(nextPaths);
    setPreviews(nextPreviews);
    onChange(nextPaths);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("register.imageType"));
      return;
    }
    setUploading(true);
    try {
      const result = await compressAndUploadImage(file, deviceId);
      if (result) {
        const nextPaths = [...paths, result.path];
        const nextPreviews = [...previews, result.publicUrl];
        sync(nextPaths, nextPreviews);
        toast.success(t("register.imageUploaded"));
      } else {
        toast.error(t("register.imageUploadFailed"));
      }
    } catch {
      toast.error(t("register.imageProcessingFailed"));
    } finally {
      setUploading(false);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onMultipleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = max - paths.length;
    if (files.length > remaining) {
      toast.error(t("register.maxImagesReached"));
    }
    files.slice(0, remaining).forEach(handleFile);
    e.target.value = "";
  };

  const removeAt = (idx: number) => {
    sync(paths.filter((_, i) => i !== idx), previews.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="label-base">{t("register.deviceImage")}</label>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: Math.max(slots, previews.length) }).map((_, idx) => {
          const preview = previews[idx];
          if (preview) {
            return (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 aspect-square group">
                <img src={preview} alt={`Device ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-neutral-900/60 text-white flex items-center justify-center hover:bg-neutral-900/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-1 left-1.5 text-[10px] font-medium text-white bg-neutral-900/50 rounded px-1 py-0.5">
                  {idx + 1}
                </span>
              </div>
            );
          }
          if (uploading && idx === previews.length) {
            return (
              <div key={idx} className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-neutral-300 dark:border-neutral-600 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{t("register.uploading")}</p>
              </div>
            );
          }
          if (canAdd && idx === previews.length) {
            return (
              <div key={idx} className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 flex flex-col items-center justify-center gap-1.5 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/20 transition-colors">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="w-7 h-7 rounded-md bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-50 dark:hover:bg-neutral-600"
                      title={t("register.uploadImage")}
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraRef.current?.click()}
                      className="w-7 h-7 rounded-md bg-primary-50 border border-primary-200 text-primary-700 flex items-center justify-center hover:bg-primary-100"
                      title={t("register.captureImage")}
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                    <Plus className="w-3 h-3" />
                    {t("register.addImage")}
                  </p>
                </div>
              </div>
            );
          }
          return (
            <div key={idx} className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-neutral-200 dark:text-neutral-700" />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{t("register.imageHint", { max })}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onMultipleChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  );
}
