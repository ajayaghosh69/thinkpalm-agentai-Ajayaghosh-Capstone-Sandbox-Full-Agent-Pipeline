
Memory 

Long-term: You are utilizing Neo4j as a persistent graph database. This allows your Memory Agent to store, relate, and retrieve cross-project data (e.g., vessel or fuel dependencies) even after sessions end. 

Short-term: Your LangGraph orchestration maintains the state of the conversation and the current context of the Jira user stories being processed. 

Tool-Calling:


Jira REST API: For fetching and updating user stories/bugs.  

Playwright: A custom automation tool called by the Execution Agent to run test scripts.  

Google/Outlook Calendar APIs: Used by the MeetLender/Calendar agent to check availability and book meetings.  

Agents (Collaborative Roles): You have a multi-agent hierarchy with distinct, specialized roles, including the

Fetch Agent,Jira Agent, Memory Agent, Gap Analyzing Agent, Execution Agent, and MeetLender Agent. These agents hand off tasks (e.g., from Gap Analyzing to Conversion, then to Execution) via the LangGraph state machine. 

Working UI: You have a functional web interface hosted on AI Studio, providing users with a dashboard to manage projects, view memory connections, analyze gaps, and schedule meetings.
This contains everything you need to run your app locally.


View your app in AI Studio: https://thinkpalm-agentai-ajayaghosh-capstone-sandbox-full-r14352tq4.vercel.app

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
`npm install`
2. Set the `groq` in [.env.local](.env.local) to your groq API key
3. Run the app:
`npm run dev`

