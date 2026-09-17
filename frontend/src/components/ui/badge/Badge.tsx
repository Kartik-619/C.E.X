import React from "react";

export interface BadgeProps {
  variant?: "buy" | "sell" | "positive" | "negative" | "warning" | "neutral";
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className,
  onClick,
}) => {
  const variantClasses = {
    buy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    sell: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    negative: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    neutral: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  };

  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${variantClasses[variant]} cursor-pointer transition-opacity hover:opacity-80 ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <span className={`${base} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};
