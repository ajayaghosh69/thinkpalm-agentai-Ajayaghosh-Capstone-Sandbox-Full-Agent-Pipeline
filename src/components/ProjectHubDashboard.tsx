import React, { useState, useEffect, useRef } from "react";
import { Project, UserStory } from "../types";
import { 
  Plus, 
  Folder, 
  ArrowLeft, 
  Globe, 
  ChevronRight, 
  FolderOpen
} from "lucide-react";

export function PacketBackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || canvas.offsetWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || canvas.offsetHeight || 380);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || canvas.offsetWidth || 500;
      height = canvas.height = canvas.parentElement?.clientHeight || canvas.offsetHeight || 380;
    };

    window.addEventListener("resize", handleResize);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      isActive: boolean;
      alpha: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 3.2; // High Speed Packet movement
        this.vy = (Math.random() - 0.5) * 1.8;
        this.isActive = Math.random() > 0.8;   // Highlighted custom active packets
        this.alpha = this.isActive ? 0.95 : 0.45;
        this.size = this.isActive ? Math.random() * 3 + 2.5 : Math.random() * 1.5 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.shadowBlur = this.isActive ? 12 : 0;
        context.shadowColor = "rgba(139, 92, 246, 0.85)";
        context.fillStyle = `rgba(167, 139, 250, ${this.alpha})`;
        context.fill();
        context.shadowBlur = 0;
      }
    }

    const particles: Particle[] = Array.from({ length: 45 }).map(() => new Particle());

    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw active packet connection links
      ctx.strokeStyle = "rgba(139, 92, 246, 0.05)";
      ctx.lineWidth = 0.85;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 115) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw packets
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0"
    />
  );
}

interface ProjectHubDashboardProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onUpdateProject: (id: string, updatedFields: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onSelectStory: (story: UserStory) => void;
  onConfigureJiraProject: (details: {
    name: string;
    description: string;
    managerName?: string;
    jiraUrl: string;
    jiraToken: string;
    jiraEmail: string;
    projectKey: string;
  }) => Promise<void>;
  onImportNewStory: () => void;
  dispatchGenAiQuery: (contents: string, systemInstruction?: string) => Promise<string>;
}

export default function ProjectHubDashboard({
  projects,
  activeProjectId,
  onSelectProject,
  onUpdateProject,
  onDeleteProject,
  onConfigureJiraProject
}: ProjectHubDashboardProps) {
  
  // Navigation State: Directory vs Inside a Project
  const [isInsideProject, setIsInsideProject] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  // Connect Jira Project Form State
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projManager, setProjManager] = useState("Aparna Ajay");
  const [jiraUrl, setJiraUrl] = useState("");
  const [jiraEmail, setJiraEmail] = useState("");
  const [jiraToken, setJiraToken] = useState("");
  const [projKey, setProjKey] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  // Edit / Delete states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editManager, setEditManager] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editJiraUrl, setEditJiraUrl] = useState("");
  const [editJiraEmail, setEditJiraEmail] = useState("");
  const [editJiraToken, setEditJiraToken] = useState("");
  
  const [revealToken, setRevealToken] = useState(false);

  // Find currently active project
  const activeProj = projects.find(p => p.id === activeProjectId) || projects[0];

  const handleConnectJiraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projKey.trim() || !projDesc.trim()) return;
    
    setConnectLoading(true);
    try {
      await onConfigureJiraProject({
        name: projName,
        description: projDesc,
        managerName: projManager || "Aparna Ajay",
        jiraUrl: jiraUrl || "https://custom-jira-operations.atlassian.net",
        jiraEmail: jiraEmail || "pm-lead@corporate-services.com",
        jiraToken: jiraToken || "ATATT3x_token_2026",
        projectKey: projKey.toUpperCase()
      });
      
      setProjName("");
      setProjDesc("");
      setProjManager("Aparna Ajay");
      setJiraUrl("");
      setJiraEmail("");
      setJiraToken("");
      setProjKey("");
      setShowConnectModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setConnectLoading(false);
    }
  };

  const openEditModal = () => {
    if (!activeProj) return;
    setEditName(activeProj.name);
    setEditDesc(activeProj.description);
    setEditManager(activeProj.managerName || "Aparna Ajay");
    setEditKey(activeProj.projectKey);
    setEditJiraUrl(activeProj.jiraUrl);
    setEditJiraEmail(activeProj.jiraEmail);
    setEditJiraToken(activeProj.jiraToken);
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProj) return;
    onUpdateProject(activeProj.id, {
      name: editName,
      description: editDesc,
      managerName: editManager,
      projectKey: editKey.toUpperCase(),
      jiraUrl: editJiraUrl,
      jiraEmail: editJiraEmail,
      jiraToken: editJiraToken,
    });
    setShowEditModal(false);
  };

  const handleDelete = () => {
    if (!activeProj) return;
    if (confirm(`Are you sure you want to delete the project '${activeProj.name}'? This actions is permanent.`)) {
      onDeleteProject(activeProj.id);
      setIsInsideProject(false);
    }
  };

  // If we are looking at the Project Directory list
  if (!isInsideProject) {
    return (
      <div className="space-y-6" id="project-directory-view">
        {/* Simple Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div className="space-y-1">
            <h2 className="text-sm font-mono uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-violet-400" />
              Connected Project Hub
            </h2>
            <p className="text-xs text-neutral-500 font-sans">
              Only displaying your connected workspaces. Select any project below to inspect its details or edit settings.
            </p>
          </div>
          
          <button
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs tracking-wide transition cursor-pointer self-start sm:self-auto h-9"
          >
            <Plus className="w-3.5 h-3.5" />
            Connect Jira Project
          </button>
        </div>

        {/* Directory Card Grid - Show only added projects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const isCurrentlySelected = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProject(p.id);
                  setIsInsideProject(true);
                }}
                className={`p-5 rounded-xl border text-left transition duration-200 cursor-pointer flex flex-col justify-between ${
                  isCurrentlySelected
                    ? "bg-violet-950/20 border-violet-600 shadow-md shadow-violet-950/10"
                    : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9.5px] font-mono uppercase px-2 py-0.5 rounded border ${
                      isCurrentlySelected 
                        ? "bg-violet-900/30 text-violet-400 border-violet-750" 
                        : "bg-neutral-950 text-neutral-400 border-neutral-850"
                    }`}>
                      Key: {p.projectKey}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 font-semibold">
                      {p.stories.length} stories
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-white text-xs tracking-tight line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-neutral-850/50 flex items-center justify-between">
                  <span className="text-[9px] font-mono text-neutral-400 bg-neutral-950/40 px-2 py-0.5 rounded-full flex items-center gap-1.5 leading-none font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Manager: {p.managerName || "Aparna Ajay"}
                  </span>
                  
                  <span className="text-[10px] font-sans font-semibold text-violet-400 flex items-center gap-0.5 group-hover:translate-x-1 transition">
                    Go Inside <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State Guide */}
        {projects.length === 0 && (
          <div className="text-center p-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-950 flex flex-col items-center justify-center">
            <Folder className="w-10 h-10 text-neutral-600 mb-3" />
            <h4 className="text-sm font-semibold text-white">No Connected Projects</h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Please click "Connect Jira Project" above to define a project context and load backlog tickets.
            </p>
          </div>
        )}

        {/* Jira Connected Projects Setup Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in animate-duration-150">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-left">
              <button 
                onClick={() => setShowConnectModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition text-lg h-6 w-6 flex items-center justify-center rounded-full bg-neutral-950/50"
                disabled={connectLoading}
              >
                &times;
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-violet-950/20 rounded border border-violet-900/30">
                    <Globe className="w-4 h-4 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">Connect New Jira Cloud Project</h3>
                </div>
                <p className="text-xs text-neutral-400">
                  Provide project parameters to generate synchronized requirements and testing universes instantly.
                </p>
              </div>

              <form onSubmit={handleConnectJiraSubmit} className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                      Project Display Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Booking Engine Service"
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                      disabled={connectLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                      Jira Project Key
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BES"
                      value={projKey}
                      onChange={(e) => setProjKey(e.target.value)}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono uppercase"
                      disabled={connectLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                    Project Manager Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Aparna Ajay"
                    value={projManager}
                    onChange={(e) => setProjManager(e.target.value)}
                    className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                    disabled={connectLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                    Project Context & Specification Goals
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Describe what this software pipeline handles..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg p-3 text-xs focus:outline-none focus:border-violet-500 resize-none font-sans"
                    disabled={connectLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                    Jira Host URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://atlassian-cloud.atlassian.net"
                    value={jiraUrl}
                    onChange={(e) => setJiraUrl(e.target.value)}
                    className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono"
                    disabled={connectLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                      Atlassian User Email
                    </label>
                    <input
                      type="email"
                      placeholder="engineer-lead@company.org"
                      value={jiraEmail}
                      onChange={(e) => setJiraEmail(e.target.value)}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                      disabled={connectLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                      Secure API Token Key
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••"
                      value={jiraToken}
                      onChange={(e) => setJiraToken(e.target.value)}
                      className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                      disabled={connectLoading}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 text-xs pt-3 border-t border-neutral-850 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(false)}
                    className="px-4 py-2 bg-neutral-950 text-neutral-400 hover:text-white rounded-lg text-xs leading-none font-semibold transition"
                    disabled={connectLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={connectLoading}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs leading-none transition"
                  >
                    {connectLoading ? "Synchronizing..." : "Establish Link"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ELSE: WE ARE "INSIDE" A SELECTED PROJECT! Show Project core info with editing & deletion ONLY!
  if (!activeProj) {
    return (
      <div className="text-center p-12">
        <p className="text-sm text-neutral-400">No project active.</p>
        <button
          onClick={() => setIsInsideProject(false)}
          className="mt-4 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="project-details-workbench">
      
      {/* Detail Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-850 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInsideProject(false)}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
            title="Back to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-violet-950/40 text-violet-400 border border-violet-900/40 px-2 py-0.5 rounded font-bold">
                Project Key: {activeProj.projectKey}
              </span>
              <span className="text-[10px] uppercase font-mono bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 px-2 py-0.5 rounded font-semibold">
                Jira Synced Pipeline
              </span>
            </div>
            <h2 className="text-base font-sans font-bold text-white tracking-tight">
              {activeProj.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-750 rounded-lg text-xs font-semibold text-neutral-350 hover:text-white transition cursor-pointer"
          >
            Edit Details
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/20 border border-rose-900/30 hover:border-rose-800/50 rounded-lg text-xs font-semibold text-rose-450 hover:text-rose-350 transition cursor-pointer"
          >
            Delete Project
          </button>
        </div>
      </div>

      {/* Main Single-View Layout displaying exactly project details and JIRA connection details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Project details card */}
        <div className="glass-panel p-5 space-y-4 shadow-lg flex flex-col justify-between relative overflow-hidden">
          {/* Tactical HUD accents */}
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
          
          {/* Scanning HUD Animation */}
          <div className="hud-scan-line" />

          {/* High-Performance Canvas Animation Backdrop */}
          <PacketBackgroundCanvas />

          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Folder className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-300">
                Project Details
              </h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">Project Code</span>
                  <span className="text-sm font-mono font-medium text-white">{activeProj.projectKey}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">Project Manager Name</span>
                  <span className="text-sm font-sans font-medium text-white">{activeProj.managerName || "Aparna Ajay"}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold font-bold">Workflow Description</span>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed mt-1">{activeProj.description}</p>
              </div>
            </div>
          </div>

          {/* Counts Dashboard */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 mt-6 md:mt-2 relative z-10">
            <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-center">
              <span className="text-[9.5px] font-mono text-neutral-400 uppercase block font-semibold">Number of User Stories</span>
              <span className="text-xl font-mono font-bold text-violet-400 mt-1">{activeProj.stories.length}</span>
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-center">
              <span className="text-[9.5px] font-mono text-neutral-400 uppercase block font-semibold">Number of Bugs</span>
              <span className="text-xl font-mono font-bold text-rose-450 mt-1">{(activeProj.bugs || []).length}</span>
            </div>
          </div>
        </div>

        {/* Jira connection details */}
        <div className="glass-panel p-5 space-y-4 shadow-lg text-left relative overflow-hidden">
          {/* Tactical HUD accents */}
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
          
          {/* Scanning HUD Animation */}
          <div className="hud-scan-line" style={{ animationDelay: "3s" }} />

          {/* High-Performance Canvas Animation Backdrop */}
          <PacketBackgroundCanvas />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-neutral-300">
                Jira Connection
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">Jira URL</span>
                <span className="text-xs font-mono text-neutral-300 block mt-1 break-all bg-black/40 p-2.5 rounded border border-white/5">
                  {activeProj.jiraUrl || "https://jira-cloud-instance.atlassian.net"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">Atlassian User Email</span>
                <span className="text-xs font-sans text-neutral-300 block mt-1 bg-black/40 p-2.5 rounded border border-white/5">
                  {activeProj.jiraEmail || "ops-team@atlassian-cloud.org"}
                </span>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-semibold">Token / Password</span>
                  <button
                    type="button"
                    onClick={() => setRevealToken(!revealToken)}
                    className="text-[10px] font-sans font-semibold text-violet-400 hover:text-violet-300 transition cursor-pointer"
                  >
                    {revealToken ? "Mask Token" : "Reveal Token"}
                  </button>
                </div>
                <span className="text-xs font-mono text-neutral-300 block mt-1 break-all bg-black/40 p-2.5 rounded border border-white/5">
                  {revealToken 
                    ? (activeProj.jiraToken || "No Token Assigned") 
                    : "••••••••••••••••••••••••••••••••••••••••"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Elegant Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition text-lg h-6 w-6 flex items-center justify-center rounded-full bg-neutral-950/50"
            >
              &times;
            </button>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-white tracking-tight">Modify Connected Project</h3>
              <p className="text-xs text-neutral-400">
                Update core attributes and Atlassian secrets cleanly.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                    Project Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                    Jira Project Key
                  </label>
                  <input
                    type="text"
                    required
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                    Project Manager Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editManager}
                    onChange={(e) => setEditManager(e.target.value)}
                    className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                    Atlassian User Email
                  </label>
                  <input
                    type="email"
                    value={editJiraEmail}
                    onChange={(e) => setEditJiraEmail(e.target.value)}
                    className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                  Project Description
                </label>
                <textarea
                  required
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg p-3 text-xs focus:outline-none focus:border-violet-500 resize-none font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                  Jira Host URL
                </label>
                <input
                  type="text"
                  value={editJiraUrl}
                  onChange={(e) => setEditJiraUrl(e.target.value)}
                  className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-neutral-400 uppercase font-bold block">
                  Secure API Token Key
                </label>
                <input
                  type="password"
                  value={editJiraToken}
                  onChange={(e) => setEditJiraToken(e.target.value)}
                  className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs pt-3 border-t border-neutral-850 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-neutral-950 text-neutral-400 hover:text-white rounded-lg text-xs leading-none font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs leading-none transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
