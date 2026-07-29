import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export default function BackButton({
  to,
  label,
  className = "",
}: {
  to?: string;
  label?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      {label || t("common.back")}
    </button>
  );
}
