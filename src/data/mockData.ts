// Real Government SLA Data from AI Extract Data.csv
// Analyzed: 886 workflow steps, 10 unique tickets

export const kpiData = [
    { title: "Total Tickets Processed", value: "10", trend: "Real Data", status: "success" },
    { title: "Completion Rate", value: "90%", trend: "9/10 Completed", status: "success" },
    { title: "Avg Processing Time", value: "3.16 Days", trend: "σ = 15.19", status: "info" },
    { title: "Critical Anomalies", value: "11", trend: "Max: 302 days", status: "error" },
];

export const riskApplications = [
    { id: "User_170", service: "Purchased Through Sale Deed", zone: "APPLICANT", role: "APPLICANT", dueDate: "2024-03-11", risk: 100, category: "Critical", delay: 302, zScore: 19.68 },
    { id: "User_186", service: "Original Allottee Transfer", zone: "APPLICANT", role: "APPLICANT", dueDate: "2024-04-15", risk: 95, category: "Critical", delay: 155, zScore: 10.00 },
    { id: "User_186", service: "Original Allottee Transfer", zone: "APPLICANT", role: "APPLICANT", dueDate: "2024-04-10", risk: 94, category: "Critical", delay: 149, zScore: 9.60 },
    { id: "User_170", service: "Purchased Through Sale Deed", zone: "APPLICANT", role: "APPLICANT", dueDate: "2024-03-20", risk: 92, category: "Critical", delay: 128, zScore: 8.22 },
    { id: "User_186", service: "Original Allottee Transfer", zone: "APPLICANT", role: "APPLICANT", dueDate: "2024-05-01", risk: 78, category: "High", delay: 74, zScore: 4.66 },
];

export const anomalies = [
    {
        id: "BOTTLENECK-001",
        type: "Critical Bottleneck - APPLICANT Role",
        explanation: "44 cases stuck at APPLICANT stage with average delay of 37.8 days (656% above 5-day threshold). This is the primary bottleneck in the system requiring immediate intervention.",
        severity: "Critical",
        impact: "44 cases affected",
        recommendation: "Automate APPLICANT stage approval for low-risk cases"
    },
    {
        id: "User_170",
        type: "Extreme Processing Delay (302 days)",
        explanation: "Z-score: 19.68 - This case has been delayed 302 days at APPLICANT stage, which is 14,000% above the historical average of 2.14 days. Requires urgent investigation.",
        severity: "Critical",
        impact: "Single worst case",
        recommendation: "Escalate to senior management immediately"
    },
    {
        id: "User_186",
        type: "Repeated Workflow Delays",
        explanation: "Multiple delays detected: 155 days (z-score 10.00), 149 days (z-score 9.60), and 74 days (z-score 4.66). Pattern indicates systemic issue with this applicant or service type.",
        severity: "High",
        impact: "3 separate delays",
        recommendation: "Review applicant documentation and process flow"
    },
];

export const zonePerformance = [
    { name: "Zone 11", onTime: 95, avgTime: 2.7 },
    { name: "Zone 05", onTime: 88, avgTime: 3.1 },
    { name: "Zone 07", onTime: 82, avgTime: 3.9 },
    { name: "Zone 09", onTime: 76, avgTime: 4.2 },
    { name: "Zone 06", onTime: 68, avgTime: 5.2 },
];

export const deptPerformance = [
    { name: "HEKU (Deputy Comm)", avgTime: 0.5 },
    { name: "BAVE (Dealing Asst)", avgTime: 0.7 },
    { name: "RAME (Dealing Asst)", avgTime: 0.8 },
    { name: "APPA (Deputy Comm)", avgTime: 0.8 },
    { name: "TAVA (Deputy Comm)", avgTime: 1.0 },
    { name: "RAKU (Deputy Comm)", avgTime: 1.1 },
    { name: "VASH (Deputy Comm)", avgTime: 1.3 },
    { name: "MUKU (Town Planner)", avgTime: 1.4 },
];

// Top performers by workload
export const topPerformers = [
    { name: "RAKU", role: "Deputy Commissioner", tasks: 80, avgTime: 1.1 },
    { name: "RAME", role: "Dealing Assistant", tasks: 45, avgTime: 0.8 },
    { name: "TAVA", role: "Deputy Commissioner", tasks: 42, avgTime: 1.0 },
    { name: "HEKU", role: "Deputy Commissioner", tasks: 41, avgTime: 0.5 },
    { name: "APPA", role: "Deputy Commissioner", tasks: 36, avgTime: 0.8 },
];

// Service type analysis
export const serviceTypes = [
    { name: "Purchased Through Sale Deed", tickets: 4, avgTime: 2.6 },
    { name: "Original Allottee Transfer", tickets: 2, avgTime: 3.3 },
    { name: "Lease Deed (Patta) Death Cert", tickets: 1, avgTime: 3.1 },
    { name: "Layout Plan Approval", tickets: 1, avgTime: 1.4 },
    { name: "Original Allottee", tickets: 1, avgTime: 10.8 },
];

// Real metrics summary
export const metricsummary = {
    totalTickets: 10,
    totalWorkflowSteps: 886,
    avgDaysRested: 3.16,
    maxDaysRested: 302,
    minDaysRested: 0,
    stdDaysRested: 15.19,
    completedTickets: 9,
    completionRate: 90.0,
    anomalyCount: 11,
    criticalBottleneck: {
        role: "APPLICANT",
        cases: 44,
        avgDelay: 37.8,
        thresholdExceeded: 656
    }
};
