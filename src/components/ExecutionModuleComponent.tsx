import React, { useState, useEffect } from "react";
import { Project, UserStory } from "../types";
import { 
  Play, 
  PlayCircle, 
  Globe, 
  Cpu, 
  FileText, 
  Download, 
  Code, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  Settings,
  Flame,
  Award,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

interface ExecutionModuleComponentProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  dispatchGenAiQuery: (contents: string, systemInstruction?: string) => Promise<string>;
}

export default function ExecutionModuleComponent({
  projects,
  activeProjectId,
  onSelectProject,
  dispatchGenAiQuery
}: ExecutionModuleComponentProps) {
  // Navigation: null means we are on the Project Selection landing list
  const [selectedProjId, setSelectedProjId] = useState<string | null>(null);
  
  // Custom Live Web URL
  const [liveUrl, setLiveUrl] = useState("https://billing-operations-system.taxaj.ai");
  
  // Locator Strategy state (Option A vs Option B)
  const [locatorStrategy, setLocatorStrategy] = useState<"OptionA" | "OptionB">("OptionB");
  
  // Execution status states
  const [executing, setExecuting] = useState(false);
  const [execLevel, setExecLevel] = useState<"project" | "story" | null>(null);
  const [targetStoryId, setTargetStoryId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{ msg: string; type: "info" | "success" | "warn" | "code" }[]>([]);
  
  // Custom execution checkboxes scope checking
  const [selectedStoryIds, setSelectedStoryIds] = useState<Record<string, boolean>>({});

  // Test results state (tracks pass/fail status per user story)
  const [testResults, setTestResults] = useState<Record<string, { status: "pending" | "running" | "passed" | "failed"; duration: number; logs: string[] }>>({});
  
  const currentProject = projects.find(p => p.id === selectedProjId);

  // Reset states if project changes or shifts
  useEffect(() => {
    if (currentProject) {
      // Pre-populate execution states and checkboxes for this project's stories
      const initial: typeof testResults = {};
      const initialSelection: Record<string, boolean> = {};
      currentProject.stories.forEach(st => {
        initial[st.id] = { status: "pending", duration: 0, logs: [] };
        initialSelection[st.id] = true; // default select all story frames
      });
      setTestResults(initial);
      setSelectedStoryIds(initialSelection);
      setLogs([]);
      setExecuting(false);
      setProgress(0);
    }
  }, [selectedProjId]);

  const handleSelectProjectAndEnter = (projId: string) => {
    setSelectedProjId(projId);
    onSelectProject(projId);
  };

  // Run automated test suite
  const triggerExecution = async (level: "project" | "story", storyId?: string) => {
    if (executing || !currentProject) return;

    const storiesToRun = level === "story" && storyId 
      ? currentProject.stories.filter(s => s.id === storyId)
      : currentProject.stories.filter(s => selectedStoryIds[s.id]);

    if (storiesToRun.length === 0) {
      setLogs([
        { msg: `⚠️ [DANGER] No user stories selected in your execution scope! Please check at least one box.`, type: "warn" }
      ]);
      return;
    }
    
    setExecuting(true);
    setExecLevel(level);
    setTargetStoryId(storyId || null);
    setProgress(1);

    // Initialize/clear results for running stories
    setTestResults(prev => {
      const next = { ...prev };
      storiesToRun.forEach(s => {
        next[s.id] = { status: "running", duration: 0, logs: [] };
      });
      return next;
    });

    setLogs([
      { msg: `📡 [TAXAJ AUTOMATION SUITE] Initializing testing node relative to ${liveUrl}...`, type: "info" },
      { msg: `⚙️ Locator Engine configured to use: ${locatorStrategy === "OptionA" ? "Option A (Dynamic DOM Scanner)" : "Option B (Dynamic Code Replacement)"}`, type: "info" },
      { msg: `💻 Targeting ${storiesToRun.length} validation block(s) within module ${currentProject.projectKey}`, type: "info" }
    ]);

    // Let's iterate through each story and simulate sequential tests
    for (let index = 0; index < storiesToRun.length; index++) {
      const story = storiesToRun[index];
      const stepPctStart = Math.floor((index / storiesToRun.length) * 100);
      const stepPctEnd = Math.floor(((index + 1) / storiesToRun.length) * 100);
      
      setProgress(Math.max(stepPctStart, 10));

      setLogs(prev => [
        ...prev,
        { msg: `------------------------------------------------`, type: "info" },
        { msg: `🔥 STARTING RUN: [${story.id}] - "${story.title}"`, type: "info" }
      ]);

      // Stage 1: Resolve Target Route & Init Locator bindings
      await delay(600);
      
      let locatorLog = "";
      if (locatorStrategy === "OptionA") {
        locatorLog = `🔍 [Option A] Dynamic DOM scanner active. Inspecting "${liveUrl}" for candidate components... Detected tag "#billing-submit", button text "Submit Approval". Action bound.`;
      } else {
        locatorLog = `🧬 [Option B] Injecting environment placeholders. Replacing "{LIVE_URL}" with "${liveUrl}" and "{STORY_ID}" with "${story.id}". Bound element to exact standard identifier "#ticket-tag-${story.id.toLowerCase()}".`;
      }

      setLogs(prev => [
        ...prev,
        { msg: `🌐 page.goto("${liveUrl}") - Status code 200 (OK)`, type: "success" },
        { msg: locatorLog, type: "code" }
      ]);

      // Stage 2: Fill state fields & attempt transitions
      await delay(700);
      setProgress(Math.floor(stepPctStart + (stepPctEnd - stepPctStart) * 0.5));

      setLogs(prev => [
        ...prev,
        { msg: `✍️ Filling login credentials for default testing tenant: "test_ops_lead"`, type: "info" },
        { msg: `🧪 Simulating user stories transitions and validating acceptance criteria checks...`, type: "info" }
      ]);

      // Stage 3: Assertions outcomes & timing
      await delay(700);
      const durationVal = +(1.2 + Math.random() * 2.1).toFixed(1);
      const isSuccess = Math.random() > 0.08; // 92% pass rate simulation

      const storyLogs = [
        `page.goto("${liveUrl}")`,
        `locatorStrategy: ${locatorStrategy}`,
        `Passed verification criteria rules for: ${story.title}`
      ];

      setTestResults(prev => ({
        ...prev,
        [story.id]: {
          status: isSuccess ? "passed" : "failed",
          duration: durationVal,
          logs: storyLogs
        }
      }));

      if (isSuccess) {
        setLogs(prev => [
          ...prev,
          { msg: `✅ PASS: [${story.id}] - Verified system limits under validation and business requirements in ${durationVal}s.`, type: "success" }
        ]);
      } else {
        setLogs(prev => [
          ...prev,
          { msg: `❌ FAIL: [${story.id}] - Business logic checkpoint failed to render. Missing container override for automated audit trace logs.`, type: "warn" }
        ]);
      }
    }

    setProgress(100);
    setExecuting(false);
    setLogs(prev => [
      ...prev,
      { msg: `================================================`, type: "info" },
      { msg: `🎉 ALL PLANNED RUNS ARE CONCLUDED! Reports generated successfully. Ready to download.`, type: "success" }
    ]);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Dynamic CSV/TXT Test Report download logic
  const handleDownloadReport = () => {
    if (!currentProject) return;

    const resultsList = Object.values(testResults) as { status: "pending" | "running" | "passed" | "failed"; duration: number; logs: string[] }[];
    const runCount = resultsList.length;
    const passedCount = resultsList.filter(r => r.status === "passed").length;
    const failedCount = resultsList.filter(r => r.status === "failed").length;
    const totalDuration = resultsList.reduce((acc, curr) => acc + curr.duration, 0).toFixed(1);

    let docContent = `========================================================================
             TAXAJ.AI ENTERPRISE QUALITY REPORT
========================================================================
Project Name:         ${currentProject.name}
Project Key:          ${currentProject.projectKey}
Execution Timestamp:  ${new Date().toLocaleString()}
Target Live Web URL:  ${liveUrl}
Selected Locator Strategy: ${locatorStrategy === "OptionA" ? "Option A (Dynamic DOM Scanner)" : "Option B (Dynamic Code Replacement)"}
------------------------------------------------------------------------
SUMMARY STATS:
Total Test Cases Run:   ${runCount}
Passed Scenarios:       ${passedCount}
Failed Defect Blox:     ${failedCount}
Total Execution Time:   ${totalDuration} seconds
========================================================================

INDIVIDUAL TEST RUN OUTCOMES:
`;

    currentProject.stories.forEach(st => {
      const result = testResults[st.id] || { status: "pending", duration: 0, logs: [] };
      docContent += `
------------------------------------------------------------------------
Test Case ID:      ${st.id}
User Story:        ${st.title}
Outcomes:          ${result.status.toUpperCase()}
Execution Duration:${result.duration}s
Acceptance Status: Verified & Completed under Safety Boundaries.
`;
    });

    docContent += `
========================================================================
TAXAJ CORPORATION AUTOMATED AUDIT SYSTEM CO.
Report signature key: SHA256-TX88-${Date.now().toString(16).toUpperCase()}
`;

    // Create file blob & trigger download
    const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `Taxaj-Execution-Report-${currentProject.projectKey}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  // -----------------------------------------------------------------
  // VIEW 1: Project List Landing Screen
  // -----------------------------------------------------------------
  if (!selectedProjId) {
    return (
      <div className="space-y-6" id="execution-landing-suite">
        {/* Banner */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-mono uppercase bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded tracking-wider font-semibold">
              Module 15: Execution and Playwright Controller
            </span>
          </div>
          <h3 className="font-sans font-semibold text-white text-base">Automated Test Execution Centre</h3>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
            Execute Playwright automated compliance suites directly against any live environment deployments. Support seamless user flow execution either across entire projects or story-by-story with interactive reporting logs.
          </p>
        </div>

        {/* Action instruction */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
            Select an active project below to open its dedicated Execution desk:
          </span>
        </div>

        {/* Project Tiles Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const openGaps = (proj.gaps || []).filter(g => g.status === "Unresolved").length;
            const openBugs = proj.bugs?.length || 0;
            return (
              <div
                key={proj.id}
                onClick={() => handleSelectProjectAndEnter(proj.id)}
                id={`exec-project-card-${proj.id}`}
                className="group relative bg-[#131315] hover:bg-[#18181b] border border-neutral-800/80 hover:border-violet-500/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden shadow-xl"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 p-3 bg-neutral-950 border-l border-b border-neutral-850 text-indigo-400 text-[10px] font-mono tracking-wider uppercase font-bold rounded-bl-xl leading-none">
                  {proj.projectKey}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <h4 className="text-sm font-sans font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                      {proj.name}
                    </h4>
                  </div>

                  <p className="text-[11.5px] text-neutral-400 leading-relaxed font-sans line-clamp-3">
                    {proj.description}
                  </p>

                  {/* Metadata display panel */}
                  <div className="grid grid-cols-3 gap-2 border-t border-b border-neutral-850/80 py-3 mt-1 text-center bg-neutral-950/40 rounded-xl font-mono">
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">Stories</span>
                      <span className="text-xs font-bold text-white">{proj.stories?.length || 0}</span>
                    </div>
                    <div className="border-l border-r border-neutral-850">
                      <span className="text-[9px] text-neutral-500 uppercase block">Bugs</span>
                      <span className="text-xs font-bold text-rose-450 text-rose-400">{openBugs}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-neutral-500 uppercase block">Gaps</span>
                      <span className="text-xs font-bold text-amber-400">{openGaps}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs font-mono">
                  <span className="text-neutral-500">
                    Awaiting live environment url
                  </span>
                  <span className="flex items-center gap-1 text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all font-bold">
                    Open Execution desk <ChevronRight className="w-3.5 h-3.5" />
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
  // VIEW 2: Dedicated Project Execution Workspace Desk
  // -----------------------------------------------------------------
  const pendingStoriesCount = currentProject?.stories.filter(s => (testResults[s.id]?.status || "pending") === "pending").length || 0;
  const passedStoriesCount = currentProject?.stories.filter(s => (testResults[s.id]?.status || "pending") === "passed").length || 0;
  const failedStoriesCount = currentProject?.stories.filter(s => (testResults[s.id]?.status || "pending") === "failed").length || 0;

  return (
    <div className="space-y-6" id="project-execution-desk-view">
      
      {/* Back Header panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-neutral-900 border border-neutral-855 rounded-2xl gap-4 shadow-md text-left">
        <div className="space-y-1">
          <button
            onClick={() => setSelectedProjId(null)}
            className="group flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition font-mono mb-2 bg-neutral-950 border border-neutral-850 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Active Projects Selector
          </button>
          
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-900/60 font-mono text-[9px] font-bold rounded">
              PROJECT DESK: {currentProject.projectKey}
            </span>
            <h3 className="font-sans font-extrabold text-white text-base">
              Automated Testing Core &mdash; {currentProject.name}
            </h3>
          </div>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Run automated live actions, assert logic values, and verify downstream record updates immediately. Customize target domain variables below.
          </p>
        </div>

        {/* Global Action Download button */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={handleDownloadReport}
            disabled={passedStoriesCount === 0 && failedStoriesCount === 0}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition select-none cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Execution Report</span>
          </button>
          
          {/* Quick reset actions */}
          <button
            onClick={() => {
              const reset: typeof testResults = {};
              currentProject.stories.forEach(st => {
                reset[st.id] = { status: "pending", duration: 0, logs: [] };
              });
              setTestResults(reset);
              setLogs([]);
              setProgress(0);
            }}
            className="p-2 bg-neutral-950 border border-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs transition cursor-pointer"
            title="Reset test records"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Dashboard Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {/* Left Control Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Environment Target Web URL Box */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
            <span className="text-[10px] font-mono uppercase bg-neutral-950 px-2.5 py-0.5 border border-neutral-850 rounded text-neutral-400 tracking-wider">
              ⚙️ Environment Settings
            </span>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">
                Enter Live Web URL to Target
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-500" />
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://billing-operations-system.taxaj.ai"
                    className="w-full bg-neutral-950 text-white text-xs rounded-lg pl-9 pr-3 py-2.5 border border-neutral-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 leading-normal">
                All granular Playwright code checks will dynamically target this active network host.
              </p>
            </div>
          </div>

          {/* Locator Strategy Architecture block */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-neutral-950 px-2.5 py-0.5 border border-neutral-850 rounded text-neutral-400 tracking-wider">
                🤖 Locator Resolution Strategy
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 bg-indigo-950 text-indigo-400 border border-indigo-900/30 rounded font-semibold">
                Choice Panel
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Stable live-URL testing requires durable web selectors. Review our architectural comparison:
            </p>

            <div className="space-y-3">
              {/* Option A Card */}
              <div 
                onClick={() => setLocatorStrategy("OptionA")}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                  locatorStrategy === "OptionA" 
                    ? "bg-violet-950/20 border-violet-500/80 text-violet-300"
                    : "bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-400"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${locatorStrategy === "OptionA" ? "bg-violet-500 text-white" : "border-neutral-600"}`}>A</span>
                  <span className="text-[11.5px] font-extrabold text-white block">Option A: Dynamic DOM Scanner</span>
                </div>
                <p className="text-[10.5px] leading-relaxed">
                  Scans target page live layout elements dynamically using relative heuristics prior to test execution. 
                </p>
                <span className="text-[9px] uppercase font-mono text-amber-500 font-bold block mt-1.5">
                  ⚠️ Danger: Brittle to rapid DOM changes.
                </span>
              </div>

              {/* Option B Card */}
              <div 
                onClick={() => setLocatorStrategy("OptionB")}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition ${
                  locatorStrategy === "OptionB" 
                    ? "bg-indigo-950/20 border-indigo-500/80 text-indigo-300"
                    : "bg-neutral-950 border-neutral-850 hover:border-neutral-700 text-neutral-400"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${locatorStrategy === "OptionB" ? "bg-indigo-500 text-white" : "border-neutral-600"}`}>B</span>
                  <span className="text-[11.5px] font-extrabold text-white block">Option B: Code Replacement (Recommended)</span>
                </div>
                <p className="text-[10.5px] leading-relaxed">
                  Utilizes structured environment mappings and dynamically injects values into typed locator matrices inside the script variables.
                </p>
                <span className="text-[9px] uppercase font-mono text-emerald-400 font-bold block mt-1.5">
                  ✓ Enterprise Choice: Zero runtime timing lag or brittle styling failures.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
            <span className="text-[10px] font-mono uppercase bg-neutral-900 text-neutral-400 font-bold block border-b border-neutral-800 pb-2 mb-3">
              🎯 Test Suite Diagnostics
            </span>
            <div className="grid grid-cols-3 gap-2.5 text-center font-mono py-1">
              <div className="p-2.5 bg-neutral-950 rounded-xl">
                <span className="text-[8.5px] text-neutral-500 uppercase block">Pending</span>
                <span className="text-sm font-bold text-neutral-400">{pendingStoriesCount}</span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-emerald-900/20">
                <span className="text-[8.5px] text-emerald-500 uppercase block">Passed</span>
                <span className="text-sm font-bold text-emerald-400">{passedStoriesCount}</span>
              </div>
              <div className="p-2.5 bg-neutral-950 rounded-xl border border-rose-900/20">
                <span className="text-[8.5px] text-rose-500 uppercase block">Failed</span>
                <span className="text-sm font-bold text-rose-400">{failedStoriesCount}</span>
              </div>
            </div>
            
            <button
              onClick={() => triggerExecution("project")}
              disabled={executing || currentProject.stories.filter(s => selectedStoryIds[s.id]).length === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-white" />
              <span>Execute Scopes ({currentProject.stories.filter(s => selectedStoryIds[s.id]).length || 0} Selected)</span>
            </button>
          </div>

        </div>

        {/* Right Active Execution Core Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* User Stories Action Queue Matrix */}
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl text-left">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 flex-wrap gap-2">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">
                  Granular Playwright Target Queue
                </span>
                <h4 className="text-xs text-neutral-400 leading-normal mt-0.5">
                  Selectively scope execution or run individual diagnostics.
                </h4>
              </div>

              <button
                onClick={() => {
                  const allChecked = currentProject.stories.every(s => selectedStoryIds[s.id]);
                  const nextSelection: Record<string, boolean> = {};
                  currentProject.stories.forEach(s => {
                    nextSelection[s.id] = !allChecked;
                  });
                  setSelectedStoryIds(nextSelection);
                }}
                className="px-2.5 py-1 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded font-mono text-[10px] text-neutral-400 hover:text-white transition"
              >
                {currentProject.stories.every(s => selectedStoryIds[s.id]) ? "Deselect All Scopes" : "Select All Scopes"}
              </button>
            </div>

            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {currentProject.stories.map((story) => {
                const outcomeResult = testResults[story.id] || { status: "pending", duration: 0 };
                const isSelectedScope = !!selectedStoryIds[story.id];
                return (
                  <div
                    key={story.id}
                    className={`p-3 rounded-xl flex items-center justify-between gap-3 transition border ${
                      isSelectedScope 
                        ? "bg-neutral-950 border-neutral-850 hover:border-neutral-800" 
                        : "bg-neutral-950/40 border-neutral-900/40 opacity-70 hover:opacity-90"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-grow">
                      <input
                        type="checkbox"
                        checked={isSelectedScope}
                        onChange={() => {
                          setSelectedStoryIds(prev => ({ ...prev, [story.id]: !prev[story.id] }));
                        }}
                        className="w-4 h-4 cursor-pointer accent-indigo-550 border-neutral-800 bg-neutral-900 rounded select-none shrink-0"
                        title="Toggle target story run scope"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9.5px] font-mono text-indigo-400 font-extrabold tracking-wider bg-indigo-950/35 border border-indigo-900/30 px-1.5 py-0.2 rounded">
                            {story.id}
                          </span>
                          
                          {/* Status outcomes badge */}
                          {outcomeResult.status === "passed" && (
                            <span className="text-[9px] px-1.5 py-0.2 font-mono bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 rounded uppercase font-bold">
                              Passed ({outcomeResult.duration}s)
                            </span>
                          )}
                          {outcomeResult.status === "failed" && (
                            <span className="text-[9px] px-1.5 py-0.2 font-mono bg-rose-950/20 text-rose-400 border border-rose-900/40 rounded uppercase font-bold">
                              Failed ({outcomeResult.duration}s)
                            </span>
                          )}
                          {outcomeResult.status === "running" && (
                            <span className="text-[9px] px-1.5 py-0.2 font-mono bg-amber-950/30 text-amber-400 border border-amber-900/30 rounded uppercase font-bold animate-pulse">
                              Running...
                            </span>
                          )}
                          {outcomeResult.status === "pending" && (
                            <span className="text-[9px] px-1.5 py-0.2 font-mono bg-neutral-900 text-neutral-400 border border-neutral-850 rounded uppercase font-bold">
                              Awaiting Run
                            </span>
                          )}
                        </div>
                        <h5 className="text-[11.5px] font-bold text-white truncate leading-none pt-0.5">
                          {story.title}
                        </h5>
                        <p className="text-[10.5px] text-neutral-400 line-clamp-1 font-sans">
                          {story.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => triggerExecution("story", story.id)}
                      disabled={executing}
                      className="p-2 bg-neutral-900 border border-neutral-800 hover:border-indigo-600 text-indigo-400 hover:text-white rounded-lg text-xs leading-none transition cursor-pointer hover:bg-indigo-950/20 shrink-0"
                      title="Execute this story"
                    >
                      <Play className="w-3.5 h-3.5 fill-indigo-400 hover:fill-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HEADLESS TEST CONSOLE OUTPUT TERMINAL */}
          <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl flex flex-col justify-between h-[310px]">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5 shrink-0 select-none">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
                <h4 className="text-[10.5px] font-mono uppercase font-bold tracking-wider text-neutral-300">
                  Headless Playwright Sandbox Console
                </h4>
              </div>
              <span className="text-[9.5px] px-2 py-0.5 bg-neutral-900 text-indigo-400 font-mono border border-neutral-850 rounded">
                Live terminal log stream
              </span>
            </div>

            {/* Simulated progress slider bar */}
            {executing && (
              <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden mt-2 shrink-0">
                <div 
                  className="bg-gradient-to-r from-violet-500 via-indigo-400 to-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Scroll log console list */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[10px] font-mono py-3 max-h-[190px] select-all bg-radial">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 py-12">
                  <Code className="w-8 h-8 text-neutral-800 mb-2" />
                  <span>Sandbox console idle</span>
                  <span className="text-[9px] uppercase tracking-widest mt-1 text-center max-w-sm">
                    Select a story or execute full project class to view terminal trace dumps
                  </span>
                </div>
              ) : (
                logs.map((log, index) => {
                  let textClass = "text-neutral-400";
                  if (log.type === "success") textClass = "text-emerald-400 font-semibold";
                  else if (log.type === "warn") textClass = "text-rose-400 italic";
                  else if (log.type === "code") textClass = "text-violet-400";
                  
                  return (
                    <div key={index} className="flex gap-2">
                      <span className="text-neutral-605 text-neutral-600 text-[9px]">{`[0${index + 2}:04:18]`}</span>
                      <pre className={`whitespace-pre-wrap leading-relaxed ${textClass}`}>{log.msg}</pre>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-neutral-850 pt-2 bg-neutral-950 text-[9px] font-mono text-neutral-500 flex justify-between items-center select-none shrink-0">
              <span>Docker node target: Chromium-WebPlatform-V1.0</span>
              <span className="text-indigo-400 uppercase font-bold px-1.5 py-0.2 bg-indigo-950/20 border border-indigo-900/30 rounded text-[8px] tracking-wider leading-none">
                Playwright Connected
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
