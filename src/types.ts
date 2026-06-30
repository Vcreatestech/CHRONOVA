export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export type MissionStatus = "On Track" | "Needs Attention" | "Critical" | "Completed" | "Archived";

export interface AIPhase {
  phaseName: string;
  timeAllocation: string;
  focusArea: string;
  tasks: string[];
}

export interface AIPlan {
  planTitle: string;
  totalEstimatedHours: number;
  phases: AIPhase[];
  tips: string[];
  riskAssessment: string;
  aiMissionSummary?: string;
  priorityAnalysis?: string;
  bestTimeToStart?: string;
  estimatedCompletionTimeStr?: string;
  potentialRisks?: string[];
  aiRecommendations?: string[];
  successPredictionPercentage?: number;
  successPredictionExplanation?: string;
}

export interface Mission {
  id: string;
  name: string;
  deadline: string; // ISO string or date representation
  priority: PriorityLevel;
  hoursAvailable: number;
  notes?: string;
  status: MissionStatus;
  aiPlan?: AIPlan;
  createdAt: string;
  isArchived?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: "create" | "edit" | "complete" | "archive" | "ai_action" | "reminder" | "delete";
  message: string;
  missionName: string;
  missionId?: string;
}
