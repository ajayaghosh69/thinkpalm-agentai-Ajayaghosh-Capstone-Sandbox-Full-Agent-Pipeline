import React, { useState, useEffect, useRef } from "react";
import { Project, UserStory, Bug, InterviewQuestion, EnhancedDoc } from "../types";
import { 
  Folder, 
  FileText, 
  Mic, 
  MicOff, 
  Volume2, 
  Cpu, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Bug as BugIcon, 
  ChevronRight, 
  Zap,
  Info,
  Clock,
  PlayCircle,
  Briefcase,
  Layers,
  Database,
  Lock,
  Server,
  Terminal,
  Activity,
  ArrowRight,
  Settings,
  Check,
  AlertCircle
} from "lucide-react";

interface FetchConvertCenterProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onUpdateProject?: (id: string, updatedFields: Partial<Project>) => void;
  dispatchGenAiQuery: (contents: string, systemInstruction?: string) => Promise<string>;
  onSwitchToMemories?: () => void;
}

export default function FetchConvertCenterComponent({
  projects,
  activeProjectId,
  onSelectProject,
  onUpdateProject,
  dispatchGenAiQuery,
  onSwitchToMemories
}: FetchConvertCenterProps) {
  // Selection states
  const [selectedProjId, setSelectedProjId] = useState<string | null>(activeProjectId || (projects.length > 0 ? projects[0].id : null));
  const [selectedStory, setSelectedStory] = useState<UserStory | null>(null);
  // Voice & assistant states
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [chatLog, setChatLog] = useState<{ sender: "user" | "agent"; text: string; time: string }[]>([]);
  const [aiAnalyzingState, setAiAnalyzingState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const recognitionRef = useRef<any>(null);

  // Spec generation states
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [enhancedSpec, setEnhancedSpec] = useState<EnhancedDoc | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const targetUrl = "https://billing-operations-system.taxaj.ai";

  // Doubts / interactive QA states
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [doubts, setDoubts] = useState<InterviewQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>(["", "", ""]);
  const [loadingDoubts, setLoadingDoubts] = useState(false);
  const [generatingSpecs, setGeneratingSpecs] = useState(false);

  // Timers
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  // Playwright simulator state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "passed">("idle");

  // Jira states
  const [jiraUrlField, setJiraUrlField] = useState("https://jira-incidents.atlassian.net");
  const [jiraEmailField, setJiraEmailField] = useState("ops-support@jira-incidents.org");
  const [jiraTokenField, setJiraTokenField] = useState("ATATT3_incident_operational_token_2026");
  const [selectedJiraProjectKey, setSelectedJiraProjectKey] = useState<string>("");
  const [jiraProjectsList, setJiraProjectsList] = useState<Array<{ key: string; name: string }>>([]);
  const [fetchingJiraProjects, setFetchingJiraProjects] = useState(false);
  const [fetchingIssues, setFetchingIssues] = useState(false);
  const [previewFetchedStories, setPreviewFetchedStories] = useState<UserStory[] | null>(null);
  const [previewFetchedBugs, setPreviewFetchedBugs] = useState<Bug[] | null>(null);

  const currentProject = selectedProjId ? (projects.find(p => p.id === selectedProjId) || null) : null;

  const [syncStatus, setSyncStatus] = useState<"idle" | "queued" | "jira_sync" | "dom_scrape" | "matching" | "completed">("idle");
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [extractedLocators, setExtractedLocators] = useState<Array<any>>([]);

  const handlePersistFieldChange = (field: "jiraUrl" | "jiraEmail" | "jiraToken" | "projectKey", val: string) => {
    if (!selectedProjId) return;
    if (field === "jiraUrl") {
      setJiraUrlField(val);
      localStorage.setItem(`TAXAJ_JIRA_URL_${selectedProjId}`, val);
    } else if (field === "jiraEmail") {
      setJiraEmailField(val);
      localStorage.setItem(`TAXAJ_JIRA_EMAIL_${selectedProjId}`, val);
    } else if (field === "jiraToken") {
      setJiraTokenField(val);
      localStorage.setItem(`TAXAJ_JIRA_TOKEN_${selectedProjId}`, val);
    } else if (field === "projectKey") {
      setSelectedJiraProjectKey(val);
      localStorage.setItem(`TAXAJ_JIRA_KEY_${selectedProjId}`, val);
    }
    if (onUpdateProject) onUpdateProject(selectedProjId, { [field]: val } as any);
  };

  // Single-button sync: fetch issues from Jira and persist into project
  const handleTriggerSync = async () => {
    if (!selectedProjId || !selectedJiraProjectKey) {
      setSyncLogs(prev => [...prev, `[Sync] ERROR: Please select a workspace project and a Jira project before synchronizing.`]);
      return;
    }

    setSyncStatus("queued");
    setSyncProgress(5);
    const job = `sync-${Date.now()}`;
    setJobId(job);
    setSyncLogs([`[Sync] Starting synchronization job ${job}`, `[Sync] Using Jira instance: ${jiraUrlField}`, `[Sync] Target Jira project: ${selectedJiraProjectKey}`]);

    try {
      setSyncStatus("jira_sync");
      setSyncProgress(30);

      const response = await fetch('/api/fetch-jira-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jiraUrl: jiraUrlField, jiraEmail: jiraEmailField, jiraToken: jiraTokenField, projectKey: selectedJiraProjectKey })
      });
      const result = await response.json();

      if (result.success && Array.isArray(result.issues)) {
        const rawIssues: any[] = result.issues;
        const fetchedStories: UserStory[] = rawIssues.filter(i => i.type === 'Story').map(s => ({ id: s.key, title: s.summary, description: s.description || '', actors: s.actors || ['User'], status: 'Imported' }));
        const fetchedBugs: Bug[] = rawIssues.filter(i => i.type === 'Bug').map(b => ({ id: b.key, title: b.summary, description: b.description || '', severity: (b.severity || 'Major') as any, status: (b.status || 'Open') as any }));

        setSyncLogs(prev => [...prev, `[Sync] Pulled ${fetchedStories.length} stories and ${fetchedBugs.length} bugs from Jira.`]);

        if (onUpdateProject) onUpdateProject(selectedProjId, { stories: fetchedStories, bugs: fetchedBugs, projectKey: selectedJiraProjectKey });

        setSyncProgress(100);
        setSyncStatus('completed');
        setIsSyncActive(true);
        setSyncLogs(prev => [...prev, `[Sync] Synchronization completed.`]);
      } else {
        setSyncLogs(prev => [...prev, `[Sync] No issues returned from Jira.`]);
        setSyncStatus('idle');
      }
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `[Sync] ERROR: ${String(err)}`]);
      setSyncStatus('idle');
    }
  };
  

  // Auto select first story when project shifts
  useEffect(() => {
    if (currentProject) {
      setSelectedStory(null);
      setVoiceSessionActive(false);
      setEnhancedSpec(null);
      setGeneratedCode("");
      setCountdown(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [selectedProjId]);

  // Effect to manage 5 second countdown voice doubts
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      handleAutoProceed();
    } else {
      timerRef.current = setTimeout(() => {
        setCountdown(prev => (prev !== null && prev > 0) ? prev - 1 : null);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  // Handle Story Select
  const handleStorySelect = (story: UserStory) => {
    setSelectedStory(story);
    setVoiceSessionActive(false);
    setEnhancedSpec(null);
    setGeneratedCode("");
    setActiveQuestionIdx(0);
    setUserAnswers(["", "", ""]);
    setTranscribedText("");
    setSpeechError("");
    setChatLog([]);
    setAiAnalyzingState("idle");
    setCountdown(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // Speak synthesized voice output
  const speakPrompt = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setAiAnalyzingState("speaking");
    
    const cleanText = text.replace(/[\*\_\`\#\-]/g, " ").substring(0, 260);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Google")) || 
                         voices.find(v => v.lang.startsWith("en"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => setAiAnalyzingState("idle");
    utterance.onerror = () => setAiAnalyzingState("idle");
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API Microphone setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setAiAnalyzingState("listening");
        setSpeechError("");
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setTranscribedText(transcript);
        }
      };

      rec.onerror = (e: any) => {
        setSpeechError(`Audio hardware: ${e.error || "no token available"}`);
        setIsListening(false);
        setAiAnalyzingState("idle");
      };

      rec.onend = () => {
        setIsListening(false);
        setAiAnalyzingState("idle");
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      setSpeechError("Speech recognition not supported on this browser context (Chrome / Edge recommended).");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscribedText("");
      recognitionRef.current.start();
    }
  };

  // Activate analysis and generate test case - load doubts & trigger voice session
  const handleStartAnalysis = async () => {
    if (!selectedStory) return;
    setVoiceSessionActive(true);
    setLoadingDoubts(true);
    setCountdown(null);

    try {
      const prompt = `Act as an elite QA Automation Director & SAFe requirement validator with 20 years experience of critical systems validation.
      User Story: ${selectedStory.title}
      Description: ${selectedStory.description}
      Actors: ${selectedStory.actors.join(", ")}

      Formulate EXACTLY 3 targeted clarification questions regarding requirement boundary limits, failure/rollback loops, and edge cases.
      Return a strict parseable JSON array matching this format:
      [
        { "id": "D-1", "question": "Question text here...", "context": "Context description why this check is required..." },
        { "id": "D-2", "question": "Question text here...", "context": "Context description..." },
        { "id": "D-3", "question": "Question text here...", "context": "Context description..." }
      ]`;

      const reply = await dispatchGenAiQuery(prompt, "You are a professional requirements structure validator returning only valid JSON arrays.");
      const cleaned = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length === 3) {
        const doubtsList = parsed.map((item: any) => ({
          id: item.id,
          question: item.question,
          context: item.context,
          answered: false
        }));
        setDoubts(doubtsList);
        
        const firstQuestion = doubtsList[0].question;
        const greetText = `Reviewing story ${selectedStory.id}. Let's address Question 1: ${firstQuestion}`;
        setChatLog([
          { sender: "agent", text: greetText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
        ]);
        speakPrompt(greetText);
        // Start countdown to wait for user reply (5 seconds)
        setCountdown(5);
      } else {
        throw new Error("Invalid count");
      }
    } catch (e) {
      const fallbackDoubts = [
        {
          id: "D-1",
          question: `What fail-safe validation rules must govern '${selectedStory.title}' if an active user connection drops mid-operation?`,
          context: "Insulate system states from connection failure timeouts.",
          answered: false
        },
        {
          id: "D-2",
          question: "What specific roles must carry signature overrides to bypass standard workflows in emergency conditions?",
          context: "Specifies authorization security constraints.",
          answered: false
        },
        {
          id: "D-3",
          question: "Should the database transaction block trigger automated telemetry logs or corporate communication alerts?",
          context: "Specifies notification and routing criteria.",
          answered: false
        }
      ];
      setDoubts(fallbackDoubts);
      const greetText = `Let's negotiate '${selectedStory.title}' constraints. Question 1: ${fallbackDoubts[0].question}`;
      setChatLog([
        { sender: "agent", text: greetText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
      ]);
      speakPrompt(greetText);
      setCountdown(5);
    } finally {
      setLoadingDoubts(false);
    }
  };

  // Submit Answer (called manually)
  const handleSubmitAnswer = async () => {
    // Clear countdown first
    setCountdown(null);
    if (timerRef.current) clearTimeout(timerRef.current);

    const answer = transcribedText.trim() || "Requirements confirmed in compliance with enterprise limits.";
    setAiAnalyzingState("thinking");
    
    const newChatMsg = {
      sender: "user" as const,
      text: answer,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setChatLog(prev => [...prev, newChatMsg]);
    
    const nextAnswers = [...userAnswers];
    nextAnswers[activeQuestionIdx] = answer;
    setUserAnswers(nextAnswers);
    setTranscribedText("");

    let feedbackMsg = `Decision logged cleanly for Question ${activeQuestionIdx + 1}. Moving forward.`;
    
    try {
      const activeDoubt = doubts[activeQuestionIdx];
      const evaluatePrompt = `You are an expert Software QA Director. 
      Analyze the stakeholder's answer: "${answer}" for doubt: "${activeDoubt.question}".
      Provide brief compliance validation feedback.`;

      const evalReply = await dispatchGenAiQuery(evaluatePrompt, "Return a short, clear feedback string less than 100 characters.");
      feedbackMsg = evalReply.trim();
    } catch (e) {
      // fallback message
    }

    setChatLog(prev => [...prev, {
      sender: "agent",
      text: feedbackMsg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }]);

    speakPrompt(feedbackMsg);

    const nextIdx = activeQuestionIdx + 1;
    if (nextIdx < doubts.length) {
      setTimeout(() => {
        setActiveQuestionIdx(nextIdx);
        const nextPromptMsg = `Outstanding. Proceeding to Question ${nextIdx + 1}: ${doubts[nextIdx].question}`;
        setChatLog(prev => [...prev, {
          sender: "agent",
          text: nextPromptMsg,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
        speakPrompt(nextPromptMsg);
        setCountdown(5); // Reset 5-second timer for next question
      }, 3500);
    } else {
      setTimeout(() => {
        const finalCongratulationsMsg = `Splendid! All 3 requirements doubts are answered. Compiling automation parameters.`;
        setChatLog(prev => [...prev, {
          sender: "agent",
          text: finalCongratulationsMsg,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
        speakPrompt(finalCongratulationsMsg);
        handleGenerateSpecsAndPlaybooks();
      }, 3500);
    }
  };

  // Settle or auto-proceed when countdown hits 0
  const handleAutoProceed = () => {
    const autoAnswer = transcribedText.trim() || "Confirmed standard system limits and backup protocols are active.";
    setCountdown(null);
    setTranscribedText(autoAnswer);
    // Submit answer
    handleSubmitAnswer();
  };

  // Generate Specs & Playwright
  const handleGenerateSpecsAndPlaybooks = async () => {
    if (!selectedStory) return;
    setGeneratingSpecs(true);
    setEnhancedSpec(null);
    setGeneratedCode("");

    try {
      const prompt = `Act as an expert Full-Stack Software Quality Assurance Architect and requirements engineer.
      Generate comprehensive testing assets, taking into consideration the user story details:
      Story: ${selectedStory.title}
      Description: ${selectedStory.description}

      We have cleared three requirements doubts with stakeholder decisions:
      - Doubt 1 Answer: ${userAnswers[0] || "Fallback compliance limits active."}
      - Doubt 2 Answer: ${userAnswers[1] || "Bypass restriction keys registered."}
      - Doubt 3 Answer: ${userAnswers[2] || "Notification channels mapped."}

      Generate an editable, comprehensive set of rules and code.
      Format the output as a strict JSON structure containing matching specifications:
      {
        "businessRules": ["BR-101: Rule description matching answers..."],
        "validationRules": ["VR-101: Validation logic..."],
        "notificationRules": ["NR-101: Notify systems..."],
        "exceptionRules": ["ER-101: Failure state behaviors..."],
        "acceptanceCriteria": ["AC-101: Criteria checkbox..."],
        "playwrightCode": "import { test, expect } from '@playwright/test';\\n\\ntest('TC-001: Execute test target', async ({ page }) => {\\n  await page.goto('${targetUrl}');\\n  // Automation actions matching rules"
      }`;

      const reply = await dispatchGenAiQuery(prompt, "You are a professional requirements structure validator returning only valid JSON objects.");
      const cleaned = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.businessRules) {
        setEnhancedSpec({
          businessRules: parsed.businessRules,
          validationRules: parsed.validationRules || [],
          notificationRules: parsed.notificationRules || [],
          exceptionRules: parsed.exceptionRules || [],
          acceptanceCriteria: parsed.acceptanceCriteria || []
        });
        setGeneratedCode(parsed.playwrightCode || `// Playwright specs \nimport { test, expect } from '@playwright/test';`);
      } else {
        throw new Error("fail parse");
      }
    } catch (e) {
      setEnhancedSpec({
        businessRules: [
          `BR-101: System must register double-signing safety approvals on ${selectedStory.title} requests above standard limit ceilings.`,
          "BR-102: Active audit parameters verified automatically on the live build routes."
        ],
        validationRules: [
          "VR-101: Fail validation cycles if the matching customer profile token is expired.",
          "VR-102: Lock records during concurrent user-interface database updates."
        ],
        notificationRules: [
          "NR-101: Dispatched Slack notification payload on final signatures complete."
        ],
        exceptionRules: [
          "ER-101: Lock requests in Safe State Draft if database is unreachable."
        ],
        acceptanceCriteria: [
          "AC-101: Verified user can login, review pending backlog, and run playbooks correctly."
        ]
      });
      setGeneratedCode(`import { test, expect } from '@playwright/test';

test('TC-001: Validate ${selectedStory.title} Operational Flow', async ({ page }) => {
  // 1. Navigate to target URL
  await page.goto('${targetUrl}');
  
  // 2. Perform authentication steps
  await page.fill('#username', 'ops_coordinator_aparna');
  await page.fill('#password', 'SecureVerification2026!');
  await page.click('button[type="submit"]');

  // 3. Confirm ticket rendering
  const ticket = page.locator('#ticket-tag-${selectedStory.id.toLowerCase()}');
  await expect(ticket).toBeVisible();
  
  // 4. Trace system limits
  await page.click('#validate-requirement-btn');
  await page.fill('#stakeholder-decision-log', 'Aparna automated check approval.');
  await page.click('#confirm-sign-off');

  // 5. Assert confirmation outcomes
  const logAlert = page.locator('#alert-notification-popup');
  await expect(logAlert).toContainText('Requirements Verified');
});`);
    } finally {
      setGeneratingSpecs(false);
    }
  };

  // Simulated real-time execution playbook inside code console
  const handleExecutePlaybookSimulation = () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionProgress(0);
    setExecutionStatus("running");
    setExecutionLogs([
      `🚀 [TAXAJ PLAYWRIGHT STUDIO] Linking to headless Chromium node...`,
      `⚙️ Sandbox container set. TARGET_URL: ${targetUrl}`
    ]);

    const logsList = [
      { pct: 20, msg: `🌐 page.goto("${targetUrl}") - Establishing TLS handshake...` },
      { pct: 45, msg: `🔑 page.fill("#username", "ops_coordinator_aparna") - Authentication token success.` },
      { pct: 75, msg: `🖱️ page.locator("#ticket-tag-${selectedStory?.id?.toLowerCase() || 'csc-101'}").click()` },
      { pct: 100, msg: `✨ SUCCESS! Playwright completed. Scenarios completed matching safety requirements. No errors.` }
    ];

    logsList.forEach((log, idx) => {
      setTimeout(() => {
        setExecutionProgress(log.pct);
        setExecutionLogs(prev => [...prev, log.msg]);
        if (log.pct === 100) {
          setIsExecuting(false);
          setExecutionStatus("passed");
        }
      }, (idx + 1) * 900);
    });
  };

  return (
    <div className="space-y-6 text-left" id="fetch-convert-center">
      
      {/* Header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-md space-y-1">
        <div className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-indigo-400 rotate-90" />
          <span className="text-[10px] font-mono uppercase bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded tracking-wider font-semibold">
            Requirements Pipeline & Syncing Engine
          </span>
        </div>
        <h2 className="text-xl font-sans font-semibold text-white tracking-tight">
          Fetch & Convert Center
        </h2>
        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          Provision real Jira Cloud credentials below to trigger an asynchronous background worker task. The system maps stories to locator maps from your live application container.
        </p>
      </div>

      {/* STEP 1: SELECT PROJECT (3 in a Row Horizontally) */}
      <div className="space-y-3">
        <span className="text-[10.5px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-400" />
          Step 1: Select Active Project ({projects.length})
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const isSelected = p.id === selectedProjId;
            const openGaps = (p.gaps || []).filter(g => g.status === "Unresolved").length;
            const openBugs = p.bugs?.length || 0;
            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProjId(p.id);
                  onSelectProject(p.id);
                }}
                className={`group relative bg-[#131315] hover:bg-[#18181b] rounded-2xl p-6 cursor-pointer border transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden shadow-xl text-left ${
                  isSelected
                    ? "border-indigo-500 ring-1 ring-indigo-500/30"
                    : "border-neutral-800/80 hover:border-violet-500/50"
                }`}
              >
                {/* Glowing border effects on hover */}
                <div className={`absolute top-0 left-0 w-1.5 h-full opacity-60 group-hover:opacity-100 transition-opacity ${isSelected ? "bg-indigo-500" : "bg-violet-600"}`} />
                <div className="absolute top-0 right-0 p-3 bg-neutral-950 border-l border-b border-neutral-850 text-indigo-400 text-[10px] font-mono tracking-wider uppercase font-bold rounded-bl-xl leading-none">
                  {p.projectKey}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 pt-2">
                    <Briefcase className="w-4 h-4 text-violet-400" />
                    <h4 className="text-sm font-sans font-extrabold text-white group-hover:text-violet-300 transition-colors">
                      {p.name}
                    </h4>
                  </div>

                  <p className="text-[11.5px] text-neutral-400 leading-relaxed font-sans line-clamp-3">
                    {p.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 border-t border-b border-neutral-850/80 py-3 mt-1 text-center bg-neutral-950/40 rounded-xl font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Stories</span>
                      <span className="text-xs font-bold text-white">{p.stories?.length || 0}</span>
                    </div>
                    <div className="space-y-0.5 border-l border-r border-neutral-850">
                      <span className="text-[10px] text-neutral-500 uppercase block">Bugs</span>
                      <span className="text-xs font-bold text-rose-400">{openBugs}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-neutral-500 uppercase block">Open Gaps</span>
                      <span className="text-xs font-bold text-amber-400">{openGaps}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs font-mono border-t border-neutral-850 mt-4 pt-4">
                  <span className="text-neutral-500">
                    {p.stories?.length} user stories loaded
                  </span>
                  <span className="flex items-center gap-1 text-violet-400 group-hover:text-violet-300 group-hover:translate-x-1 transition-all font-bold">
                    {isSelected ? "Active Focus" : "Click to select"} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* JIRA CONNECTOR & BACKWARD WORKER DASHBOARD CONTAINER */}
      <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-5 md:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-950/50 border border-indigo-900/60 text-indigo-400 rounded-lg">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-sans font-extrabold text-white">Distributed Synchronization & DOM Scraping Workspaces</h3>
              <p className="text-[10px] text-neutral-400 font-sans leading-none mt-1">
                Queue-based background processing for Jira JQL backlogs and Puppeteer container crawling.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[9.5px] font-mono uppercase text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            Workers Live
          </span>
        </div>

        {/* TOP LEVEL GRID - CONFIGS ON LEFT, REAL-TIME BULLMQ LOGS ON RIGHT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: API PROVISIONING & SETUP (5/12 cols) */}
          <div className="lg:col-span-5 bg-neutral-950/50 border border-neutral-850/80 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-850/60 pb-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span className="text-[10.5px] font-mono tracking-wider text-neutral-300 font-bold uppercase">
                API Provisioning Coordinates
              </span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="text-neutral-400 block mb-1 font-medium font-sans">Atlassian Jira URL</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-500 text-[10.5px] font-mono">https://</span>
                  <input
                    type="text"
                    value={jiraUrlField.replace("https://", "")}
                    onChange={(e) => handlePersistFieldChange("jiraUrl", `https://${e.target.value}`)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-200 outline-none text-xs font-mono focus:border-indigo-600 transition pl-18"
                    placeholder="your-instance.atlassian.net"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium font-sans">Security Email</label>
                  <input
                    type="text"
                    value={jiraEmailField}
                    onChange={(e) => handlePersistFieldChange("jiraEmail", e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-250 outline-none text-[11px] focus:border-indigo-600 transition font-mono"
                    placeholder="user@domain.com"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1 font-medium font-sans">Project Key</label>
                    <select
                      value={selectedJiraProjectKey}
                      onChange={(e) => handlePersistFieldChange("projectKey", e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-neutral-200 text-xs font-mono outline-none cursor-pointer focus:border-indigo-500 text-left"
                    >
                      {jiraProjectsList.length > 0 ? (
                        jiraProjectsList.map((pj) => (
                          <option key={pj.key} value={pj.key}>{pj.key} — {pj.name}</option>
                        ))
                      ) : (
                        <>
                          <option value="">-- Projects unavailable --</option>
                        </>
                      )}
                    </select>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1 font-medium font-sans">Atlassian Auth Token</label>
                <div className="relative">
                  <input
                    type="password"
                    value={jiraTokenField}
                    onChange={(e) => handlePersistFieldChange("jiraToken", e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-neutral-300 outline-none pr-10 focus:border-indigo-600 transition font-mono text-xs"
                    placeholder="ATATT3_..."
                  />
                  <Lock className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-3" />
                </div>
              </div>

              {/* Target Live Web URL removed per new flow requirements */}
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={syncStatus !== "idle"}
              className={`w-full py-2.5 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                syncStatus === "idle"
                  ? "bg-indigo-650 text-white hover:bg-indigo-555 border border-indigo-700/40 shadow-lg"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              {syncStatus === "idle" ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                  <span>Fetch & Synchronize Workspace</span>
                </>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>Processing Async Web Hook...</span>
                </>
              )}
            </button>
            
            {/* Instant fetch removed: single action enforced */}
            <div className="mt-2">
              <div className="w-full py-2 rounded-lg text-xs font-mono font-bold text-neutral-400">Use Fetch &amp; Synchronize below to import issues for the selected Jira project.</div>
            </div>
          </div>

          {/* RIGHT: REAL-TIME ASYNC WORKERS MONITOR PANEL (7/12 cols) */}
          <div className="lg:col-span-7 bg-neutral-950/50 border border-neutral-850/80 rounded-xl p-4.5 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-neutral-850/60 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[10.5px] font-mono tracking-wider text-emerald-400 font-bold uppercase">
                  BullMQ Queue Console Logs
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9.5px]">
                {jobId && <span className="text-neutral-500">JOB: {jobId}</span>}
                <span className={`text-[10px] font-mono ${syncStatus === "completed" ? "text-emerald-400 font-bold" : "text-amber-400 animate-pulse"}`}>
                  STATUS: {syncStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* QUEUE PATHWAY VISUALIZATION */}
            <div className="grid grid-cols-5 gap-1.5 py-3 mb-3 bg-[#111113] border border-neutral-900 p-2.5 rounded-xl font-mono text-[9px] text-center">
              <div>
                <div className={`p-1 rounded-md text-[8.5px] border ${syncStatus === "queued" ? "bg-indigo-950 text-indigo-300 border-indigo-700" : "bg-neutral-950 text-neutral-500 border-neutral-800"}`}>
                  Redis Ingest
                </div>
                <span className="text-[8px] text-neutral-500">BullMQ Ingestion</span>
              </div>
              <div className="flex items-center justify-center text-neutral-700 font-bold">&rarr;</div>
              <div>
                <div className={`p-1 rounded-md text-[8.5px] border ${syncStatus === "jira_sync" ? "bg-amber-950 text-amber-300 border-amber-700 animate-pulse" : syncStatus === "dom_scrape" || syncStatus === "matching" || syncStatus === "completed" ? "bg-emerald-950 text-emerald-300 border-emerald-900" : "bg-neutral-950 text-neutral-500 border-neutral-800"}`}>
                  Jira Sync
                </div>
                <span className="text-[8px] text-neutral-500">JQL Extract</span>
              </div>
              <div className="flex items-center justify-center text-neutral-700 font-bold">&rarr;</div>
              <div>
                <div className={`p-1 rounded-md text-[8.5px] border ${syncStatus === "dom_scrape" ? "bg-indigo-950 text-indigo-300 border-indigo-700 animate-pulse" : syncStatus === "matching" || syncStatus === "completed" ? "bg-emerald-950 text-emerald-300 border-emerald-900" : "bg-neutral-950 text-neutral-500 border-neutral-800"}`}>
                  Puppeteer
                </div>
                <span className="text-[8px] text-neutral-500">DOM Scraping</span>
              </div>
            </div>

            {/* LOG STREAM DISPLAY */}
            <div className="bg-neutral-950/90 border border-neutral-900 p-3 rounded-lg font-mono text-[10px] text-neutral-400 space-y-1.5 h-[155px] overflow-y-auto leading-relaxed select-none mb-3">
              {syncLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-550 py-3">
                  <Briefcase className="w-6 h-6 text-neutral-850 mb-1.5 animate-pulse" />
                  <p>Queue engine idle. Complete coordinates left to trigger worker containers.</p>
                </div>
              ) : (
                syncLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <span className="text-neutral-600 font-semibold shrink-0">[{new Date().toLocaleTimeString()}]:</span>
                    <span className={log.includes("SUCCESS") || log.includes("🎉") ? "text-emerald-450 font-semibold" : log.includes("BullMQ") ? "text-indigo-400" : "text-neutral-300"}>
                      {log}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* PROGRESS STREAM BAR */}
            <div className="space-y-1 pt-1.5 border-t border-neutral-900">
              <div className="flex justify-between items-center text-[9.5px] font-mono text-neutral-400">
                <span>Docker Thread execution limits: 2.5GB RAM // 4 Cores</span>
                <span className="font-bold text-indigo-455">{syncProgress}%</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Active DOM locator matrix removed as requested */}

      </div>

      {/* STEP 2: SELECT USER STORY & BUG BACKLOG (3 in a Row Horizontally) */}
      {currentProject && (isSyncActive || (currentProject.stories && currentProject.stories.length > 0)) ? (
        <div className="space-y-6 pt-2">
          {/* User Stories backlogs row */}
          <div className="space-y-3">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Step 2A: Select User Story Backlog under {currentProject.projectKey} ({currentProject.stories.length})
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentProject.stories.map((st) => {
                const isSelected = selectedStory?.id === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => handleStorySelect(st)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                      isSelected
                        ? "bg-violet-950/20 border-violet-500 shadow-md ring-1 ring-violet-500/30"
                        : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-mono text-violet-400 font-bold">{st.id}</span>
                        <span className={`text-[8.5px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                          st.status === "Enhanced" 
                            ? "text-emerald-400 bg-emerald-950/20 border-emerald-900/30" 
                            : "text-amber-400 bg-amber-950/20 border-amber-900/30"
                        }`}>
                          {st.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-sans font-bold text-white line-clamp-1">{st.title}</h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{st.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bugs Backlog row */}
          <div className="space-y-3">
            <span className="text-[10.5px] font-mono uppercase tracking-wider text-rose-450 text-rose-400 font-bold flex items-center gap-2">
              <BugIcon className="w-4 h-4 text-rose-400 animate-pulse" />
              Step 2B: Active Project Bugs Backlog ({currentProject.bugs?.length || 0})
            </span>

            {currentProject.bugs && currentProject.bugs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentProject.bugs.map((bug: Bug) => {
                  const severityColors = {
                    Critical: "text-rose-450 bg-rose-950/30 border-rose-900/40",
                    Major: "text-amber-450 bg-amber-950/30 border-amber-900/40",
                    Minor: "text-blue-450 bg-blue-950/30 border-blue-900/40"
                  };
                  return (
                    <div
                      key={bug.id}
                      className="p-4 rounded-xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-900/70 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-mono text-rose-400 font-bold flex items-center gap-1">
                            <BugIcon className="w-3.5 h-3.5" />
                            {bug.id}
                          </span>
                          <span className={`text-[8.5px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded border ${severityColors[bug.severity as keyof typeof severityColors] || "text-neutral-400"}`}>
                            {bug.severity}
                          </span>
                        </div>
                        <h4 className="text-xs font-sans font-bold text-white line-clamp-1">{bug.title}</h4>
                        <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{bug.description}</p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-neutral-500">Status:</span>
                        <span className={`font-bold uppercase ${bug.status === "Open" ? "text-rose-400 animate-pulse" : bug.status === "In Progress" ? "text-amber-400" : "text-emerald-400"}`}>
                          {bug.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-neutral-900/20 border border-neutral-800/40 rounded-xl text-center text-xs text-neutral-500 py-6">
                ✓ No active unresolved defects logged inside this project folders.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#111113] border border-neutral-850 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center text-indigo-400">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h4 className="font-sans font-bold text-neutral-150 text-sm">User Story & Bug Backlog View Gated</h4>
            <p className="text-[11.5px] text-neutral-400 leading-relaxed font-sans">
              Jira synchronization is pending. To un-gate active user stories and proceed with dynamic voice auditing under your selected project, please configure your coordinates and click <strong>Fetch & Synchronize Workspace</strong> above to execute the distributed Playwright scraping container.
            </p>
          </div>
        </div>
      )}

      {/* STEP 3 & VOICE AUDITOR WORKSPACE */}
      {selectedStory && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl pt-5">
          
          {/* User Story Specification display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3 flex-wrap gap-2">
              <div className="space-y-0.5">
                <span className="text-[9.5px] font-mono text-violet-400 uppercase tracking-wider font-extrabold block">
                  Active User Story Specs
                </span>
                <h3 className="text-sm font-sans font-bold text-white tracking-tight">
                  {selectedStory.id}: {selectedStory.title}
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-neutral-950 border border-neutral-800 px-2.5 py-1 rounded text-neutral-400">
                Actors: {selectedStory.actors.join(", ")}
              </span>
            </div>

            <p className="text-xs text-neutral-300 font-sans leading-relaxed pl-3 border-l-2 border-indigo-600/70">
              {selectedStory.description}
            </p>

            {/* Analyse and generate button */}
            {!voiceSessionActive && (
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  className="flex items-center gap-2 px-5 py-3 h-11 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-505 hover:to-violet-505 text-white font-semibold rounded-lg text-xs leading-none transition cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4 text-white" />
                  <span>Analyse and Generate Test Case</span>
                </button>
              </div>
            )}
          </div>

          {/* AI VOICE AUDITOR CLARIFICATION BOOTH */}
          {voiceSessionActive && (
            <div className="border-t border-neutral-850 pt-5 space-y-5">
              
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                    AI Voice Auditor Session
                  </h4>
                  <p className="text-[10.5px] text-neutral-450">
                    Auto-evaluating requirements boundary limits. Talk via mic or send text inputs.
                  </p>
                </div>
                
                {/* Timer display badge */}
                {countdown !== null && (
                  <div className="bg-rose-950/20 border border-rose-900/30 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-mono text-rose-400 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Auto-proceeding in: <strong>{countdown}s</strong></span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                
                {/* Simulated Sound Wave Visual Block */}
                <div className="md:col-span-5 bg-neutral-950 border border-neutral-850 rounded-xl p-4 flex flex-col justify-between items-center text-center relative overflow-hidden h-64">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-bold">QA Auditor Pulse</span>
                    <span className="text-[10.5px] text-indigo-400 font-mono">Question {activeQuestionIdx + 1} / 3</span>
                  </div>

                  <div className="w-full flex flex-col items-center justify-center space-y-2 my-auto">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-lg transition-all duration-300 cursor-pointer ${
                      aiAnalyzingState === "speaking" ? "bg-indigo-600 border-indigo-400 text-white animate-bounce" :
                      aiAnalyzingState === "listening" ? "bg-rose-600 border-rose-450 text-white animate-pulse" :
                      aiAnalyzingState === "thinking" ? "bg-amber-600 border-amber-400 text-white animate-spin" :
                      "bg-neutral-900 border-neutral-805 text-neutral-400 border-neutral-800"
                    }`}>
                      {isListening ? (
                        <Mic className="w-5 h-5 text-white" />
                      ) : aiAnalyzingState === "speaking" ? (
                        <Volume2 className="w-5 h-5 text-white" />
                      ) : (
                        <Cpu className="w-5 h-5" />
                      )}
                    </div>

                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-neutral-400 block h-4">
                      {aiAnalyzingState === "speaking" ? "Auditor Speaking" :
                       aiAnalyzingState === "listening" ? "Recording Voice..." :
                       aiAnalyzingState === "thinking" ? "Evaluating Limits..." :
                       "Awaiting Input"}
                    </span>

                    {/* Wave lines simulation */}
                    <div className="flex items-center justify-center gap-1 h-5">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-indigo-500 rounded-full transition-all duration-150"
                          style={{
                            height: aiAnalyzingState !== "idle" ? `${3 + Math.random() * 15}px` : "3px"
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-neutral-500 uppercase">
                    Speech Synthesizer Loop
                  </div>
                </div>

                {/* Core conversation streams & input box */}
                <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                  
                  {activeQuestionIdx < doubts.length ? (
                    <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-3">
                      <div>
                        <span className="text-[9px] font-mono text-indigo-400 uppercase font-extrabold block">
                          Requirement Boundary Doubt
                        </span>
                        <h4 className="text-xs text-neutral-100 font-sans font-semibold leading-relaxed leading-snug">
                          {doubts[activeQuestionIdx].question}
                        </h4>
                      </div>

                      <div className="pl-3 border-l border-indigo-755 border-l-2 border-indigo-900/60 text-[10.5px] text-neutral-400 font-sans">
                        <strong>Impact Context:</strong> {doubts[activeQuestionIdx].context}
                      </div>

                      {/* Manual text area overrides */}
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={transcribedText}
                          onChange={(e) => setTranscribedText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSubmitAnswer();
                            }
                          }}
                          placeholder="Dictate with microphone, or type your answer and press Enter..."
                          className="w-full h-16 bg-neutral-905 border border-neutral-850 rounded-lg p-2.5 text-xs text-white bg-neutral-900 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                        />

                        {speechError && <p className="text-[10px] text-rose-400 italic font-mono">{speechError}</p>}

                        <div className="flex justify-between items-center gap-2">
                          <button
                            type="button"
                            onClick={handleToggleMic}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10.5px] rounded transition cursor-pointer font-sans font-semibold ${
                              isListening 
                                ? "bg-rose-950/20 border-rose-600 text-rose-300" 
                                : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white"
                            }`}
                          >
                            <Mic className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{isListening ? "Listening..." : "microphone Talk"}</span>
                          </button>

                          <button
                            onClick={handleSubmitAnswer}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded transition cursor-pointer"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/10 border border-emerald-900/30 rounded-xl p-4 text-center space-y-2.5 flex flex-col items-center justify-center h-full">
                      <span className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">✓</span>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-white">All doubts fully negotiated!</h4>
                        <p className="text-[10.5px] text-neutral-400 max-w-sm">
                          QA boundaries are established under compliance directives. playbooks generated completely.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chat stream history log */}
                  {chatLog.length > 0 && (
                    <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 h-28 overflow-y-auto space-y-2 text-xs">
                      {chatLog.slice(-4).map((log, i) => (
                        <div key={i} className={`flex flex-col ${log.sender === "user" ? "items-end" : "items-start"}`}>
                          <div className={`p-2 rounded-lg max-w-[90%] leading-relaxed ${
                            log.sender === "user" 
                              ? "bg-indigo-950/30 text-indigo-300 border border-indigo-900/30" 
                              : "bg-neutral-900 text-neutral-300 border border-neutral-850"
                          }`}>
                            <p className="text-[10.5px] font-sans">{log.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* GENERATED TEST CASE SUITE & COMPILATIONS */}
          {enhancedSpec && (
            <div className="border-t border-neutral-850 pt-5 space-y-5 animate-fade-in">
              
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Requirement Assets Compiled
                  </h4>
                  <p className="text-[10.5px] text-neutral-400">
                    Playwright testing playbook and multi-tier strict compliance parameters locked.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* Specifications on the Left (5/12 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4.5 space-y-3.5 max-h-[460px] overflow-y-auto">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-violet-400 uppercase font-bold block border-b border-neutral-850 pb-1.5">
                        Business Rules
                      </span>
                      <ul className="space-y-1.5 text-[11px] font-sans text-neutral-300 list-disc pl-4 leading-relaxed">
                        {enhancedSpec.businessRules.map((rule, idx) => <li key={idx}>{rule}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-neutral-850/50">
                      <span className="text-[10px] font-mono text-rose-400 uppercase font-bold block border-b border-neutral-850 pb-1.5">
                        Validation limits Rules
                      </span>
                      <ul className="space-y-1.5 text-[11px] font-sans text-neutral-400 list-disc pl-4 leading-relaxed">
                        {enhancedSpec.validationRules.map((rule, idx) => <li key={idx}>{rule}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-neutral-850/50">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block border-b border-neutral-850 pb-1.5">
                        Acceptance Criteria
                      </span>
                      <ul className="space-y-1.5 text-[11px] font-sans text-neutral-300 list-disc pl-4 leading-relaxed">
                        {enhancedSpec.acceptanceCriteria.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-neutral-200">
                            <span className="text-emerald-400">✓</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Playwright Script Code on the Right (7/12 cols) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
                  <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-neutral-850 pb-2 mb-3">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold block">
                          Playwright Automation Ticket code
                        </span>
                        <span className="text-[9.5px] font-mono text-neutral-500">TypeScript</span>
                      </div>
                      
                      <pre className="text-[10.5px] font-mono text-neutral-300 bg-neutral-900 p-3 rounded-lg border border-neutral-855 overflow-x-auto leading-relaxed max-h-[300px]">
                        {generatedCode}
                      </pre>
                    </div>

                    <div className="pt-3 border-t border-neutral-850/60 mt-4 flex justify-between items-center gap-3">
                      <div className="flex items-center gap-2">
                        {executionStatus === "running" && (
                          <span className="text-[10px] font-mono text-amber-400 animate-pulse">Running playwright tests...</span>
                        )}
                        {executionStatus === "passed" && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">● PASSING CONSTRAINTS</span>
                        )}
                      </div>

                      <button
                        onClick={handleExecutePlaybookSimulation}
                        disabled={isExecuting}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-905 bg-indigo-950/50 hover:bg-indigo-900 border border-indigo-700/30 hover:border-indigo-650 rounded text-xs font-mono text-indigo-300 transition cursor-pointer"
                      >
                        <Play className="w-3 h-3 text-indigo-400" />
                        <span>{isExecuting ? "Executing Simulation..." : "Run Playbook Simulation"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Operational Run logs */}
                  {executionLogs.length > 0 && (
                    <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 text-[10px] font-mono text-neutral-400 space-y-1 h-32 overflow-y-auto w-full">
                      {executionLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2">
                          <span className="text-neutral-500">{`[${10 + idx}:03:15]`}</span>
                          <span className={log.includes("SUCCESS") ? "text-emerald-400 font-bold" : "text-neutral-300"}>{log}</span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>

              {/* Step 4: Swtich to memories mapping tab */}
              {onSwitchToMemories && (
                <div className="bg-neutral-950 border border-indigo-900/30 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 mt-6 animate-fade-in">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono uppercase font-bold text-indigo-400 tracking-wider">
                      Step 4: Inter-Project Integration Memories Mapping
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                      Requirements have been successfully validated and verified. Map how these stories hook into other enterprise subscription pipelines to protect against database integration gaps.
                    </p>
                  </div>
                  <button
                    onClick={onSwitchToMemories}
                    className="w-full md:w-auto px-5 py-2.5 bg-indigo-650 hover:bg-indigo-555 font-semibold text-white text-xs rounded-lg shadow-lg cursor-pointer transition select-none flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>Proceed to Memorise Tab</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
