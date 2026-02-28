import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ─────────────────────────────────────────────────────────────────
interface OutlierTicket {
    ticketId: string;
    zone: string;
    primaryCategory: 'Analytical Outlier' | 'Behavioral Outlier';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    outlierSummary: string;
    rootCause: string;
    recommendations: string[];
    keyEvidence: string[];
    documentCrossCheck?: {
        falsyRequestedAfterSubmission: string[];
        genuinelyMissing: string[];
        crossCheckSummary: string;
    };
}

interface OutlierZoneSummary {
    zone: string;
    totalTickets: number;
    analyticalOutliers: number;
    behavioralOutliers: number;
    criticalCount: number;
    topRecommendation: string;
}

interface ZoneOutlierReportData {
    executiveSummary: string;
    zoneSummary: OutlierZoneSummary[];
    ticketReports: OutlierTicket[];
}

interface ZoneReportData {
    projectName: string;
    date: string;
    targetZoneName?: string;
    overallStats: {
        totalTickets: number;
        avgProcessingTime: number;
        completionRate: number;
    };
    zones: Array<{
        name: string;
        avgTime: number;
        avgTotalDelay: number;
        onTime: number;
        ticketCount: number;
        internalDelay: number;
        avgInternalDelay: number;
    }>;
    alertZone?: { name: string; avgTime: number; docDelayRate: number };
    bestZone?: { name: string; avgTime: number; onTimeRate: number };
    aiInsights?: any;
    outlierReport?: ZoneOutlierReportData;
}

// ─── Enterprise Color System ────────────────────────────────────────────────
const C = {
    ink: [15, 23, 42] as [number, number, number],      // Slate 900
    inkSoft: [51, 65, 85] as [number, number, number],  // Slate 700
    muted: [100, 116, 139] as [number, number, number], // Slate 500
    subtle: [148, 163, 184] as [number, number, number],// Slate 400
    rule: [226, 232, 240] as [number, number, number],  // Slate 200
    surface: [248, 250, 252] as [number, number, number],// Slate 50
    white: [255, 255, 255] as [number, number, number],

    // Accent – Enterprise Indigo
    accent: [67, 56, 202] as [number, number, number],  // Indigo 700
    accentLight: [99, 102, 241] as [number, number, number],// Indigo 500
    accentBg: [238, 242, 255] as [number, number, number],  // Indigo 50

    // Status / Alerts
    critical: [190, 18, 60] as [number, number, number], // Rose 700
    critBg: [255, 241, 242] as [number, number, number], // Rose 50
    high: [194, 65, 12] as [number, number, number],   // Amber 700
    highBg: [255, 251, 235] as [number, number, number], // Amber 50
    medium: [3, 105, 161] as [number, number, number],  // Sky 700
    medBg: [240, 249, 255] as [number, number, number],  // Sky 50
    low: [5, 150, 105] as [number, number, number],   // Emerald 600
    lowBg: [236, 253, 245] as [number, number, number],  // Emerald 50
};

// ─── Helpers ───────────────────────────────────────────────────────────────
type Weight = 'bold' | 'normal' | 'italic';

const severityMeta = (s: string) => {
    switch (s) {
        case 'CRITICAL': return { fg: C.critical, bg: C.critBg, label: 'CRITICAL' };
        case 'HIGH': return { fg: C.high, bg: C.highBg, label: 'HIGH' };
        case 'MEDIUM': return { fg: C.medium, bg: C.medBg, label: 'MEDIUM' };
        default: return { fg: C.low, bg: C.lowBg, label: 'LOW' };
    }
};

export const generateZoneReportPDF = (data: ZoneReportData) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const ML = 15; // margin-left 
    const MR = 15; // margin-right
    const CW = PW - ML - MR;
    const colW = CW / 12; // 12-col grid
    let Y = 0;

    // ── Primitive tools ──────────────────────────────────────────────
    const T = (text: string, x: number, y: number, size: number, color: [number, number, number], weight: Weight = 'normal') => {
        doc.setFontSize(size); doc.setFont('helvetica', weight); doc.setTextColor(...color);
        doc.text(text, x, y);
    };

    const rect = (x: number, y: number, w: number, h: number, fill?: [number, number, number], stroke?: [number, number, number], r = 0) => {
        if (fill) doc.setFillColor(...fill);
        if (stroke) { doc.setDrawColor(...stroke); doc.setLineWidth(0.1); }
        else doc.setDrawColor(0, 0, 0, 0);
        const style = fill && stroke ? 'FD' : fill ? 'F' : 'D';
        if (r > 0) doc.roundedRect(x, y, w, h, r, r, style);
        else doc.rect(x, y, w, h, style);
    };

    const rule = (y: number, color: [number, number, number] = C.rule, thick = 0.2) => {
        doc.setDrawColor(...color); doc.setLineWidth(thick);
        doc.line(ML, y, PW - MR, y);
        doc.setLineWidth(0.1);
    };

    const guard = (needed: number, title?: string) => {
        if (Y + needed > PH - 20) {
            doc.addPage(); Y = 15;
            if (title) {
                T(title, ML, Y, 7, C.subtle, 'bold');
                rule(Y + 2); Y += 6;
            }
            return true;
        }
        return false;
    };

    // ── UI Components ──────────────────────────────────────────────
    const sectionHeader = (title: string) => {
        Y += 2;
        T(title.toUpperCase(), ML, Y, 8, C.ink, 'bold');
        rule(Y + 2.5, C.ink, 0.4);
        Y += 8;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // PAGE 1 — COMPACT AUDIT DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────

    // ── Compact Header Block (32mm) ───────────────────────────────────
    rect(0, 0, PW, 32, C.ink);
    rect(0, 0, 1.5, 32, C.accentLight);

    T('JDA FORENSIC AUDIT BRIEFING', ML, 10, 8, C.subtle, 'bold');
    T(
        data.targetZoneName ? `Project: ${data.projectName} · Zone: ${data.targetZoneName}` : `Project: ${data.projectName}`,
        ML, 20, 14, C.white, 'bold'
    );

    const metaStr = `Generated: ${data.date} · Confidential`;
    doc.setFontSize(7.5);
    const mStrW = doc.getTextWidth(metaStr);
    T(metaStr, PW - MR - mStrW, 10, 7.5, C.subtle);
    T('Ref: AUDIT-SLA-INTEL', PW - MR - doc.getTextWidth('Ref: AUDIT-SLA-INTEL'), 20, 7, [90, 100, 120]);

    Y = 40;

    // ── Key Metrics (Grid Row) ────────────────────────────────────────
    const kpiH = 22;
    const kpiX = [ML, ML + 4 * colW + 2, ML + 8 * colW + 4];
    const statItem = (idx: number, label: string, val: string, color: [number, number, number]) => {
        const x = kpiX[idx];
        rect(x, Y, 3.7 * colW, kpiH, C.white, C.rule, 0.5);
        rect(x, Y, 0.8, kpiH, color); // thin sidebar
        T(label, x + 3.5, Y + 6, 6.5, C.muted, 'bold');
        T(val, x + 3.5, Y + 15, 16, C.ink, 'bold');
    };

    statItem(0, 'TOTAL TICKETS', data.overallStats.totalTickets.toString(), C.accent);
    statItem(1, 'PROCESSING AVG', `${data.overallStats.avgProcessingTime.toFixed(1)}d`, C.high);
    statItem(2, 'COMPLIANCE', `${data.overallStats.completionRate.toFixed(1)}%`, C.low);

    Y += kpiH + 10;

    // ── Outlier Analytics ─────────────────────────────────────────────
    if (data.outlierReport) {
        const rpt = data.outlierReport;
        sectionHeader('Forensic Risk Intelligence');

        // Distribution Bar
        const total = rpt.ticketReports.length || 1;
        const analytical = rpt.ticketReports.filter(t => t.primaryCategory === 'Analytical Outlier').length;
        const pctA = (analytical / total);
        const barH = 6;

        T('IMPACT DISTRIBUTION', ML, Y, 7, C.muted, 'bold');
        Y += 3;
        rect(ML, Y, CW, barH, C.critical, undefined, 0.5);
        if (pctA > 0) rect(ML, Y, CW * pctA, barH, C.accent, undefined, 0.5);

        Y += barH + 4;
        T(`${Math.round(pctA * 100)}% Analytical Gaps`, ML, Y, 7.5, C.accent, 'bold');
        const bLabel = `${Math.round((1 - pctA) * 100)}% Behavioral Risks`;
        T(bLabel, PW - MR - doc.getTextWidth(bLabel), Y, 7.5, C.critical, 'bold');

        Y += 8;

        // Severity summary boxes (Row 2)
        const sevH = 18;
        const sevStat = (idx: number, label: string, count: number, meta: any) => {
            const x = kpiX[idx];
            rect(x, Y, 3.7 * colW, sevH, meta.bg, meta.fg, 0.5);
            T(label, x + 3.5, Y + 5.5, 6.5, meta.fg, 'bold');
            T(count.toString(), x + 3.5, Y + 14, 12, meta.fg, 'bold');
        };

        sevStat(0, 'CRITICAL ALARMS', rpt.ticketReports.filter(t => t.severity === 'CRITICAL').length, severityMeta('CRITICAL'));
        sevStat(1, 'HIGH PRIORITY', rpt.ticketReports.filter(t => t.severity === 'HIGH').length, severityMeta('HIGH'));
        sevStat(2, 'MODERATE RISK', rpt.ticketReports.filter(t => t.severity === 'MEDIUM').length, severityMeta('MEDIUM'));

        Y += sevH + 10;

        // Executive Narrative - Tightened
        T('EXECUTIVE SUMMARY', ML, Y, 7, C.muted, 'bold');
        Y += 3;
        const lines = doc.splitTextToSize(rpt.executiveSummary, CW - 10);
        const cardH = (lines.length * 4.2) + 6;
        rect(ML, Y, CW, cardH, C.surface, C.rule, 0.5);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.inkSoft);
        doc.text(lines, ML + 5, Y + 5);

        Y += cardH + 10;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORENSIC TICKETS - Deep Dive (Tighter spacing)
    // ─────────────────────────────────────────────────────────────────────────
    if (data.outlierReport) {
        sectionHeader('Forensic Findings Detail');

        const tickets = [...data.outlierReport.ticketReports].sort((a, b) => {
            const order = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            return order[a.severity] - order[b.severity];
        });

        for (const t of tickets) {
            const isBeh = t.primaryCategory === 'Behavioral Outlier';
            const catC = isBeh ? C.critical : C.accent;
            const meta = severityMeta(t.severity);
            const piecemeal = t.documentCrossCheck?.falsyRequestedAfterSubmission || [];

            // Measurements
            const summaryL = doc.splitTextToSize(t.outlierSummary || '', CW - 15);
            const causeL = doc.splitTextToSize(t.rootCause || '', CW - 15);
            const evidenceL = (t.keyEvidence || []).slice(0, 3).flatMap(e => doc.splitTextToSize(e, CW - 20));

            let h = 18; // base header
            h += (summaryL.length * 4.2) + 6;
            h += (causeL.length * 4.2) + 6;
            if (evidenceL.length) h += (evidenceL.length * 4) + 8;
            if (piecemeal.length) h += 10;
            h += 10; // action footer

            guard(h + 8, 'Forensic Findings Detail (Cont.)');

            const startY = Y;
            rect(ML, Y, CW, h, C.white, C.rule, 0.5);
            rect(ML, Y, 1, h, catC); // sidebar

            // Card Header
            rect(ML + 1, Y, CW - 1, 9, C.surface, undefined, 0);
            T(isBeh ? 'BEHAVIORAL MISCONDUCT' : 'PROCESS GAP', ML + 4, Y + 6, 6.5, catC, 'bold');
            // Severity pill
            const sW = doc.getTextWidth(meta.label) + 4;
            rect(PW - MR - sW - 3, Y + 2, sW, 5, meta.fg, undefined, 0.5);
            T(meta.label, PW - MR - (sW / 2) - 3, Y + 5.5, 6, C.white, 'bold');

            Y += 13;
            T(`#${t.ticketId}`, ML + 4, Y, 10, C.ink, 'bold');
            T(`Zone ${t.zone} · ${Math.round(t.confidence * 100)}% Confidence`, ML + 4, Y + 5, 7, C.muted);

            Y += 9;

            // Findings text
            T('INSIGHT', ML + 4, Y, 6, C.muted, 'bold');
            Y += 3.5;
            doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.inkSoft);
            doc.text(summaryL, ML + 4, Y);
            Y += (summaryL.length * 4.2) + 4;

            // Flag Alert
            if (piecemeal.length) {
                rect(ML + 4, Y, CW - 8, 8, C.critBg, undefined, 0.5);
                T('FLAG:', ML + 6, Y + 5.5, 7, C.critical, 'bold');
                T(`Re-requested: ${piecemeal.join(', ')}`, ML + 15, Y + 5.5, 7, C.inkSoft);
                Y += 10;
            }

            // Root Cause
            T('ROOT CAUSE', ML + 4, Y, 6, C.muted, 'bold');
            Y += 3.5;
            doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.ink);
            doc.text(causeL, ML + 4, Y);
            Y += (causeL.length * 4.2) + 4;

            // Evidence grain
            if (evidenceL.length) {
                T('EVIDENCE', ML + 4, Y, 6, C.muted, 'bold');
                Y += 3.5;
                doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.muted);
                evidenceL.forEach((line, i) => {
                    T('>', ML + 4, Y + (i * 4), 7, C.subtle, 'bold');
                    doc.text(line, ML + 8, Y + (i * 4));
                });
                Y += (evidenceL.length * 4) + 4;
            }

            // Card Footer (Action)
            const footerY = startY + h - 8;
            rect(ML + 1, footerY, CW - 1, 8, C.accentBg, undefined, 0);
            const action = (t.recommendations || [])[0] || 'Observe process Variations.';
            T('ACTION:', ML + 4, footerY + 5.5, 6.5, C.accent, 'bold');
            T(action, ML + 16, footerY + 5.5, 7.5, C.accent);

            Y = startY + h + 6;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ANNEX - DATA APPENDIX
    // ─────────────────────────────────────────────────────────────────────────
    guard(40, 'Regional Performance Annex');
    sectionHeader('Regional Performance Annex');

    autoTable(doc, {
        head: [['ZONE AUTHORITY', 'TICKETS', 'AVG TIME', 'INTERNAL', 'COMPLIANCE %']],
        body: data.zones.map(z => [
            z.name,
            z.ticketCount.toString(),
            `${z.avgTime.toFixed(1)}d`,
            `${z.avgInternalDelay.toFixed(1)}d`,
            `${z.onTime.toFixed(1)}%`
        ]),
        startY: Y,
        theme: 'plain',
        headStyles: { fillColor: C.ink, textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
        bodyStyles: { fontSize: 7.5, textColor: C.inkSoft, halign: 'center', cellPadding: 2 },
        alternateRowStyles: { fillColor: C.surface },
        columnStyles: { 0: { halign: 'left', fontStyle: 'bold', textColor: C.ink } },
        margin: { left: ML, right: MR }
    });

    // ── Compact Footer ─────────────────────────────────────────────
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(...C.rule); doc.setLineWidth(0.2);
        doc.line(ML, PH - 10, PW - MR, PH - 10);

        T('CONFIDENTIAL AUDIT BRIEFING', ML, PH - 6, 6, C.subtle, 'bold');
        T(`Project: ${data.projectName} · Page ${i} / ${totalPages}`, PW / 2, PH - 6, 6, C.subtle, 'normal');

        const footNote = 'JDA SLA Intelligence';
        T(footNote, PW - MR - doc.getTextWidth(footNote), PH - 6, 6, C.subtle);
    }

    const filename = `JDA_ForensicCompact_${data.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};