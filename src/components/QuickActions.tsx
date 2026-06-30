import React, { useState, useEffect } from "react";
import {
  Zap,
  Activity,
  MessageSquare,
  Mic,
  Clock,
  Sparkles,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Archive,
  Volume2,
  Calendar,
  Layers,
  ArrowRight,
  Gauge,
  Brain,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Mission, ActivityLog } from "../types";

interface QuickActionsProps {
  missions: Mission[];
  activityLogs: ActivityLog[];
  onAddLog: (type: ActivityLog["type"], message: string, missionName: string) => void;
  onCompleteMission?: (id: string) => void;
  onArchiveMission?: (id: string) => void;
}

export default function QuickActions({
  missions,
  activityLogs,
  onAddLog,
  onCompleteMission,
  onArchiveMission,
}: QuickActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  // Ask AI state
  const [aiQuery, setAiQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello! I am your Chronova AI Productivity Coach. Ask me anything about prioritizing your workload, scheduling optimal deep-work blocks, or clearing critical deadlines before they lapse."
    }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Plan My Day state
  const [daySchedule, setDaySchedule] = useState<Array<{ time: string; task: string; details: string; priority: string }>>([]);
  const [dayScheduleExplanation, setDayScheduleExplanation] = useState("");

  // Smart Priorities state
  const [smartPriorities, setSmartPriorities] = useState<Array<{
    rank: number;
    name: string;
    priority: string;
    reason: string;
    urgency: "Immediate" | "Critical" | "High" | "Moderate" | "Low";
    nextAction: string;
  }>>([]);

  // Productivity Coach state
  const [coachInsights, setCoachInsights] = useState<{
    workload: string;
    strategy: string;
    breakTiming: string;
    successChance: number;
    successExplanation: string;
    tips: string[];
  } | null>(null);

  // Smart Reminders state
  const [smartReminders, setSmartReminders] = useState<Array<{
    id: string;
    missionName: string;
    urgency: "Immediate" | "Urgent" | "Standard";
    text: string;
    action: string;
  }>>([]);

  // Generate Plan My Day schedule dynamically on opening
  useEffect(() => {
    if (activeAction === "Plan My Day") {
      const active = missions.filter(m => m.status !== "Completed" && m.status !== "Archived");
      if (active.length === 0) {
        setDaySchedule([
          { time: "09:00 AM – 10:30 AM", task: "Chronometer Baseline", details: "No active missions found. Design a new mission to calibrate.", priority: "Low" },
          { time: "11:00 AM – 12:30 PM", task: "AI Strategy Review", details: "Review historical metrics or clear completed archives.", priority: "Low" },
          { time: "02:00 PM – 04:00 PM", task: "Productivity Drift Guard", details: "Maintain daily consistency loops.", priority: "Low" }
        ]);
        setDayScheduleExplanation("Create your first mission to enable the dynamic AI Scheduler. Once a mission is active, we'll calibrate high-impact focus blocks around your deadline and available focus windows.");
        return;
      }

      // Sort by priority and deadline
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const sorted = [...active].sort((a, b) => {
        const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      const plan: typeof daySchedule = [];
      const timeSlots = [
        "09:00 AM – 10:30 AM",
        "11:00 AM – 12:30 PM",
        "01:30 PM – 03:00 PM",
        "03:30 PM – 05:00 PM"
      ];

      sorted.forEach((mission, idx) => {
        if (idx < timeSlots.length) {
          const allTasks = mission.aiPlan?.phases?.flatMap(p => p.tasks || []) || [];
          const completedSet = new Set(mission.completedChecklistItems || []);
          const nextTask = allTasks.find(t => !completedSet.has(t)) || "Deliver milestones";

          plan.push({
            time: timeSlots[idx],
            task: `${mission.name}`,
            details: `Focus on: "${nextTask}". High priority block allocated around estimated ${mission.aiPlan?.totalEstimatedHours || 4}h effort.`,
            priority: mission.priority
          });
        }
      });

      // Add remaining as buffer
      if (plan.length < timeSlots.length) {
        for (let i = plan.length; i < timeSlots.length; i++) {
          plan.push({
            time: timeSlots[i],
            task: i === timeSlots.length - 1 ? "Daily Reflection & Sync" : "Adaptive Buffer Block",
            details: i === timeSlots.length - 1 
              ? "Review checklist metrics, check off achievements, and clean your workspace."
              : "Reserved for spillover tasks or cognitive decompression rest loops.",
            priority: "Low"
          });
        }
      }

      setDaySchedule(plan);

      // Generate description explanation
      const topNames = sorted.map(m => m.name);
      const expl = `AI Scheduling Decisions: Prioritized "${topNames[0]}" first during your morning peak focus hours when cognitive reserves are at their highest. ${
        sorted[1] ? `Midday slot is allocated to "${sorted[1].name}" to maintain high execution momentum before daily transitions. ` : ""
      }${
        sorted[2] ? `Reserved the late afternoon block for "${sorted[2].name}" to prevent fatigue and leverage standard end-of-day closure loops.` : "Remaining periods are structured as safety buffer blocks."
      }`;
      setDayScheduleExplanation(expl);
    }
  }, [activeAction, missions]);

  // Generate Smart Priorities dynamically on opening
  useEffect(() => {
    if (activeAction === "Smart Priorities") {
      const active = missions.filter(m => m.status !== "Completed" && m.status !== "Archived");
      if (active.length === 0) {
        setSmartPriorities([]);
        return;
      }

      // Sort by urgency/priority
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const sorted = [...active].sort((a, b) => {
        const pWeightA = priorityWeight[a.priority] * 50 - (new Date(a.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        const pWeightB = priorityWeight[b.priority] * 50 - (new Date(b.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return pWeightB - pWeightA;
      });

      const priorities = sorted.map((mission, idx) => {
        const hoursLeft = Math.ceil((new Date(mission.deadline).getTime() - Date.now()) / (1000 * 60 * 60));
        const daysLeft = Math.floor(hoursLeft / 24);

        let urgency: "Immediate" | "Critical" | "High" | "Moderate" | "Low" = "Moderate";
        if (hoursLeft < 24 || mission.priority === "Critical") urgency = "Immediate";
        else if (hoursLeft < 48 || mission.priority === "High") urgency = "Critical";
        else if (mission.priority === "Medium") urgency = "Moderate";
        else urgency = "Low";

        // AI Reasoning
        let reason = `Estimated effort requires ${mission.aiPlan?.totalEstimatedHours || 4} hours with deadline approaching on ${new Date(mission.deadline).toLocaleDateString()}.`;
        const nameLower = mission.name.toLowerCase();
        if (nameLower.includes("bill") || nameLower.includes("pay")) {
          reason = `Short transaction timeline with fixed due date. Late action risks late fees and merchant service disruption.`;
        } else if (nameLower.includes("scholarship") || nameLower.includes("grant") || nameLower.includes("apply")) {
          reason = `High-importance academic opportunity requiring certified files. Mentors need sufficient buffer to upload recommendation letters.`;
        } else if (nameLower.includes("code") || nameLower.includes("hackathon") || nameLower.includes("dev")) {
          reason = `Development milestones require continuous deep-work cycles. High risk of compilation errors close to submission cutoffs.`;
        }

        const allTasks = mission.aiPlan?.phases?.flatMap(p => p.tasks || []) || [];
        const completedSet = new Set(mission.completedChecklistItems || []);
        const nextTask = allTasks.find(t => !completedSet.has(t)) || "All checklists completed!";

        return {
          rank: idx + 1,
          name: mission.name,
          priority: mission.priority,
          reason,
          urgency,
          nextAction: nextTask
        };
      });

      setSmartPriorities(priorities);
    }
  }, [activeAction, missions]);

  // Generate Productivity Coach insights on opening
  useEffect(() => {
    if (activeAction === "Productivity Coach") {
      const active = missions.filter(m => m.status !== "Completed" && m.status !== "Archived");
      if (active.length === 0) {
        setCoachInsights({
          workload: "Light / Standby",
          strategy: "Calibrate New Objectives",
          breakTiming: "Standard 50/10 focus loops",
          successChance: 99,
          successExplanation: "Chronova systems are primed. Initiate your first mission to activate performance coaching.",
          tips: [
            "Use the 'Create Mission' tool to establish clear deadline targets.",
            "Formulate realistic daily available focus hour bounds to avoid overallocation.",
            "Take 10-minute mindful breathing cycles to keep cognitive focus high."
          ]
        });
        return;
      }

      const totalEstimated = active.reduce((acc, m) => acc + (m.aiPlan?.totalEstimatedHours || 4), 0);
      const avgHoursAvailable = active.reduce((acc, m) => acc + m.hoursAvailable, 0) / active.length;

      let workload = "Balanced";
      let strategy = "Pomodoro Sprint Loops";
      let breakTiming = "5-minute microbreaks every 25 minutes";
      
      if (active.length >= 3 || totalEstimated > 15) {
        workload = "Heavy Workload Peak";
        strategy = "Ruthless Eisenhower Isolation & Timeboxing";
        breakTiming = "10-minute screen-free rest every 50 minutes";
      } else if (active.some(m => m.name.toLowerCase().includes("code") || m.name.toLowerCase().includes("dev") || m.name.toLowerCase().includes("scholarship"))) {
        workload = "High Focus Deep Work";
        strategy = "90-minute Deep Work Cycles (Ultradian Rhythm)";
        breakTiming = "20-minute cognitive decompression breaks";
      }

      // Success Chance calculation
      let chance = 95 - (active.length * 4);
      if (avgHoursAvailable < 2 && active.length >= 2) chance -= 15;
      const criticalCount = active.filter(m => m.priority === "Critical").length;
      chance -= (criticalCount * 8);
      chance = Math.max(10, Math.min(99, chance));

      let successExplanation = "Excellent outlook. Timeline parameters contain safe buffer boundaries.";
      if (chance < 75) {
        successExplanation = "Timeline bottleneck detected. Task density exceeds available work hours. Focus strictly on critical items.";
      } else if (chance < 85) {
        successExplanation = "Tight timeline margins. Ensure references are pinged and payment gateways verified today.";
      }

      // Personalized dynamic tips
      const tips: string[] = [];
      const hasApp = active.some(m => m.name.toLowerCase().includes("scholarship") || m.name.toLowerCase().includes("apply"));
      const hasBill = active.some(m => m.name.toLowerCase().includes("bill") || m.name.toLowerCase().includes("pay"));
      const hasSoftware = active.some(m => m.name.toLowerCase().includes("code") || m.name.toLowerCase().includes("dev") || m.name.toLowerCase().includes("app"));

      if (hasApp) {
        tips.push("Draft Statement of Purpose (SOP) essay responses offline in a secure document to avoid portal timeouts.");
        tips.push("Confirm recommenders have received academic reference links before close of business.");
      }
      if (hasBill) {
        tips.push("Execute the bill checkout sequence now during active banking hours to guarantee same-day clearing.");
      }
      if (hasSoftware) {
        tips.push("Verify compilation blocks and run clean build checks early to eliminate dependency errors.");
      }
      tips.push("Mute push notifications and close non-essential browser tabs for the next 45 minutes.");
      if (tips.length < 3) {
        tips.push("Complete checklist checkpoints sequentially instead of multi-tasking across active boards.");
      }

      setCoachInsights({
        workload,
        strategy,
        breakTiming,
        successChance: chance,
        successExplanation,
        tips: tips.slice(0, 4)
      });
    }
  }, [activeAction, missions]);

  // Generate Smart Reminders dynamically on opening
  useEffect(() => {
    if (activeAction === "Smart Reminders") {
      const active = missions.filter(m => m.status !== "Completed" && m.status !== "Archived");
      if (active.length === 0) {
        setSmartReminders([]);
        return;
      }

      const reminders = active.map((m, idx) => {
        const hoursLeft = Math.ceil((new Date(m.deadline).getTime() - Date.now()) / (1000 * 60 * 60));
        
        let urgency: "Immediate" | "Urgent" | "Standard" = "Standard";
        if (hoursLeft < 24 || m.priority === "Critical") urgency = "Immediate";
        else if (hoursLeft < 72 || m.priority === "High") urgency = "Urgent";

        const nameLower = m.name.toLowerCase();
        let text = `The deadline for "${m.name}" is scheduled in ${hoursLeft} hours. Starting your next action now ensures high quality delivery and avoids late rushes.`;
        let action = "Review upcoming checklist checkpoints.";

        if (nameLower.includes("scholarship") || nameLower.includes("apply") || nameLower.includes("grant")) {
          text = `Your scholarship application "${m.name}" closes in ${hoursLeft} hours. Starting within the next hour gives enough time to review documents and avoid last-minute upload issues.`;
          action = "Proofread statement essays and verify referee attachments.";
        } else if (nameLower.includes("bill") || nameLower.includes("pay")) {
          text = `Your billing transaction for "${m.name}" is due in ${hoursLeft} hours. Complete this 5-minute checkout within the next hour to avoid late fees or service cutoffs.`;
          action = "Launch secure payment gateway and settle bill.";
        } else if (nameLower.includes("code") || nameLower.includes("dev") || nameLower.includes("hackathon") || nameLower.includes("app")) {
          text = `The submission window for "${m.name}" closes in ${hoursLeft} hours. Running a local build sequence now eliminates compiler errors before submission lines freeze.`;
          action = "Execute verify compilation command and record demo showcase video.";
        }

        return {
          id: m.id,
          missionName: m.name,
          urgency,
          text,
          action
        };
      });

      setSmartReminders(reminders);
    }
  }, [activeAction, missions]);

  // Handle Ask AI submit
  const handleAskAISubmit = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuery || aiQuery;
    if (!queryToUse.trim()) return;

    setChatHistory((prev) => [...prev, { role: "user", text: queryToUse }]);
    if (!customQuery) setAiQuery("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryToUse,
          missions,
          history: chatHistory.slice(-6)
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      
      setChatHistory((prev) => [...prev, { role: "assistant", text: data.reply }]);
      onAddLog("ai_action", `Consulted Chronova AI: "${queryToUse.slice(0, 35)}..."`, "AI Consultant");
    } catch (err) {
      setTimeout(() => {
        // Local generator fallback on client side
        const activeMissions = missions.filter(m => m.status !== "Completed" && m.status !== "Archived");
        
        let fallbackText = "I suggest focusing on your closest deadline today and breaking down immediate checklist actions to secure steady progress.";
        if (activeMissions.length > 0) {
          const topMission = activeMissions[0];
          fallbackText = `Based on your active board, prioritize the closest target **"${topMission.name}"**. Focus on completing your outstanding sub-tasks sequentially and keep all distractions muted.`;
        }

        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            text: fallbackText
          }
        ]);
        setAiLoading(false);
      }, 600);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mt-14 select-none">
      <h3 className="font-space text-xs font-bold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 mb-6">
        AI Productivity Tools
      </h3>

      {/* Grid of elegant premium action cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        
        {/* Action 1: Plan My Day */}
        <div
          id="action-plan-day"
          onClick={() => {
            setActiveAction("Plan My Day");
            onAddLog("ai_action", "Calibrated daily schedule metrics.", "Plan My Day");
          }}
          className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white/40 p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/20 hover:bg-white dark:border-neutral-800/40 dark:bg-neutral-900/15 dark:hover:border-indigo-400/20 dark:hover:bg-neutral-900/30 cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/5 text-indigo-600 dark:bg-indigo-400/5 dark:text-indigo-400">
            <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="mt-6">
            <h4 className="font-space text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
              Plan My Day
            </h4>
            <p className="mt-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
              Calibrate Schedule
            </p>
          </div>
        </div>

        {/* Action 2: Smart Priorities */}
        <div
          id="action-smart-priorities"
          onClick={() => {
            setActiveAction("Smart Priorities");
            onAddLog("ai_action", "Analyzed priorities and calculated intelligent ranks.", "Smart Priorities");
          }}
          className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white/40 p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-red-500/20 hover:bg-white dark:border-neutral-800/40 dark:bg-neutral-900/15 dark:hover:border-red-400/20 dark:hover:bg-neutral-900/30 cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/5 text-red-600 dark:bg-red-400/5 dark:text-red-400">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div className="mt-6">
            <h4 className="font-space text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
              Smart Priorities
            </h4>
            <p className="mt-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
              AI Rank & Reasoning
            </p>
          </div>
        </div>

        {/* Action 3: Ask AI */}
        <div
          id="action-ask-ai"
          onClick={() => setActiveAction("Ask AI")}
          className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white/40 p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/20 hover:bg-white dark:border-neutral-800/40 dark:bg-neutral-900/15 dark:hover:border-amber-400/20 dark:hover:bg-neutral-900/30 cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/5 text-amber-600 dark:bg-amber-400/5 dark:text-amber-400">
            <MessageSquare className="h-5 w-5 transition-transform group-hover:rotate-6" />
          </div>
          <div className="mt-6">
            <h4 className="font-space text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
              Ask AI
            </h4>
            <p className="mt-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
              Context Assistant
            </p>
          </div>
        </div>

        {/* Action 4: Productivity Coach */}
        <div
          id="action-productivity-coach"
          onClick={() => {
            setActiveAction("Productivity Coach");
            onAddLog("ai_action", "Accessed custom performance coaching metrics.", "Productivity Coach");
          }}
          className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white/40 p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/20 hover:bg-white dark:border-neutral-800/40 dark:bg-neutral-900/15 dark:hover:border-violet-400/20 dark:hover:bg-neutral-900/30 cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/5 text-violet-600 dark:bg-violet-400/5 dark:text-violet-400">
            <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="mt-6">
            <h4 className="font-space text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
              Productivity Coach
            </h4>
            <p className="mt-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
              AI Insights
            </p>
          </div>
        </div>

        {/* Action 5: Smart Reminders */}
        <div
          id="action-smart-reminders"
          onClick={() => {
            setActiveAction("Smart Reminders");
            onAddLog("ai_action", "Constructed smart contextual warnings.", "Smart Reminders");
          }}
          className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white/40 p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20 hover:bg-white dark:border-neutral-800/40 dark:bg-neutral-900/15 dark:hover:border-emerald-400/20 dark:hover:bg-neutral-900/30 cursor-pointer select-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/5 text-emerald-600 dark:bg-emerald-400/5 dark:text-emerald-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="mt-6">
            <h4 className="font-space text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
              Smart Reminders
            </h4>
            <p className="mt-1 text-[9px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-mono">
              AI Contextual Alerts
            </p>
          </div>
        </div>
      </div>

      {/* Action Dialog Modal Layer */}
      <AnimatePresence>
        {activeAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveAction(null)}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-md dark:bg-neutral-950/75"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-neutral-800/70 dark:bg-neutral-900"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveAction(null)}
                className="absolute top-5 right-5 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* ACTION: PLAN MY DAY */}
              {activeAction === "Plan My Day" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400">
                    <Zap className="h-5 w-5 animate-pulse" />
                    <h3 className="font-space text-lg font-bold uppercase tracking-wider">
                      OPTIMIZED DAILY SCHEDULE
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Chronova's AI scheduler balanced priority ratings, available hours, and target deadlines to build your optimized day planner.
                  </p>
                  
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {daySchedule.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1 p-3.5 rounded-2xl border border-gray-50 bg-neutral-50/50 dark:border-neutral-800/40 dark:bg-neutral-800/20"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                            🕒 {item.time}
                          </span>
                          {item.priority !== "Low" && (
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm font-bold ${
                              item.priority === "Critical" 
                                ? "bg-red-500/10 text-red-500 border border-red-500/10"
                                : item.priority === "High"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                                : "bg-blue-500/10 text-blue-500 border border-blue-500/10"
                            }`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white mt-1">
                          {item.task}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
                          {item.details}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* AI Explanation of Scheduling Decisions */}
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/10 p-4 dark:border-indigo-950/40 dark:bg-indigo-950/5 space-y-1">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Scheduler Reasoning
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                      {dayScheduleExplanation}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveAction(null)}
                    className="w-full mt-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors cursor-pointer"
                  >
                    LOCK IN PROTOCOLS
                  </button>
                </div>
              )}

              {/* ACTION: SMART PRIORITIES */}
              {activeAction === "Smart Priorities" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                    <Activity className="h-5 w-5" />
                    <h3 className="font-space text-lg font-bold uppercase tracking-wider">
                      SMART PRIORITIES & RANKING
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Instead of a simple list, Chronova's AI analyzes deadlines, effort margins, and risk factors to explain exactly why each mission is ranked.
                  </p>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {smartPriorities.length === 0 ? (
                      <div className="text-center py-10 text-xs text-neutral-400 italic">
                        No active missions. Design an objective to calculate ranking.
                      </div>
                    ) : (
                      smartPriorities.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-2xl border border-gray-150 bg-neutral-50/50 dark:border-neutral-850/40 dark:bg-neutral-800/20 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-[11px] font-black text-red-600 dark:bg-red-400/10 dark:text-red-400">
                                #{item.rank}
                              </span>
                              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                                {item.name}
                              </h4>
                            </div>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                              item.urgency === "Immediate"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : item.urgency === "Critical"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            }`}>
                              URGENCY: {item.urgency}
                            </span>
                          </div>

                          <div className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-light space-y-1.5 pl-7 border-l border-neutral-100 dark:border-neutral-800/60 ml-2.5">
                            <p>
                              <strong className="font-semibold text-neutral-800 dark:text-white">Reasoning:</strong> {item.reason}
                            </p>
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                              👉 <strong className="font-bold">Suggested Next Action:</strong> {item.nextAction}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setActiveAction(null)}
                    className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    CONFIRM WORKLOAD PRIORITY
                  </button>
                </div>
              )}

              {/* ACTION: ASK AI */}
              {activeAction === "Ask AI" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-amber-500">
                    <MessageSquare className="h-5 w-5" />
                    <h3 className="font-space text-lg font-bold uppercase tracking-wider">
                      CHRONOVA AI CO-PILOT
                    </h3>
                  </div>

                  {/* Chat Message Stream */}
                  <div className="h-[200px] overflow-y-auto border border-gray-100 rounded-2xl p-4 bg-gray-50/50 dark:border-neutral-800 dark:bg-neutral-800/20 space-y-3 flex flex-col">
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "self-end bg-indigo-600 text-white font-medium"
                            : "self-start bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-gray-100 dark:border-neutral-700"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="self-start bg-neutral-100 text-neutral-400 dark:bg-neutral-800 rounded-2xl p-3 text-xs animate-pulse">
                        Analyzing active board matrix...
                      </div>
                    )}
                  </div>

                  {/* Recommended Quick-Tap Prompts */}
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      Suggested Context Queries
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto p-0.5">
                      {[
                        "What should I work on next?",
                        "Which deadline is most critical?",
                        "Can I finish everything today?",
                        "Rearrange my schedule.",
                        "Help me complete this application.",
                        "Explain why this mission is high priority."
                      ].map((qText, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={aiLoading}
                          onClick={() => handleAskAISubmit(undefined, qText)}
                          className="text-[10px] bg-neutral-50 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-neutral-800/50 dark:hover:bg-neutral-800 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-left transition-all cursor-pointer truncate max-w-[210px]"
                        >
                          💬 {qText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ask AI Input Field */}
                  <form onSubmit={(e) => handleAskAISubmit(e)} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Ask about prioritization, roadmap, or blockers..."
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      className="flex-1 rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-xs text-neutral-900 focus:bg-white focus:outline-hidden dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-white dark:focus:bg-neutral-900 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={aiLoading}
                      className="rounded-xl bg-neutral-900 p-3 text-white hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* ACTION: PRODUCTIVITY COACH */}
              {activeAction === "Productivity Coach" && coachInsights && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-5 w-5" />
                    <h3 className="font-space text-lg font-bold uppercase tracking-wider">
                      PERSONALIZED PERFORMANCE INSIGHTS
                    </h3>
                  </div>

                  {/* Summary Indicators */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl border border-gray-50 bg-neutral-50/50 dark:border-neutral-800/40 dark:bg-neutral-800/20">
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase tracking-wider">WORKLOAD</span>
                      <span className="block text-[11px] font-bold mt-1 text-neutral-800 dark:text-neutral-200 truncate font-mono uppercase">{coachInsights.workload}</span>
                    </div>
                    <div className="p-3 rounded-2xl border border-gray-50 bg-neutral-50/50 dark:border-neutral-800/40 dark:bg-neutral-800/20">
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase tracking-wider">BREAK TIMING</span>
                      <span className="block text-[11px] font-bold mt-1 text-neutral-800 dark:text-neutral-200 truncate font-mono uppercase">{coachInsights.breakTiming.split(" ")[0]} Interval</span>
                    </div>
                    <div className="p-3 rounded-2xl border border-gray-50 bg-neutral-50/50 dark:border-neutral-800/40 dark:bg-neutral-800/20">
                      <span className="block text-[8px] font-mono text-neutral-400 uppercase tracking-wider">STRATEGY</span>
                      <span className="block text-[11px] font-bold mt-1 text-indigo-600 dark:text-indigo-400 truncate font-mono uppercase">{coachInsights.strategy.split(" ")[0]}</span>
                    </div>
                  </div>

                  {/* Progress completion chance */}
                  <div className="rounded-2xl border border-gray-100 bg-white/40 p-4 dark:border-neutral-800/50 dark:bg-neutral-900/20 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-neutral-400 dark:text-neutral-500">
                      <span>CHANCE OF COMPLETING TODAY'S GOALS</span>
                      <span className="font-bold text-neutral-900 dark:text-white">{coachInsights.successChance}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div 
                        style={{ width: `${coachInsights.successChance}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          coachInsights.successChance > 80 
                            ? "bg-emerald-500" 
                            : coachInsights.successChance > 60 
                            ? "bg-amber-500" 
                            : "bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-normal font-light italic">
                      {coachInsights.successExplanation}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      AI Coach Tailored Tips
                    </h4>
                    <div className="space-y-2 bg-neutral-50/40 p-3.5 rounded-2xl border border-gray-100 dark:bg-neutral-800/10 dark:border-neutral-800/30">
                      {coachInsights.tips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
                          <Sparkles className="h-4 w-4 shrink-0 text-violet-500 mt-0.5" />
                          <p className="leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveAction(null)}
                    className="w-full py-3 bg-violet-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 transition-colors cursor-pointer"
                  >
                    ACKNOWLEDGE COACH ADVICE
                  </button>
                </div>
              )}

              {/* ACTION: SMART REMINDERS */}
              {activeAction === "Smart Reminders" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-5 w-5" />
                    <h3 className="font-space text-lg font-bold uppercase tracking-wider">
                      AI SMART REMINDERS
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Context-aware warnings with action-oriented recommendations to prevent last-minute misses.
                  </p>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {smartReminders.length === 0 ? (
                      <p className="text-xs text-neutral-400 italic text-center py-12">
                        🎉 System is clear of deadline threats. Excellent proactive planning buffer!
                      </p>
                    ) : (
                      smartReminders.map((rem) => {
                        return (
                          <div
                            key={rem.id}
                            className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/5 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-neutral-900 dark:text-white uppercase font-space text-[10px] tracking-wider">
                                🔔 {rem.missionName}
                              </span>
                              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10">
                                {rem.urgency}
                              </span>
                            </div>
                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                              {rem.text}
                            </p>
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium leading-relaxed font-mono">
                              💡 Action advice: {rem.action}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
