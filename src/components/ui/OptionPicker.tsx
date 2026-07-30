import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Check, Search } from "lucide-react";
import Modal from "./Modal";

export interface OptionItem {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface OptionPickerProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  title?: string;
  searchable?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function OptionPicker({
  label,
  placeholder = "Select an option",
  value,
  options,
  onChange,
  title,
  searchable = false,
  icon,
  className = "",
}: OptionPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearchTerm("");
  };

  const modalTitle = title || label || placeholder;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="label-base block mb-1.5 font-medium text-xs text-neutral-600 dark:text-neutral-400">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full input-base flex items-center justify-between text-left cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors py-2.5 px-3.5"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {icon ? (
            <span className="text-neutral-400 dark:text-neutral-500 flex-shrink-0">{icon}</span>
          ) : (
            selectedOption?.icon && (
              <span className="text-neutral-500 dark:text-neutral-400 flex-shrink-0">
                {selectedOption.icon}
              </span>
            )
          )}
          <span className={`truncate text-sm font-medium ${selectedOption ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
      </button>

      {/* Options List Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle} size="md">
        <div className="space-y-3">
          {searchable && options.length > 5 && (
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none z-10" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("common.searchOptions")}
                className="input-base !pl-10 text-sm py-2"
                style={{ paddingLeft: "2.5rem" }}
                autoFocus
              />
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {filteredOptions.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-6">{t("common.noData")}</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "border-brand-500 bg-brand-500/10 dark:bg-brand-500/20 text-neutral-900 dark:text-neutral-100 ring-1 ring-brand-500/50"
                        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {opt.icon && (
                        <div
                          className={`p-2 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "bg-brand-500 text-white"
                              : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                          }`}
                        >
                          {opt.icon}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{opt.label}</span>
                          {opt.badge}
                        </div>
                        {opt.description && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${
                        isSelected
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-neutral-300 dark:border-neutral-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
