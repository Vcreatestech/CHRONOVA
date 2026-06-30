import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface HeroProps {
  onAddMissionClick: () => void;
}

export default function Hero({ onAddMissionClick }: HeroProps) {
  return (
    <div className="relative overflow-visible pt-12 pb-14 text-center select-none">
      <div className="mx-auto max-w-5xl px-6">
        {/* Display Logo Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="font-space text-[clamp(2rem,4.5vw,4.5rem)] font-black tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent uppercase mb-4 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300 whitespace-nowrap px-4 py-1"
        >
          Never Miss What Matters.
        </motion.h1>

        {/* Core Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="font-space text-xl font-semibold tracking-[0.25em] text-neutral-800 sm:text-2xl dark:text-neutral-200 uppercase"
        >
          CHRONOVA
        </motion.p>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-3 text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto"
        >
          AI That Never Lets You Miss What Matters.
        </motion.p>

        {/* Single Primary Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-10"
        >
          <button
            onClick={onAddMissionClick}
            id="add-mission-cta"
            className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 font-space text-sm font-semibold tracking-wider text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98] dark:from-indigo-500 dark:to-violet-500 dark:shadow-indigo-500/5 dark:hover:from-indigo-600 dark:hover:to-violet-600"
          >
            {/* Subtle glow boundary animation */}
            <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            
            <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
            <span>ADD NEW MISSION</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
