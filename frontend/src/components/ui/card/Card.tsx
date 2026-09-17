import React from "react";

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  className,
}) => {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
    >
      {header && (
        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
          {header}
        </div>
      )}
      <div className="px-5 py-5">{children}</div>
      {footer && (
        <div className="border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          {footer}
        </div>
      )}
    </div>
  );
};
