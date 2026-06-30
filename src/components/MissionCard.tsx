import React from "react";
import { ArrowRight, Clock, AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Mission } from "../types";

interface MissionCardProps {
  key?: string;
  mission: Mission;
  onContinueClick: (mission: Mission) => void;
  onDeleteClick: (id: string) => void;
}

export default function MissionCard({ mission, onContinueClick, onDeleteClick }: MissionCardProps) {
  // Compute real-time deadline difference
  const getDeadlineText = (isoDate: string) => {
    const now = new Date();
    const target = new Date(isoDate);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"}`;
    } else if (diffDays === 0) {
      return "Due Today";
    } else if (diffDays === 1) {
      return "Due Tomorrow";
    } else {
      return `${diffDays} Days Remaining`;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Critical":
        return {
          bg: "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400 border-red-500/10",
          dot: "bg-red-500 dark:bg-red-400",
        };
      case "Needs Attention":
        return {
          bg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border-amber-500/10",
          dot: "bg-amber-500 dark:bg-amber-400",
        };
      case "Completed":
        return {
          bg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400 border-emerald-500/10",
          dot: "bg-emerald-500 dark:bg-emerald-400",
        };
      case "On Track":
      default:
        return {
          bg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 border-indigo-500/10",
          dot: "bg-indigo-500 dark:bg-indigo-400",
        };
    }
  };

  const statusStyle = getStatusStyle(mission.status);

  return (
    <div
      onClick={() => onContinueClick(mission)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white/70 p-6 shadow-sm backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/25 hover:bg-white hover:shadow-md dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:hover:border-indigo-400/25 dark:hover:bg-neutral-900/80 cursor-pointer"
    >
      {/* Absolute glow background on hover */}
      <div className="absolute -inset-px -z-10 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Top row */}
      <div className="space-y-4">
        {/* Simple Status Badge */}
        <div className="flex items-center justify-between">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase font-semibold ${statusStyle.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${statusStyle.dot}`} />
            {mission.status}
          </div>
          <div className="flex items-center gap-2.5">
            {mission.priority === "High" && (
              <span className="text-[10px] font-mono uppercase bg-red-500/5 text-red-500 border border-red-500/10 rounded-md px-2 py-0.5 font-bold">
                High Priority
              </span>
            )}
            <button
              id={`delete-mission-${mission.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(mission.id);
              }}
              className="text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
              title="Delete Mission"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Mission Name */}
        <h3 className="font-space text-lg font-bold text-neutral-800 group-hover:text-neutral-900 dark:text-neutral-200 dark:group-hover:text-white transition-colors">
          {mission.name}
        </h3>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-50 dark:border-neutral-800/40">
        {/* Deadline text */}
        <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
          {getDeadlineText(mission.deadline)}
        </span>

        {/* Continue trigger */}
        <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300 transition-colors">
          <span>Continue</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
}
