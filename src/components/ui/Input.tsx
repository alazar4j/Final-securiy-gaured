import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightIcon, className = "", id, style, ...props }, ref) => {
    const inputId = id || props.name;
    const paddingLeft = icon ? "2.75rem" : undefined;
    const paddingRight = rightIcon ? "2.75rem" : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label-base">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center z-10">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input-base ${icon ? "!pl-11" : ""} ${rightIcon ? "!pr-11" : ""} ${error ? "border-error-400 focus:border-error-500 focus:ring-error-500/20" : ""} ${className}`}
            style={{
              paddingLeft,
              paddingRight,
              ...style,
            }}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center z-10">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-error-600 animate-fade-in">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, icon, className = "", id, style, children, ...props }, ref) => {
    const selectId = id || props.name;
    const paddingLeft = icon ? "2.75rem" : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="label-base">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center z-10">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            className={`input-base appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%2371717a%22 stroke-width=%222%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem] !pr-10 ${icon ? "!pl-11" : ""} ${error ? "border-error-400 focus:border-error-500 focus:ring-error-500/20" : ""} ${className}`}
            style={{
              paddingLeft,
              paddingRight: "2.5rem",
              ...style,
            }}
            {...props}
          >
            {children}
          </select>
        </div>
        {error && <p className="mt-1 text-xs text-error-600 animate-fade-in">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
