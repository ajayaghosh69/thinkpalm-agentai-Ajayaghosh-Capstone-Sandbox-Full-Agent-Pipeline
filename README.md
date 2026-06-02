This unified multi-project platform serves as an autonomous QA and collaborative ecosystem that syncs Jira user stories and bugs, utilizing an interactive voice clarification tool to resolve requirement doubts before automatically generating comprehensive test cases and automation scripts in both Playwright and Selenium. Backed by a Gap Analysis tool to uncover missing logic and a native Execution IDE to run generated code directly, the platform features a specialized "Memorise Me" hub that automatically discovers and connects entirely separate projects sharing similar functional domains, such as linking distinct systems through their shared fuel efficiency modules. This cross-project intelligence seamlessly drives an integrated scheduling workspace that aggregates team calendars from Google and MS Teams into an interactive hourly availability matrix for instant, conflict-free booking and real-time team notifications.

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


View your app : https://thinkpalm-agentai-ajayaghosh-capstone-sandbox-full-r14352tq4.vercel.app

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
`npm install`
2. Set the `groq` in [.env.local](.env.local) to your groq API key
3. Run the app:
`npm run dev`

