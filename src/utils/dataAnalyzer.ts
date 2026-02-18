
import type { WorkflowStep, ProjectStatistics, JDAIntelligence, JDADepartment, JDAParentService, JDAService } from '../types';

/**
 * 7-Point Delay Categorization Framework (Rule-Based)
 */
export function ruleBasedDelayClassification(remark: string): string {
    const r = remark.toLowerCase();

    if (r.includes('missing') || r.includes('incomplete') || r.includes('incorrect') || r.includes('invalid') || r.includes('document')) return 'Documentation Issues';
    if (r.includes('understand') || r.includes('unclear') || r.includes('language') || r.includes('response')) return 'Communication Gaps';
    if (r.includes('approval') || r.includes('coordination') || r.includes('inspection') || r.includes('verification') || r.includes('technical review')) return 'Process Bottlenecks';
    if (r.includes('late') || r.includes('non-compliance') || r.includes('payment') || r.includes('unavailable')) return 'Applicant-Side Issues';
    if (r.includes('delayed processing') || r.includes('workload') || r.includes('system') || r.includes('server') || r.includes('down')) return 'Employee/System-Side Issues';
    if (r.includes('third-party') || r.includes('clearance') || r.includes('utility') || r.includes('audit')) return 'External Dependencies';
    if (r.includes('complex') || r.includes('dispute') || r.includes('legal') || r.includes('policy')) return 'Complexity/Special Cases';

    return 'Uncategorized'; // To be handled by LLM if needed
}

/**
 * Build Hierarchical JDA Data Structure
 */
export function buildJDAHierarchy(steps: WorkflowStep[], existingHierarchy?: JDAIntelligence): JDAIntelligence {
    const departmentsMap = new Map<string, Map<string, Map<string, WorkflowStep[]>>>();

    // Index existing tickets for O(1) lookup of AI data
    const aiEnrichedTickets = new Map<string, any>();
    if (existingHierarchy) {
        existingHierarchy.departments.forEach(d => {
            d.parentServices.forEach(ps => {
                ps.services.forEach(s => {
                    s.tickets.forEach(t => {
                        // Create a composite key or just use ticketID if unique (steps might duplicate ID)
                        // Using TicketID + StepOwner might be safer if multiple steps
                        // But for now, let's map by TicketID to grab the summary
                        if (t.remarkEnglishSummary && t.remarkEnglishSummary !== t.remarkOriginal) {
                            aiEnrichedTickets.set(t.ticketId, {
                                summary: t.remarkEnglishSummary,
                                category: t.detectedCategory
                            });
                        }
                    });
                });
            });
        });
    }

    // 1. Group by Dept -> Parent Service -> Service
    steps.forEach(step => {
        const deptName = step.departmentName || 'General';
        const parentService = step.parentServiceName || 'General';
        const service = step.serviceName || 'General';

        if (!departmentsMap.has(deptName)) {
            departmentsMap.set(deptName, new Map());
        }
        const parentMap = departmentsMap.get(deptName)!;

        if (!parentMap.has(parentService)) {
            parentMap.set(parentService, new Map());
        }
        const serviceMap = parentMap.get(parentService)!;

        if (!serviceMap.has(service)) {
            serviceMap.set(service, []);
        }
        serviceMap.get(service)!.push(step);
    });

    // 2. Build Output Structure
    const departments: JDADepartment[] = [];

    departmentsMap.forEach((parentMap, deptName) => {
        const parentServices: JDAParentService[] = [];

        parentMap.forEach((serviceMap, parentServiceName) => {
            const services: JDAService[] = [];

            serviceMap.forEach((allSteps, serviceName) => {
                // Determine insight for this service level
                // 1. Filter out Applicant actions for "Employee Processing" metrics
                const employeeSteps = allSteps.filter(t => {
                    const role = (t.post || '').toUpperCase();
                    const name = (t.employeeName || '').toUpperCase();
                    return !['APPLICANT', 'CITIZEN', 'SYSTEM'].includes(role) &&
                        !['APPLICANT', 'CITIZEN', 'SYSTEM'].includes(name);
                });

                // 2. Group by unique ticket to get accurate Total Ticket count and sum of employee processing time
                const ticketProcessingMap = new Map<string, number>();
                employeeSteps.forEach(t => {
                    ticketProcessingMap.set(t.ticketId, (ticketProcessingMap.get(t.ticketId) || 0) + (t.totalDaysRested || 0));
                });

                const uniqueCount = ticketProcessingMap.size;
                const totalEmployeeDays = Array.from(ticketProcessingMap.values()).reduce((sum, d) => sum + d, 0);

                const serviceInsight = `Total Processing: ${totalEmployeeDays} Days. Total Tickets: ${uniqueCount}`;

                services.push({
                    name: serviceName,
                    serviceLevelInsight: serviceInsight,
                    tickets: allSteps.map(t => {
                        // Check if we have AI data for this ticket
                        const aiData = aiEnrichedTickets.get(t.ticketId);

                        return {
                            ticketId: t.ticketId,
                            stepOwnerName: t.employeeName || 'Unknown',
                            stepOwnerRole: t.post,
                            remarkOriginal: t.lifetimeRemarksFrom || 'No remarks',
                            // PRESERVE AI SUMMARY IF AVAILABLE, else default
                            remarkEnglishSummary: aiEnrichedTickets.has(t.ticketId) ? aiData?.summary : (t.lifetimeRemarksFrom || 'No remarks'),
                            detectedCategory: aiEnrichedTickets.has(t.ticketId) ? aiData?.category : ruleBasedDelayClassification(t.lifetimeRemarksFrom || ''),
                            daysRested: t.totalDaysRested,
                            deliveredOn: t.deliveredOn || ''
                        };
                    })
                });
            });

            parentServices.push({
                name: parentServiceName,
                services
            });
        });

        departments.push({
            name: deptName,
            parentServices
        });
    });

    return { departments };
}

/**
 * Calculate mean of an array of numbers
 */
function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = mean(values);
    const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
    return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate z-score for a value
 */
function zScore(value: number, avg: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - avg) / stdDev;
}

/**
 * Analyze workflow data and generate statistics
 * Ported from backend to allow real-time filtering on frontend
 */
export function analyzeWorkflowData(workflowSteps: WorkflowStep[], existingHierarchy?: JDAIntelligence): ProjectStatistics {
    const totalWorkflowSteps = workflowSteps.length;

    // Extract unique tickets
    const uniqueTickets = new Set(workflowSteps.map(step => step.ticketId));
    const totalTickets = uniqueTickets.size;

    // Calculate processing time statistics
    const daysRested = workflowSteps.map(step => step.totalDaysRested);
    const avgDaysRested = parseFloat(mean(daysRested).toFixed(2));
    const maxDaysRested = daysRested.length > 0 ? Math.max(...daysRested) : 0;
    const minDaysRested = daysRested.length > 0 ? Math.min(...daysRested) : 0;
    const stdDaysRested = parseFloat(standardDeviation(daysRested).toFixed(2));

    // Count completed tickets (those with DeliveredOn date)
    const completedTickets = workflowSteps.filter(step => step.deliveredOn && step.deliveredOn !== '').length;
    const completionRate = totalWorkflowSteps > 0 ? parseFloat(((completedTickets / totalWorkflowSteps) * 100).toFixed(1)) : 0;

    // Identify anomalies (z-score > 3)
    const anomalies = workflowSteps.filter(step => {
        const z = zScore(step.totalDaysRested, avgDaysRested, stdDaysRested);
        return Math.abs(z) > 3;
    });
    const anomalyCount = anomalies.length;

    // Find critical bottleneck (role with highest average delay)
    const excludedRoles = ['APPLICANT', 'CITIZEN', 'SYSTEM', 'UNKNOWN'];

    const roleDelays = new Map<string, number[]>();
    workflowSteps.forEach(step => {
        // Normalize role for check
        const role = step.post.toUpperCase().trim();
        if (!roleDelays.has(step.post) && !excludedRoles.includes(role)) {
            roleDelays.set(step.post, []);
        }

        if (roleDelays.has(step.post)) {
            roleDelays.get(step.post)!.push(step.totalDaysRested);
        }
    });

    let criticalBottleneck: ProjectStatistics['criticalBottleneck'] | undefined;
    let maxAvgDelay = 0;

    roleDelays.forEach((delays, role) => {
        const avgDelay = mean(delays);
        if (avgDelay > maxAvgDelay && delays.length > 5) { // Only consider roles with >5 cases
            maxAvgDelay = avgDelay;
            const threshold = 5; // 5 days threshold
            const thresholdExceeded = ((avgDelay - threshold) / threshold) * 100;
            criticalBottleneck = {
                role,
                cases: delays.length,
                avgDelay: parseFloat(avgDelay.toFixed(1)),
                thresholdExceeded: parseFloat(thresholdExceeded.toFixed(0))
            };
        }
    });

    // Find top performers (employees with best avg time and high task count)
    const employeePerformance = new Map<string, { tasks: number; totalTime: number; role: string }>();

    const excludedEmployees = ['APPLICANT', 'CITIZEN', 'SYSTEM', 'UNKNOWN', 'Admin', 'Administrator'];

    workflowSteps.forEach(step => {
        const employeeName = step.lifetimeRemarksFrom || 'Unknown';
        const normalizedName = employeeName.toUpperCase().trim();

        // Skip if employee matches exclusion list
        if (excludedEmployees.some(ex => normalizedName.includes(ex.toUpperCase()))) {
            return;
        }

        if (!employeePerformance.has(employeeName)) {
            employeePerformance.set(employeeName, { tasks: 0, totalTime: 0, role: step.post });
        }
        const perf = employeePerformance.get(employeeName)!;
        perf.tasks++;
        perf.totalTime += step.totalDaysRested;
    });

    const topPerformers = Array.from(employeePerformance.entries())
        .map(([name, data]) => ({
            name,
            role: data.role,
            tasks: data.tasks,
            avgTime: parseFloat((data.totalTime / data.tasks).toFixed(1))
        }))
        .filter(p => p.tasks >= 10) // Only consider employees with 10+ tasks
        .sort((a, b) => a.avgTime - b.avgTime)
        .slice(0, 5);

    // Identify high-risk applications (high z-score delays)
    const riskApplications = workflowSteps
        .map(step => {
            const z = zScore(step.totalDaysRested, avgDaysRested, stdDaysRested);
            return {
                id: step.ticketId,
                service: step.serviceName,
                zone: step.zoneId,
                role: step.post,
                dueDate: step.applicationDate,
                risk: Math.min(100, Math.max(0, Math.round((Math.abs(z) / 20) * 100))),
                category: Math.abs(z) > 10 ? 'Critical' : Math.abs(z) > 5 ? 'High' : 'Medium',
                delay: step.totalDaysRested,
                zScore: parseFloat(z.toFixed(2)),
                remarks: step.lifetimeRemarks,
                lastActionBy: step.lifetimeRemarksFrom,
                applicantName: step.applicantName,
            };
        })
        .filter(app => Math.abs(app.zScore) > 3)
        .sort((a, b) => b.zScore - a.zScore)
        .slice(0, 10);

    // Calculate zone performance
    const zonePerformance = new Map<string, { totalSteps: number; completedSteps: number; totalTime: number }>();
    workflowSteps.forEach(step => {
        const zoneId = step.zoneId || 'Unknown';
        if (!zonePerformance.has(zoneId)) {
            zonePerformance.set(zoneId, { totalSteps: 0, completedSteps: 0, totalTime: 0 });
        }
        const perf = zonePerformance.get(zoneId)!;
        perf.totalSteps++;
        perf.totalTime += step.totalDaysRested;
        if (step.deliveredOn && step.deliveredOn !== '') {
            perf.completedSteps++;
        }
    });

    const zoneData = Array.from(zonePerformance.entries())
        .map(([zone, data]) => ({
            name: zone,
            onTime: parseFloat(((data.completedSteps / data.totalSteps) * 100).toFixed(1)),
            avgTime: Math.round(data.totalTime / data.totalSteps) // Round to integer
        }))
        .sort((a, b) => b.onTime - a.onTime)
        .slice(0, 6);

    // Calculate Department/Role performance
    const deptPerformance = new Map<string, { totalTime: number; count: number }>();
    workflowSteps.forEach(step => {
        if (!deptPerformance.has(step.post)) {
            deptPerformance.set(step.post, { totalTime: 0, count: 0 });
        }
        const perf = deptPerformance.get(step.post)!;
        perf.totalTime += step.totalDaysRested;
        perf.count++;
    });

    const deptData = Array.from(deptPerformance.entries())
        .map(([dept, data]) => ({
            name: dept,
            avgTime: Math.round(data.totalTime / data.count) // Round to integer
        }))
        .filter(d => d.avgTime > 0)
        .sort((a, b) => b.avgTime - a.avgTime)
        .slice(0, 5);

    // Behavioral Metrics: Deep dive into employee remark patterns
    const employeeRemarksMap = new Map<string, Map<string, number>>();
    const redFlags: ProjectStatistics['behaviorMetrics']['redFlags'] = [];

    workflowSteps.forEach(step => {
        const name = step.lifetimeRemarksFrom || 'Unknown';
        const remark = (step.lifetimeRemarks || '').trim();

        if (remark && name !== 'Unknown' && name !== 'APPLICANT') {
            if (!employeeRemarksMap.has(name)) {
                employeeRemarksMap.set(name, new Map());
            }
            const remarks = employeeRemarksMap.get(name)!;
            remarks.set(remark, (remarks.get(remark) || 0) + 1);
        }
    });

    const employeeRemarks = Array.from(employeeRemarksMap.entries()).map(([name, remarksMap]) => {
        const sortedRemarks = Array.from(remarksMap.entries())
            .map(([text, count]) => ({ text, count }))
            .sort((a, b) => b.count - a.count);

        const totalRemarks = sortedRemarks.reduce((sum, r) => sum + r.count, 0);
        const topRemark = sortedRemarks[0];
        const repetitionRate = topRemark ? (topRemark.count / totalRemarks) : 0;

        // Find if this employee is an outlier in delay
        const perf = employeePerformance.get(name);
        const avgDelay = perf ? Math.round(perf.totalTime / perf.tasks) : 0; // Round to integer
        const delayOutlier = avgDelay > (avgDaysRested + stdDaysRested);

        // Anomaly Score: Combination of high repetition and high delay
        const anomalyScore = Math.min(1, (repetitionRate * 0.7) + (delayOutlier ? 0.3 : 0));

        if (repetitionRate > 0.6 && totalRemarks > 5) {
            redFlags.push({
                type: 'REPEATED_REMARK',
                entity: name,
                evidence: `Uses same remark "${topRemark.text}" for ${Math.round(repetitionRate * 100)}% of cases.`,
                severity: repetitionRate > 0.8 ? 'CRITICAL' : 'HIGH'
            });
        }

        if (delayOutlier && (perf?.tasks || 0) > 5) {
            redFlags.push({
                type: 'UNUSUAL_DELAY',
                entity: name,
                evidence: `Average processing time (${avgDelay.toFixed(1)}d) is significantly above average.`,
                severity: avgDelay > (avgDaysRested * 2) ? 'CRITICAL' : 'HIGH'
            });
        }

        return {
            employeeName: name,
            remarks: sortedRemarks.slice(0, 3),
            topDelayReason: topRemark?.text || 'Standard Processing',
            anomalyScore: parseFloat(anomalyScore.toFixed(2))
        };
    });

    // Global Topic Extraction (Simple Keyword Frequency on ALL tickets)
    const topicMap = new Map<string, number>();
    const stopWords = new Set(['the', 'and', 'is', 'to', 'in', 'of', 'for', 'with', 'on', 'at', 'by', 'from', 'a', 'an', 'this', 'that', 'it', 'as', 'be', 'are', 'was', 'were', 'has', 'have', 'had', 'been', 'will', 'shall', 'may', 'can', 'should', 'would', 'could', 'not', 'no', 'yes', 'ok', 'okay', 'done', 'remarks', 'remark', 'issue', 'issues', 'case', 'file', 'application']);

    workflowSteps.forEach(step => {
        const text = (step.lifetimeRemarks || '' + ' ' + (step.lifetimeRemarksFrom || '')).toLowerCase();
        // Simple tokenization
        const words = text.split(/[\s,.;:()\/]+/);
        words.forEach(w => {
            if (w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w)) {
                topicMap.set(w, (topicMap.get(w) || 0) + 1);
            }
        });
    });

    const globalTopics = Array.from(topicMap.entries())
        .map(([topic, count]) => ({
            topic: topic.charAt(0).toUpperCase() + topic.slice(1),
            count,
            sentiment: 'neutral' as 'neutral' // Placeholder
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    return {
        totalWorkflowSteps,
        totalTickets,
        avgDaysRested,
        maxDaysRested,
        minDaysRested,
        stdDaysRested,
        completedTickets,
        completionRate,
        anomalyCount,
        criticalBottleneck,
        topPerformers,
        riskApplications,
        zonePerformance: zoneData,
        deptPerformance: deptData,
        behaviorMetrics: {
            employeeRemarks,
            redFlags: redFlags.slice(0, 10),
            globalTopics: globalTopics
        },
        jdaHierarchy: buildJDAHierarchy(workflowSteps, existingHierarchy)
    };
}
