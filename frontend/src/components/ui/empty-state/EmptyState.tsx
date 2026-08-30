import React from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionOnClick,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon || (
          <svg
            className="h-7 w-7 text-zinc-400 dark:text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        )}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {actionLabel && (
        <button
          onClick={actionOnClick}
          className="mt-4 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
