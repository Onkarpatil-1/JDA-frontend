// CSV Parser for Government SLA Ticket Data

export interface SLATicket {
    ticketId: string;
    departmentName: string;
    serviceName: string;
    parentServiceName: string;
    applicantName: string;
    applicationDate: string;
    deliveredOn: string;
    roleId: number | null;
    employeeIdTo: number | null;
    employee: string;
    numberOfEntries: number;
    post: string;
    totalDaysRested: number;
    maxEventTimeStamp: string;
    runDate: string;
    currentStatusId: number;
    subStatusId: number;
    ownerDepartmentId: number;
    isActive: number;
    dueDate: string;
    departmentIdTo: number;
    lifeTimeRemarks: string;
    lifeTimeRemarksFrom: string;
    lifeTimeEventStampDate: string;
}

export interface TicketMetrics {
    avgProcessingTime: number;
    totalTickets: number;
    completedTickets: number;
    pendingTickets: number;
    avgDaysRested: number;
    departmentPerformance: Map<string, number>;
    employeeWorkload: Map<string, number>;
}

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Parse CSV data into SLA tickets
 */
export function parseCSV(csvContent: string): SLATicket[] {
    const lines = csvContent.split('\n');
    const tickets: SLATicket[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = parseCSVLine(line);
        if (fields.length < 24) continue;

        tickets.push({
            ticketId: fields[0].replace(/^\uFEFF/, ''), // Remove BOM
            departmentName: fields[1],
            serviceName: fields[2],
            parentServiceName: fields[3],
            applicantName: fields[4],
            applicationDate: fields[5],
            deliveredOn: fields[6],
            roleId: fields[7] === 'NULL' ? null : parseInt(fields[7]),
            employeeIdTo: fields[8] === 'NULL' ? null : parseInt(fields[8]),
            employee: fields[9],
            numberOfEntries: parseInt(fields[10]) || 0,
            post: fields[11],
            totalDaysRested: parseInt(fields[12]) || 0,
            maxEventTimeStamp: fields[13],
            runDate: fields[14],
            currentStatusId: parseInt(fields[15]) || 0,
            subStatusId: parseInt(fields[16]) || 0,
            ownerDepartmentId: parseInt(fields[17]) || 0,
            isActive: parseInt(fields[18]) || 0,
            dueDate: fields[19],
            departmentIdTo: parseInt(fields[20]) || 0,
            lifeTimeRemarks: fields[21],
            lifeTimeRemarksFrom: fields[22],
            lifeTimeEventStampDate: fields[23],
        });
    }

    return tickets;
}

/**
 * Calculate metrics from ticket data
 */
export function calculateMetrics(tickets: SLATicket[]): TicketMetrics {
    const departmentPerf = new Map<string, number>();
    const employeeWorkload = new Map<string, number>();

    let totalDaysRested = 0;
    let completedCount = 0;

    tickets.forEach(ticket => {
        // Track department performance
        const dept = ticket.departmentName;
        departmentPerf.set(dept, (departmentPerf.get(dept) || 0) + 1);

        // Track employee workload
        if (ticket.employee && ticket.employee !== 'Nofo') {
            employeeWorkload.set(ticket.employee, (employeeWorkload.get(ticket.employee) || 0) + 1);
        }

        // Calculate metrics
        totalDaysRested += ticket.totalDaysRested;
        if (ticket.currentStatusId === 0 || ticket.lifeTimeRemarks.includes('Case Closed')) {
            completedCount++;
        }
    });

    return {
        avgProcessingTime: tickets.length > 0 ? totalDaysRested / tickets.length : 0,
        totalTickets: tickets.length,
        completedTickets: completedCount,
        pendingTickets: tickets.length - completedCount,
        avgDaysRested: tickets.length > 0 ? totalDaysRested / tickets.length : 0,
        departmentPerformance: departmentPerf,
        employeeWorkload: employeeWorkload,
    };
}

/**
 * Group tickets by ticket ID (to get full workflow)
 */
export function groupByTicketId(tickets: SLATicket[]): Map<string, SLATicket[]> {
    const grouped = new Map<string, SLATicket[]>();

    tickets.forEach(ticket => {
        const id = ticket.ticketId;
        if (!grouped.has(id)) {
            grouped.set(id, []);
        }
        grouped.get(id)!.push(ticket);
    });

    return grouped;
}

/**
 * Detect anomalies in ticket processing times
 */
export function detectAnomalies(tickets: SLATicket[], threshold: number = 2): SLATicket[] {
    const daysRested = tickets.map(t => t.totalDaysRested);
    const mean = daysRested.reduce((sum, val) => sum + val, 0) / daysRested.length;
    const variance = daysRested.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / daysRested.length;
    const stdDev = Math.sqrt(variance);

    return tickets.filter(ticket => {
        const zScore = Math.abs((ticket.totalDaysRested - mean) / stdDev);
        return zScore > threshold;
    });
}
