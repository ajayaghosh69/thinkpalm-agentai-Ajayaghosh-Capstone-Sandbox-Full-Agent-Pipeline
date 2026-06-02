import { UserStory, Gap, QaRisk, InterviewQuestion, EnhancedDoc } from "../types";

export const INITIAL_STORIES: UserStory[] = [
  {
    id: "CSC-101",
    title: "Create Secure Support Incident Ticket",
    description: "As a Support Coordinator, I want to initiate a customer incident ticket, selecting the customer corporate profile, severity urgency tier, custom system logging notes, and assignment agent groups, so that support records can be resolved.",
    actors: ["Support Coordinator", "Systems Engineer"],
    status: "Analyzed"
  },
  {
    id: "CSC-102",
    title: "Approve High-Priority Escalated Incident Resolution",
    description: "As an Engineering Manager, I want to review and approve emergency resolution patches exceeding standard operation costs, so that critical tickets are securely validated and deployed to active service grids.",
    actors: ["Engineering Manager", "Request Creator", "Systems Engineer"],
    status: "Imported"
  },
  {
    id: "CSC-103",
    title: "Track Dispatch Notification Progress",
    description: "As a System Operator, I want to monitor the execution status of support tickets in real-time, receiving automated webhook checkpoints from the dispatch gateway.",
    actors: ["System Operator", "Alert Webhook Hub"],
    status: "Analyzed"
  },
  {
    id: "CSC-104",
    title: "Void Suspended Duplicate Incident Request",
    description: "As a Support Coordinator, I want to void an active pending duplicate ticket before final service dispatch when regional system configurations or customer parameters change.",
    actors: ["Support Coordinator", "Engineering Manager"],
    status: "Analyzed"
  }
];

export const INITIAL_GAPS: Gap[] = [
  {
    id: "GAP-01",
    category: "Workflow State",
    description: "Missing rejection & rollback states. Once initiated and rejected, the story doesn't specify if the support ticket reverts to draft status, void status, or terminates.",
    severity: "High",
    status: "Unresolved",
    storyId: "CSC-102",
    gapPoints: [
      "No rollback state specified when offshore connection handshake fails",
      "Rejection state machine does not clarify default incident assignment",
      "No fallback route for canceled manual dispatches"
    ]
  },
  {
    id: "GAP-02",
    category: "Business Rule",
    description: "Dual execution approval threshold is undefined. Escalations are assumed simple, but high-impact system incidents (e.g., enterprise annual cluster downtime) require dual-manager signatures.",
    severity: "High",
    status: "Unresolved",
    storyId: "CSC-102",
    gapPoints: [
      "Dual-manager digital approval signature threshold absent",
      "Incident SLA escalation timeline for parallel approvals undefined",
      "High-impact tier verification checklist is not documented"
    ]
  },
  {
    id: "GAP-03",
    category: "Validation",
    description: "Customer assignment constraints. No validation prevents double-submitting or duplicate incident triggers on parallel browser threads.",
    severity: "Medium",
    status: "Unresolved",
    storyId: "CSC-103",
    gapPoints: [
      "Missing concurrency execution locks on client incident routing form",
      "Duplicate incident indicator validation rule undefined",
      "Character layout limits on customer assignment parameter fields not specified"
    ]
  },
  {
    id: "GAP-04",
    category: "Notification",
    description: "Stakeholder trigger routes. Original story does not define who receives automatic SLA alert notifications or emails when support tickets are finalized or voided.",
    severity: "Medium",
    status: "Unresolved",
    storyId: "CSC-104",
    gapPoints: [
      "Automated stakeholder email/Slack trigger rules absent upon void flag",
      "SMS dispatcher payload schema is not declared",
      "High-gravity failure alert message priority mapping is missing"
    ]
  },
  {
    id: "GAP-05",
    category: "Exception",
    description: "Failure recovery when external Dispatch API experiences sync connection timeouts.",
    severity: "Low",
    status: "Unresolved",
    storyId: "CSC-101",
    gapPoints: [
      "Uncaught dispatch handshake exception does not detail retry limit",
      "Failover secondary dispatch API integration endpoint is undefined",
      "Incident records fall into dead-letter-queue without notice triggers"
    ]
  }
];

export const INITIAL_RISKS: QaRisk[] = [
  {
    id: "RSK-01",
    category: "Functional",
    scenario: "Duplicate-incident vulnerability where support teams trigger duplicate dispatch records simultaneously.",
    mitigation: "Strict validation check matching transaction ID reference numbers before state creation save in database."
  },
  {
    id: "RSK-02",
    category: "Security",
    scenario: "Privilege escalation bypass where a standard Support Operator attempts to use Postman to directly invoke CSC-102 approval hooks.",
    mitigation: "Role-Based Access Control (RBAC) validations mapping manager security sessions inside backend state endpoints."
  },
  {
    id: "RSK-03",
    category: "Performance",
    scenario: "Concurrency database lock conflict when two engineering managers attempt to approve or dispatch the exact same incident at the exact same millisecond.",
    mitigation: "Establish a write lock (Mutex/Atomic Transaction) at the database layer ensuring only one state update commits."
  }
];

export const INTERVIEW_SESSIONS: InterviewQuestion[] = [
  {
    id: "Q-01",
    question: "Who is officially authorized to approve incident processing over the critical SLA escalation limit?",
    context: "Roles mapping details: Engineers can approve standard ticket logs, but who handles executive level escalations and audits?",
    answered: false
  },
  {
    id: "Q-02",
    question: "Can resolutions be rejected? What happens to the incident state after rejection?",
    context: "Gap category correction: Is there an analytical rollback flow or is it marked void?",
    answered: false
  },
  {
    id: "Q-03",
    question: "Is there a specific impact margin where secondary approvals are triggered?",
    context: "Double approval checks: e.g. corporate custom outages exceeding standard duration parameters.",
    answered: false
  }
];

export const SAMPLE_ENHANCED_DOC: EnhancedDoc = {
  businessRules: [
    "BR-001: Support Coordinators and Support Directors hold official incident dispatch authority.",
    "BR-002: Incidents with critical outage duration exceeding SLA thresholds must undergo dual manager approval before engineering teams are dispatched.",
    "BR-003: Only active, credentialed systems matching valid client profiles can undergo ticket creation."
  ],
  validationRules: [
    "VR-001: Source and target event identifiers must map to distinct system operational logs.",
    "VR-002: Incident transaction timestamps cannot overlap with existing active trial periods or finalized feedback cycles.",
    "VR-003: Incident urgency levels must consist of positive integer urgency priorities."
  ],
  notificationRules: [
    "NR-001: Email active engineers instantly when an incident is initially marked, modified, or placed.",
    "NR-002: Dispatch automatic status push notifications to the customer profile on active resolution updates.",
    "NR-003: Raise priority escalation warnings via Slack alert notification integrations."
  ],
  exceptionRules: [
    "ER-001: If external gateway is offline, store transaction items in local temporary queues and retry after 2 minutes.",
    "ER-002: Rejection triggers automated notifications requesting immediate cancellation reason notes before incident reverts to Coordinator state."
  ],
  acceptanceCriteria: [
    "AC-001: Approval logs map the precise manager ID, timestamp, and audit sign-off credentials.",
    "AC-002: Dual approval state keeps status as 'Pending Dual Sign-off' until second verification completes."
  ]
};

export const PLAYWRIGHT_CODE = `import { test, expect } from '@playwright/test';

test.describe('Taxaj.ai Generated - Incident Dispatch Suite', () => {

  test('TC-001: Verify Standard Incident Approval Flow', async ({ page }) => {
    // 1. Authenticate as Authorized Engineering Manager
    await page.goto('/login');
    await page.fill('#username', 'manager_engineering');
    await page.fill('#password', 'SecurePass123!');
    await page.click('button[type="submit"]');
    
    // 2. Navigate to pending incidents and search CSC-102
    await page.goto('/incidents/pending');
    await page.click('text=CSC-102: Approve Escalated Incident');
    
    // 3. Perform and confirm approval operation
    await page.click('button#approve-btn');
    await page.click('button#confirm-signature');
    
    // 4. Validate output state of incident registry
    const status = page.locator('#incident-status-tag');
    await expect(status).toHaveText('Approved');
    
    // 5. Verify audit history records matching VR-001/BR-001
    const auditLog = page.locator('#audit-record-log');
    await expect(auditLog).toContainText('Sign-off recorded by manager_engineering');
  });

});`;

export const INITIAL_BUGS = [
  {
    id: "CSC-BUG-01",
    title: "Console Leakage on Gateway API Failures",
    description: "OAuth tokens and private gateway authorization headers are dumped to public client console output during high-cost ticket dispatch retries.",
    severity: "Critical",
    status: "Open"
  },
  {
    id: "CSC-BUG-02",
    title: "Gateway Webhook Timeout Failure",
    description: "Slack alerts and notification emails time out and crash the main queue if secondary network connections drop below 50kbps.",
    severity: "Major",
    status: "In Progress"
  },
  {
    id: "CSC-BUG-03",
    title: "Expired Support Authorization Bypass",
    description: "Operators can proceed with corporate ticket dispatches to client accounts carrying expired SLAs without triggering override locks.",
    severity: "Major",
    status: "Open"
  }
] as const;

export function generateInitialGaps(projectKey: string, name: string): Gap[] {
  return [
    {
      id: `${projectKey}-GAP-01`,
      category: "Workflow State",
      description: `Missing rejection & rollback states in ${name}. Once initiated and rejected, the story doesn't specify if the ticket reverts to draft status, void status, or terminates.`,
      severity: "High",
      status: "Unresolved",
      storyId: `${projectKey}-101`,
      gapPoints: [
        `No status rollback designated when external handler rejects submission`,
        `Draft state transitions back to active queue lack user confirmation prompts`,
        `Void state does not trigger log archiving or record cleanup`
      ]
    },
    {
      id: `${projectKey}-GAP-02`,
      category: "Business Rule",
      description: `Dual execution approval threshold is undefined for ${projectKey} actions. Escalations are assumed simple, but high-impact operations require dual signatures.`,
      severity: "High",
      status: "Unresolved",
      storyId: `${projectKey}-102`,
      gapPoints: [
        `Lack of multi-tiered manager signature validation rules`,
        `Second approver override timeline and lockout duration is missing`,
        `Tier assignment matrix limits are completely undefined`
      ]
    },
    {
      id: `${projectKey}-GAP-03`,
      category: "Validation",
      description: `Customer assignment constraints or duplicate prevention rules are absent during database state synchronization.`,
      severity: "Medium",
      status: "Unresolved",
      storyId: `${projectKey}-101`,
      gapPoints: [
        `No transaction concurrency lock prevents double-submission on slow requests`,
        `Boundary checks for input parameters on selection screens are undefined`,
        `Empty or null inputs are not explicitly rejected on form submission`
      ]
    }
  ];
}
