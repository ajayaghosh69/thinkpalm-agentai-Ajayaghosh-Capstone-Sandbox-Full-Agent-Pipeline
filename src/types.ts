export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "Major" | "Minor";
  status: "Open" | "In Progress" | "Resolved";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  managerName?: string;
  jiraUrl: string;
  jiraToken: string;
  jiraEmail: string;
  projectKey: string;
  stories: UserStory[];
  bugs?: Bug[];
  gaps?: Gap[];
}

export interface ProjectMetrics {
  understandingScore: number; // Initially 68%, can be raised to 91% or 95%
  coverageScore: number; // 86%
  featureCoverage: number; // 88%
  workflowCoverage: number; // 84%
  riskCoverage: number; // 79%
  automationCoverage: number; // 72%
  executionCoverage: number; // 90%
  openRisks: number;
  criticalGaps: number;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  actors: string[];
  status: "Imported" | "Analyzed" | "Enhanced";
}

export interface Gap {
  id: string;
  category: "Workflow State" | "Business Rule" | "Validation" | "Notification" | "Exception";
  description: string;
  severity: "High" | "Medium" | "Low";
  status: "Unresolved" | "Clarified";
  resolvedAnswer?: string;
  storyId?: string;
  gapPoints?: string[];
}

export interface QaRisk {
  id: string;
  category: "Functional" | "Security" | "Performance" | "Integration" | "Business";
  scenario: string;
  mitigation: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  context: string;
  answered: boolean;
  userAnswer?: string;
}

export interface EnhancedDoc {
  businessRules: string[];
  validationRules: string[];
  notificationRules: string[];
  exceptionRules: string[];
  acceptanceCriteria: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "copilot" | "interview-agent";
  text: string;
  timestamp: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}
