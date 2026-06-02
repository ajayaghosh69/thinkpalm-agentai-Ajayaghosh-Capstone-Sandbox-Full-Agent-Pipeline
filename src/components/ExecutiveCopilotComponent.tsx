import React, { useState } from "react";
import { MessageSquare, LayoutDashboard, Send, ShieldAlert, Sparkles, HelpCircle, Check } from "lucide-react";

interface ExecutiveCopilotComponentProps {
  onPostCopilotMessage: (prompt: string) => Promise<string>;
}

export default function ExecutiveCopilotComponent({
  onPostCopilotMessage
}: ExecutiveCopilotComponentProps) {
  const [messages, setMessages] = useState<{ sender: "user" | "copilot"; text: string }[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);

  const EXECUTIVE_PRESETS = [
    {
      q: "Which feature currently represents the greatest release risk?",
      ans: `⚠️ **Audit Risk Report: High-Value Invoice Approval Workflow**

**Key Reasons:**
- Feature coverage is currently below 70%.
- Escalation routing bounds (payment thresholds over $10k) are undefined.
- Multiple workflow gaps remain unclarified (specifically missing rejection rollback state mappings).

**Recommended Actions:**
1. Conduct Stakeholder Interview session (Module 10) to map out invoice rejection states.
2. Formulate explicit exception handling rules (ER-001) for downstream ledger databases.
3. Align automation limits inside Playwright suites to cover boundary payment limits.`
    },
    {
      q: "Which requirements remain incomplete?",
      ans: `📋 **Incomplete Requirements Inventory:**
- **BIL-102: Approve High-Value Invoice**: Rejection states, rollback guidelines, and notification escalation limits are missing.
- **Payment Gateway Webhook Sync Exception Flow**: Fault-tolerance patterns under gateway downtime are currently undocumented.`
    },
    {
      q: "What is our current automation readiness and maturity level?",
      ans: `⚙️ **Automation Readiness Quotient:** **72%**
- **Test execution success rate:** 90%
- **E2E coverage status:** 72% of priority critical user journeys are coded inside Playwright automated suites.
- **Blockers:** Dual approval and rollback loops remain manual until BR-002 validations are integrated.`
    }
  ];

  const handlePostMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setLoading(true);

    try {
      const prompt = `Act as the elite Taxaj.ai Executive Copilot. Provide an executive level, strategic compliance response for a software leader asking about the Billing & Subscription System:
Question: "${text}"

Reply with direct bullet points, structure, clear risk identifiers, and recommendations matching Taxaj.ai executive reporting guidelines.`;
      
      const result = await onPostCopilotMessage(prompt);
      setMessages((prev) => [...prev, { sender: "copilot", text: result }]);
    } catch (e) {
      setMessages((prev) => [...prev, { sender: "copilot", text: "⚠️ Network request timed out. Please verify your GEMINI_API_KEY inside Settings > Secrets." }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: typeof EXECUTIVE_PRESETS[0]) => {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: preset.q },
      { sender: "copilot", text: preset.ans }
    ]);
  };

  return (
    <div className="space-y-6" id="executive-copilot-suite">
      {/* Overview Block */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-violet-400" />
          <h3 className="font-sans font-semibold text-white text-sm">Module 18: Executive AI Copilot</h3>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">
          Interact with project quality intelligence as easily as speaking to an expert consultant. Get real-time predictions of release bottlenecks, missing coverage maps, and compliance vulnerabilities in natural language.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Playbook Preset Buttons (Left Column) */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs uppercase font-mono font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> One-Click Governance Audit
          </h4>
          <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
            Select precompiled audits derived from the live transaction billing telemetry database to test intelligence responses:
          </p>
          <div className="space-y-2.5">
            {EXECUTIVE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset)}
                className="w-full text-left p-3 rounded-lg border border-neutral-850 hover:border-violet-600/50 bg-neutral-950 text-xs text-neutral-300 hover:text-white transition duration-200 cursor-pointer block leading-snug font-medium font-sans"
              >
                {preset.q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat interaction Terminal (Right Column) */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg flex flex-col justify-between h-[480px]">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-neutral-850 pb-2 mb-3 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <h4 className="text-xs font-semibold text-neutral-200 font-mono uppercase tracking-wider">
              Governance Analytics Thread
            </h4>
          </div>

          {/* Interactive Chat Output Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs select-all max-h-[340px]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-16">
                <MessageSquare className="w-9 h-9 text-neutral-700 mb-2" />
                <span className="font-semibold text-xs text-neutral-400">CoPilot Workspace Active</span>
                <span className="text-[10px] text-neutral-600 uppercase mt-1 tracking-widest max-w-sm leading-relaxed">
                  Trigger presets on the left or type custom audit queries below to evaluate compliance
                </span>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3.5 rounded-xl border leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-violet-950/20 border-violet-900/30 text-neutral-100 ml-12 text-right font-sans" 
                      : "bg-neutral-950 border-neutral-850 text-neutral-300 mr-12 whitespace-pre-wrap font-sans"
                  }`}
                >
                  <span className="text-[8px] font-bold block mb-1 text-neutral-500 uppercase tracking-widest font-mono">
                    {msg.sender === "user" ? "EXECUTIVE INQUIRY" : "TAXAJ AI COPILOT"}
                  </span>
                  {msg.text}
                </div>
              ))
            )}

            {loading && (
              <div className="text-neutral-500 italic animate-pulse font-mono text-[11px] p-2">
                ⚡ Collating risk indicators from Enterprise Knowledge Graph...
              </div>
            )}
          </div>

          {/* Input text controls */}
          <div className="flex gap-2 border-t border-neutral-850 pt-3 mt-2 shrink-0">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePostMessage(inputVal)}
              placeholder="e.g. Provide structural coverage metrics of our invoice processing billing flow..."
              className="flex-1 bg-neutral-950 text-white border border-neutral-850 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-violet-500 font-sans"
            />
            <button
              onClick={() => {
                handlePostMessage(inputVal);
                setInputVal("");
              }}
              disabled={!inputVal.trim() || loading}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 px-4 text-white font-semibold rounded-lg text-xs tracking-wider transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
