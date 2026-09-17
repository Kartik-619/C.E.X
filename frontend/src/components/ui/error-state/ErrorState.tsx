import React from "react";

export interface ErrorStateProps {
  title: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  retryLabel,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
        <svg
          className="h-7 w-7 text-red-500 dark:text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {title}
      </h3>
      {description && (
        <p className="max-w-xs break-words text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {retryLabel && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};