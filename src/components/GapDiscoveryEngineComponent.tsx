import React, { useState } from "react";
import { Gap, UserStory, Project } from "../types";
import { 
  AlertCircle, 
  HelpCircle, 
  FileWarning, 
  Play, 
  CheckCircle, 
  Cpu, 
  ShieldCheck,
  ChevronLeft,
  Briefcase,
  ChevronRight,
  PlusCircle,
  FileText,
  AlertTriangle,
  FileCheck,
  CheckSquare
} from "lucide-react";

interface GapDiscoveryEngineComponentProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  gaps: Gap[];
  stories: UserStory[];
  onTriggerGapScanning: (storyText: string) => Promise<string>;
  onMarkResolved: (gapId: string, answer: string) => void;
  onUpdateProjectGaps?: (projectId: string, gaps: Gap[]) => void;
}

export default function GapDiscoveryEngineComponent({
  projects,
  activeProjectId,
  onSelectProject,
  gaps,
  stories,
  onTriggerGapScanning,
  onMarkResolved,
  onUpdateProjectGaps
}: GapDiscoveryEngineComponentProps) {
  // Navigation state - viewingProjectId allows "going inside" a project
  const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);
  
  // Active story and Scanner state
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string>("");
  
  // State for manual gap logging
  const [showLogForm, setShowLogForm] = useState(false);
  const [newGapCategory, setNewGapCategory] = useState<"Workflow State" | "Business Rule" | "Validation" | "Notification" | "Exception">("Workflow State");
  const [newGapDesc, setNewGapDesc] = useState("");
  const [newGapSeverity, setNewGapSeverity] = useState<"High" | "Medium" | "Low">("Medium");
  const [newGapStoryId, setNewGapStoryId] = useState("");
  const [newGapPointsInput, setNewGapPointsInput] = useState("");

  // Resolving panel state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [clarificationInput, setClarificationInput] = useState("");

  // Interactive checked missing points
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});

  // Get active project details
  const currentProject = projects.find(p => p.id === viewingProjectId);
  const projectGaps = currentProject?.gaps || [];
  const projectStories = currentProject?.stories || [];

  // Sync selected story ID when project is loaded or changed
  const handleSelectProjectAndGoInside = (proj: Project) => {
    setViewingProjectId(proj.id);
    onSelectProject(proj.id);
    if (proj.stories && proj.stories.length > 0) {
      setSelectedStoryId(proj.stories[0].id);
    } else {
      setSelectedStoryId("");
    }
    setAiReport("");
  };

  const handleBackToProjects = () => {
    setViewingProjectId(null);
  };

  const exploreAIGaps = async () => {
    const activeStory = projectStories.find((s) => s.id === selectedStoryId);
    if (!activeStory) return;
    
    setLoading(true);
    setAiReport("");
    try {
      const prompt = `Perform an elite Taxaj.ai Gap Discovery scan on this software requirement:
User Story ID: ${activeStory.id}
User Story Title: ${activeStory.title}
User Story Description: ${activeStory.description}

Analyze the target item across these 5 strict Taxaj.ai Gap Categories:
1. Missing Workflow States (e.g. reject, cancel, escalate, resubmit, reopen)
2. Missing Business/Validation Rules
3. Missing Exception Handling (e.g. network timeout, service offline)
4. Missing Permission/Role Controls
5. Missing Notification Triggers

Format the output as a beautiful, high-contrast, structured Taxaj.ai GAP ANALYSIS REPORT with headers, bullet points, severity grades (High, Medium, Low), and tactical QA recommendations. Mention any specific missing parts clearly.`;
      
      const resText = await onTriggerGapScanning(prompt);
      setAiReport(resText);
    } catch (e) {
      setAiReport("⚠️ Failed to invoke Gemini full-stack gap scanner. Please ensure your GEMINI_API_KEY is configured.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewGap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGapDesc.trim() || !viewingProjectId) return;

    const pointsArray = newGapPointsInput
      .split("\n")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const newGapItem: Gap = {
      id: `${currentProject?.projectKey}-GAP-0${projectGaps.length + 1}`,
      category: newGapCategory,
      description: newGapDesc,
      severity: newGapSeverity,
      status: "Unresolved",
      storyId: newGapStoryId || undefined,
      gapPoints: pointsArray.length > 0 ? pointsArray : ["Validate input parameters", "Verify role definitions"]
    };

    const updatedGaps = [newGapItem, ...projectGaps];
    if (onUpdateProjectGaps) {
      onUpdateProjectGaps(viewingProjectId, updatedGaps);
    }

    // Reset Form
    setNewGapDesc("");
    setNewGapStoryId("");
    setNewGapPointsInput("");
    setShowLogForm(false);
  };

  const togglePointCheck = (pointKey: string) => {
    setCheckedPoints(prev => ({
      ...prev,
      [pointKey]: !prev[pointKey]
    }));
  };

  const getSeverityBadgeClass = (sev: "High" | "Medium" | "Low") => {
    switch (sev) {
      case "High": return "bg-rose-950/30 text-rose-400 border border-rose-900/40";
      case "Medium": return "bg-amber-950/30 text-amber-400 border border-amber-900/40";
      case "Low": return "bg-sky-950/30 text-sky-400 border border-sky-905/40";
    }
  };

  // -----------------------------------------------------------------
  // VIEW 1: Project Selection Dashboard
  // -----------------------------------------------------------------
  if (!viewingProjectId) {
    return (
      <div className="space-y-6" id="gap-project-explorer">
        {/* Intro banner */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-2">
          <div className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-amber-400" />
            <h3 className="font-sans font-semibold text-white text-sm">Module 8: Gap Discovery Engine Portal</h3>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
            Existing QA tools blindly create test cases based on assumptions that requirements are fully complete. 
            Taxaj.ai acts as an AI firewall. Select a workspace project below and drill inside to perform strict requirement audits, identify missing exception routes, check points, and map user story deficiencies.
          </p>
        </div>

        {/* Heading */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
            Enterprise Projects Active for Auditing ({projects.length})
          </span>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const openGaps = (proj.gaps || []).filter(g => g.status === "Unresolved").length;
            const resolvedGaps = (proj.gaps || []).filter(g => g.status === "Clarified").length;
            return (
              <div
                key={proj.id}
                onClick={() => handleSelectProjectAndGoInside(proj)}
                id={`project-card-${proj.id}`}
                className="group relative bg-[#131315] hover:bg-[#18181b] border border-neutral-800/80 hover:border-violet-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                {/* Glowing border effects on hover */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 p-3 bg-neutral-950 border-l border-b border-neutral-850 text-indigo-400 text-[10px] font-mono tracking-wider uppercase font-bold rounded-bl-xl leading-none">
                  {proj.projectKey}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    <Briefcase className="w-4 h-4 text-violet-400" />
                    <h4 className="text-sm font-sans font-extrabold text-white group-hover:text-violet-300 transition-colors">
                      {proj.name}
                    </h4>
                  </div>

                  <p className="text-[11.5px] text-neutral-400 leading-relaxed font-sans line-clamp-3">
                    {proj.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 border-t border-b border-neutral-850/80 py-3 mt-1 text-center bg-neutral-950/40 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Stories</span>
                      <span className="text-xs font-mono font-bold text-white">{proj.stories?.length || 0}</span>
                    </div>
                    <div className="space-y-0.5 border-l border-r border-neutral-850">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Bugs</span>
                      <span className="text-xs font-mono font-bold text-rose-450 text-rose-450">{proj.bugs?.length || 0}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-neutral-500 uppercase block">Open Gaps</span>
                      <span className="text-xs font-mono font-bold text-amber-400">{openGaps}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">
                    {resolvedGaps} Resolved / {openGaps + resolvedGaps} Total
                  </span>
                  <span className="flex items-center gap-1 text-violet-400 group-hover:text-violet-300 group-hover:translate-x-1 transition-all font-bold">
                    Go Inside <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // VIEW 2: Inside Project Gap Discovery Details
  // -----------------------------------------------------------------
  return (
    <div className="space-y-6" id="project-gap-details-view">
      {/* Back navigation and project header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-850 rounded-2xl p-5 shadow-lg">
        <div className="space-y-1.5">
          <button
            onClick={handleBackToProjects}
            className="group flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition font-mono mb-2 bg-neutral-950 border border-neutral-850 px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Projects List
          </button>
          
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-violet-950 text-violet-400 border border-violet-900/60 font-mono text-[10px] font-bold rounded">
              Project Code: {currentProject.projectKey}
            </span>
            <h3 className="font-sans font-extrabold text-white text-base">
              Gap Matrix &mdash; {currentProject.name}
            </h3>
          </div>
          <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
            {currentProject.description}
          </p>
        </div>

        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="px-4 py-2 bg-neutral-950 hover:bg-neutral-850 text-white border border-neutral-800 hover:border-neutral-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition select-none self-end sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>Log Custom Gap</span>
        </button>
      </div>

      {/* Manual Gap log form modal expand */}
      {showLogForm && (
        <form onSubmit={handleAddNewGap} className="p-5 bg-[#131315] border border-neutral-800 rounded-2xl gap-y-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in shadow-xl">
          <div className="col-span-1 md:col-span-2 flex items-center justify-between border-b border-neutral-850 pb-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-violet-400" /> Log Newly Identified Gap
            </h4>
            <button type="button" onClick={() => setShowLogForm(false)} className="text-xs text-neutral-500 hover:text-white">✕ Close</button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Gap Category</label>
            <select
              value={newGapCategory}
              onChange={(e) => setNewGapCategory(e.target.value as any)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-sans"
            >
              <option value="Workflow State">Workflow State</option>
              <option value="Business Rule">Business Rule</option>
              <option value="Validation">Validation</option>
              <option value="Notification">Notification</option>
              <option value="Exception">Exception</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Severity</label>
            <select
              value={newGapSeverity}
              onChange={(e) => setNewGapSeverity(e.target.value as any)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-sans"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Related User Story</label>
            <select
              value={newGapStoryId}
              onChange={(e) => setNewGapStoryId(e.target.value)}
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-sans"
            >
              <option value="">-- No specific story --</option>
              {projectStories.map(s => (
                <option key={s.id} value={s.id}>{s.id}: {s.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Deficient Description / Found Gap</label>
            <input
              type="text"
              value={newGapDesc}
              onChange={(e) => setNewGapDesc(e.target.value)}
              required
              placeholder="e.g. Missing rollback state on transaction communication handshakes..."
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-sans"
            />
          </div>

          <div className="col-span-1 md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
              Gap Points / Missing Requirement Items (One item per line)
            </label>
            <textarea
              value={newGapPointsInput}
              onChange={(e) => setNewGapPointsInput(e.target.value)}
              rows={3}
              placeholder="e.g.&#10;No rollback to Pending state defined&#10;Failure error notification rules absent&#10;Alternative failover node limits not configured"
              className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg p-3 text-xs focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowLogForm(false)}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white rounded-lg transition shadow-md cursor-pointer"
            >
              Log Backlog Gap
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Left Gaps list & Right diagnostics scan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Columns - Project Discovered Gaps List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Active Gap checklist ({projectGaps.filter(g => g.status === "Unresolved").length} open deficiencies)
            </span>
          </div>

          {projectGaps.length === 0 ? (
            <div className="p-8 bg-neutral-950/40 border border-neutral-850/80 rounded-2xl text-center space-y-1.5">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <h5 className="text-xs font-sans font-bold text-white">No Gaps Discovered</h5>
              <p className="text-[11px] text-neutral-500 leading-normal max-w-sm mx-auto">
                No active gaps are logged in this project files. Use our AI Active Gap Scanner on the right to read stories and automatically flag new ones!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectGaps.map((gap) => {
                const relatedStory = projectStories.find((s) => s.id === gap.storyId);
                const isClarified = gap.status === "Clarified";

                return (
                  <div
                    key={gap.id}
                    id={`gap-item-${gap.id}`}
                    className={`p-5 rounded-2xl border transition-all duration-300 shadow-sm space-y-4 ${
                      isClarified
                        ? "bg-emerald-950/5 border-emerald-900/20 opacity-75"
                        : "bg-[#131315] border-neutral-850 hover:border-neutral-800"
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[9px] font-bold text-violet-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded leading-none">
                            {gap.id}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase text-neutral-400 tracking-wider">
                            {gap.category}
                          </span>
                          <span className={`text-[8.5px] font-mono font-extrabold uppercase tracking-widest px-1.5 py-0.2 rounded leading-none ${getSeverityBadgeClass(gap.severity)}`}>
                            {gap.severity}
                          </span>
                        </div>

                        <h5 className="text-xs font-sans font-bold text-white leading-normal pt-1">
                          {gap.description}
                        </h5>
                      </div>

                      {/* Resolution triggers */}
                      {isClarified ? (
                        <span className="p-1 px-2 rounded-lg bg-emerald-950/40 text-emerald-400 shrink-0 border border-emerald-900/30 text-[9px] font-mono font-bold flex items-center gap-1 select-none">
                          <FileCheck className="w-3.5 h-3.5" />
                          Clarified
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setResolvingId(gap.id);
                            setClarificationInput(gap.resolvedAnswer || "");
                          }}
                          className="text-[10.5px] font-mono text-violet-400 hover:text-violet-300 bg-violet-950/25 px-2.5 py-1 border border-violet-900/50 hover:bg-violet-950/40 transition rounded-lg cursor-pointer shrink-0 select-none font-bold"
                        >
                          Resolve
                        </button>
                      )}
                    </div>

                    {/* Mapped Related Story Detail (Traceability) */}
                    {relatedStory && (
                      <div className="bg-neutral-950/80 border border-neutral-850/40 p-3 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[9px] font-mono uppercase font-bold text-[indigo-400] text-indigo-400">
                            Linked Backlog ticket &rarr; {relatedStory.id}
                          </span>
                        </div>
                        <h6 className="text-[11px] font-sans font-bold text-neutral-300 leading-tight">
                          {relatedStory.title}
                        </h6>
                        <p className="text-[10px] text-neutral-500 leading-relaxed italic pr-2">
                          "{relatedStory.description}"
                        </p>
                      </div>
                    )}

                    {/* Interactive Gap Points (Missing parts checkbox list) */}
                    {gap.gapPoints && gap.gapPoints.length > 0 && (
                      <div className="space-y-2 border-t border-neutral-850/60 pt-3">
                        <span className="text-[9.5px] font-mono uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                          Gap Checkpoints to Verify ({gap.gapPoints.length})
                        </span>
                        
                        <div className="grid grid-cols-1 gap-2 pl-1">
                          {gap.gapPoints.map((point, index) => {
                            const pointKey = `${gap.id}-point-${index}`;
                            const isChecked = checkedPoints[pointKey] || false;
                            return (
                              <div
                                key={index}
                                onClick={() => togglePointCheck(pointKey)}
                                className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition select-none ${
                                  isChecked 
                                    ? "bg-emerald-950/10 border border-emerald-900/20 text-neutral-400" 
                                    : "bg-neutral-950/30 border border-neutral-850/20 text-neutral-300 hover:bg-neutral-950"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="mt-0.5 rounded border-neutral-800 bg-neutral-950 text-violet-600 focus:ring-violet-500/30 h-3.5 w-3.5"
                                />
                                <span className={`text-[10.5px] leading-snug font-sans ${isChecked ? "line-through opacity-60 text-emerald-400" : ""}`}>
                                  {point}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inline clarification save box */}
                    {resolvingId === gap.id && (
                      <div className="mt-3 bg-neutral-900/80 p-4 rounded-xl border border-neutral-850 space-y-3 animate-fade-in shadow-inner">
                        <label className="text-[9px] font-mono uppercase text-neutral-400 font-bold block">
                          Clarification rule decision
                        </label>
                        <input
                          type="text"
                          value={clarificationInput}
                          onChange={(e) => setClarificationInput(e.target.value)}
                          placeholder="e.g. APPROVED workflow reverts to Draft state on manual rejection, triggering system notification."
                          className="w-full bg-neutral-950 text-white border border-neutral-850 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-sans"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setResolvingId(null)}
                            className="px-3 py-1 font-mono text-[10px] text-neutral-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!clarificationInput.trim()}
                            onClick={() => {
                              onMarkResolved(gap.id, clarificationInput);
                              
                              // Local sync view
                              if (onUpdateProjectGaps) {
                                const localNext = projectGaps.map(g => g.id === gap.id ? { ...g, status: "Clarified" as const, resolvedAnswer: clarificationInput } : g);
                                onUpdateProjectGaps(viewingProjectId, localNext);
                              }

                              setResolvingId(null);
                            }}
                            className="px-3 py-1 text-[10.5px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition select-none"
                          >
                            Save Definition
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Resolved Rule Decided Output block */}
                    {isClarified && gap.resolvedAnswer && (
                      <div className="mt-2.5 bg-neutral-950 border border-emerald-950 p-3 rounded-xl text-[11px] text-neutral-400 font-sans leading-relaxed">
                        <span className="text-emerald-400 font-mono text-[9px] font-bold block mb-1 uppercase tracking-wider">
                          ✓ Resolved Stakeholder Decision:
                        </span>
                        {gap.resolvedAnswer}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Columns - Active Diagnosing Scan Simulator Console */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-850 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
            <div>
              <h4 className="text-xs font-semibold text-neutral-200 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-violet-400 animate-pulse" /> Active AI Gap Scanner
              </h4>
              <p className="text-[10px] text-neutral-400 font-mono">Simulate real-time Gemini audits on project user stories</p>
            </div>
          </div>

          {/* Selection interface */}
          <div className="space-y-3 bg-[#131315] p-4 rounded-xl border border-neutral-850">
            <label className="text-[9.5px] font-mono text-neutral-500 uppercase font-bold block">
              1. Choose User Story from active project stories ({projectStories.length})
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStoryId}
                onChange={(e) => {
                  setSelectedStoryId(e.target.value);
                  setAiReport("");
                }}
                className="bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 flex-1 font-mono"
              >
                {projectStories.length === 0 ? (
                  <option value="">No stories present</option>
                ) : (
                  projectStories.map(s => (
                    <option key={s.id} value={s.id}>{s.id}: {s.title}</option>
                  ))
                )}
              </select>
              <button
                onClick={exploreAIGaps}
                disabled={loading || projectStories.length === 0}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 text-white font-semibold rounded-lg text-xs leading-none shadow-lg active:scale-95 transition duration-200 cursor-pointer select-none"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Parsing Target...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run AI Gap Detection</span>
                  </>
                )}
              </button>
            </div>

            {/* Read story description inline */}
            {selectedStoryId && (
              <div className="mt-2.5 border-t border-neutral-850 pt-2 text-[11px] text-neutral-400 font-sans leading-relaxed">
                <span className="text-[9px] font-mono font-bold text-violet-400 mr-1.5 uppercase">Draft context:</span>
                "{projectStories.find(st => st.id === selectedStoryId)?.description}"
              </div>
            )}
          </div>

          {/* Diagnostic report terminal outbox */}
          <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 min-h-64 whitespace-pre-wrap flex flex-col justify-between">
            {aiReport ? (
              <div className="prose prose-invert text-xs max-w-none text-neutral-300 font-sans leading-relaxed space-y-3 font-medium">
                {aiReport}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 py-16 font-mono text-xs">
                <HelpCircle className="w-8 h-8 text-neutral-700 mb-2" />
                <span>Diagnostic Report Board</span>
                <span className="text-[10px] text-neutral-700 mt-1.5 uppercase tracking-widest leading-none">
                  Select a User story above and click "Run AI Gap Detection"
                </span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
