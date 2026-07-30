import { type ReactNode } from "react";

export interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface RadioGroupProps<T extends string> {
  label?: string;
  options: RadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function RadioGroup<T extends string>({ label, options, value, onChange }: RadioGroupProps<T>) {
  return (
    <div className="w-full">
      {label && <label className="label-base block mb-2">{label}</label>}
      <div className="grid grid-cols-1 gap-2.5">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-brand-500 bg-brand-500/10 dark:bg-brand-500/20 text-neutral-900 dark:text-neutral-100 ring-1 ring-brand-500/50 shadow-sm"
                  : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {option.icon && (
                  <div className={`p-2 rounded-lg flex items-center justify-center ${
                    isSelected
                      ? "bg-brand-500 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                  }`}>
                    {option.icon}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-sm block">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">{option.description}</span>
                  )}
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${
                isSelected ? "border-brand-500 bg-brand-500 text-white" : "border-neutral-300 dark:border-neutral-700"
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

