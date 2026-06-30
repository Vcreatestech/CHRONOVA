import React, { useState, useEffect } from "react";
import { X, Sparkles, Clock, AlertTriangle, Calendar, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PriorityLevel, Mission } from "../types";

interface MissionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMissionCreated: (mission: Mission) => void;
}

export default function MissionCreationModal({
  isOpen,
  onClose,
  onMissionCreated,
}: MissionCreationModalProps) {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("Medium");
  const [hoursAvailable, setHoursAvailable] = useState<number>(3);
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Reassuring animated messages during Gemini execution
  const loadingMessages = [
    "Contacting Chronova AI core...",
    "Deconstructing mission requirements...",
    "Estimating technical complexities...",
    "Optimizing work schedules for your availability...",
    "Structuring logical development phases...",
    "Formulating target timeline goals...",
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2400);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a Name for this mission.");
      return;
    }
    if (!deadline) {
      setError("A precise Deadline is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/missions/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          deadline,
          priority,
          hoursAvailable,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Plan generation returned an unstable state.");
      }

      const planData = await response.json();

      const newMission: Mission = {
        id: "m-" + Math.random().toString(36).substr(2, 9),
        name,
        deadline,
        priority,
        hoursAvailable,
        notes: notes || undefined,
        status: "On Track",
        aiPlan: planData,
        createdAt: new Date().toISOString(),
      };

      onMissionCreated(newMission);
      // Reset State
      setName("");
      setDeadline("");
      setPriority("Medium");
      setHoursAvailable(3);
      setNotes("");
      onClose();
    } catch (err: any) {
      console.error(err);
      setError("Unstable connection. Re-routing Chronova AI protocols...");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Underlay Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-neutral-950/40 backdrop-blur-md dark:bg-neutral-950/75"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-neutral-800/80 dark:bg-neutral-900 transition-colors"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-gray-50 px-6 py-5 dark:border-neutral-800/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-space text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Initiate New Mission
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Loading Active Overlay */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center select-none min-h-[400px]">
              <div className="relative mb-8">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin dark:border-indigo-400/10 dark:border-t-indigo-400" />
                <Sparkles className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              </div>
              
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="font-space text-lg font-medium text-neutral-800 dark:text-neutral-200"
                >
                  {loadingMessages[loadingStep]}
                </motion.p>
              </AnimatePresence>
              
              <p className="mt-2 text-xs font-mono text-neutral-400 dark:text-neutral-500 tracking-wide uppercase">
                Synchronizing with Chronova Neural Engine
              </p>
            </div>
          ) : (
            /* Input Form Body */
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {/* Mission Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Mission Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Google AI Hackathon Submission"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500/40 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-indigo-400/40 dark:focus:bg-neutral-900 transition-all"
                />
              </div>

              {/* Deadline & Priority Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Deadline Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Deadline Target
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-10 pr-4 py-3 text-sm text-neutral-900 focus:border-indigo-500/40 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white dark:focus:border-indigo-400/40 dark:focus:bg-neutral-900 transition-all"
                    />
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400 dark:text-neutral-600" />
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Priority Level
                  </label>
                  <div className="flex gap-1.5 rounded-2xl border border-gray-100 bg-gray-50/30 p-1.5 dark:border-neutral-800 dark:bg-neutral-800/20">
                    {(["Low", "Medium", "High"] as PriorityLevel[]).map((p) => {
                      const isActive = priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex-1 rounded-xl py-1.5 text-xs font-medium tracking-wide transition-all ${
                            isActive
                              ? p === "High"
                                ? "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                                : p === "Medium"
                                ? "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
                                : "bg-neutral-200/50 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                              : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hours Available Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Hours Available Per Day
                  </label>
                  <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {hoursAvailable} {hoursAvailable === 1 ? "Hour" : "Hours"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Clock className="h-4.5 w-4.5 text-neutral-400 dark:text-neutral-600" />
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={hoursAvailable}
                    onChange={(e) => setHoursAvailable(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-gray-100 accent-indigo-600 appearance-none cursor-pointer dark:bg-neutral-800 dark:accent-indigo-500"
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Mission Parameters / Notes <span className="text-neutral-300 dark:text-neutral-700 font-normal">(Optional)</span>
                </label>
                <textarea
                  placeholder="Describe your core goal, technology stack, constraints, or sub-deliverables..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-500/40 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-indigo-400/40 dark:focus:bg-neutral-900 transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-gray-50 dark:border-neutral-800/50">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-gray-100 py-3.5 text-xs font-bold uppercase tracking-wider text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="modal-generate-plan"
                  className="flex-[2] flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/10 dark:from-indigo-500 dark:to-violet-500 dark:hover:from-indigo-600 dark:hover:to-violet-600 dark:shadow-none transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Add New Mission</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
  );
}
