import React, { useState, useEffect, useMemo, useRef } from "react";
import { Project, UserStory } from "../types";
import { 
  Database, 
  Brain, 
  Search, 
  Share2, 
  FileCode, 
  HelpCircle, 
  Activity, 
  Sparkles, 
  Cpu, 
  Layers, 
  ChevronRight, 
  Code, 
  Calendar, 
  AlertTriangle, 
  Workflow, 
  ClipboardList, 
  Network, 
  MessageSquare, 
  Timer, 
  CheckSquare, 
  FileText, 
  X, 
  Compass, 
  Maximize2, 
  Zap,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MemoryTabComponentProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onTriggerCrossProjectAnalysis: (prompt: string) => Promise<string>;
}

// Simplified high-integrity node format representing real functions & projects only
export interface GraphNode {
  id: string;
  label: string;
  type: "project" | "feature" | "requirement" | "task" | "api";
  subtitle: string;
  description: string;
  timeline?: Array<{ date: string; event: string; type: "system" | "milestone" | "decision" | "gap" | "code" | "anomaly" | "guideline" }>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

// -----------------------------------------------------------------------------
// TECHNICAL MASTER REGISTERS (Real functions, APIs, and Data Points ONLY - no people)
// -----------------------------------------------------------------------------
const KNOWLEDGE_GRAPH_NODES: GraphNode[] = [
  // PROJECTS (The 4 anchor systems)
  {
    id: "proj-csc",
    label: "CSC Incident Engine",
    type: "project",
    subtitle: "Support Escalations & Active Dispatch Node",
    description: "Enterprise incident clearinghouse syncing active tracking tickets, live status streams, and compliance triggers.",
    timeline: [
      { date: "2026-05-10", event: "Project repository bootstrapped on cloud registry", type: "system" },
      { date: "2026-05-15", event: "Standard routing queues configured", type: "system" }
    ]
  },
  {
    id: "proj-cpd",
    label: "Collision Prevention Deck (CPD)",
    type: "project",
    subtitle: "Collision Intelligence & Prediction Vector Service",
    description: "Low-latency alert dashboard processing CPA/TCPA trajectories, transponder streams, and marine telemetry.",
    timeline: [
      { date: "2026-05-01", event: "AIS feed transponder parsing pipeline established", type: "milestone" },
      { date: "2026-05-20", event: "Collision geometry mathematical vectors verified", type: "system" }
    ]
  },
  {
    id: "proj-tal",
    label: "Compliance & Mariner Logs (TAL)",
    type: "project",
    subtitle: "Automated Licensing Ledger & Hour Watch",
    description: "Regulatory ledger comparing mandatory simulator training templates with real-time bridge logger schedules.",
    timeline: [
      { date: "2026-03-10", event: "SLA watchkeeping validation metrics drafted", type: "milestone" }
    ]
  },
  {
    id: "proj-mca",
    label: "Maritime Cargo Analytics (MCA)",
    type: "project",
    subtitle: "Automated High-Safety Silo Control Core",
    description: "SIL-3 safety monitoring core listening to pressure, tilt ratios, weight displacement metrics, and hazmat states.",
    timeline: [
      { date: "2026-05-05", event: "SIL-3 safety containment valve protocol certified", type: "milestone" }
    ]
  },

  // REAL CONNECTING FUNCTIONS & TELEMETRY DATA POINTS
  {
    id: "func-nmea-parser",
    label: "NMEA GPS Ingestion Parser",
    type: "feature",
    subtitle: "Parser • CPD ── MCA Junction",
    description: "Decodes continuous NMEA sentence lines from maritime transponders. Connects CPD navigation paths with active MCA port cargo silos to determine spatial orientation on arrival.",
    timeline: [{ date: "2026-05-02", event: "Standardized binary string translator added", type: "code" }]
  },
  {
    id: "func-tcpa-calculator",
    label: "TCPA Trajectory Calculus Solver",
    type: "feature",
    subtitle: "Calculus Service • CPD ── TAL Junction",
    description: "Calculates Time to Closest Point of Approach (TCPA) matrices. Links active CPD warning thresholds directly into TAL simulators to grade officer watch course reactions.",
    timeline: [{ date: "2026-04-12", event: "Verified trajectory intersection loop vectors", type: "system" }]
  },
  {
    id: "func-sqlite-verification",
    label: "SQLite Credential Audit Schema",
    type: "api",
    subtitle: "Validation Schema • TAL ── CSC Junction",
    description: "Queries the local SQLite database to confirm mariner credentials. Provides proof-of-watch compliance when the CSC incident dispatcher receives urgent escalations from bridge stations.",
  },
  {
    id: "func-vessel-corrections",
    label: "Auto-Steering Corrections API",
    type: "api",
    subtitle: "Vector Control API • CPD ── MCA Junction",
    description: "Forwards predictive auto-helm yaw commands to helm relays. If a high tilt vector is reported inside MCA cargo silos, this API automatically triggers course adjustments via CPD controls to stabilize ballast.",
  },
  {
    id: "func-displacement-telemetry",
    label: "Silo Displacement Hydrometer Protocol",
    type: "api",
    subtitle: "Sensor Data Stream • MCA ── CSC Junction",
    description: "Streams high-frequency volume metrics from cargo silos. Any sensor displacement delta exceeding the safety ceiling automatically registers a critical ticket inside the CSC Incident database.",
  },
  {
    id: "func-jwt-sanitizer",
    label: "JWT Outflux Token Sanitizer",
    type: "requirement",
    subtitle: "Security Filter • CSC ── TAL Junction",
    description: "Cleanses error logs of OAuth JWT structures. Prevents secret watchkeeper tokens and licenses in TAL registries from leaking into CSC webhook payloads during system diagnostic dumps.",
  },
  {
    id: "func-webhook-scheduler",
    label: "Webhook Event Failover Retrier",
    type: "requirement",
    subtitle: "Reliability Queue • CSC ── CPD Junction",
    description: "Acts as an exponential backoff scheduler. Prevents dispatcher socket timeouts on CSC whenever a network gap interrupts the CPD high-seas telemetry transponder broadcast stream.",
  },
  {
    id: "func-sil3-fail-safe",
    label: "SIL-3 Auto-Shutoff Safe Valve Trigger",
    type: "requirement",
    subtitle: "Safety Control • MCA ── TAL Junction",
    description: "Hardware loop actuator commanding immediate pressure exhaust shutoffs. Connects MCA physical limits with the TAL compliance deck to write immutable emergency logs during physical overrides.",
  }
];

const KNOWLEDGE_GRAPH_EDGES: GraphEdge[] = [
  // Each function connects exactly 2 projects
  { id: "e-nmea-cpd", source: "func-nmea-parser", target: "proj-cpd", label: "Provide GPS inputs" },
  { id: "e-nmea-mca", source: "func-nmea-parser", target: "proj-mca", label: "Sync port silo coords" },

  { id: "e-tcpa-cpd", source: "func-tcpa-calculator", target: "proj-cpd", label: "Calculate CPA warning" },
  { id: "e-tcpa-tal", source: "func-tcpa-calculator", target: "proj-tal", label: "Log course simulator grade" },

  { id: "e-sqlite-tal", source: "func-sqlite-verification", target: "proj-tal", label: "Assess mariner license validity" },
  { id: "e-sqlite-csc", source: "func-sqlite-verification", target: "proj-csc", label: "Authorize urgent support priorities" },

  { id: "e-vessel-cpd", source: "func-vessel-corrections", target: "proj-cpd", label: "Send traj adjustments" },
  { id: "e-vessel-mca", source: "func-vessel-corrections", target: "proj-mca", label: "Trigger silo ballast acts" },

  { id: "e-disp-mca", source: "func-displacement-telemetry", target: "proj-mca", label: "Monitor fluid weights" },
  { id: "e-disp-csc", source: "func-displacement-telemetry", target: "proj-csc", label: "Report sensor overflow log" },

  { id: "e-jwt-csc", source: "func-jwt-sanitizer", target: "proj-csc", label: "Scrub support payload outflux" },
  { id: "e-jwt-tal", source: "func-jwt-sanitizer", target: "proj-tal", label: "Protect system credentials" },

  { id: "e-web-csc", source: "func-webhook-scheduler", target: "proj-csc", label: "Queue notification hooks" },
  { id: "e-web-cpd", source: "func-webhook-scheduler", target: "proj-cpd", label: "Retry telemetry frames" },

  { id: "e-sil3-mca", source: "func-sil3-fail-safe", target: "proj-mca", label: "Actuate silo block valve" },
  { id: "e-sil3-tal", source: "func-sil3-fail-safe", target: "proj-tal", label: "Log formal regulatory override" }
];

// Coordinate grids for a highly project-wise visual representation
// The 4 main projects form the outer rectangle, and functions sit relative to them
const BASE_DRAG_POSITIONS: Record<string, { x: number; y: number }> = {
  // Main projects (Corners)
  "proj-cpd": { x: 22, y: 22 },   // Top Left
  "proj-tal": { x: 78, y: 22 },   // Top Right
  "proj-csc": { x: 22, y: 78 },   // Bottom Left
  "proj-mca": { x: 78, y: 78 },   // Bottom Right

  // Connecting functions (Placed strategically along orbits/diagonals)
  "func-tcpa-calculator": { x: 50, y: 16 },       // Top Center
  "func-displacement-telemetry": { x: 50, y: 84 }, // Bottom Center
  "func-webhook-scheduler": { x: 16, y: 50 },      // Left Center
  "func-sil3-fail-safe": { x: 84, y: 50 },         // Right Center

  "func-nmea-parser": { x: 44, y: 41 },            // Mid-Center Cluster 1
  "func-sqlite-verification": { x: 56, y: 41 },    // Mid-Center Cluster 2
  "func-vessel-corrections": { x: 44, y: 59 },     // Mid-Center Cluster 3
  "func-jwt-sanitizer": { x: 56, y: 59 }           // Mid-Center Cluster 4
};

// Real pre-computed Agent Analyses mapping functions to stories, removing all human names
const AGENT_PRESET_ANALYSES: Record<string, { connectedStories: string[]; whyRelated: string }> = {
  "func-nmea-parser": {
    connectedStories: [
      "CPD-102: Process streaming AIS GPS transponder coordinates",
      "MCA-503: Track real-time vessel positioning relative to cargo silos"
    ],
    whyRelated: "The NMEA GPS Ingestion Parser acts as the primary telemetry bridge. It binds the low-latency transponder streams from the Collision Prevention Deck (CPD) directly with the geo-location listeners of the Maritime Cargo Analytics (MCA) system. This ensures that cargo silos have sub-second awareness of approaching ship vectors, allowing the safety modules to coordinate hazard clearance levels dynamically without manual delay."
  },
  "func-tcpa-calculator": {
    connectedStories: [
      "CPD-201: Calculate TCPA (Time to Closest Point of Approach) matrices",
      "TAL-402: Log bridge watch simulator training performance metrics"
    ],
    whyRelated: "The TCPA Trajectory Calculus Solver is mathematically bound to both collision mitigation and officer licensing. It generates target motion vectors in CPD and synchronizes the simulator records in TAL to record and certify that bridge crews have successfully responded to automated collision avoidance test trajectories, validating safety thresholds under audit conditions."
  },
  "func-sqlite-verification": {
    connectedStories: [
      "TAL-112: Query SQLite credentials ledger for certified watchkeepers",
      "CSC-610: Elevate support tier priority for validated bridge situations"
    ],
    whyRelated: "The SQLite Credential Audit Schema enforces instant authorization checks. When a critical support ticket is received by the CSC Incident Engine, this schema queries TAL's SQLite ledger to verify if the reporting duty command profile holds the appropriate watchkeeping license. High-priority support channels are unlocked solely for verified nodes, preventing manual verification delays during mid-sea incidents."
  },
  "func-vessel-corrections": {
    connectedStories: [
      "CPD-305: Dispatch automated helm trajectory steer commands",
      "MCA-508: Seal silo cargo hatches on approach warning thresholds"
    ],
    whyRelated: "The Auto-Steering Corrections API forms a high-integrity dual-system fail-safe. If the Collision Prevention Deck calculates an unavoidable course correction event, it simultaneously commands the active auto-helm and triggers the Maritime Cargo Analytics system to automatically seal all high-pressure cargo silos. This prevents material contamination or rupture risks from sudden directional yaw shifts."
  },
  "func-displacement-telemetry": {
    connectedStories: [
      "MCA-109: Stream cargo silo tilt and volume pressure sensors",
      "CSC-405: File critical automated webhook exceptions on pressure logs"
    ],
    whyRelated: "The Silo Displacement Hydrometer Protocol is an active diagnostics pipeline. It monitors continuous volume and weight metrics across the cargo silos mapped in MCA. Any telemetry deviation exceeding the standard 8% threshold initiates an exception state, which is immediately pushed to the CSC Incident Engine to spin up support alerts on Port 3000."
  },
  "func-jwt-sanitizer": {
    connectedStories: [
      "CSC-220: Intercept and scrub logs before webhook dispatches",
      "TAL-310: Secure simulator credential database from bearer token leaks"
    ],
    whyRelated: "The JWT Outflux Token Sanitizer acts as a strict security barrier. In CSC Incident systems, debugging failure payloads often inadvertently dump authorization headers into external notification logs. This sanitizer automatically inspects all outgoing transaction payloads and scrubs JWT tokens, ensuring that sensitive mariner certificates in the TAL database remain safe from public exposure."
  },
  "func-webhook-scheduler": {
    connectedStories: [
      "CSC-102: Dispatch Slack and email incident escalation updates",
      "CPD-404: Broadcast telemetry exception updates"
    ],
    whyRelated: "The Webhook Event Failover Retrier maintains connection reliability under heavy packet loads. It prevents thread freezes in the CSC Incident Engine by implementing an asynchronous retry queue with exponential backoff. This ensures that critical transponder telemetry exceptions occurring in CPD are successfully dispatched as escalation alerts even during severe weather network degradation."
  },
  "func-sil3-fail-safe": {
    connectedStories: [
      "MCA-308: Trigger automatic exhaust shutoff block valves",
      "TAL-501: Track critical emergency override authorizations"
    ],
    whyRelated: "The SIL-3 Auto-Shutoff Safe Valve Trigger represents a hardcoded safety-integrity loop. It binds MCA's automated physical containment valves with the TAL compliance logging deck. If any silo automated override is initiated, the valve shutoff event is permanently written into compliance logs to maintain full audibility under international maritime safety regulations."
  }
};

export default function MemoryTabComponent({
  projects,
  activeProjectId,
  onSelectProject,
  onTriggerCrossProjectAnalysis
}: MemoryTabComponentProps) {
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dragging offsets
  const [dragOffsets, setDragOffsets] = useState<Record<string, { x: number; y: number }>>({});
  
  // Hover, selector states
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("proj-cpd");
  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");

  // POPUP FOCUS MODEL STATES
  const [focusModalNode, setFocusModalNode] = useState<GraphNode | null>(null);
  const [modalAnalysisText, setModalAnalysisText] = useState("");
  const [isModalAnalyzing, setIsModalAnalyzing] = useState(false);

  // Chatbot state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "copilot"; text: string }>>([
    { 
      sender: "copilot", 
      text: "System knowledge bases synchronized. Query me to analyze cross-project dependencies, explain SIL-3 loop compliance, or detail how functions bridge different platforms!" 
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Telemetry logger
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYS] Master Memory registers indexed on Port 3000.",
    "[SYS] Eliminated human-name indexes. Structural code integration points active.",
    "[SYS] Core 1:1 square topography ready."
  ]);

  // Toggle for horizontal point preview panel
  const [showMorePoints, setShowMorePoints] = useState(false);

  // Ambient dust particles
  const particles = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => {
      const size = Math.random() * 3 + 1.5;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const speed = Math.random() * 6 + 4;
      const delay = Math.random() * -8;
      const opacity = Math.random() * 0.2 + 0.05;
      return {
        id: i,
        style: {
          position: "absolute" as const,
          width: `${size}px`,
          height: `${size}px`,
          left: `${left}%`,
          top: `${top}%`,
          backgroundColor: "#6366f1",
          borderRadius: "50%",
          opacity: opacity,
          boxShadow: `0 0 ${size * 1.5}px rgba(99, 102, 241, 0.45)`,
          animation: `float-memory-refined ${speed}s linear infinite`,
          animationDelay: `${delay}s`,
          pointerEvents: "none" as const,
        }
      };
    });
  }, []);

  const handleNodeDrag = (nodeId: string, event: any, info: any) => {
    setDragOffsets(prev => ({
      ...prev,
      [nodeId]: {
        x: (prev[nodeId]?.x || 0) + info.delta.x * 0.12,
        y: (prev[nodeId]?.y || 0) + info.delta.y * 0.12
      }
    }));
  };

  const nodePositions = useMemo(() => {
    const coords: Record<string, { x: number; y: number }> = {};
    KNOWLEDGE_GRAPH_NODES.forEach(n => {
      const base = BASE_DRAG_POSITIONS[n.id] || { x: 50, y: 50 };
      const offset = dragOffsets[n.id] || { x: 0, y: 0 };
      coords[n.id] = {
        x: Math.max(5, Math.min(95, base.x + offset.x)),
        y: Math.max(5, Math.min(95, base.y + offset.y))
      };
    });
    return coords;
  }, [dragOffsets]);

  // Dynamic filter based on searchQuery
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return KNOWLEDGE_GRAPH_NODES;
    const q = searchQuery.toLowerCase();
    return KNOWLEDGE_GRAPH_NODES.filter(n => 
      n.label.toLowerCase().includes(q) ||
      n.subtitle.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q) ||
      n.type.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const selectedNode = useMemo(() => {
    return KNOWLEDGE_GRAPH_NODES.find(n => n.id === selectedNodeId) || KNOWLEDGE_GRAPH_NODES[0];
  }, [selectedNodeId]);

  const visibleConnectionPoints = useMemo(() => {
    const maxPoints = filteredNodes.slice(0, 6);
    return showMorePoints ? maxPoints : maxPoints.slice(0, 2);
  }, [filteredNodes, showMorePoints]);

  const highlightedNodeIds = useMemo(() => {
    const targetId = hoveredNodeId || selectedNodeId;
    if (!targetId) return new Set<string>();

    const neighbors = new Set<string>([targetId]);
    KNOWLEDGE_GRAPH_EDGES.forEach(edge => {
      if (edge.source === targetId) neighbors.add(edge.target);
      else if (edge.target === targetId) neighbors.add(edge.source);
    });

    if (searchQuery.trim()) {
      filteredNodes.forEach(n => neighbors.add(n.id));
    }
    return neighbors;
  }, [hoveredNodeId, selectedNodeId, filteredNodes, searchQuery]);

  const discoveryTrail = useMemo(() => {
    if (!selectedNodeId) return [];
    const path: Array<{ label: string; type: string; edgeLabel?: string }> = [];
    path.push({ label: selectedNode.label, type: selectedNode.type });

    let currentId = selectedNodeId;
    let visited = new Set<string>([currentId]);

    for (let depth = 0; depth < 3; depth++) {
      const nextEdge = KNOWLEDGE_GRAPH_EDGES.find(e => 
        (e.source === currentId && !visited.has(e.target)) || 
        (e.target === currentId && !visited.has(e.source))
      );

      if (nextEdge) {
        const nextId = nextEdge.source === currentId ? nextEdge.target : nextEdge.source;
        const nextNode = KNOWLEDGE_GRAPH_NODES.find(n => n.id === nextId);
        if (nextNode) {
          path.push({ label: nextNode.label, type: nextNode.type, edgeLabel: nextEdge.label });
          currentId = nextId;
          visited.add(nextId);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return path;
  }, [selectedNodeId, selectedNode]);

  const relatedGroupedItems = useMemo<Record<string, GraphNode[]>>(() => {
    const results: Record<string, GraphNode[]> = {
      project: [],
      feature: [],
      requirement: [],
      task: [],
      api: []
    };

    if (!selectedNodeId) return results;

    KNOWLEDGE_GRAPH_EDGES.forEach(edge => {
      let linkedId: string | null = null;
      if (edge.source === selectedNodeId) linkedId = edge.target;
      else if (edge.target === selectedNodeId) linkedId = edge.source;

      if (linkedId) {
        const node = KNOWLEDGE_GRAPH_NODES.find(n => n.id === linkedId);
        if (node) {
          results[node.type]?.push(node);
        }
      }
    });

    return results;
  }, [selectedNodeId]);

  // Styles configuration for nodes
  const getNodeColorStyles = (type: GraphNode["type"]) => {
    switch (type) {
      case "project":
        return { border: "border-indigo-500/50", glow: "shadow-indigo-500/10", text: "text-indigo-400", bg: "bg-indigo-950/20", dot: "bg-indigo-400" };
      case "feature":
        return { border: "border-emerald-500/50", glow: "shadow-emerald-500/15", text: "text-emerald-400", bg: "bg-emerald-950/20", dot: "bg-emerald-400" };
      case "requirement":
        return { border: "border-purple-500/50", glow: "shadow-purple-500/15", text: "text-purple-400", bg: "bg-purple-950/20", dot: "bg-purple-400" };
      case "task":
        return { border: "border-rose-500/50", glow: "shadow-rose-500/15", text: "text-rose-400", bg: "bg-rose-950/20", dot: "bg-rose-400" };
      case "api":
        return { border: "border-cyan-500/50", glow: "shadow-cyan-500/15", text: "text-cyan-400", bg: "bg-cyan-950/20", dot: "bg-cyan-400" };
      default:
        return { border: "border-neutral-700", glow: "shadow-neutral-500/5", text: "text-neutral-400", bg: "bg-neutral-900/30", dot: "bg-neutral-400" };
    }
  };

  const getEntityIcon = (type: GraphNode["type"], className = "w-4 h-4") => {
    switch (type) {
      case "project": return <Database className={className} />;
      case "feature": return <Cpu className={className} />;
      case "requirement": return <ClipboardList className={className} />;
      case "task": return <AlertTriangle className={className} />;
      case "api": return <FileCode className={className} />;
      default: return <Workflow className={className} />;
    }
  };

  // Chatbot system
  const handleAiQuestion = async (e?: React.FormEvent, presetQuery?: string) => {
    if (e) e.preventDefault();
    const queryText = (presetQuery || chatInput).trim();
    if (!queryText) return;

    setChatMessages(prev => [...prev, { sender: "user", text: queryText }]);
    setChatInput("");
    setIsAiLoading(true);

    const logMsg = `[COPILOT] Query dispatch: "${queryText.substring(0, 35)}..."`;
    setTerminalLogs(prev => [logMsg, ...prev]);

    const promptMessage = `
      You are the expert TAXAJ.ai Cognitive System Architect.
      Inspect this graph query: "${queryText}"
      
      TECHNICAL TOPOLOGY MATRIX:
      - Node List: ${JSON.stringify(KNOWLEDGE_GRAPH_NODES.map(n => ({ label: n.label, type: n.type, subtitle: n.subtitle })))}
      - Connections: ${JSON.stringify(KNOWLEDGE_GRAPH_EDGES)}

      Please explain the relationship or response in a short, elegant, technical chatbot-style response under 100 words. Absolutely do NOT use any human or people names. Trace structural functions and data paths.
    `;

    try {
      const response = await onTriggerCrossProjectAnalysis(promptMessage);
      setChatMessages(prev => [...prev, { sender: "copilot", text: response }]);
    } catch (err) {
      // Local fallback explanation
      let answer = "Analyzed structural topology indices. ";
      const foundFeature = KNOWLEDGE_GRAPH_NODES.find(n => 
        queryText.toLowerCase().includes(n.label.toLowerCase()) || 
        n.label.toLowerCase().includes(queryText.toLowerCase())
      );
      if (foundFeature) {
        answer += `**${foundFeature.label}** (${foundFeature.subtitle}) serves as a verified integration point. It facilitates micro-service transactions between linked project nodes. Click 'Vertex Hits' to expand its live cognitive layout popup.`;
      } else {
        answer += "This query targets cross-project data points syncing active registries on Port 3000. Try querying specific integrations like 'NMEA GPS Ingestion' or 'SIL-3 safe shutoff' for pinpoint compliance details.";
      }
      setChatMessages(prev => [...prev, { sender: "copilot", text: answer }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectNode = (nodeId: string, source: string) => {
    setSelectedNodeId(nodeId);
    const node = KNOWLEDGE_GRAPH_NODES.find(n => n.id === nodeId);
    if (node) {
      setTerminalLogs(prev => [
        `[PIVOT] Lock focus: "${node.label}" [${node.type.toUpperCase()}] clicked via ${source}`,
        ...prev.slice(0, 3)
      ]);
    }
  };

  // ACTIVE FOCUS NODE POPUP TRIGGER
  const handleOpenFocusPopup = async (node: GraphNode) => {
    setFocusModalNode(node);
    
    // Set immediate preset answer so there is 0 latency
    const preset = AGENT_PRESET_ANALYSES[node.id] || {
      connectedStories: ["SYS-101: System integration integrity verification"],
      whyRelated: `This function (${node.label}) represents a system-integrity connection point. It governs fail-safe boundaries, data streaming protocols, or authorization ledgers between the linked projects to guarantee robust uptime and SIL-3 compliance standards.`
    };
    
    setModalAnalysisText(preset.whyRelated);
    setIsModalAnalyzing(true);

    const diagnosticPrompt = `
      Perform an expert Agent Analysis of the cross-project integration node: "${node.label}" (${node.subtitle}).
      This node connects the enterprise modules.
      Explain:
      1. What exact micro-junction is being bridged?
      2. Why is this critical to system safety and cross-project sync?
      
      Do NOT mention any human names or user profiles. Keep the response highly technical, detailed, objective, and under 110 words in formatted plain text.
    `;

    try {
      // Real background AI agent analysis
      const result = await onTriggerCrossProjectAnalysis(diagnosticPrompt);
      if (result && result.trim()) {
        setModalAnalysisText(result);
      }
    } catch (err) {
      console.log("Using preset agent analysis fallback.");
    } finally {
      setIsModalAnalyzing(false);
    }
  };

  // Helper to determine what is connected to a function node
  const getConnectionsString = (node: GraphNode) => {
    const linkedIds = KNOWLEDGE_GRAPH_EDGES
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => e.source === node.id ? e.target : e.source);

    const linkedNames = KNOWLEDGE_GRAPH_NODES
      .filter(n => linkedIds.includes(n.id))
      .map(n => n.label.replace(" (CPD)", "").replace(" (TAL)", "").replace(" (MCA)", ""));

    if (linkedNames.length === 2) {
      return `${linkedNames[0]} ── ${linkedNames[1]}`;
    }
    return linkedNames.join(", ") || "System Core Cluster";
  };

  const suggestionPrompts = [
    "Explain Collision course correction API",
    "How does the SQLite Schema authenticate CSC support?",
    "What links SIL-3 shutoffs to regulatory watch logs?"
  ];

  return (
    <div 
      className="relative overflow-hidden w-full text-left bg-[#07070a]/80 border border-neutral-850 space-y-6" 
      id="project-memory-brain"
      style={{
        maxWidth: "1200px",
        margin: "32px auto",
        padding: "32px",
        borderRadius: "16px",
        boxShadow: "0 0 30px rgba(99, 102, 241, 0.05)"
      }}
    >
      {/* Sparkles background dust */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map(p => (
          <div key={p.id} style={p.style} />
        ))}
      </div>

      <div className="relative z-10 space-y-6 w-full">
        
        {/* SIMPLE HEADLINE HEADER */}
        <div className="border-b border-neutral-900 pb-5 pt-1 select-none flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <span className="p-1 px-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 text-lg font-mono tracking-widest animate-pulse">
                AJ.AI
              </span>
              Memory Space
            </h2>
            <p className="text-xs font-mono uppercase tracking-widest text-[#6c7086] font-extrabold">
              search from memory
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-900 p-2 rounded-xl text-[10px] font-mono leading-none">
            <span className="px-2 py-1 text-indigo-400 bg-indigo-950/20 rounded border border-indigo-900/30">
              INTEGRATION VERTICES: {KNOWLEDGE_GRAPH_NODES.length}
            </span>
            <span className="px-2 py-1 text-cyan-400 bg-cyan-950/20 rounded border border-cyan-900/30">
              STABLE EDGES: {KNOWLEDGE_GRAPH_EDGES.length}
            </span>
          </div>
        </div>

        {/* SEARCH AREA (SPACIOUS & BIG) */}
        <div className="bg-[#0c0c10] border border-neutral-850 p-6 rounded-2xl relative overflow-hidden flex flex-col gap-3 group transition-all duration-300 hover:border-indigo-500/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#585b70]">
              <Search className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search functions, APIs, compliance rules, or projects..."
              className="w-full bg-[#07070a] border-2 border-neutral-800 focus:border-indigo-500 text-sm text-white pl-12 pr-12 py-3.5 rounded-xl placeholder-[#585b70] focus:outline-none transition-all font-sans font-semibold tracking-wide"
            />

            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* MAIN SPLIT GRID: COMPACT TOPOLOGY MAP & SIDEBAR CHAT */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT COLUMN (8 cols): ORBITAL CLUSTER + VERTEX HIT LIST */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* ORBITAL MEMORY CLUSTER - PERFECT FLUID COMPACT CONTAINER */}
              <div className="lg:col-span-12 bg-[#0c0c10] border border-neutral-850 p-4.5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="w-full flex items-center justify-between pb-2 border-b border-neutral-900 select-none shrink-0 z-10">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                    <Network className="w-4 h-4 text-indigo-400" />
                    Orbital Topography Map
                  </span>
                  <span className="text-[8px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">
                    SQUARE 1:1 ALIGNMENT
                  </span>
                </div>

                {/* GRAPH VISUAL PORTAL - PERFECT SQUARE, NEVER STRETCHED */}
                <div className="w-full aspect-square rounded-xl border border-neutral-900 bg-[#050508]/95 overflow-hidden relative select-none mt-3 mb-3">
                  
                  {/* Concentric orbital grids */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full border border-indigo-500/5 pointer-events-none select-none">
                    <div className="absolute inset-0 rounded-full border border-dashed border-indigo-500/10 animate-[spin_60s_linear_infinite]" />
                    <div className="absolute inset-[15%] rounded-full border border-dotted border-cyan-500/10 animate-[spin_40s_linear_infinite]" />
                    <div className="absolute inset-[30%] rounded-full border border-dashed border-indigo-500/5" />
                    <div className="absolute inset-[45%] rounded-full border border-neutral-800/15" />
                  </div>

                  {/* Laser links edges */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.85" />
                        <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.85" />
                      </linearGradient>
                      <filter id="laserRedGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {KNOWLEDGE_GRAPH_EDGES.map((edge) => {
                      const p1 = nodePositions[edge.source];
                      const p2 = nodePositions[edge.target];
                      if (!p1 || !p2) return null;

                      const isConnectedToSelected = edge.source === selectedNodeId || edge.target === selectedNodeId;
                      const isConnectedToHovered = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
                      const isSelectedLine = isConnectedToSelected || isConnectedToHovered;

                      return (
                        <g key={edge.id}>
                          <path
                            d={`M ${p1.x},${p1.y} L ${p2.x},${p2.y}`}
                            fill="none"
                            stroke={isSelectedLine ? "#6366f1" : "#1b1d28"}
                            strokeWidth={isSelectedLine ? "0.9" : "0.3"}
                            opacity={isSelectedLine ? "0.8" : "0.25"}
                            filter="url(#laserRedGlow)"
                          />

                          <path
                            d={`M ${p1.x},${p1.y} L ${p2.x},${p2.y}`}
                            fill="none"
                            stroke="url(#laserGrad)"
                            strokeWidth={isSelectedLine ? "1.1" : "0.4"}
                            strokeDasharray={isSelectedLine ? "2, 1" : "1, 4"}
                            className="march-dash"
                            style={{
                              strokeDashoffset: isSelectedLine ? -30 : -4,
                              animation: "laserMarch 2s linear infinite"
                            }}
                            opacity={isSelectedLine ? "1" : "0.35"}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Topography Nodes */}
                  {KNOWLEDGE_GRAPH_NODES.map((node) => {
                    const pos = nodePositions[node.id];
                    if (!pos) return null;

                    const isFocused = node.id === selectedNodeId;
                    const isHovered = node.id === hoveredNodeId;
                    const isSearchingMatch = searchQuery.trim() && filteredNodes.some(fn => fn.id === node.id);
                    const isFirstDegreeHighlight = highlightedNodeIds.has(node.id);

                    const colorConfig = getNodeColorStyles(node.type);

                    let opacityClass = "opacity-[0.45] scale-90";
                    if (highlightedNodeIds.size === 0 || isFirstDegreeHighlight || isSearchingMatch) {
                      opacityClass = "opacity-100 scale-100";
                    }
                    if (isFocused || isHovered) {
                      opacityClass = "opacity-100 scale-105 z-40";
                    }

                    const isProjectNode = node.type === "project";

                    return (
                      <motion.div
                        key={node.id}
                        drag
                        dragMomentum={false}
                        onDrag={(e, info) => handleNodeDrag(node.id, e, info)}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          position: "absolute",
                          cursor: "grab",
                        }}
                        whileDrag={{ scale: 1.08, cursor: "grabbing" }}
                        className={`z-30 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${opacityClass}`}
                      >
                        <div
                          onClick={() => handleSelectNode(node.id, "Compass Interactive Topography")}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          className={`py-1 px-2.5 rounded-full border bg-neutral-950/95 backdrop-blur shadow-xl flex items-center gap-1.5 relative select-none cursor-pointer ${
                            isFocused 
                              ? "border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-105 ring-1 ring-indigo-500/40" 
                              : isHovered 
                              ? "border-cyan-400 shadow-md scale-105" 
                              : isSearchingMatch
                              ? "border-amber-400 shadow-sm ring-1 ring-amber-400/30"
                              : isProjectNode
                              ? "border-indigo-650/80 bg-neutral-950/90"
                              : "border-neutral-850 hover:border-neutral-700"
                          }`}
                        >
                          {isProjectNode && (
                            <span className="absolute -inset-1 rounded-full border border-indigo-500/10 animate-pulse pointer-events-none" />
                          )}

                          <span className={`w-1.5 h-1.5 rounded-full ${colorConfig.dot}`} />
                          <span className="text-[10px] font-mono tracking-tight text-white font-extrabold whitespace-nowrap leading-none">
                            {isProjectNode ? (
                              <span className="text-indigo-300 font-black tracking-normal underline underline-offset-2 decoration-indigo-500/30">
                                {node.label.replace(" (CPD)", "").replace(" (TAL)", "").replace(" (MCA)", "")}
                              </span>
                            ) : (
                              node.label
                            )}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="w-full pt-1.5 border-t border-neutral-900 flex justify-between items-center text-[9px] font-mono text-neutral-500 shrink-0 z-10">
                  <span>PROJECT CORNERS REGISTER</span>
                  <span>TAP OR CRAWL NODES</span>
                </div>
              </div>

              {/* Vertex hit list removed per user request */}

            </div>

            {/* HORIZONTAL POINTS PREVIEW PANEL */}
            <div className="w-full bg-[#0c0c10] border border-neutral-850 p-4.5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-900 select-none shrink-0">
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-extrabold flex items-center gap-1 bg-indigo-950/20 px-2 py-0.5 rounded">
                    🔹 Connected Points
                  </span>
                  <span className="text-[8px] font-mono text-neutral-500">
                    {visibleConnectionPoints.length} of {Math.min(filteredNodes.length, 6)} visible
                  </span>
                </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {visibleConnectionPoints.length > 0 ? (
                  visibleConnectionPoints.map((node) => {
                    const connectionCount = KNOWLEDGE_GRAPH_EDGES.filter(
                      (e) => e.source === node.id || e.target === node.id
                    ).length;
                    const projectsList = getConnectionsString(node);

                    return (
                      <div
                        key={node.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => { handleSelectNode(node.id, "Preview click"); handleOpenFocusPopup(node); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleSelectNode(node.id, "Preview keyboard"); handleOpenFocusPopup(node); } }}
                        className="rounded-2xl border border-neutral-850 bg-[#07070a]/90 p-3 shadow-inner shadow-black/20 relative overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[96px]"
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-cyan-400 flex-shrink-0" />
                            <span className="text-[8.5px] font-mono uppercase tracking-[0.16em] text-neutral-500 truncate">{node.type.toUpperCase()}</span>
                          </div>
                          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full border text-[10px] font-mono text-neutral-100 bg-[#050507] border-neutral-800 shrink-0">
                            {connectionCount} connections
                          </div>
                        </div>

                        <h3 className="text-[12px] font-black text-white leading-snug mb-1 truncate">{node.label}</h3>
                        <p className="text-[9px] leading-relaxed text-[#9ca3af] line-clamp-2 truncate">{node.subtitle}</p>

                        {projectsList && (
                          <div className="mt-3 text-[9px] text-neutral-300 font-mono bg-[#050507]/40 px-3 py-2 rounded border border-neutral-800 truncate overflow-hidden">
                            {projectsList}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-2xl border border-dashed border-neutral-850 bg-[#050507]/90 p-4 text-[10px] text-neutral-500 text-center">
                    No points currently visible.
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[9px] font-mono text-neutral-500">
                  Showing {visibleConnectionPoints.length} of {Math.min(filteredNodes.length, 6)} points
                </span>
                {filteredNodes.length > 2 && (
                  <button
                    onClick={() => setShowMorePoints((current) => !current)}
                    className="px-3 py-1.5 text-[10px] font-mono uppercase font-black rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-950/40 transition"
                  >
                    {showMorePoints ? "Show less" : `Read more (${Math.min(filteredNodes.length, 6) - 2})`}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-[#07070a] border border-neutral-900 rounded-xl p-3 font-mono text-[9px] leading-relaxed text-left space-y-1 select-none relative">
              <span className="text-[8px] font-black uppercase tracking-widest text-[#585b70] block pb-0.5 border-b border-neutral-900">
                📡 MEMORY ROUTING LOGS (ACTIVE GRAPH CONDUIT SYNC)
              </span>
              <div className="space-y-0.5 text-neutral-400">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-1.5 items-start opacity-75 hover:opacity-100 transition-opacity">
                    <span className="text-indigo-400 font-extrabold">▪</span>
                    <span className="truncate">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI GRAPH QUESTIONER - HIGH FIDELITY CHATBOT STYLE BAR */}
          <div className="xl:col-span-4 chat-container bg-[#0c0c10] border border-neutral-850 rounded-2xl p-5 flex flex-col justify-between shadow-2xl space-y-4 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-3.5 flex-1 flex flex-col justify-between overflow-hidden">

              {/* Chat Header */}
              <div id="chat-header" style={{display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 10}}>
                <div style={{width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981'}} />
                <span style={{fontFamily: 'monospace', fontSize: 11, color: '#a1a1aa', letterSpacing: '0.05em', textTransform: 'uppercase'}}>System Terminal Active</span>
              </div>

              {/* Messages List */}
              <div id="messages-list" style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4}}>
                {/* System Message */}
                <div style={{alignSelf: 'flex-start', maxWidth: '85%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '4px 14px 14px 14px'}}>
                  <p style={{fontSize: 13, color: '#d4d4d8', margin: 0, lineHeight: 1.5}}>Welcome to the command interface. How can I assist with your deployment today?</p>
                  <span style={{fontSize: 9, color: '#52525b', marginTop: 4, display: 'block'}}>09:41 AM • SYSTEM</span>
                </div>
                {/* User Message */}
                <div style={{alignSelf: 'flex-end', maxWidth: '85%', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '10px 14px', borderRadius: '14px 14px 4px 14px'}}>
                  <p style={{fontSize: 13, color: '#e0e7ff', margin: 0, lineHeight: 1.5}}>Check status of the Incident Engine.</p>
                  <span style={{fontSize: 9, color: '#818cf8', marginTop: 4, display: 'block'}}>09:42 AM • USER</span>
                </div>
              </div>

              {/* Chat Input */}
              <div id="chat-input-container" style={{marginTop: 15, position: 'relative'}}>
                <input type="text" placeholder="Transmit command..." style={{width: '100%', background: '#050507', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: 8, padding: '12px 14px', color: '#f4f4f5', fontSize: 13, outline: 'none', transition: 'border-color 0.2s'}} />
                <div style={{position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6366f1', opacity: 0.6, fontSize: 12, fontFamily: 'monospace'}}>⏎</div>
              </div>

            </div>

            {/* Actions panel footer */}
            <div className="chat-footer flex justify-between items-center select-none shrink-0">
              <span>AJ.AI PORTAL PROXY v1.5</span>
              <span className="text-indigo-400 font-extrabold uppercase">
                PORT 3000 CONDUIT
              </span>
            </div>

          </div>

        </div>

        {/* STATIC CHRONO SYSTEM FOOTER */}
        <footer 
          className="w-full border-t border-neutral-900 bg-neutral-950/25 rounded-2xl flex flex-col md:flex-row items-center justify-between text-[10px] font-mono text-[#6c7086] relative z-20"
          style={{ padding: "16px 24px", marginTop: "24px" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="font-sans font-black tracking-tight text-[#cdd6f4] uppercase">
              AJ.AI MEMORY SPACE
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0 select-none">
            <span>SECURE SYSTEM MODULE</span>
            <span>PING: 12MS</span>
            <span className="text-indigo-400 font-extrabold uppercase py-0.5 px-2 bg-indigo-950/20 border border-indigo-900/30 rounded text-[9px]">
              STABLE STACK INDEXED
            </span>
          </div>
        </footer>

      </div>

      {/* =========================================================================
          COGNITIVE NODE FOCUS OVERLAY MODAL (Agent connection analysis)
          ========================================================================= */}
      <AnimatePresence>
        {focusModalNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            
            {/* Modal card outer */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ cubicBezier: [0.16, 1, 0.3, 1], duration: 0.25 }}
              className="bg-[#0c0c10] border border-neutral-800 rounded-3xl p-6 shadow-2xl relative w-full max-w-2xl text-left overflow-hidden futuristic-glow"
              style={{ maxHeight: "90vh" }}
            >
              {/* Close Button top right */}
              <button
                onClick={() => setFocusModalNode(null)}
                className="absolute right-5 top-5 p-2 rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-white transition cursor-pointer z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Accent vector mesh background */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Pop-up header */}
              <div className="space-y-1 pb-4 border-b border-neutral-900 select-none flex items-start gap-3">
                <span className="p-3.5 rounded-2xl bg-indigo-950/30 text-indigo-400 border border-indigo-900/40 shrink-0">
                  <Brain className="w-6 h-6 animate-pulse" />
                </span>
                <div className="min-w-0 pr-10">
                  <span className="text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/15 px-2.5 py-0.5 rounded font-black tracking-widest leading-none">
                    Agentic Connection Analyzer
                  </span>
                  <h3 className="text-xl font-sans font-black text-white leading-tight mt-1 truncate">
                    {focusModalNode.label}
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 block truncate uppercase">
                    {focusModalNode.subtitle}
                  </span>
                </div>
              </div>

              {/* Scrollable contents zone */}
              <div className="my-5 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-neutral-850" style={{ maxHeight: "55vh" }}>
                
                {/* 1. BRIDGED MODULES TARGET */}
                <div className="p-4 bg-indigo-950/10 border border-indigo-950/40 rounded-xl space-y-1 select-none">
                  <span className="text-[9px] font-mono uppercase font-black text-indigo-400 tracking-wider flex items-center gap-1 leading-none">
                    <Database className="w-3 h-3" />
                    Bridging Enterprise Modules:
                  </span>
                  <p className="text-xs font-sans text-neutral-200 leading-normal font-bold">
                    {getConnectionsString(focusModalNode)}
                  </p>
                </div>

                {/* 2. DESCRIPTION DETAILS */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase font-black text-neutral-500 tracking-wider block select-none">
                    Function Specifications:
                  </span>
                  <p className="text-[12px] font-sans text-neutral-300 leading-relaxed bg-[#050508] p-3 border border-neutral-900 rounded-xl">
                    {focusModalNode.description}
                  </p>
                </div>

                {/* 3. DYNAMIC CONNECTED USER STORIES / SYSTEMS REQUIREMENTS */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono uppercase font-black text-neutral-500 tracking-wider block select-none">
                    Aligned User Stories:
                  </span>
                  <div className="space-y-1.5">
                    {(AGENT_PRESET_ANALYSES[focusModalNode.id]?.connectedStories || [
                      "SYS-101: Validate general routing interfaces on active registers."
                    ]).map((story, sIdx) => (
                      <div 
                        key={sIdx} 
                        className="bg-[#050508] border border-neutral-900 p-2.5 rounded-xl flex items-start gap-2 text-[11px] font-sans"
                      >
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-neutral-300 leading-snug">{story}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. COGNITIVE AGENT RELATIONSHIP AUDIT TEXT */}
                <div className="space-y-2.5 pt-2 border-t border-neutral-900">
                  <div className="flex justify-between items-center select-none">
                    <span className="text-[10px] font-mono uppercase font-black text-cyan-400 tracking-wider flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                      Agentic Relationship Audit Summary:
                    </span>
                    {isModalAnalyzing ? (
                      <span className="text-[8px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-900/30 px-2 py-0.5 rounded font-bold animate-pulse leading-none">
                        STREAMING FRESH INTEGRATION GAPS...
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono bg-emerald-950/20 text-emerald-300 border border-emerald-900/20 px-2 py-0.5 rounded font-bold leading-none">
                        ANALYSIS FINALIZED
                      </span>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-neutral-850/60 bg-gradient-to-br from-[#0a0f18] to-[#07070a]/90 text-[11.5px] font-sans leading-relaxed text-neutral-300 font-medium whitespace-pre-wrap">
                    {modalAnalysisText}
                  </div>
                </div>

              </div>

              {/* Dialog action buttons footer */}
              <div className="pt-4 border-t border-neutral-900 flex justify-end gap-3 select-none">
                <button
                  onClick={() => setFocusModalNode(null)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10.5px] font-black uppercase rounded-xl cursor-pointer shadow-md transition"
                >
                  Close Focus Dashboard
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
