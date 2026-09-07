import React from "react";

export interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  name?: string;
  className?: string;
  step?: string;
  min?: string;
  autoComplete?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  label,
  name,
  className,
  step,
  min,
  autoComplete,
  error,
}) => {
  const id = React.useId();

  const baseClasses =
    "block w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500";

  const borderClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500 dark:focus:border-red-500"
    : "border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500/30 dark:border-zinc-700 dark:focus:border-zinc-500";

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        name={name}
        step={step}
        min={min}
        autoComplete={autoComplete}
        className={`${baseClasses} ${borderClasses} ${className}`}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
