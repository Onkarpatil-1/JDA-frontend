import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ─────────────────────────────────────────────────────────────────
interface OutlierTicket {
    ticketId: string;
    zone: string;
    primaryCategory: 'Analytical Outlier' | 'Behavioral Outlier';
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
    topRecommendation: string;
}

interface ZoneOutlierReportData {
    executiveSummary: string;
    zoneSummary: OutlierZoneSummary[];
    ticketReports: OutlierTicket[];
}

interface EmployeeData {
    name: string;
    role: string;
    ticketCount: number;
    avgDelay: number;
    documentationIssues: number;
    documentationShare: number;
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
    employees?: EmployeeData[];
}

// ─── Pure Monochrome / Grayscale Color System ────────────────────────────────────────────────
const C = {
    ink: [0, 0, 0] as [number, number, number],      // Near Black
    inkSoft: [64, 64, 64] as [number, number, number],  // Dark Gray
    muted: [128, 128, 128] as [number, number, number], // Med Gray
    subtle: [192, 192, 192] as [number, number, number],// Light Gray
    rule: [224, 224, 224] as [number, number, number],  // Very Light Gray
    surface: [248, 248, 248] as [number, number, number],// Off-white
    white: [255, 255, 255] as [number, number, number],

    // Accent – Minimalist Black/Grey
    accent: [0, 0, 0] as [number, number, number],
    accentLight: [64, 64, 64] as [number, number, number],
    accentBg: [240, 240, 240] as [number, number, number],

    // Status / Alerts - Muted tones
    critical: [0, 0, 0] as [number, number, number],
    critBg: [224, 224, 224] as [number, number, number],
    high: [64, 64, 64] as [number, number, number],
    highBg: [240, 240, 240] as [number, number, number],
    medium: [128, 128, 128] as [number, number, number],
    medBg: [248, 248, 248] as [number, number, number],
    low: [160, 160, 160] as [number, number, number],
    lowBg: [255, 255, 255] as [number, number, number],
};

// ─── Helpers ───────────────────────────────────────────────────────────────
type Weight = 'bold' | 'normal' | 'italic';

export const generateZoneReportPDF = (data: ZoneReportData) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const ML = 15; // margin-left 
    const MR = 15; // margin-right
    const CW = PW - ML - MR;
    let Y = 0;

    // ── Primitive tools ──────────────────────────────────────────────
    const T = (text: string, x: number, y: number, size: number, color: [number, number, number], weight: Weight = 'normal') => {
        doc.setFontSize(size); doc.setFont('helvetica', weight); doc.setTextColor(...color);
        doc.text(text, x, y);
    };

    const paragraph = (text: string, size: number, color: [number, number, number], maxWidth: number) => {
        if (!text || !text.trim()) return;
        doc.setFontSize(size);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...color);

        // Split by double newline to handle paragraphs
        const paragraphs = text.split(/\n\n+/);
        paragraphs.forEach(p => {
            const lines = doc.splitTextToSize(p.trim(), maxWidth);
            doc.text(lines, ML, Y);
            Y += lines.length * (size * 0.45) + 4; // Extra space between paragraphs
        });
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

    // ── UI Components ──────────────────────────────────────────────
    const sectionHeader = (title: string) => {
        Y += 2;
        T(title.toUpperCase(), ML, Y, 8, C.ink, 'bold');
        rule(Y + 2.5, C.ink, 0.4);
        Y += 8;
    };

    const hexToRgb = (hex: string): [number, number, number] => {
        const h = hex.replace('#', '');
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16)
        ];
    };

    const drawHeatmap = (zones: any[]) => {
        sectionHeader('Zone Efficiency Heatmap');
        const cols = 3;
        const gap = 3;
        const tileW = (CW - (gap * (cols - 1))) / cols;
        const tileH = 18;

        let startX = ML;
        let startY = Y;

        zones.forEach((z, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (tileW + gap);
            const y = startY + row * (tileH + gap);

            // Check page overflow
            if (y + tileH > PH - 20) {
                doc.addPage();
                Y = 20;
                startY = Y;
                // Re-calculate row since we reset startY
                // Actually easier to just update Y and reset the loop logic's reference
            }

            const val = z.avgInternalDelay;
            let bgColor: [number, number, number] = [21, 128, 61]; // Success Green

            if (val > 20) {
                const lerp = (c1: [number, number, number], c2: [number, number, number], w: number): [number, number, number] => [
                    Math.round(c1[0] + (c2[0] - c1[0]) * w),
                    Math.round(c1[1] + (c2[1] - c1[1]) * w),
                    Math.round(c1[2] + (c2[2] - c1[2]) * w)
                ];

                const GREEN = hexToRgb('#15803d');
                const AMBER = hexToRgb('#d97706');
                const RED = hexToRgb('#991b1b');

                if (val >= 60) bgColor = RED;
                else if (val <= 40) bgColor = lerp(GREEN, AMBER, (val - 20) / 20);
                else bgColor = lerp(AMBER, RED, (val - 40) / 20);
            }

            rect(x, y, tileW, tileH, bgColor, undefined, 1);

            // Labels
            const fullLabel = z.name.replace(/zone/i, '').trim() || z.name;
            const label = fullLabel.length > 20 ? fullLabel.substring(0, 20) + '...' : fullLabel;
            T('ZONE', x + 2, y + 5.5, 5, [255, 255, 255], 'bold');
            T(label, x + 2, y + 10, 8, [255, 255, 255], 'bold');

            T('Bottleneck Intensity Index', x + tileW - 2, y + 5.5, 5, [255, 255, 255], 'normal');
            doc.setFontSize(5);
            const delayText = `${z.avgInternalDelay.toFixed(1)}`;
            const textW = doc.getTextWidth(delayText);
            T(delayText, x + tileW - 2 - textW, y + 10, 7, [255, 255, 255], 'bold');

            Y = Math.max(Y, y + tileH + gap);
        });

        // Heatmap Legend
        Y += 2;
        const legendW = 40;
        const legendH = 3;
        const legendX = ML + CW - legendW;

        T('Efficient (<20d)', legendX - 22, Y + legendH, 6, [21, 128, 61], 'bold');

        // Simulating gradient with 10 small rects
        for (let j = 0; j < 10; j++) {
            const stepW = legendW / 10;
            const x = legendX + j * stepW;
            const val = 20 + (j * 4); // 20 to 60

            const lerp = (c1: [number, number, number], c2: [number, number, number], w: number): [number, number, number] => [
                Math.round(c1[0] + (c2[0] - c1[0]) * w),
                Math.round(c1[1] + (c2[1] - c1[1]) * w),
                Math.round(c1[2] + (c2[2] - c1[2]) * w)
            ];
            const GREEN = hexToRgb('#15803d');
            const AMBER = hexToRgb('#d97706');
            const RED = hexToRgb('#991b1b');

            let color = GREEN;
            if (val <= 40) color = lerp(GREEN, AMBER, (val - 20) / 20);
            else color = lerp(AMBER, RED, (val - 40) / 20);

            rect(x, Y, stepW + 0.5, legendH, color);
        }

        T('Delayed (60d+)', legendX + legendW + 2, Y + legendH, 6, [153, 27, 27], 'bold');
        Y += 8;
    };


    // ─────────────────────────────────────────────────────────────────────────
    // PAGE 1 — COMPACT AUDIT DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────

    // ── Minimalist Header Block (32mm) ───────────────────────────────────
    rect(ML, 5, CW, 25, C.white, C.rule, 1);

    T('JDA FORENSIC AUDIT BRIEFING', ML + 5, 11, 7, C.muted, 'bold');
    T(
        data.targetZoneName ? `Project: ${data.projectName} // Zone: ${data.targetZoneName}` : `Project: ${data.projectName}`,
        ML + 5, 19, 12, C.ink, 'bold'
    );

    const metaStr = `Generated: ${data.date}`;
    doc.setFontSize(7);
    const mStrW = doc.getTextWidth(metaStr);
    T(metaStr, PW - MR - 5 - mStrW, 11, 7, C.subtle);
    T('Ref: AUDIT-SLA-INTEL', PW - MR - 5 - doc.getTextWidth('Ref: AUDIT-SLA-INTEL'), 19, 7, C.subtle);

    // Start content below header
    Y = 40;

    // ── Executive Summary & Outlier Analytics ─────────────────────────────
    if (data.outlierReport) {
        const rpt = data.outlierReport;

        // Executive summary block
        if (rpt.executiveSummary && rpt.executiveSummary.trim()) {
            sectionHeader('Executive Summary');
            paragraph(rpt.executiveSummary, 8, C.inkSoft, CW);
            Y += 4;
        }

        sectionHeader('Zone Risk Summary');

        const tickets = rpt.ticketReports || [];
        const analyticalCount = tickets.filter(t => t.primaryCategory === 'Analytical Outlier').length;
        const behavioralCount = tickets.filter(t => t.primaryCategory === 'Behavioral Outlier').length;
        const outlierTotal = analyticalCount + behavioralCount;
        const pctA = outlierTotal ? analyticalCount / outlierTotal : 0;
        const pctB = outlierTotal ? behavioralCount / outlierTotal : 0;

        T('OUTLIER RISK DISTRIBUTION (ONLY OUTLIERS)', ML, Y, 7, C.muted, 'bold');
        Y += 6;

        T(`${Math.round(pctA * 100)}% Analytical`, ML + 5, Y, 8, C.ink, 'bold');
        T(`${Math.round(pctB * 100)}% Behavioral`, ML + 45, Y, 8, C.critical, 'bold');

        Y += 10;

        // Classification bar chart instead of severity
        T('OUTLIER CLASSIFICATION PROFILE', ML, Y, 7, C.muted, 'bold');
        Y += 4;
        const chartH = 25;
        rect(ML, Y, CW, chartH, C.surface, C.rule, 0);

        const classifications = ['ANALYTICAL OUTLIER', 'BEHAVIORAL OUTLIER'];
        const classCounts = [analyticalCount, behavioralCount];
        const maxC = Math.max(...classCounts, 1);

        const barW = (CW - 60) / 2;
        classifications.forEach((cls, i) => {
            const count = classCounts[i];
            const h = (count / maxC) * (chartH - 10);
            const x = ML + 20 + (i * (barW + 20));
            const y = Y + chartH - 5;

            // Draw baseline
            if (i === 0) {
                doc.setDrawColor(...C.rule);
                doc.setLineWidth(0.4);
                doc.line(ML + 10, y, ML + CW - 10, y);
                doc.setLineWidth(0.1);
            }

            if (h > 0) {
                const shade = i === 0 ? C.ink : C.inkSoft;
                rect(x, y - h, barW, h, shade, undefined, 0);
            }

            T(cls, x + (barW / 2) - (doc.getTextWidth(cls) / 2), y + 4, 6, C.muted, 'bold');
            if (h > 0) {
                T(count.toString(), x + (barW / 2) - (doc.getTextWidth(count.toString()) / 2), y - h - 1.5, 7, C.ink, 'bold');
            }
        });

        Y += chartH + 10;

        // ── Zone-level summary table (compact, with outlier split) ───────────
        if (rpt.zoneSummary && rpt.zoneSummary.length > 0) {
            Y += 5; // Add some space before the table
            autoTable(doc, {
                head: [['ZONE', 'TICKETS', 'ANALYTICAL', 'BEHAVIORAL', 'NORMAL', 'TOP RECOMMENDATION']],
                body: rpt.zoneSummary.map((z: any) => {
                    const total = z.totalTickets || 0;
                    const analytical = z.analyticalOutliers || 0;
                    const behavioral = z.behavioralOutliers || 0;
                    const normal = z.normalTickets != null ? z.normalTickets : Math.max(total - analytical - behavioral, 0);

                    const analyticalPct = z.analyticalOutlierPercent != null
                        ? z.analyticalOutlierPercent
                        : (total ? (analytical / total) * 100 : 0);
                    const behavioralPct = z.behavioralOutlierPercent != null
                        ? z.behavioralOutlierPercent
                        : (total ? (behavioral / total) * 100 : 0);
                    const normalPct = z.normalPercent != null
                        ? z.normalPercent
                        : (total ? (normal / total) * 100 : 0);

                    const fmt = (count: number, pct: number) =>
                        total ? `${count} (${pct.toFixed(0)}%)` : count.toString();

                    return [
                        z.zone,
                        total.toString(),
                        fmt(analytical, analyticalPct),
                        fmt(behavioral, behavioralPct),
                        fmt(normal, normalPct),
                        z.topRecommendation
                    ];
                }),
                startY: Y,
                theme: 'plain',
                headStyles: { fillColor: C.ink, textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
                bodyStyles: { fontSize: 7.5, textColor: C.inkSoft, halign: 'center', cellPadding: 2 },
                alternateRowStyles: { fillColor: C.surface },
                columnStyles: {
                    0: { halign: 'left', fontStyle: 'bold', textColor: C.ink },
                    5: { halign: 'left', cellWidth: 70 }
                },
                margin: { left: ML, right: MR }
            });
            Y = (doc as any).lastAutoTable.finalY + 10;
        }

        // ── Forensic Findings Detail (Deep Dive) ─────────────────────────────
        if (rpt.ticketReports && rpt.ticketReports.length > 0) {
            Y += 5; // Add some space before the table

            const tickets = [...rpt.ticketReports];

            autoTable(doc, {
                head: [['TICKET', 'TYPE', 'FLAG / ACTION']],
                body: tickets.map(t => {
                    const root = (t.rootCause || '').trim();
                    const defaultFlag =
                        t.primaryCategory === 'Behavioral Outlier'
                            ? 'Behavioral pattern indicated by forensic summaries.'
                            : 'Analytical pattern indicated by structural/process issues.';

                    let flagAction = `FLAG: ${root || defaultFlag}\n\n`;
                    const action = (t.recommendations || [])[0] || 'Observe process variations.';
                    flagAction += `ACTION: ${action}`;

                    return [
                        `#${t.ticketId}`,
                        t.primaryCategory === 'Behavioral Outlier' ? 'BEHAVIORAL' : 'ANALYTICAL',
                        flagAction
                    ];
                }),
                startY: Y,
                theme: 'plain',
                headStyles: { fillColor: C.ink, textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
                bodyStyles: { fontSize: 7.5, textColor: C.inkSoft, halign: 'left', cellPadding: 2, cellWidth: 'wrap' },
                alternateRowStyles: { fillColor: C.surface },
                columnStyles: {
                    0: { halign: 'center', fontStyle: 'bold', textColor: C.ink, cellWidth: 25 },
                    1: { halign: 'center', cellWidth: 25 },
                    2: { halign: 'left', cellWidth: 'auto' }
                },
                margin: { left: ML, right: MR }
            });
            Y = (doc as any).lastAutoTable.finalY + 10;
        }
    }

    // ── Zone Efficiency Heatmap (Only for All Zones) ─────────────────────
    if (!data.targetZoneName && data.zones && data.zones.length > 0) {
        if (Y > PH - 60) { doc.addPage(); Y = 20; }
        drawHeatmap(data.zones);
    }

    // ── Employee Workload & Delay Analysis ─────────────────────────────
    if (data.employees && data.employees.length > 0) {
        if (Y > PH - 60) { doc.addPage(); Y = 20; }
        sectionHeader('Employee Workload & Delay Analysis');
        T('Sorted by Average Delay to highlight potential bottlenecks.', ML, Y, 7, C.muted, 'italic');
        Y += 5;

        autoTable(doc, {
            head: [['EMPLOYEE', 'ROLE', 'TICKETS', 'AVG DELAY']],
            body: data.employees.map(e => [
                e.name,
                e.role,
                e.ticketCount.toString(),
                `${e.avgDelay.toFixed(1)}d`
            ]),
            startY: Y,
            theme: 'plain',
            headStyles: { fillColor: C.ink, textColor: 255, fontSize: 7, fontStyle: 'bold', halign: 'center', cellPadding: 2 },
            bodyStyles: { fontSize: 7.5, textColor: C.inkSoft, halign: 'center', cellPadding: 2 },
            didParseCell: (data) => {
                // If column is 'AVG DELAY' (index 3) and value > 10, highlight red
                if (data.column.index === 3 && data.section === 'body') {
                    const rawValue = data.cell.raw as string;
                    const delay = parseFloat(rawValue.replace('d', ''));
                    if (delay > 10) {
                        data.cell.styles.textColor = [185, 28, 28]; // #b91c1c
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
            alternateRowStyles: { fillColor: C.surface },
            columnStyles: {
                0: { halign: 'left', fontStyle: 'bold', textColor: C.ink },
                1: { halign: 'left' }
            },
            margin: { left: ML, right: MR }
        });
        Y = (doc as any).lastAutoTable.finalY + 10;
    }

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