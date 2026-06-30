import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Clock,
  Compass,
  ShieldAlert,
  CheckSquare,
  Square,
  Info,
  Calendar,
  Edit3,
  Check,
  Archive,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Gauge,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Mission, AIPlan, PriorityLevel, MissionStatus } from "../types";

interface PlanViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: Mission | null;
  onDeleteMission: (id: string) => void;
  onUpdateMission: (mission: Mission) => void;
  onMarkComplete: (id: string) => void;
  onArchiveMission: (id: string) => void;
}

export default function PlanViewerModal({
  isOpen,
  onClose,
  mission,
  onDeleteMission,
  onUpdateMission,
  onMarkComplete,
  onArchiveMission,
}: PlanViewerModalProps) {
  if (!mission || !mission.aiPlan) return null;

  const plan: AIPlan = mission.aiPlan;

  // Track state for checklist completion satisfaction
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  
  // Track inline editing status
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(mission.name);
  const [editedDeadline, setEditedDeadline] = useState(mission.deadline.split("T")[0] + "T12:00");
  const [editedPriority, setEditedPriority] = useState<PriorityLevel>(mission.priority);
  const [editedHours, setEditedHours] = useState<number>(mission.hoursAvailable);
  const [editedNotes, setEditedNotes] = useState(mission.notes || "");

  // Countdown timer state
  const [timeRemaining, setTimeRemaining] = useState("");

  // Sync edit state values on opening different mission
  useEffect(() => {
    setEditedName(mission.name);
    // Format deadline for datetime-local input safely
    try {
      const dateStr = new Date(mission.deadline).toISOString().slice(0, 16);
      setEditedDeadline(dateStr);
    } catch (e) {
      setEditedDeadline(mission.deadline);
    }
    setEditedPriority(mission.priority);
    setEditedHours(mission.hoursAvailable);
    setEditedNotes(mission.notes || "");
    setIsEditing(false);
  }, [mission]);

  // Handle countdown calculations
  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(mission.deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining("OVERDUE / EXPIRED");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      let str = "";
      if (days > 0) str += `${days}d `;
      if (hours > 0 || days > 0) str += `${hours}h `;
      str += `${minutes}m`;
      setTimeRemaining(str);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [mission.deadline]);

  // Compute tasks checklist statistics
  const totalTasks = plan.phases.reduce((acc, phase) => acc + phase.tasks.length, 0);
  const completedCount = plan.phases.reduce((acc, phase, pIdx) => {
    return acc + phase.tasks.filter((_, tIdx) => completedTasks[`${pIdx}-${tIdx}`]).length;
  }, 0);
  const checklistProgress = totalTasks > 0 ? (completedCount / totalTasks) : 0;

  // Compute success prediction dynamically
  const calculateSuccessPrediction = () => {
    const diff = new Date(mission.deadline).getTime() - Date.now();
    const daysLeft = diff / (1000 * 60 * 60 * 24);
    
    let base = 75; // starts with a safe 75% baseline
    
    // Checklist progress boosts success
    base += checklistProgress * 20;

    // Fast-approaching deadlines decrease success slightly if progress is low
    if (daysLeft < 2 && checklistProgress < 0.4) {
      base -= 30;
    } else if (daysLeft < 5 && checklistProgress < 0.2) {
      base -= 15;
    }

    // High/Critical priorities need swift action
    if (mission.priority === "Critical" && checklistProgress < 0.3) {
      base -= 10;
    } else if (mission.priority === "Low") {
      base += 5;
    }

    return Math.max(5, Math.min(99, Math.round(base)));
  };

  const successPrediction = calculateSuccessPrediction();

  // Determine complexity rating
  const getComplexityLevel = () => {
    const hours = plan.totalEstimatedHours;
    if (hours >= 20) return { label: "CRITICAL COMPENSATING", color: "text-red-500 dark:text-red-400 bg-red-500/10" };
    if (hours >= 10) return { label: "HIGH COMPLEXITY", color: "text-amber-500 dark:text-amber-400 bg-amber-500/10" };
    if (hours >= 4) return { label: "MODERATE COMPLEXITY", color: "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10" };
    return { label: "OPTIMIZED LIGHTWEIGHT", color: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10" };
  };

  const complexity = getComplexityLevel();

  const toggleTask = (phaseIndex: number, taskIndex: number) => {
    const key = `${phaseIndex}-${taskIndex}`;
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle Edit Submission
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;

    const updatedMission: Mission = {
      ...mission,
      name: editedName,
      deadline: new Date(editedDeadline).toISOString(),
      priority: editedPriority,
      hoursAvailable: editedHours,
      notes: editedNotes.trim() || undefined,
      // Keep existing plan structure but update title if custom fallback was used
      aiPlan: mission.aiPlan ? {
        ...mission.aiPlan,
        planTitle: mission.aiPlan.planTitle.startsWith("Mission Protocol") 
          ? `Mission Protocol: ${editedName}` 
          : mission.aiPlan.planTitle
      } : undefined
    };

    onUpdateMission(updatedMission);
    setIsEditing(false);
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
        {/* Underlay Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md dark:bg-neutral-950/75"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative my-8 w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-neutral-800/80 dark:bg-neutral-900 transition-colors"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4.5 dark:border-neutral-800/50 bg-neutral-50/20 dark:bg-neutral-900/40">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                <Compass className="h-4 w-4" />
              </div>
              <h3 className="font-space text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.18em]">
                CHRONOVA MISSION INTELLIGENCE
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && mission.status !== "Completed" && mission.status !== "Archived" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-full p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                  title="Edit parameters"
                >
                  <Edit3 className="h-4.5 w-4.5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6 md:p-8 space-y-6">
            
            {isEditing ? (
              /* ACTIVE EDIT FORM OVERLAY */
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <h4 className="font-space text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Edit3 className="h-4 w-4" /> Edit Mission Parameters
                </h4>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Mission Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2.5 text-sm text-neutral-900 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white dark:focus:bg-neutral-900 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Deadline Target
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={editedDeadline}
                      onChange={(e) => setEditedDeadline(e.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2.5 text-sm text-neutral-900 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white dark:focus:bg-neutral-900 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Priority Level
                    </label>
                    <div className="flex gap-1.5 rounded-xl border border-gray-100 bg-gray-50/30 p-1 dark:border-neutral-800 dark:bg-neutral-800/20">
                      {(["Low", "Medium", "High", "Critical"] as PriorityLevel[]).map((p) => {
                        const isActive = editedPriority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setEditedPriority(p)}
                            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all cursor-pointer ${
                              isActive
                                ? p === "Critical" || p === "High"
                                  ? "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400 font-semibold"
                                  : "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 font-semibold"
                                : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500"
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Hours Available Per Day
                    </label>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {editedHours} Hours
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={editedHours}
                    onChange={(e) => setEditedHours(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-gray-100 accent-indigo-600 appearance-none cursor-pointer dark:bg-neutral-800 dark:accent-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Mission Notes
                  </label>
                  <textarea
                    rows={3}
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2.5 text-sm text-neutral-900 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white dark:focus:bg-neutral-900 transition-all resize-none"
                    placeholder="Enter notes..."
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2.5 border border-gray-100 rounded-xl text-xs font-bold uppercase text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 cursor-pointer"
                  >
                    Apply Changes
                  </button>
                </div>
              </form>
            ) : (
              /* DETAILED CHRONOVA INTELLIGENCE PANEL */
              <>
                {/* Mission Hero Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-neutral-50/60 border border-gray-100/80 p-5 dark:bg-neutral-800/15 dark:border-neutral-800/30">
                  
                  {/* Real-time countdown clock */}
                  <div className="absolute top-4 right-4 text-right">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-mono font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400 animate-pulse">
                      <Clock className="h-3 w-3" />
                      <span>{timeRemaining}</span>
                    </div>
                  </div>

                  <h2 className="font-space text-xl font-bold text-neutral-900 dark:text-white pr-36">
                    {mission.name}
                  </h2>
                  
                  <div className="flex flex-wrap items-center gap-2.5 mt-3 text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
                    <span>Priority: <strong className={mission.priority === "Critical" || mission.priority === "High" ? "text-red-500 font-bold" : "text-indigo-500"}>{mission.priority}</strong></span>
                    <span>•</span>
                    <span>Deadline: {new Date(mission.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    <span>•</span>
                    <span>Effort: {plan.totalEstimatedHours}h Alloc</span>
                  </div>
                </div>

                {/* KPI Metrics Dashboard Row */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {/* Metric 1: Success Prediction */}
                  <div className="rounded-2xl border border-gray-100 bg-white/40 p-4 dark:border-neutral-800/50 dark:bg-neutral-900/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      <span>SUCCESS PREDICTION</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                        {plan.successPredictionPercentage || successPrediction}%
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div
                        style={{ width: `${plan.successPredictionPercentage || successPrediction}%` }}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          (plan.successPredictionPercentage || successPrediction) > 70 
                            ? "bg-emerald-500" 
                            : (plan.successPredictionPercentage || successPrediction) > 40 
                            ? "bg-amber-500" 
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="text-[9px] text-neutral-400 mt-2 font-mono leading-relaxed uppercase">
                      {plan.successPredictionExplanation || (successPrediction > 80 ? "High confidence due to proactive planning buffers." : "Sufficient timeline parameters registered.")}
                    </p>
                  </div>

                  {/* Metric 2: Estimated Completion Time */}
                  <div className="rounded-2xl border border-gray-100 bg-white/40 p-4 dark:border-neutral-800/50 dark:bg-neutral-900/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" />
                      <span>ESTIMATED COMPLETION</span>
                    </div>
                    <div className="mt-2.5">
                      <span className="text-xs font-bold tracking-tight text-neutral-900 dark:text-white block truncate uppercase font-mono">
                        {plan.estimatedCompletionTimeStr || `${plan.totalEstimatedHours} Hours Total`}
                      </span>
                    </div>
                    <p className="text-[9px] text-neutral-400 mt-3.5 font-mono leading-relaxed uppercase">
                      Requires {plan.totalEstimatedHours} hours of active focus loops across scheduled intervals.
                    </p>
                  </div>

                  {/* Metric 3: Best Time to Start */}
                  <div className="col-span-2 sm:col-span-1 rounded-2xl border border-gray-100 bg-white/40 p-4 dark:border-neutral-800/50 dark:bg-neutral-900/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                      <span>BEST TIME TO START</span>
                    </div>
                    <div className="mt-2.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block leading-tight uppercase font-mono truncate">
                        {plan.bestTimeToStart || "Immediately Today"}
                      </span>
                    </div>
                    <p className="text-[9px] text-neutral-400 mt-3.5 font-mono leading-relaxed uppercase">
                      Starting early secures optimal cognitive energy and buffer zones.
                    </p>
                  </div>
                </div>

                {/* AI-Generated Summary & Priority Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI Mission Summary */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> AI Mission Summary
                    </h4>
                    <div className="rounded-2xl border border-gray-100 bg-indigo-50/5 p-4 dark:border-neutral-800/30 dark:bg-neutral-800/5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                      {plan.aiMissionSummary || `A specialized sequence designed to help you execute "${mission.name}" within your allocated parameters of ${mission.hoursAvailable} hours per day.`}
                    </div>
                  </div>

                  {/* Priority Analysis */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-indigo-500" /> Priority Analysis
                    </h4>
                    <div className="rounded-2xl border border-gray-100 bg-indigo-50/5 p-4 dark:border-neutral-800/30 dark:bg-neutral-800/5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-light">
                      {plan.priorityAnalysis || `The "${mission.priority}" priority level was assigned due to the required effort of ${plan.totalEstimatedHours} hours and the time remaining before the deadline target.`}
                    </div>
                  </div>
                </div>

                {/* Dynamic Execution Checklist */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Personalized Action Plan
                    </h4>
                    <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-full">
                      PROGRESS: {completedCount}/{totalTasks} ({Math.round(checklistProgress * 100)}%)
                    </span>
                  </div>
                  <div className="space-y-4 border-l border-gray-100 pl-4 ml-2 dark:border-neutral-800/60">
                    {plan.phases.map((phase, pIdx) => (
                      <div key={pIdx} className="relative space-y-2">
                        {/* Bullet circle marker */}
                        <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-indigo-500 bg-white dark:bg-neutral-900 ring-4 ring-white dark:ring-neutral-900" />
                        
                        <div className="flex items-center justify-between">
                          <h5 className="font-space text-xs font-bold text-neutral-800 dark:text-white uppercase tracking-wide">
                            {phase.phaseName}
                          </h5>
                          <span className="font-mono text-[9px] uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md dark:bg-neutral-800/60 dark:text-neutral-400">
                            {phase.timeAllocation}
                          </span>
                        </div>
                        
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-light leading-relaxed">
                          {phase.focusArea}
                        </p>

                        {/* Checklist sub-tasks */}
                        <div className="mt-2 space-y-1.5 bg-neutral-50/30 rounded-xl p-3 border border-gray-100/50 dark:bg-neutral-800/10 dark:border-neutral-800/30">
                          {phase.tasks.map((task, tIdx) => {
                            const isCompleted = !!completedTasks[`${pIdx}-${tIdx}`];
                            return (
                              <div
                                key={tIdx}
                                onClick={() => toggleTask(pIdx, tIdx)}
                                className="flex items-start gap-3 cursor-pointer group py-1 select-none"
                              >
                                <button className="shrink-0 text-neutral-400 group-hover:text-indigo-500 dark:text-neutral-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {isCompleted ? (
                                    <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                  ) : (
                                    <Square className="h-4 w-4" />
                                  )}
                                </button>
                                <span className={`text-xs text-neutral-700 dark:text-neutral-300 transition-all ${
                                  isCompleted ? "line-through text-neutral-400 dark:text-neutral-600 font-normal" : "font-normal"
                                }`}>
                                  {task}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactical Tips & Risks Grid */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
                  {/* Recommendations */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      AI Recommendations
                    </h4>
                    <div className="rounded-2xl border border-gray-100 bg-indigo-50/10 p-4 dark:border-neutral-800/40 dark:bg-indigo-950/5 space-y-2.5">
                      {(plan.aiRecommendations || plan.tips || []).map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500 mt-0.5" />
                          <p>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risks */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Potential Risks
                    </h4>
                    <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 dark:border-red-500/5 dark:bg-red-950/5 space-y-2.5">
                      {plan.potentialRisks && plan.potentialRisks.length > 0 ? (
                        plan.potentialRisks.map((risk, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                            <p>{risk}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                          <p>{plan.riskAssessment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Dynamic action triggers */}
          <div className="flex flex-wrap items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-neutral-800/50 bg-neutral-50/30 dark:bg-neutral-800/20 gap-3">
            {!isEditing && (
              <>
                <button
                  onClick={() => {
                    onDeleteMission(mission.id);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/5 rounded-xl transition-colors cursor-pointer uppercase font-space tracking-wide"
                >
                  <Trash2 className="h-4 w-4" /> Terminate
                </button>

                <div className="flex items-center gap-2">
                  {mission.status !== "Completed" && mission.status !== "Archived" && (
                    <button
                      onClick={() => {
                        onMarkComplete(mission.id);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Secure Complete
                    </button>
                  )}

                  {mission.status !== "Archived" && (
                    <button
                      onClick={() => {
                        onArchiveMission(mission.id);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors cursor-pointer border border-neutral-100/10"
                    >
                      <Archive className="h-4 w-4" /> Archive Mission
                    </button>
                  )}
                </div>
              </>
            )}
            {isEditing && (
              <div className="w-full text-right text-[10px] font-mono text-neutral-400 uppercase tracking-widest leading-relaxed">
                Applying parameters in memory registries...
              </div>
            )}
          </div>
        </motion.div>
      </div>
  );
}
