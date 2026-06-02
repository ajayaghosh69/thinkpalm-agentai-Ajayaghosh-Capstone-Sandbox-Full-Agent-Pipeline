import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON bodyParser with safe limits
  app.use(express.json({ limit: "15mb" }));

  // Helper to get Groq API key with round-robin multitasking support
  let keyIndex = 0;
  function getGroqApiKey(): string {
    const key1 = process.env.GROQ_API_KEY_1;
    const key2 = process.env.GROQ_API_KEY_2;
    
    if (!key1) {
      throw new Error("GROQ_API_KEY_1 environment variable is missing. Please set your Groq API keys in Settings > Secrets to unleash the playground capability!");
    }
    
    // Rotate between two keys for multitasking/parallel requests
    if (key2) {
      const selectedKey = keyIndex % 2 === 0 ? key1 : key2;
      keyIndex++;
      return selectedKey;
    }
    return key1;
  }

  // API endpoints
  app.post("/api/generate", async (req, res) => {
    try {
      const { model, contents, systemInstruction, responseMimeType, responseSchema, tools, toolConfig } = req.body;

      console.log("🚀 Routing generation query through Groq API...");
      const prompt = typeof contents === "string" ? contents : JSON.stringify(contents);
      
      const messages: any[] = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      // Use Groq with round-robin API key rotation for multitasking
      const groqApiKey = getGroqApiKey();
      const groqBody: any = {
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.1,
      };

      if (responseMimeType === "application/json") {
        groqBody.response_format = { type: "json_object" };
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(groqBody)
      });

      if (!response.ok) {
        const errText = await response.text();
        let errData;
        try {
          errData = JSON.parse(errText);
        } catch {
          errData = { error: { message: errText } };
        }
        const errMsg = errData.error?.message || `Groq API responded with status ${response.status}`;
        throw new Error(errMsg);
      }

      const data: any = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      res.json({
        success: true,
        text,
        groundingMetadata: null,
      });
    } catch (error: any) {
      console.error("API generation failed:", error);
      const isConfigError = error.message?.includes("GROQ_API_KEY");
      res.status(isConfigError ? 403 : 500).json({
        success: false,
        error: error.message || "An unknown error occurred on the server.",
      });
    }
  });

  // Dynamic Live Element Analyzer & Scraper Route
  app.post("/api/fetch-live-elements", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      let targetUrl = url.trim();
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = "https://" + targetUrl;
      }

      console.log(`🌐 Real Fetch triggered for: ${targetUrl}`);
      let html = "";
      try {
        const response = await fetch(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
          }
        });
        if (response.ok) {
          html = await response.text();
        }
      } catch (err: any) {
        console.log(`ℹ️ Target Web URL ${targetUrl} is currently offline or unreachable. Prompting AI structures fallback...`);
      }

      // We'll prepare a prompt for the AI model to extract or construct real element locators
      // using the scraped HTML snippet if available, or analyze based on the URL domain context!
      // This will use Groq with dual API keys for fast parallel processing

      const systemInstruction = "You are an expert QA Automation Engineer. Extract or generate exactly 5 interactive HTML element details (like buttons, input fields, forms, links) with unique selectors. Respond ONLY in valid JSON array.";
      const userPrompt = `
Analyze this target Web URL: "${targetUrl}"
Raw HTML Snippet: ${html ? html.substring(0, 15000) : "Not available (CORS/firewall block)"}

Return an array of EXACTLY 5 interactive elements with this schema, mapping to real features of this website:
[
  {
    "element": "Descriptive human label, e.g. Customer Search Input Box",
    "tag": "input" | "button" | "a" | "div",
    "selector": "reliable CSS selector, e.g. #username or button[type='submit'] or input.search-query",
    "xpath": "matching absolute or relative XPath, e.g. //input[@id='username']",
    "targetBacklog": "associated user stories backlog scope name, e.g. Authentication & Entry Rules"
  }
]
`;

      let textResult = "";

      // Use Groq with round-robin API key rotation
      const groqApiKey = getGroqApiKey();
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });
      if (response.ok) {
        const data: any = await response.json();
        textResult = data.choices?.[0]?.message?.content || "[]";
      }

      // Parse JSON from LLM or return default elements
      let parsedElements = [];
      try {
        let cleanText = textResult.trim();
        // Remove markdown wrappers if any
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
        }

        if (cleanText.startsWith("{") && !cleanText.startsWith("[")) {
          const wrapper = JSON.parse(cleanText);
          parsedElements = wrapper.elements || wrapper.items || Object.values(wrapper)[0] || [];
        } else {
          parsedElements = JSON.parse(cleanText);
        }
      } catch (parseError) {
        console.error("Failed to parse LLM locator response:", textResult);
      }

      if (!Array.isArray(parsedElements) || parsedElements.length === 0) {
        parsedElements = [
          { element: "Primary Navigation Brand Logo", tag: "a", selector: "a.navbar-brand", xpath: "//a[contains(@class,'navbar-brand')]", targetBacklog: "Authentication & Entry Rules", status: "Fully Linked" },
          { element: "User Identifier Account Login", tag: "input", selector: "input[type='email']", xpath: "//input[@type='email']", targetBacklog: "Authentication & Entry Rules", status: "Fully Linked" },
          { element: "Password Input Form Panel", tag: "input", selector: "input[type='password']", xpath: "//input[@type='password']", targetBacklog: "Authentication & Entry Rules", status: "Fully Linked" },
          { element: "Submit Dispatch Control Button", tag: "button", selector: "button[type='submit']", xpath: "//button[@type='submit']", targetBacklog: "Action & Multi-system flow", status: "Fully Linked" },
          { element: "Main Dashboard Wrapper Panel", tag: "div", selector: "#dashboard-main", xpath: "//*[@id='dashboard-main']", targetBacklog: "Action & Multi-system flow", status: "Fully Linked" }
        ];
      }

      // Add default binding status
      const mappedLocators = parsedElements.map((item: any) => ({
        ...item,
        status: item.status || "Fully Linked"
      }));

      res.json({ success: true, locators: mappedLocators, fetchedLive: !!html });
    } catch (err: any) {
      console.error("DOM analysis endpoint failed:", err);
      res.json({ success: false, error: err.message });
    }
  });

  // Dynamic Jira Rest Endpoint Integration with AI fallback (using real Groq/Gemini context keys)
  app.post("/api/fetch-jira-issues", async (req, res) => {
    try {
      const { jiraUrl, jiraEmail, jiraToken, projectKey, liveUrl } = req.body;
      let fetchedRealJira = false;
      let issues: any[] = [];

      // Resolve coordinates by checking body inputs and falling back to any environment variables configured in settings/secrets
      const activeJiraUrl = (process.env.JIRA_URL || jiraUrl || "").trim();
      const activeJiraEmail = (process.env.JIRA_EMAIL || jiraEmail || "").trim();
      const activeJiraToken = (process.env.JIRA_TOKEN || process.env.JIRA_API_KEY || jiraToken || "").trim();

      // Attempt a real fetch whenever we have valid-looking coordinates configured
      if (activeJiraUrl && activeJiraUrl.startsWith("http") && activeJiraEmail && activeJiraEmail.includes("@") && activeJiraToken) {
        try {
          console.log(`📡 Attempting real Atlassian Jira Cloud Search: ${activeJiraUrl}`);
          const auth = Buffer.from(`${activeJiraEmail}:${activeJiraToken}`).toString("base64");
          const jql = `project = "${projectKey}" AND issuetype IN (Story, Bug)`;
          
          let cleanJiraUrl = activeJiraUrl;
          if (!cleanJiraUrl.startsWith("http://") && !cleanJiraUrl.startsWith("https://")) {
            cleanJiraUrl = "https://" + cleanJiraUrl;
          }
          const jiraSearchUrl = `${cleanJiraUrl.replace(/\/$/, "")}/rest/api/3/search`;
          console.log(`Hitting Jira URL: ${jiraSearchUrl} with JQL: ${jql}`);

          const response = await fetch(jiraSearchUrl, {
            method: "POST",
            headers: {
              "Authorization": `Basic ${auth}`,
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              jql,
              maxResults: 15,
              fields: ["summary", "description", "issuetype", "status"]
            })
          });

          if (response.ok) {
            const data: any = await response.json();
            if (data.issues && Array.isArray(data.issues)) {
              issues = data.issues.map((issue: any) => {
                const isBug = issue.fields?.issuetype?.name?.toLowerCase().includes("bug") || issue.fields?.issuetype?.name?.toLowerCase().includes("defect");
                const desc = issue.fields?.description;
                // Jira v3 description can be a rich-text document
                let decString = "";
                if (typeof desc === "string") {
                  decString = desc;
                } else if (desc && desc.content) {
                  // extract text from ADF format
                  decString = desc.content.map((c: any) => c.content?.map((inner: any) => inner.text).join("") || "").join("\n");
                }

                return {
                  key: issue.key,
                  summary: issue.fields?.summary || `Jira Issue ${issue.key}`,
                  description: decString || `Requirement mapped dynamically back to Jira board ticket ${issue.key}`,
                  type: isBug ? "Bug" : "Story"
                };
              });
              fetchedRealJira = true;
              console.log(`Successfully fetched ${issues.length} real tickets from Jira.`);
            }
          } else {
            console.log(`ℹ️ Atlassian Jira service returned request status ${response.status}. Triggering Agile Backlog Synthesizer...`);
          }
        } catch (jiraErr: any) {
          console.log(`ℹ️ Jira Cloud REST connection offline or unreachable: ${jiraErr.message}. Triggering Agile Backlog Synthesizer...`);
        }
      }

      // Fallback: If we didn't fetch any real Jira issues, let's use Groq 
      // with dual API keys for fast parallel generation of high-quality requirements and user stories!
      if (!fetchedRealJira) {
        console.log("💡 Preparing custom AI-generated user stories and backlog defects using Groq (round-robin dual keys)...");

        const systemInstruction = "You are a professional Agile Product Owner. Respond only in a valid JSON object with 'stories' and 'bugs' keys.";
        const userPrompt = `
Generate custom high-fidelity User Stories and Defect Bugs list for Project Key: "${projectKey}"
This project represents a professional portal hosted at live URL: "${liveUrl}".
Generate exactly 3 custom User Stories and 2 custom Defect Bugs. Make them highly realistic, functional, and matching the domain of "${liveUrl}".

Format your output exactly as standard JSON:
{
  "stories": [
    {
      "id": "${projectKey}-101",
      "title": "Short descriptive Scrum title",
      "description": "As a [role] I want to [action] so that [benefit]... with clear functional requirements.",
      "actors": ["User", "Coordinator"]
    }
  ],
  "bugs": [
    {
      "id": "${projectKey}-BUG-01",
      "title": "Real descriptive bug title",
      "description": "Detailed reproduction steps and impact on systems.",
      "severity": "Critical" | "Major" | "Minor",
      "status": "Open" | "In Progress"
    }
  ]
}
`;

        let textResult = "";
        
        // Use Groq with round-robin API key rotation for multitasking
        const groqApiKey = getGroqApiKey();
        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });
        if (groqResponse.ok) {
          const data: any = await groqResponse.json();
          textResult = data.choices?.[0]?.message?.content || "";
        }

        try {
          let cleanText = textResult.trim();
          if (cleanText.startsWith("```json")) {
            cleanText = cleanText.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (cleanText.startsWith("```")) {
            cleanText = cleanText.replace(/^```/, "").replace(/```$/, "").trim();
          }

          const parsed = JSON.parse(cleanText);
          if (parsed.stories && Array.isArray(parsed.stories)) {
            issues = [
              ...parsed.stories.map((s: any) => ({
                key: s.id,
                summary: s.title,
                description: s.description,
                type: "Story",
                actors: s.actors || ["User"]
              })),
              ...(parsed.bugs || []).map((b: any) => ({
                key: b.id,
                summary: b.title,
                description: b.description,
                type: "Bug",
                severity: b.severity || "Major",
                status: b.status || "Open"
              }))
            ];
          }
        } catch (e) {
          console.error("Failed to parse custom generated synthetic backlog:", e);
        }
      }

      // Safeguard fallback if everything fails
      if (issues.length === 0) {
        issues = [
          { key: `${projectKey}-101`, summary: "Secure Two-Factor Authentication Portal Access", description: "As an administrative system user, I want to authenticate via multi-factor authentication tokens to safeguard customer operational ticket dispatch lines.", type: "Story", actors: ["User", "Security Admin"] },
          { key: `${projectKey}-102`, summary: "Validate Core Operational Ticket Pipeline Inputs", description: "As a Coordinator, I want to audit system incoming support ticket bodies prior to saving so that we eliminate SQL injections or payload malformations.", type: "Story", actors: ["Coordinator"] },
          { key: `${projectKey}-BUG-01`, summary: "Critical Stack Trace on Large Payload Sync", description: "Synchronization endpoints crash with a OutOfMemory error when uploading log archives larger than 10MB.", type: "Bug", severity: "Critical", status: "Open" }
        ];
      }

      res.json({ success: true, issues, fetchedRealJira });
    } catch (err: any) {
      console.error("Jira fetch endpoint failed:", err);
      res.json({ success: false, error: err.message });
    }
  });

  // Key status endpoint for friendly front-end warning banners indicating active model setup
  app.get("/api/key-status", (req, res) => {
    res.json({
      hasKey: !!process.env.GEMINI_API_KEY || !!process.env.GROQ_API_KEY,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
