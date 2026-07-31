import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { User, Phone, Smartphone, Hash, Palette, Tag, Save, UserCheck } from "lucide-react";
import type { Device, DeviceStatus, OwnerRole } from "../../types";
import Button from "./Button";
import { Input, Select } from "./Input";
import VoiceInput from "./VoiceInput";
import ImageUpload from "./ImageUpload";
import OptionPicker from "./OptionPicker";
import { compressAndUploadImage } from "../../lib/imageUpload";
import { toast } from "./Toast";

interface DeviceFormProps {
  onSubmit: (data: {
    owner_name: string;
    owner_role: OwnerRole;
    owner_phone: string;
    brand: string;
    model: string;
    color: string;
    serial_number: string;
    image_path: string | null;
    image_paths: string[];
    status: DeviceStatus;
  }) => Promise<void>;
  submitLabel?: string;
  initial?: Partial<Device>;
  presetSerial?: string;
}

export default function DeviceForm({ onSubmit, submitLabel, initial, presetSerial }: DeviceFormProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    owner_name: initial?.owner_name || "",
    owner_role: (initial?.owner_role || "student") as OwnerRole,
    owner_phone: initial?.owner_phone || "",
    brand: initial?.brand || "",
    model: initial?.model || "",
    color: initial?.color || "",
    serial_number: presetSerial || initial?.serial_number || "",
    status: (initial?.status || "active") as DeviceStatus,
  });
  const [imagePath, setImagePath] = useState<string | null>(initial?.image_path || null);
  const [imagePaths, setImagePaths] = useState<string[]>(initial?.image_paths || (initial?.image_path ? [initial.image_path] : []));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ ...form, image_path: imagePath, image_paths: imagePaths });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const tempId = "pending-" + Math.random().toString(36).slice(2);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Info */}
      <section className="p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <User className="w-5 h-5 text-primary-600" />
          {t("register.personalInfo")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <Input
              name="owner_name"
              label={t("register.ownerName")}
              value={form.owner_name}
              onChange={(e) => set("owner_name", e.target.value)}
              icon={<User className="w-4 h-4" />}
              placeholder={t("placeholders.fullName")}
              required
            />
            <div className="pt-1">
              <VoiceInput field="owner_name" label={t("register.voiceInput")} value={form.owner_name} onChange={(v) => set("owner_name", v)} />
            </div>
          </div>
          <div>
            <OptionPicker
              label={t("register.ownerRole")}
              value={form.owner_role}
              icon={<UserCheck className="w-4 h-4" />}
              options={[
                { value: "student", label: t("register.student") },
                { value: "staff", label: t("register.staff") },
                { value: "guest", label: t("register.guest") },
              ]}
              onChange={(value) => set("owner_role", value as OwnerRole)}
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Input
              name="owner_phone"
              label={t("register.phone")}
              value={form.owner_phone}
              onChange={(e) => set("owner_phone", e.target.value)}
              icon={<Phone className="w-4 h-4" />}
              placeholder="+251 91 123 4567"
              required
            />
            <div className="pt-1">
              <VoiceInput field="owner_phone" label={t("register.voiceInput")} value={form.owner_phone} onChange={(v) => set("owner_phone", v)} />
            </div>
          </div>
        </div>
      </section>

      {/* Device Info */}
      <section className="p-5 sm:p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <Smartphone className="w-5 h-5 text-primary-600" />
          {t("register.deviceInfo")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <Input
              name="brand"
              label={t("register.brand")}
              value={form.brand}
              onChange={(e) => set("brand", e.target.value)}
              icon={<Tag className="w-4 h-4" />}
              placeholder={t("placeholders.brand")}
              required
            />
            <div className="pt-1">
              <VoiceInput field="brand" label={t("register.voiceInput")} value={form.brand} onChange={(v) => set("brand", v)} />
            </div>
          </div>
          <div className="space-y-1">
            <Input
              name="model"
              label={t("register.model")}
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder={t("placeholders.model")}
              hint={t("common.optional")}
            />
            <div className="pt-1">
              <VoiceInput field="model" label={t("register.voiceInput")} value={form.model} onChange={(v) => set("model", v)} />
            </div>
          </div>
          <div className="space-y-1">
            <Input
              name="color"
              label={t("register.color")}
              value={form.color}
              onChange={(e) => set("color", e.target.value)}
              icon={<Palette className="w-4 h-4" />}
              placeholder={t("placeholders.color")}
            />
            <div className="pt-1">
              <VoiceInput field="color" label={t("register.voiceInput")} value={form.color} onChange={(v) => set("color", v)} />
            </div>
          </div>
          <div className="space-y-1">
            <Input
              name="serial_number"
              label={t("register.serialNumber")}
              value={form.serial_number}
              onChange={(e) => set("serial_number", e.target.value)}
              icon={<Hash className="w-4 h-4" />}
              placeholder={t("placeholders.serial")}
              hint={t("common.optional")}
            />
            <div className="pt-1">
              <VoiceInput field="serial_number" label={t("register.voiceInput")} value={form.serial_number} onChange={(v) => set("serial_number", v)} />
            </div>
          </div>
        </div>
        <div className="pt-3">
          <ImageUpload deviceId={tempId} value={imagePaths} onChange={setImagePaths} />
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" className="px-8 py-3.5 text-base font-semibold min-h-[48px]" loading={submitting}>
          <Save className="w-5 h-5" />
          {submitLabel || t("register.submit")}
        </Button>
      </div>

      {error && (
        <div className="px-4 py-2.5 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-400 text-sm text-center animate-fade-in">
          {error}
        </div>
      )}
    </form>
  );
}
