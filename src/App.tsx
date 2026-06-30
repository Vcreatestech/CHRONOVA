/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MissionCreationModal from "./components/MissionCreationModal";
import MissionCard from "./components/MissionCard";
import PlanViewerModal from "./components/PlanViewerModal";
import QuickActions from "./components/QuickActions";
import { Mission, ActivityLog, MissionStatus } from "./types";
import { Sparkles, Calendar, Compass, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Premium pre-populated default missions matching the user's specific workflow
const PRELOADED_MISSIONS: Mission[] = [
  {
    id: "default-1",
    name: "Hackathon Submission",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
    priority: "High",
    hoursAvailable: 4,
    notes: "Polish codebases, review security guidelines, configure API triggers, and complete submission criteria for Chronova.",
    status: "On Track",
    createdAt: new Date().toISOString(),
    aiPlan: {
      planTitle: "Hackathon Completion Playbook",
      totalEstimatedHours: 8,
      phases: [
        {
          phaseName: "Phase 1: Code Optimization",
          timeAllocation: "3 Hours",
          focusArea: "Conduct strict audits and modular file refactoring.",
          tasks: [
            "Check for potential infinite state re-renders in hooks",
            "Optimize tailwind variables for fast transitions",
            "Verify complete dark mode contrast compliance"
          ]
        },
        {
          phaseName: "Phase 2: Submission Assembly",
          timeAllocation: "5 Hours",
          focusArea: "Compile build packages, write clear summaries, and publish live URLs.",
          tasks: [
            "Draft clean walkthrough descriptions of user features",
            "Verify build output builds perfectly inside production environments",
            "Create demonstration screenshots"
          ]
        }
      ],
      tips: [
        "Focus purely on your core user flows; secondary features can wait.",
        "Ensure all file operations use relative paths for production portability."
      ],
      riskAssessment: "Underestimating deployment pipeline constraints can cause delayed submissions. Build early."
    }
  },
  {
    id: "default-2",
    name: "Bill Payment",
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Due in 1 day
    priority: "Critical",
    hoursAvailable: 1,
    notes: "Review pending invoices, manage digital transactions safely, and verify payment receipt numbers.",
    status: "Critical",
    createdAt: new Date().toISOString(),
    aiPlan: {
      planTitle: "Bill Clearance Protocol",
      totalEstimatedHours: 1,
      phases: [
        {
          phaseName: "Phase 1: Review & Pay",
          timeAllocation: "1 Hour",
          focusArea: "Authorize transactions via secure portals and file confirmations.",
          tasks: [
            "Verify statement accuracy against bank logs",
            "Submit direct payments and capture receipt screenshots",
            "Update personal ledger files"
          ]
        }
      ],
      tips: [
        "Use trusted secure internet connections; avoid public networks.",
        "Set calendar reminders for recurring dates next month."
      ],
      riskAssessment: "Late payments can degrade service status. Clear critical invoices immediately."
    }
  },
  {
    id: "default-3",
    name: "Exam Application",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Due in 5 days
    priority: "Medium",
    hoursAvailable: 2,
    notes: "Prepare documentation vectors, check credential files, complete submission forms, and pay registration fees.",
    status: "Needs Attention",
    createdAt: new Date().toISOString(),
    aiPlan: {
      planTitle: "Exam Registration Execution Blueprint",
      totalEstimatedHours: 4,
      phases: [
        {
          phaseName: "Phase 1: Document Checklist",
          timeAllocation: "2 Hours",
          focusArea: "Gather digital certificates, photos, and verified forms.",
          tasks: [
            "Convert files into high-quality standardized formats",
            "Double-check academic details against certificates"
          ]
        },
        {
          phaseName: "Phase 2: Portal Submission",
          timeAllocation: "2 Hours",
          focusArea: "Fill enrollment fields and execute secure fee clearance.",
          tasks: [
            "Submit accurate details inside registration portal",
            "Submit payment details and save verified enrollment confirmations"
          ]
        }
      ],
      tips: [
        "Submit at least 48 hours before official cutoff to avoid server traffic peaks.",
        "Review spelling of formal names carefully before confirmation."
      ],
      riskAssessment: "Incorrect attachments can trigger immediate application rejection. Verify each upload."
    }
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("chronova_theme");
    return saved ? saved === "dark" : true; // Default to dark/graphite black for premium vibe
  });

  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem("chronova_missions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Seamlessly migrate if any legacy task strings are found
        const hasLegacy = parsed.some((m: any) => 
          m.name === "Google AI Hackathon Submission" || 
          m.name === "NPTEL Advanced ML Certification" ||
          m.name === "E-Commerce Stripe API Integration"
        );
        if (hasLegacy) {
          return PRELOADED_MISSIONS;
        }
        return parsed;
      } catch (e) {
        return PRELOADED_MISSIONS;
      }
    }
    return PRELOADED_MISSIONS;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  const [resetConfirm, setResetConfirm] = useState(false);

  // Activity logs state with default entries matching PRELOADED_MISSIONS
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("chronova_activity_logs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    const now = new Date();
    return [
      {
        id: "log-1",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        type: "create",
        message: "Initiated high-fidelity project roadmap blueprint with AI integration.",
        missionName: "Hackathon Submission"
      },
      {
        id: "log-2",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        type: "reminder",
        message: "Deadline alert triggered: invoice settlement due soon.",
        missionName: "Bill Payment"
      },
      {
        id: "log-3",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        type: "create",
        message: "System baseline initialized successfully.",
        missionName: "Exam Application"
      }
    ];
  });

  // Sync activity logs to localStorage
  useEffect(() => {
    localStorage.setItem("chronova_activity_logs", JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Sync Dark/Light class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("chronova_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("chronova_theme", "light");
    }
  }, [darkMode]);

  // Sync missions to localStorage
  useEffect(() => {
    localStorage.setItem("chronova_missions", JSON.stringify(missions));
  }, [missions]);

  // Log adding utility
  const addLog = (type: ActivityLog["type"], message: string, missionName: string, missionId?: string) => {
    const newLog: ActivityLog = {
      id: "log-" + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
      missionName,
      missionId
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  const handleMissionCreated = (newMission: Mission) => {
    setMissions((prev) => [newMission, ...prev]);
    addLog("create", `Initiated new mission: "${newMission.name}". Chronova formulated a custom execution blueprint.`, newMission.name, newMission.id);
  };

  const handleDeleteMission = (id: string) => {
    const target = missions.find((m) => m.id === id);
    if (!target) return;
    setMissions((prev) => prev.filter((m) => m.id !== id));
    addLog("delete", `Terminated mission objective from Active Board.`, target.name, id);
    if (selectedMission?.id === id) {
      setSelectedMission(null);
    }
  };

  const handleUpdateMission = (updated: Mission) => {
    setMissions((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    setSelectedMission(updated);
    addLog("edit", `Modified parameters, deadlines, or strategic notes.`, updated.name, updated.id);
  };

  const handleMarkComplete = (id: string) => {
    const target = missions.find((m) => m.id === id);
    if (!target) return;
    const updated: Mission = { ...target, status: "Completed" };
    setMissions((prev) => prev.map((m) => m.id === id ? updated : m));
    setSelectedMission(updated);
    addLog("complete", `Successfully checked off and archived mission objectives.`, target.name, id);
  };

  const handleArchiveMission = (id: string) => {
    const target = missions.find((m) => m.id === id);
    if (!target) return;
    const updated: Mission = { ...target, isArchived: true, status: "Archived" };
    setMissions((prev) => prev.map((m) => m.id === id ? updated : m));
    if (selectedMission?.id === id) {
      setSelectedMission(null);
    }
    addLog("archive", `Archived completed objectives into deep storage files.`, target.name, id);
  };

  const handleResetMissions = () => {
    if (resetConfirm) {
      setMissions([]);
      setSelectedMission(null);
      setResetConfirm(false);
      addLog("archive", "Manually reset and purged the active tracking control board.", "All Missions");
    } else {
      setResetConfirm(true);
    }
  };

  useEffect(() => {
    if (resetConfirm) {
      const timer = setTimeout(() => {
        setResetConfirm(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resetConfirm]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
      {/* Header bar */}
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        {/* Core Brand Hero Section */}
        <Hero onAddMissionClick={() => setIsCreateModalOpen(true)} />

        {/* Mission Library Board */}
        <section className="mt-10">
          {(() => {
            const activeMissions = missions.filter((m) => !m.isArchived);
            return (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-neutral-800/60 mb-8">
                  <div className="flex items-center gap-2.5">
                    <Compass className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="font-space text-lg font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-100">
                      ACTIVE MISSION CONTROL ({activeMissions.length})
                    </h2>
                  </div>
                  {activeMissions.length > 0 && (
                    <button
                      onClick={handleResetMissions}
                      className={`font-mono text-[10px] uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
                        resetConfirm 
                          ? "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-bold animate-pulse" 
                          : "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                      }`}
                    >
                      {resetConfirm ? "⚠️ Click again to confirm" : "Reset Board"}
                    </button>
                  )}
                </div>

                {activeMissions.length === 0 ? (
                  /* Immersive Empty State */
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/20 py-20 px-6 text-center dark:border-dashed dark:border-neutral-800 bg-linear-to-b from-transparent to-neutral-500/5"
                  >
                    <h3 className="font-space text-2xl font-black text-neutral-800 dark:text-neutral-200 tracking-wide mb-3">
                      🎯 Ready to focus?
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
                      Create your first mission and let AI help you never miss what matters.
                    </p>
                    <button
                      id="empty-state-create-mission"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/10 dark:from-indigo-500 dark:to-violet-500 dark:hover:from-indigo-600 dark:hover:to-violet-600 transition-all duration-300 cursor-pointer"
                    >
                      [ Create Mission ]
                    </button>
                  </motion.div>
                ) : (
                  /* Mission Cards Grid */
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {activeMissions.map((mission) => (
                      <MissionCard
                        key={mission.id}
                        mission={mission}
                        onContinueClick={(m) => setSelectedMission(m)}
                        onDeleteClick={handleDeleteMission}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </section>

        {/* Quick Action Widgets */}
        <QuickActions
          missions={missions}
          activityLogs={activityLogs}
          onAddLog={addLog}
          onCompleteMission={handleMarkComplete}
          onArchiveMission={handleArchiveMission}
        />
      </main>

      {/* Centered Modern Mission Creation Form */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <MissionCreationModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onMissionCreated={handleMissionCreated}
          />
        )}
      </AnimatePresence>

      {/* Dynamic AI Plan Viewer Protocol */}
      <AnimatePresence>
        {selectedMission !== null && (
          <PlanViewerModal
            isOpen={selectedMission !== null}
            onClose={() => setSelectedMission(null)}
            mission={selectedMission}
            onDeleteMission={handleDeleteMission}
            onUpdateMission={handleUpdateMission}
            onMarkComplete={handleMarkComplete}
            onArchiveMission={handleArchiveMission}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
