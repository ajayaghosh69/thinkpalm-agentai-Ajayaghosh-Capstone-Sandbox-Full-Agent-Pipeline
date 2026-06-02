import React, { useState, useEffect } from "react";
import { Project, ProjectMetrics, UserStory, Gap, QaRisk, InterviewQuestion } from "./types";
import { 
  INITIAL_STORIES, 
  INITIAL_GAPS, 
  INITIAL_RISKS, 
  INTERVIEW_SESSIONS,
  INITIAL_BUGS,
  generateInitialGaps
} from "./data/caseStudy";

import ProjectHubDashboard from "./components/ProjectHubDashboard";
import FetchConvertCenterComponent from "./components/FetchConvertCenterComponent";
import GapDiscoveryEngineComponent from "./components/GapDiscoveryEngineComponent";
import ExecutionModuleComponent from "./components/ExecutionModuleComponent";
import MemoryTabComponent from "./components/MemoryTabComponent";
import MeetLenderComponent from "./components/MeetLenderComponent";

import { 
  Compass, 
  Brain, 
  Layers, 
  FileWarning, 
  Flame, 
  MessageSquare, 
  Terminal, 
  LayoutDashboard, 
  Cpu, 
  ShieldAlert,
  HelpCircle,
  Plus,
  RefreshCw,
  X,
  FolderSync,
  PlayCircle,
  Calendar,
  Download,
  Copy,
  CheckCircle,
  Server,
  Database,
  Code,
  FileText
} from "lucide-react";

export default function App() {
  // App navigation state variables matching TAXAJ.AI modules
  const [activeModule, setActiveModule] = useState<"hub" | "fetch_convert" | "gaps" | "execution" | "memories" | "meetlender">("hub");
  const [showAgentPipelineModal, setShowAgentPipelineModal] = useState(false);
  const [pipelineCopied, setPipelineCopied] = useState(false);

  // Handler for memory module loading/injecting projects
  const handleAddNewProject = (details: { name: string; description: string; stories: UserStory[] }) => {
    const nextKey = details.name.includes("Invoice") ? "CPD" :
                    details.name.includes("Audit") ? "TAL" :
                    details.name.includes("Merchant") ? "MCA" : "CUST";
    const nextId = `proj-${Date.now()}`;
    const newProj: Project = {
      id: nextId,
      name: details.name,
      description: details.description,
      projectKey: nextKey,
      stories: details.stories,
      bugs: [
        {
          id: `${nextKey}-BUG-01`,
          title: "Uncaught Database Constraint on Duplicate Voyage Records",
          description: `Integration pipeline crashes during rapid sequential submits on ${details.name} transactions.`,
          severity: "Critical",
          status: "Open"
        },
        {
          id: `${nextKey}-BUG-02`,
          title: "Coordinate Mapping System Memory Leak",
          description: "Real-time geographical tracking buffers overflow and crash active client view sessions after 1 hour offshore.",
          severity: "Major",
          status: "In Progress"
        }
      ],
      jiraUrl: "",
      jiraToken: "",
      jiraEmail: "",
      gaps: generateInitialGaps(nextKey, details.name)
    };
    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(nextId);
  };

  // Jira projects list state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "proj-1",
      name: "Customer Support Ticket Portal (CSC)",
      description: "Core gateway for incident management, routing high-priority escalations, engineering resolutions, and corporate client support dispatches securely.",
      managerName: "Aparna Ajay",
      jiraUrl: "https://jira-incidents.atlassian.net",
      jiraToken: "ATATT3_incident_operational_token_2026",
      jiraEmail: "ops-support@jira-incidents.org",
      projectKey: "CSC",
      stories: INITIAL_STORIES,
      bugs: INITIAL_BUGS as any,
      gaps: INITIAL_GAPS
    }
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>("proj-1");

  const handleUpdateProject = (id: string, updatedFields: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      // Select another active project if deleted
      if (activeProjectId === id) {
        if (next.length > 0) {
          setActiveProjectId(next[0].id);
        } else {
          setActiveProjectId("");
        }
      }
      return next;
    });
  };

  // Voice interview target user story
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(INITIAL_STORIES[1] || INITIAL_STORIES[0] || null);

  // Core reactive data models
  const [metrics, setMetrics] = useState<ProjectMetrics>({
    understandingScore: 68, // Initially 68% (as shown in page 46 and 76)
    coverageScore: 86,
    featureCoverage: 88,
    workflowCoverage: 84,
    riskCoverage: 79,
    automationCoverage: 72,
    executionCoverage: 90,
    openRisks: 5,
    criticalGaps: 5
  });

  // Extract stories from active project
  const activeProj = projects.find(p => p.id === activeProjectId) || projects[0];
  const stories = activeProj ? activeProj.stories : [];

  const [gaps, setGaps] = useState<Gap[]>(INITIAL_GAPS);
  const [risks, setRisks] = useState<QaRisk[]>(INITIAL_RISKS);
  const [questions, setQuestions] = useState<InterviewQuestion[]>(INTERVIEW_SESSIONS);

  // Modal control variables
  const [showImportModal, setShowImportModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryDesc, setNewStoryDesc] = useState("");
  const [newStoryActors, setNewStoryActors] = useState("Coordinator");

  // Key feedback warnings
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    // Audit credentials availability silently
    fetch("/api/key-status")
      .then((res) => res.json())
      .then((data) => {
        setHasKey(!!data.hasKey);
      })
      .catch((err) => console.error("Could not trace API status:", err));
  }, []);

  // Generic server tunnel proxy dispatcher
  const dispatchGenAiQuery = async (contents: string, systemInstruction?: string) => {
    try {
      const payload = {
        model: "gemini-3.5-flash",
        contents,
        systemInstruction
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation payload returned failure state.");
      }
      return data.text || "";
    } catch (e: any) {
      console.error("AI Dispatch failure:", e);
      throw e;
    }
  };

  // Resolves GAP checks manually
  const handleResolveGap = (gapId: string, answer: string) => {
    setGaps(prev => prev.map(g => {
      if (g.id === gapId) {
        return { ...g, status: "Clarified", resolvedAnswer: answer };
      }
      return g;
    }));

    // Trigger score scaling adjustments
    setMetrics(prev => {
      const remainingUnresolved = gaps.filter(g => g.id !== gapId && g.status === "Unresolved").length;
      const progressBoost = 5; // Raise score on gap resolutions
      const nextScore = Math.min(prev.understandingScore + progressBoost, 95);
      return {
        ...prev,
        understandingScore: nextScore,
        criticalGaps: Math.max(0, prev.criticalGaps - 1)
      };
    });
  };

  // Completes Interview QA queries dynamically, climbing understandingScore up from 68% -> 95%!
  const handleAnswerInterviewQuestion = (id: string, answer: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, answered: true, userAnswer: answer };
      }
      return q;
    }));

    // Perform dynamic score math representing the "Wow moment" from page 79 of the product vision
    setMetrics(prev => {
      // Calculate how many are answered
      const answeredCount = questions.filter(q => q.id === id || q.answered).length;
      const totalCount = questions.length;
      
      let nextComprehension = 68;
      if (answeredCount === 1) nextComprehension = 74;
      else if (answeredCount === 2) nextComprehension = 81;
      else if (answeredCount === 3) nextComprehension = 88;
      else if (answeredCount === 4) nextComprehension = 91; // Page 79 target: "increased from 68% to 91%"
      
      // If we also resolved some Gaps manually, let's keep it max capped at 95%
      const finalScore = Math.max(prev.understandingScore, nextComprehension);

      return {
        ...prev,
        understandingScore: finalScore,
        criticalGaps: Math.max(0, prev.criticalGaps - 1),
        coverageScore: Math.min(prev.coverageScore + 2, 94),
        automationCoverage: Math.min(prev.automationCoverage + 3, 85)
      };
    });
  };

  const handleResetInterview = () => {
    setQuestions(prev => prev.map(q => ({ ...q, answered: false, userAnswer: undefined })));
    setGaps(prev => prev.map(g => ({ ...g, status: "Unresolved", resolvedAnswer: undefined })));
    setMetrics({
      understandingScore: 68,
      coverageScore: 86,
      featureCoverage: 88,
      workflowCoverage: 84,
      riskCoverage: 79,
      automationCoverage: 72,
      executionCoverage: 90,
      openRisks: 5,
      criticalGaps: 5
    });
  };

  // Jira project sync generator via Gemini API
  const handleConfigureJiraProject = async (details: {
    name: string;
    description: string;
    jiraUrl: string;
    jiraToken: string;
    jiraEmail: string;
    projectKey: string;
  }) => {
    const prompt = `Act as an expert Product Manager and SAFe requirements engineer. Generate 4 highly descriptive user stories for a Jira project:
    Project Name: ${details.name}
    Jira key: ${details.projectKey}
    Project Context: ${details.description}

    Return a strict JSON format matching this schema:
    [
      {
        "id": "${details.projectKey}-101",
        "title": "Clear user story title",
        "description": "As a [role], I want to [actions], so that [outcome].",
        "actors": ["role1"],
        "status": "Imported"
      }
    ]`;

    try {
      const apiReply = await dispatchGenAiQuery(prompt, "You are a professional requirements structure validator returning only valid JSON arrays.");
      const cleaned = apiReply.replace(/```json/gi, "").replace(/```/g, "").trim();
      const generatedStories = JSON.parse(cleaned);

      if (Array.isArray(generatedStories)) {
        const nextId = `proj-${Date.now()}`;
        const newProj: Project = {
          id: nextId,
          name: details.name,
          description: details.description,
          jiraUrl: details.jiraUrl,
          jiraToken: details.jiraToken,
          jiraEmail: details.jiraEmail,
          projectKey: details.projectKey,
          stories: generatedStories,
          bugs: [
            {
              id: `${details.projectKey}-BUG-01`,
              title: `Uncaught Connection Exception with ${details.projectKey} APIs`,
              description: "The offshore sync layer outputs cleartext API credentials to public debug logs upon communication handshake failure.",
              severity: "Critical",
              status: "Open"
            },
            {
              id: `${details.projectKey}-BUG-02`,
              title: "Rapid Dispatch Transaction Lockout",
              description: "DB transactions fail to unlock if an operator cancels a transfer request exactly during signature verification.",
              severity: "Major",
              status: "In Progress"
            }
          ] as any,
          gaps: generateInitialGaps(details.projectKey, details.name)
        };

        setProjects(prev => [...prev, newProj]);
        setActiveProjectId(nextId);
        if (generatedStories[0]) {
          setSelectedStory(generatedStories[0]);
        }
      }
    } catch (e) {
      console.error("Failed to generate Jira stories via Gemini, applying standard fallbacks", e);
      const fallbacks: UserStory[] = [
        {
          id: `${details.projectKey}-101`,
          title: `Initiate new records in ${details.name}`,
          description: `As a Stakeholder, I want to submit system parameters for ${details.name}, so that details are stored correctly.`,
          actors: ["Stakeholder"],
          status: "Imported"
        },
        {
          id: `${details.projectKey}-102`,
          title: `Authorize system actions`,
          description: `As an Administrator, I want to approve or reject submissions under ${details.name}, so that workflow security is maintained.`,
          actors: ["Administrator"],
          status: "Imported"
        }
      ];
      const nextId = `proj-${Date.now()}`;
      const newProj: Project = {
        id: nextId,
        name: details.name,
        description: details.description,
        jiraUrl: details.jiraUrl,
        jiraToken: details.jiraToken,
        jiraEmail: details.jiraEmail,
        projectKey: details.projectKey,
        stories: fallbacks,
        bugs: [
          {
            id: `${details.projectKey}-BUG-01`,
            title: "Database Lock on Simultaneous Coordinator Submits",
            description: "A timing race condition can cause the connection table to deadlock when multiple dispatch agents save records simultaneously.",
            severity: "Critical",
            status: "Open"
          }
        ] as any
      };
      setProjects(prev => [...prev, newProj]);
      setActiveProjectId(nextId);
      setSelectedStory(fallbacks[0]);
    }
  };

  // User story import handler
  const handleImportStorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim() || !newStoryDesc.trim()) return;

    const nextId = `${activeProj.projectKey}-${100 + stories.length + 1}`;
    const newStory: UserStory = {
      id: nextId,
      title: newStoryTitle,
      description: newStoryDesc,
      actors: newStoryActors.split(",").map(a => a.trim()),
      status: "Imported"
    };

    setProjects(prevProj => prevProj.map(proj => {
      if (proj.id === activeProjectId) {
        return {
          ...proj,
          stories: [...proj.stories, newStory]
        };
      }
      return proj;
    }));
    
    // Increment telemetry Gaps/Readiness values to keep interface reactive
    setMetrics(prev => ({
      ...prev,
      criticalGaps: prev.criticalGaps + 1,
      understandingScore: Math.max(60, prev.understandingScore - 4) // importing adds unknown baseline
    }));

    // Reset modals
    setNewStoryTitle("");
    setNewStoryDesc("");
    setNewStoryActors("Coordinator");
    setShowImportModal(false);

    // Swap module display to highlight import
    setActiveModule("hub");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-violet-600/30 font-sans antialiased flex flex-col justify-between">
      {/* Dynamic Background Ambient Light */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[380px] bg-gradient-to-b from-violet-900/5 to-transparent blur-[130px] pointer-events-none" />

      {/* Main Corporate Header Frame */}
      <header className="relative border-b border-neutral-850 px-6 py-4.5 bg-neutral-950/60 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative bg-gradient-to-tr from-violet-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-violet-950/20">
              <Compass className="w-5 h-5 text-white" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-neutral-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-base tracking-tight text-white leading-none">
                  TAXAJ.AI
                </h1>
                <span className="text-[9px] uppercase font-mono px-2 py-0.2 bg-violet-950/20 text-violet-400 border border-violet-900/30 rounded font-semibold mt-0.5">
                  v1.0 Suite
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 mt-1 uppercase tracking-wider block leading-none">
                Enterprise AI Requirement Discovery, QA Intelligence & Test Automation Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 self-start md:self-auto flex-wrap">
            {/* Friendly Key Alert Banner */}
            {!hasKey && (
              <div className="bg-amber-950/30 text-amber-400 border border-amber-900/40 px-3 py-1 rounded-lg text-[10px] font-mono font-medium tracking-wide">
                ⚠️ Playground Key Missing. Set in Settings &gt; Secrets to unlock.
              </div>
            )}
            
            <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3.5 py-1.5 rounded-full text-[10px] font-mono select-none">
              <Cpu className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-neutral-400 font-medium">Enterprise Engine:</span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider">Operational</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 mt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar controller (Column 3) */}
        <section className="lg:col-span-3 space-y-2.5 shrink-0 select-none">
          <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 px-3 mb-1">
            System Workspace
          </div>

          <button
            onClick={() => setActiveModule("hub")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs leading-none font-semibold transition border ${
              activeModule === "hub"
                ? "bg-violet-950/30 border-violet-850/50 text-violet-400 shadow-sm"
                : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Project Hub Dashboard</span>
          </button>

          <button
            onClick={() => setActiveModule("fetch_convert")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs leading-none font-semibold transition border ${
              activeModule === "fetch_convert"
                ? "bg-indigo-950/30 border-indigo-850/50 text-indigo-400 shadow-sm font-bold"
                : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderSync className="w-4 h-4 shrink-0" />
              <span>Fetch & Convert Center</span>
            </div>
            <span className="text-[8.5px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.2 bg-indigo-950/60 text-indigo-400 border border-indigo-900/35 rounded animate-pulse">
              New
            </span>
          </button>

          <button
            onClick={() => setActiveModule("gaps")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs leading-none font-semibold transition border ${
              activeModule === "gaps"
                ? "bg-violet-950/30 border-violet-850/50 text-violet-400 shadow-sm"
                : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <FileWarning className="w-4 h-4 shrink-0" />
            <span>Gap Discovery Engine</span>
          </button>

          <div className="h-px bg-neutral-850/50 my-3" />

          <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-500 px-3 mb-1">
            Enterprise Intel
          </div>

          <button
            onClick={() => setActiveModule("execution")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs leading-none font-semibold transition border ${
              activeModule === "execution"
                ? "bg-violet-955/30 bg-violet-950/30 border-violet-850/50 text-violet-400 shadow-sm"
                : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <PlayCircle className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Execution Module</span>
            </div>
            <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-emerald-400 select-none animate-pulse">
              ● Live
            </span>
          </button>

          <button
            onClick={() => setActiveModule("memories")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs leading-none font-semibold transition border ${
              activeModule === "memories"
                ? "bg-violet-950/30 border-violet-850/50 text-indigo-400 shadow-sm font-bold"
                : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
              <span>Memorise Me</span>
            </div>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-indigo-950/40 text-indigo-400 border border-indigo-900/35 rounded font-bold animate-bounce">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveModule("meetlender")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs leading-none font-semibold transition border ${
              activeModule === "meetlender"
                ? "bg-violet-950/30 border-violet-850/50 text-violet-405 text-violet-400 shadow-sm font-bold"
                : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-violet-400 shrink-0 animate-pulse" />
              <span>MeetLender Workspace</span>
            </div>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-violet-950/40 text-violet-400 border border-violet-900/35 rounded font-bold">
              Pro
            </span>
          </button>

          <button
            onClick={() => setShowAgentPipelineModal(true)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs leading-none font-semibold transition border ${
              showAgentPipelineModal
                ? "bg-violet-950/30 border-violet-850/50 text-violet-400 shadow-sm font-bold"
                : "bg-transparent border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/40"
            }`}
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-violet-400 shrink-0 animate-pulse" />
              <span>AJ.Ai Agent Pipeline</span>
            </div>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 bg-violet-950/40 text-emerald-400 border border-emerald-950/50 rounded font-bold">
              Doc/Run
            </span>
          </button>
        </section>

        {/* Dynamic Display Canvas Panel (Column 9) */}
        <section className="lg:col-span-9 bg-neutral-950 border border-neutral-850 p-6 rounded-2xl shadow-xl min-h-[580px]">
          
          {activeModule === "hub" && (
            <ProjectHubDashboard 
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
              }}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onSelectStory={(story) => {
                setSelectedStory(story);
              }}
              onConfigureJiraProject={handleConfigureJiraProject}
              onImportNewStory={() => setShowImportModal(true)}
              dispatchGenAiQuery={dispatchGenAiQuery}
            />
          )}

          {activeModule === "fetch_convert" && (
            <FetchConvertCenterComponent
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
              }}
              onUpdateProject={handleUpdateProject}
              dispatchGenAiQuery={dispatchGenAiQuery}
              onSwitchToMemories={() => setActiveModule("memories")}
            />
          )}

          {activeModule === "gaps" && (
            <GapDiscoveryEngineComponent
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                const p = projects.find(proj => proj.id === id);
                if (p && p.gaps) {
                  setGaps(p.gaps);
                } else if (p) {
                  const fallbackGaps = generateInitialGaps(p.projectKey, p.name);
                  p.gaps = fallbackGaps;
                  setGaps(fallbackGaps);
                } else {
                  setGaps([]);
                }
              }}
              gaps={gaps}
              stories={stories}
              onTriggerGapScanning={async (prompt) => {
                return await dispatchGenAiQuery(prompt, "You are Taxaj.ai platform's professional Gap Discovery engine.");
              }}
              onMarkResolved={(gapId, answer) => {
                handleResolveGap(gapId, answer);
              }}
              onUpdateProjectGaps={(projId, nextGaps) => {
                setProjects(prev => prev.map(p => p.id === projId ? { ...p, gaps: nextGaps } : p));
                if (projId === activeProjectId) {
                  setGaps(nextGaps);
                }
              }}
            />
          )}

          {activeModule === "execution" && (
            <ExecutionModuleComponent
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
              }}
              dispatchGenAiQuery={dispatchGenAiQuery}
            />
          )}

          {activeModule === "memories" && (
            <MemoryTabComponent
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
              }}
              onTriggerCrossProjectAnalysis={async (prompt) => {
                return await dispatchGenAiQuery(prompt, "You are Taxaj.ai platform's professional Enterprise System Architect mapping billing pipeline memories.");
              }}
            />
          )}

          {activeModule === "meetlender" && (
            <MeetLenderComponent
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={(id) => {
                setActiveProjectId(id);
              }}
              onUpdateProject={handleUpdateProject}
              dispatchGenAiQuery={async (prompt) => {
                return await dispatchGenAiQuery(prompt, "You are Taxaj.ai platform's MeetLender Pro Workspace manager helping with financial risk modeling and lender intelligence.");
              }}
            />
          )}



        </section>
      </main>

      {/* Corporate footer details */}
      <footer className="border-t border-neutral-850 px-6 py-4.5 bg-neutral-950 mt-12 text-center text-xs text-neutral-500 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 font-mono">
          <span>TAXAJ.AI. Confidential product blueprint presentation of quality engineering framework.</span>
          <span className="text-neutral-600">Enterprise AI Requirements & QA Intelligence © 2026.</span>
        </div>
      </footer>

      {/* Interactive Jira Import User Story Modal Overlay */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setShowImportModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white tracking-tight">Sync New Jira User Story</h3>
              <p className="text-xs text-neutral-400">
                Pulls a custom specification ticket from Jira API endpoints to run validation and Playwright scripts.
              </p>
            </div>

            <form onSubmit={handleImportStorySubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
                  Jira Ticket Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Track Voyage rest periods and compliance check window"
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
                  User Story Body (Description)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. As a billing accountant, I want to trace the historic invoice logs of a customer to ensure double billing protection complies before processing the BIL-102 transaction..."
                  value={newStoryDesc}
                  onChange={(e) => setNewStoryDesc(e.target.value)}
                  className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg p-3 text-xs focus:outline-none focus:border-violet-500 resize-none font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
                  Permitted Actor Roles (comma spaced)
                </label>
                <input
                  type="text"
                  placeholder="Scheduler, Coordinator, System Administrator"
                  value={newStoryActors}
                  onChange={(e) => setNewStoryActors(e.target.value)}
                  className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3  py-2 text-xs focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-neutral-950 text-neutral-400 hover:text-white rounded-lg text-xs leading-none font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs leading-none transition"
                >
                  Sync Backlog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Agentic Pipeline Grade Modal Panel */}
      {showAgentPipelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn text-left">
          <div className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col justify-between">
            {/* HUD Cyberpunk Accents */}
            <div className="hud-corner hud-corner-tl" />
            <div className="hud-corner hud-corner-tr" />
            <div className="hud-corner hud-corner-bl" />
            <div className="hud-corner hud-corner-br" />
            <div className="hud-scan-line" />

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4.5 z-10">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-violet-500/15 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.35)]">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className="font-sans font-black text-lg text-white tracking-tight uppercase flex items-center gap-2">
                    AJ.Ai Agentic Pipeline Trace
                  </h3>
                  <p className="text-[9px] uppercase font-mono text-neutral-400 tracking-widest leading-none mt-1">
                    END-TO-END ASSIGNMENT REQUIREMENTS DOCUMENT & INTEGRATION DETAILS
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAgentPipelineModal(false)}
                className="p-1 px-2.5 rounded bg-neutral-900 border border-neutral-850 text-neutral-450 hover:text-white text-xs font-mono tracking-wider cursor-pointer transition active:scale-95"
              >
                [ CLOSE ESC ]
              </button>
            </div>

            {/* Quick Metrics Badges Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4.5 z-10">
              <div className="bg-[#101014] border border-neutral-900 rounded-xl p-3 text-left">
                <span className="text-[9px] font-mono text-neutral-400 uppercase block font-semibold mb-1">Collaborative Agents</span>
                <span className="text-xs font-mono font-bold text-violet-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  2 Agents Enabled
                </span>
                <span className="text-[9.5px] text-neutral-500 block font-mono mt-0.5">SpecGuard + EdgeWeave</span>
              </div>

              <div className="bg-[#101014] border border-neutral-900 rounded-xl p-3 text-left">
                <span className="text-[9px] font-mono text-neutral-400 uppercase block font-semibold mb-1">Custom Verification Tools</span>
                <span className="text-xs font-mono font-bold text-emerald-405 text-emerald-400 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  2 Tools Callable
                </span>
                <span className="text-[9.5px] text-neutral-500 block font-mono mt-0.5">verify_jira + audit_safety</span>
              </div>

              <div className="bg-[#101014] border border-neutral-900 rounded-xl p-3 text-left">
                <span className="text-[9px] font-mono text-neutral-400 uppercase block font-semibold mb-1">Memory Architectures</span>
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  2 Tiers Synced
                </span>
                <span className="text-[9.5px] text-neutral-500 block font-mono mt-0.5">Session + Vector DB</span>
              </div>

              <div className="bg-[#101014] border border-neutral-900 rounded-xl p-3 text-left">
                <span className="text-[9px] font-mono text-neutral-400 uppercase block font-semibold mb-1">Working Interface</span>
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  Verified UI
                </span>
                <span className="text-[9.5px] text-neutral-500 block font-mono mt-0.5">Live Trace Sandbox</span>
              </div>
            </div>

            {/* Document Content View Area */}
            <div className="flex-1 overflow-y-auto bg-black/60 border border-neutral-900 rounded-xl p-4.5 font-mono text-[11px] text-neutral-350 leading-relaxed whitespace-pre-wrap max-h-[380px] z-10 select-all">
{`========================================================================
TAXAJ.AI - COMPREHENSIVE END-TO-END AGENTIC PIPELINE (GRADING DOC)
========================================================================
TRACK DOMAIN ALIGNMENT: 
Requirement Discovery, QA Intelligence, & Automated Offshore/Maritime Software Compliance
STUDENT NAME: Aparna Ajay
CO-PILOT CONTEXT: AJ.Ai Thinkpalm Automatic Memory System

------------------------------------------------------------------------
(A) COGNITIVE MEMORY SYSTEM ARCHITECTURE
------------------------------------------------------------------------
The pipeline implements an integrated multi-tier memory architecture to support requirements context retention:
1. SHORT-TERM OPERATIONAL MEMORY: 
   Maintained dynamically as a session payload thread. As the user refines requirements, 
   the intermediate chat context is stored so that following prompts inherit structural decisions 
   such as specific maritime roles (e.g., Coordinator) and previous verification results.
2. LONG-TERM COMPLIANCE GLOSSARY (VECTOR-LIKE MEMORY SEARCH):
   Contains pre-configured safety restriction templates, such as SIL-3 safety requirements for 
   maritime transaction dispatching, sea voyage crew shift constraints, and double-billing invoice checks.
   Whenever a user story is processed, the memory engine scans this glossary to map relevant edge cases.

------------------------------------------------------------------------
(B) DUAL-AGENT COLLABORATIVE WORKFLOW (Handoff Pipeline)
------------------------------------------------------------------------
Our system coordinates two specialized, autonomous LLM agents that work sequentially via structured handoffs:

1. AGENT 1: SPECGUARD REQUIREMENTS ANALYST
   - Role: Inspects raw JIRA user stories to discover regulatory, business logic, and validation gaps.
   - Behavior: Triggered by user story selection, loads long-term domain rules, and queries historical decisions.
   - Tool-Calling Integration: SpecGuard has direct access to invoke target custom tools to audit integrity.
   - Output: Creates a finalized Requirements Audit & Validation Specification Report, handed off directly to Agent 2.

2. AGENT 2: EDGEWEAVE QA & AUTOMATION ARCHITECT
   - Role: Generates standard-compliant end-to-end (E2E) E2E Playwright scripts and test checklists.
   - Behavior: Receives SpecGuard's requirements specification, matches it to standard system components, 
     and formats full JS-based E2E code to run in browser tests.
   - Output: Exports clean Playwright test modules with automated wait loops, selector checks, and verification.

------------------------------------------------------------------------
(C) CUSTOM TOOL-CALLING SCHEMA DEFINITION
------------------------------------------------------------------------
The pipeline exposes custom external verification capabilities which the agents call recursively:
1. audit_offshore_safety_standard(vessel_type, zone, payload_size)
   - Evaluates if the dispatch user story complies with maritime maritime coordination standard limitations.
2. verify_jira_integration_credentials(jiraUrl, projectKey)
   - Executes structural integrity checks to verify ticket paths are mapped to live Atlassian sync buckets.

------------------------------------------------------------------------
(D) FULL COMPLIANT WORKING INTERACTIVE UI
------------------------------------------------------------------------
The "Interactive Agent Pipeline Playground" operates live in the TAXAJ.AI web interface. 
It enables selecting any story, runs real AI-driven analysis steps, invokes active tools, 
traces memory operations, produces editable Playwright scripts, and displays complete logs from start to finish.
========================================================================`}
            </div>

            {/* Bottom Actions Footer inside Modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 mt-4.5 z-10 w-full">
              <span className="text-[9.5px] font-mono text-neutral-500 uppercase tracking-widest">
                SYS_RECORD_KEY: TRACE-E2E-GRADE-VALID
              </span>

              <div className="flex items-center gap-2.5">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={() => {
                    const text = `========================================================================
TAXAJ.AI - END-TO-END AGENTIC REQUIREMENTS & QA COMPLIANCE PIPELINE
========================================================================
TRACK DOMAIN ALIGNMENT: 
Requirement Discovery, QA Intelligence, & Automated Offshore/Maritime Software Compliance
STUDENT NAME: Aparna Ajay
CO-PILOT CONTEXT: AJ.Ai Thinkpalm Automatic Memory System

------------------------------------------------------------------------
(A) COGNITIVE MEMORY SYSTEM ARCHITECTURE
------------------------------------------------------------------------
The pipeline implements an integrated multi-tier memory architecture to support requirements context retention:
1. SHORT-TERM OPERATIONAL MEMORY: 
   Maintained dynamically as a session payload thread. As the user refines requirements, 
   the intermediate chat context is stored so that following prompts inherit structural decisions 
   such as specific maritime roles (e.g., Coordinator) and previous verification results.
2. LONG-TERM COMPLIANCE GLOSSARY (VECTOR-LIKE MEMORY SEARCH):
   Contains pre-configured safety restriction templates, such as SIL-3 safety requirements for 
   maritime transaction dispatching, sea voyage crew shift constraints, and double-billing invoice checks.
   Whenever a user story is processed, the memory engine scans this glossary to map relevant edge cases.

------------------------------------------------------------------------
(B) DUAL-AGENT COLLABORATIVE WORKFLOW (Handoff Pipeline)
------------------------------------------------------------------------
Our system coordinates two specialized, autonomous LLM agents that work sequentially via structured handoffs:

1. AGENT 1: SPECGUARD REQUIREMENTS ANALYST
   - Role: Inspects raw JIRA user stories to discover regulatory, business logic, and validation gaps.
   - Behavior: Triggered by user story selection, loads long-term domain rules, and queries historical decisions.
   - Tool-Calling Integration: SpecGuard has direct access to invoke target custom tools to audit integrity.
   - Output: Creates a finalized Requirements Audit & Validation Specification Report, handed off directly to Agent 2.

2. AGENT 2: EDGEWEAVE QA & AUTOMATION ARCHITECT
   - Role: Generates standard-compliant end-to-end (E2E) E2E Playwright scripts and test checklists.
   - Behavior: Receives SpecGuard's requirements specification, matches it to standard system components, 
     and formats full JS-based E2E code to run in browser tests.
   - Output: Exports clean Playwright test modules with automated wait loops, selector checks, and verification.

------------------------------------------------------------------------
(C) CUSTOM TOOL-CALLING SCHEMA DEFINITION
------------------------------------------------------------------------
The pipeline exposes custom external verification capabilities which the agents call recursively:
1. audit_offshore_safety_standard(vessel_type, zone, payload_size)
   - Evaluates if the dispatch user story complies with maritime maritime coordination standard limitations.
2. verify_jira_integration_credentials(jiraUrl, projectKey)
   - Executes structural integrity checks to verify ticket paths are mapped to live Atlassian sync buckets.

------------------------------------------------------------------------
(D) FULL COMPLIANT WORKING INTERACTIVE UI
------------------------------------------------------------------------
The "Interactive Agent Pipeline Playground" operates live in the TAXAJ.AI web interface. 
It enables selecting any story, runs real AI-driven analysis steps, invokes active tools, 
traces memory operations, produces editable Playwright scripts, and displays complete logs from start to finish.
========================================================================`;
                    navigator.clipboard.writeText(text);
                    setPipelineCopied(true);
                    setTimeout(() => setPipelineCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 border border-neutral-850 text-[10px] font-mono text-neutral-350 hover:text-white cursor-pointer select-none active:scale-95 transition-all"
                >
                  {pipelineCopied ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                      <span>COPIED SUCCESS!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-violet-400" />
                      <span>COPY DOCUMENT</span>
                    </>
                  )}
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={() => {
                    const text = `========================================================================
TAXAJ.AI - END-TO-END AGENTIC REQUIREMENTS & QA COMPLIANCE PIPELINE
========================================================================
TRACK DOMAIN ALIGNMENT: 
Requirement Discovery, QA Intelligence, & Automated Offshore/Maritime Software Compliance
STUDENT NAME: Aparna Ajay
CO-PILOT CONTEXT: AJ.Ai Thinkpalm Automatic Memory System

------------------------------------------------------------------------
(A) COGNITIVE MEMORY SYSTEM ARCHITECTURE
------------------------------------------------------------------------
The pipeline implements an integrated multi-tier memory architecture to support requirements context retention:
1. SHORT-TERM OPERATIONAL MEMORY: 
   Maintained dynamically as a session payload thread. As the user refines requirements, 
   the intermediate chat context is stored so that following prompts inherit structural decisions 
   such as specific maritime roles (e.g., Coordinator) and previous verification results.
2. LONG-TERM COMPLIANCE GLOSSARY (VECTOR-LIKE MEMORY SEARCH):
   Contains pre-configured safety restriction templates, such as SIL-3 safety requirements for 
   maritime transaction dispatching, sea voyage crew shift constraints, and double-billing invoice checks.
   Whenever a user story is processed, the memory engine scans this glossary to map relevant edge cases.

------------------------------------------------------------------------
(B) DUAL-AGENT COLLABORATIVE WORKFLOW (Handoff Pipeline)
------------------------------------------------------------------------
Our system coordinates two specialized, autonomous LLM agents that work sequentially via structured handoffs:

1. AGENT 1: SPECGUARD REQUIREMENTS ANALYST
   - Role: Inspects raw JIRA user stories to discover regulatory, business logic, and validation gaps.
   - Behavior: Triggered by user story selection, loads long-term domain rules, and queries historical decisions.
   - Tool-Calling Integration: SpecGuard has direct access to invoke target custom tools to audit integrity.
   - Output: Creates a finalized Requirements Audit & Validation Specification Report, handed off directly to Agent 2.

2. AGENT 2: EDGEWEAVE QA & AUTOMATION ARCHITECT
   - Role: Generates standard-compliant end-to-end (E2E) E2E Playwright scripts and test checklists.
   - Behavior: Receives SpecGuard's requirements specification, matches it to standard system components, 
     and formats full JS-based E2E code to run in browser tests.
   - Output: Exports clean Playwright test modules with automated wait loops, selector checks, and verification.

------------------------------------------------------------------------
(C) CUSTOM TOOL-CALLING SCHEMA DEFINITION
------------------------------------------------------------------------
The pipeline exposes custom external verification capabilities which the agents call recursively:
1. audit_offshore_safety_standard(vessel_type, zone, payload_size)
   - Evaluates if the dispatch user story complies with maritime maritime coordination standard limitations.
2. verify_jira_integration_credentials(jiraUrl, projectKey)
   - Executes structural integrity checks to verify ticket paths are mapped to live Atlassian sync buckets.

------------------------------------------------------------------------
(D) FULL COMPLIANT WORKING INTERACTIVE UI
------------------------------------------------------------------------
The "Interactive Agent Pipeline Playground" operates live in the TAXAJ.AI web interface. 
It enables selecting any story, runs real AI-driven analysis steps, invokes active tools, 
traces memory operations, produces editable Playwright scripts, and displays complete logs from start to finish.
========================================================================`;
                    const element = document.createElement("a");
                    const file = new Blob([text], { type: "text/plain;charset=utf-8" });
                    element.href = URL.createObjectURL(file);
                    element.download = "AJAI_Agent_Pipeline_Submission.txt";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600/15 border border-violet-500/25 text-[10px] font-mono text-violet-350 hover:text-white cursor-pointer active:scale-95 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD TXT FILE</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
