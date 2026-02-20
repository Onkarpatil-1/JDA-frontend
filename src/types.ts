
export interface ProjectMetadata {
    id: string;
    name: string;
    uploadedAt: string;
    totalRecords: number;
    totalTickets: number;
    avgProcessingTime: number;
    completionRate: number;
}

export interface ProjectStatistics {
    totalWorkflowSteps: number;
    totalTickets: number;
    avgDaysRested: number;
    maxDaysRested: number;
    minDaysRested: number;
    stdDaysRested: number;
    completedTickets: number;
    completionRate: number;
    anomalyCount: number;
    criticalBottleneck?: {
        role: string;
        cases: number;
        avgDelay: number;
        thresholdExceeded: number;
    };
    topPerformers: Array<{
        name: string;
        role: string;
        tasks: number;
        avgTime: number;
    }>;
    riskApplications: Array<{
        id: string;
        service: string;
        zone: string;
        role: string;
        dueDate: string;
        risk: number;
        category: string;
        delay: number;
        zScore: number;
        remarks?: string;
        lastActionBy?: string;
        applicantName?: string;
    }>;
    zonePerformance: Array<{
        name: string;
        onTime: number;
        avgTime: number;
    }>;
    deptPerformance: Array<{
        name: string;
        avgTime: number;
    }>;
    behaviorMetrics: {
        employeeRemarks: Array<{
            employeeName: string;
            remarks: Array<{ text: string; count: number }>;
            topDelayReason: string;
            anomalyScore: number;
        }>;
        redFlags: Array<{
            type: 'REPEATED_REMARK' | 'UNUSUAL_DELAY' | 'PROCESS_ORPHAN';
            entity: string;
            evidence: string;
            severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        }>;
        globalTopics?: Array<{ topic: string; count: number; sentiment: 'negative' | 'neutral' }>; // New field
    };
    aiInsights?: AIInsights;
    jdaHierarchy?: JDAIntelligence;
}

// JDA Intelligence Hierarchy Types
export interface JDATicket {
    ticketId: string;
    stepOwnerName: string; // New: Actual Name (e.g., PRAKU)
    stepOwnerRole: string; // Post (e.g., Junior Engineer)
    remarkOriginal: string; // LifeTimeRemarksFrom
    remarkEnglishSummary: string;
    employeeAnalysis?: string; // New: AI analysis of employee actions
    applicantAnalysis?: string; // New: AI analysis of applicant perspective
    detectedCategory: string; // 7 categories
    daysRested: number;
    deliveredOn?: string;
}

export interface JDAService {
    name: string;
    serviceLevelInsight: string;
    tickets: JDATicket[];
}

export interface JDAParentService {
    name: string;
    services: JDAService[];
}

export interface JDADepartment {
    name: string;
    parentServices: JDAParentService[];
}

export interface JDAIntelligence {
    departments: JDADepartment[];
}

// AI-Powered Insights
export interface AIInsights {
    anomalyPatterns: string;
    rootCause: string;
    predictions: string;
    recommendations: string[];
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    // Tabular insights
    employeeEfficiencyTable?: string;
    zoneEfficiencyTable?: string;
    breachRiskTable?: string;
    highPriorityTable?: string;
    behavioralRedFlagsTable?: string;
    remarkAnalysis?: ForensicAnalysis;
    // Per-ticket forensic analysis map (NEW)
    forensicReports?: Record<string, ForensicAnalysis>;
}

export interface ForensicAnalysis {
    overallRemarkAnalysis?: {
        employeeRemarksOverall: {
            totalEmployeeRemarks: number;
            summary: string;
            commonThemes: string[];
            communicationQuality: string;
            responseTimeliness: string;
            inactionPatterns: string[];
            topEmployeeActions: string[];
        };
        applicantRemarksOverall: {
            totalApplicantRemarks: number;
            summary: string;
            commonThemes: string[];
            complianceLevel: string;
            sentimentTrend: string;
            delayPatterns: string[];
            topApplicantConcerns: string[];
        };
    };
    employeeRemarkAnalysis: {
        summary: string;
        totalEmployeeRemarks: number;
        keyActions: string[];
        responseTimeliness: string;
        communicationClarity: string;
        inactionFlags: Array<{
            observation: string;
            evidence: string;
        }>;
    };
    applicantRemarkAnalysis: {
        summary: string;
        totalApplicantRemarks: number;
        keyActions: string[];
        responseTimeliness: string;
        sentimentTrend: string;
        complianceLevel: string;
    };
    delayAnalysis: {
        primaryDelayCategory: string;
        primaryCategoryConfidence: number;
        documentClarityAnalysis?: {
            documentClarityProvided: boolean;
            documentNames: string[];
        };
        categorySummary: string;
        allApplicableCategories: Array<{
            category: string;
            confidence: number;
            reasoning: string;
        }>;
        processGaps: string[];
        painPoints: string[];
        forcefulDelays: Array<{
            reason: string;
            confidence: number;
            category: string;
            evidence: string;
            recommendation: string;
        }>;
    };
    sentimentSummary: string;
    ticketInsightSummary: string;
    // New JDA Intelligence Structure
    jdaIntelligence?: JDAIntelligence;
}

export interface WorkflowStep {
    ticketId: string;
    serviceName: string;
    post: string;
    zoneId: string;
    applicationDate: string;
    deliveredOn: string;
    totalDaysRested: number;
    lifetimeRemarks: string;
    lifetimeRemarksFrom: string;
    numberOfEntries: number;
    applicantName?: string;
    employeeName?: string; // New: Actual Name
    departmentName?: string;
    parentServiceName?: string;
    rawRow?: any;
}

export interface ProjectData {
    metadata: ProjectMetadata;
    statistics: ProjectStatistics;
    workflowSteps?: WorkflowStep[];
}

export const TYPES_VERSION = '1.0';
