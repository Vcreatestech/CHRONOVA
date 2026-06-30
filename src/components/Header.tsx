import React from "react";
import { Sun, Moon, Clock3, User } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function Header({ darkMode, setDarkMode }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-neutral-800/60 dark:bg-neutral-900/80 transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20 dark:from-indigo-500 dark:to-violet-500 dark:shadow-indigo-400/10">
            <Clock3 className="h-4 w-4 text-white" />
          </div>
          <span className="font-space text-xl font-bold tracking-wider text-neutral-900 dark:text-white uppercase">
            Chronova
          </span>
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-4">
          {/* Light / Dark Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            id="theme-toggle"
            aria-label="Toggle visual theme"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-gray-50/50 text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* User Profile Icon */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-gray-50/50 text-gray-500 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400">
            <User className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>
    </header>
  );
}
