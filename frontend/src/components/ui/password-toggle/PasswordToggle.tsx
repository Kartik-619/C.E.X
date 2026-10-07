import React from "react";

export interface PasswordToggleProps {
  show: boolean;
  onToggle: () => void;
  label?: string;
}

export const PasswordToggle: React.FC<PasswordToggleProps> = ({
  show,
  onToggle,
  label = "password",
}) => (
  <button
    type="button"
    onClick={onToggle}
    tabIndex={-1}
    aria-label={show ? `Hide ${label}` : `Show ${label}`}
    className="group rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500/30 dark:text-zinc-500 dark:hover:text-zinc-200"
  >
    <svg
      className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {show ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <path d="M1 1l22 22" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  </button>
);
