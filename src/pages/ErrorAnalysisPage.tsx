import React, { useMemo, useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Pagination,
    alpha,
    Menu,
    MenuItem
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Download,
    MapPin,
    AlertTriangle,
    TrendingUp,
    Users,
    ChevronDown
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { generateZoneReportPDF } from '../utils/pdfExport';
import API_BASE from '../lib/api';

const CATEGORY_COLORS: Record<string, string> = {
    'Documentation & Compliance Issues': '#4f46e5',
    'Process & Approval Bottlenecks': '#d97706',
    'Communication & Coordination Gaps': '#0ea5e9',
    'External Dependencies & Third-Party Delays': '#8b5cf6',
    'Internal System & Employee Issues': '#f43f5e',
    Uncategorized: '#64748b'
};

const MarkdownWrapper = ({ content }: { content: string }) => (
    <Box sx={{
        '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
        '& strong': { fontWeight: 700, color: 'inherit' },
        '& ul, & ol': { pl: 2, m: 0, mb: 1 },
        '& li': { mb: 0.5 },
        color: 'inherit',
        fontSize: 'inherit',
        lineHeight: 'inherit'
    }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Box>
);

interface ZoneSummary {
    name: string;
    avgTime: number;
    avgTotalDelay: number;
    onTime: number;
    ticketCount: number;
    internalDelay: number;
    avgInternalDelay: number;
    documentationDelayRate: number;
}

interface EmployeeRowData {
    name: string;
    role: string;
    ticketCount: number;
    avgDelay: number;
    documentationIssues: number;
    documentationShare: number;
}

const KPICard = ({ title, value, subtext, accent, icon }: { title: string; value: string; subtext?: string; accent: string; icon: React.ReactNode }) => (
    <Paper
        elevation={0}
        sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid #e5e7eb',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
    >
        <Box
            sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: alpha(accent, 0.08),
                color: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
            <Typography variant="overline" sx={{ color: '#6b7280', fontWeight: 600, letterSpacing: '0.08em', display: 'block', lineHeight: 1.2, mb: 0.5 }}>
                {title}
            </Typography>
            <Typography variant="h5" sx={{ color: '#111827', fontWeight: 700, fontFamily: 'Outfit' }}>
                {value}
            </Typography>
            {subtext && (
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, mt: 0.5, display: 'block' }}>
                    {subtext}
                </Typography>
            )}
        </Box>
    </Paper>
);

const ZoneTile = ({
    zone,
    isActive,
    onClick
}: {
    zone: ZoneSummary;
    isActive: boolean;
    onClick: () => void;
}) => {
    const getColor = (avgTime: number) => {
        if (avgTime <= 3) return '#16a34a'; // Dark green
        if (avgTime <= 7) return '#d97706'; // Amber
        return '#dc2626'; // Dark red
    };

    const bg = getColor(zone.avgTime);
    const zoneLabel = zone.name.replace(/zone/i, '').trim() || zone.name;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                borderRadius: 2,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isActive ? bg : '#e5e7eb',
                borderLeft: `4px solid ${bg}`,
                bgcolor: 'white',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? '0 10px 15px -3px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    borderColor: isActive ? bg : '#d1d5db',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="overline" sx={{ color: '#6b7280', fontWeight: 600, letterSpacing: '0.1em', lineHeight: 1 }}>
                        ZONE
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: '#111827', mt: 0.5, fontFamily: 'Outfit' }}
                    >
                        {zoneLabel}
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    variant="outlined"
                    label={`${zone.ticketCount} tickets`}
                    sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderColor: '#e5e7eb',
                        color: '#4b5563',
                        bgcolor: '#f9fafb'
                    }}
                />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, display: 'block', mb: 0.25 }}>
                        Avg Delay
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                        {zone.avgTotalDelay.toFixed(0)} <Typography component="span" variant="caption" sx={{ color: '#6b7280' }}>days</Typography>
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, display: 'block', mb: 0.25 }}>
                        Avg Internal Delay
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#111827' }}>
                        {zone.avgInternalDelay.toFixed(0)} <Typography component="span" variant="caption" sx={{ color: '#6b7280' }}>days</Typography>
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

const ErrorAnalysisPage = () => {
    const { currentProject } = useProject();
    const [page, setPage] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
    const pageSize = 6;

    const {
        zones,
        selectedZoneName,
        setSelectedZoneName,
        selectedZoneEmployees,
        selectedZoneCategories,
        globalCategoryDistribution,
        alertZone,
        bestZone
    } = useZoneAnalytics();

    if (!currentProject) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Please select a project to view zone performance analysis.</Typography>
            </Box>
        );
    }

    const activeZone = zones.find(z => z.name === selectedZoneName);
    const pagedEmployees = selectedZoneEmployees.slice((page - 1) * pageSize, page * pageSize);

    useEffect(() => {
        // Reset to first page when zone changes
        setPage(1);
    }, [selectedZoneName]);

    const handleExportClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setExportAnchorEl(event.currentTarget);
    };

    const handleExportClose = () => {
        setExportAnchorEl(null);
    };

    const handleDownloadReport = async (zoneName: string) => {
        handleExportClose();
        if (!currentProject) return;
        setIsExporting(true);
        try {
            // 1. Call backend for AI outlier analysis
            let outlierReport: any = undefined;
            try {
                const res = await fetch(`${API_BASE}/project/${currentProject.metadata.id}/zone-outlier-report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ aiProvider: 'ollama' })
                });
                if (res.ok) {
                    const json = await res.json();
                    outlierReport = json.report;
                } else {
                    console.warn('Zone outlier backend call failed, generating PDF with stats only.');
                }
            } catch (fetchErr) {
                console.warn('Could not reach backend for outlier report, generating PDF with stats only.', fetchErr);
            }

            // 2. Generate PDF with outlier data (or without if fetch failed)
            generateZoneReportPDF({
                projectName: currentProject.metadata.name,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                targetZoneName: zoneName,
                overallStats: {
                    totalTickets: currentProject.statistics.totalTickets,
                    avgProcessingTime: currentProject.metadata.avgProcessingTime,
                    completionRate: currentProject.statistics.completionRate
                },
                alertZone: alertZone ? {
                    name: alertZone.name,
                    avgTime: alertZone.avgTime,
                    docDelayRate: alertZone.documentationDelayRate
                } : undefined,
                bestZone: bestZone ? {
                    name: bestZone.name,
                    avgTime: bestZone.avgTime,
                    onTimeRate: bestZone.onTime
                } : undefined,
                aiInsights: currentProject.statistics.aiInsights,
                zones: zones.filter(z => z.name === zoneName),
                outlierReport
            });
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Box sx={{ pb: 8 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontFamily: 'Outfit',
                            fontWeight: 800,
                            color: '#0f172a',
                            mb: 1
                        }}
                    >
                        Zone Performance Heatmap
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 660 }}>
                        Visual overview of processing efficiency across all administrative zones, with drill-down into{' '}
                        <strong>Documentation &amp; Compliance Issues</strong> for each zone and employee.
                    </Typography>
                </Box>
                <Box>
                    <Button
                        variant="contained"
                        startIcon={<Download size={18} />}
                        endIcon={<ChevronDown size={16} />}
                        onClick={handleExportClick}
                        disabled={isExporting}
                        sx={{
                            bgcolor: 'white',
                            color: '#111827',
                            fontWeight: 600,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            '&:hover': {
                                bgcolor: '#f8fafc',
                                borderColor: '#cbd5e1',
                                boxShadow: 'none'
                            }
                        }}
                    >
                        {isExporting ? 'Generating...' : 'Download Zone Report'}
                    </Button>
                    <Menu
                        anchorEl={exportAnchorEl}
                        open={Boolean(exportAnchorEl)}
                        onClose={handleExportClose}
                        sx={{ mt: 1 }}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.1))',
                                border: '1px solid #e5e7eb',
                                minWidth: 240,
                                maxHeight: 360,
                                borderRadius: 2
                            }
                        }}
                    >
                        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', mb: 1, bgcolor: '#f8fafc' }}>
                            <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1 }}>
                                SELECT A ZONE TO EXPORT
                            </Typography>
                        </Box>
                        {zones.map(z => (
                            <MenuItem
                                key={z.name}
                                onClick={() => handleDownloadReport(z.name)}
                                sx={{
                                    fontSize: '0.875rem',
                                    py: 1.5,
                                    px: 2,
                                    fontWeight: 500,
                                    color: '#334155',
                                    borderBottom: '1px solid #f8fafc',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                }}
                            >
                                {z.name}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
            </Box>

            {/* Alert + Top Zone */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <KPICard
                        title="Efficiency Alert"
                        value={alertZone ? `${alertZone.name} (Avg ${alertZone.avgTime.toFixed(0)} days)` : 'No critical zone'}
                        subtext={
                            alertZone
                                ? `${(alertZone.documentationDelayRate * 100).toFixed(0)}% of its delay is due to Documentation & Compliance`
                                : 'No documentation-heavy delays detected'
                        }
                        accent="#dc2626"
                        icon={<AlertTriangle size={20} />}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <KPICard
                        title="Top Performing Zone"
                        value={bestZone ? `${bestZone.name} (Avg ${bestZone.avgTime.toFixed(0)} days)` : 'Awaiting data'}
                        subtext={
                            bestZone
                                ? `${bestZone.onTime.toFixed(0)}% on-time completion with balanced documentation handling`
                                : 'Upload and analyze data to view insights'
                        }
                        accent="#16a34a"
                        icon={<TrendingUp size={20} />}
                    />
                </Grid>
            </Grid>

            {/* Zone Heatmap */}
            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    bgcolor: 'white',
                    p: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontFamily: 'Outfit' }}>
                            Zone Efficiency Heatmap
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.25 }}>
                            Each tile represents one zone. Color intensity reflects average processing delay.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#16a34a' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                                Efficient (&lt;= 3 days)
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#d97706' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                                Moderate (3–7 days)
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: 1, bgcolor: '#dc2626' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                                Delayed (&gt; 7 days)
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Grid container spacing={2}>
                    {zones.map(zone => (
                        <Grid key={zone.name} size={{ xs: 12, sm: 6, md: 4 }}>
                            <ZoneTile
                                zone={zone}
                                isActive={zone.name === selectedZoneName}
                                onClick={() => setSelectedZoneName(zone.name)}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Paper>

            {/* Detailed Analysis for Selected Zone */}
            {activeZone && (
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid #e5e7eb',
                                bgcolor: 'white',
                                height: '100%',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 2,
                                        bgcolor: '#0f172a',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <MapPin size={18} />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                        {activeZone.name}: Detailed Analysis
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        Category distribution for resolved and pending tickets in this zone.
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ height: 220 }}>
                                {selectedZoneCategories.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={selectedZoneCategories}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={3}
                                                labelLine={false}
                                            >
                                                {selectedZoneCategories.map(entry => (
                                                    <Cell
                                                        key={entry.name}
                                                        fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS.Uncategorized}
                                                    />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{
                                                    borderRadius: 8,
                                                    border: '1px solid #e5e7eb',
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                                    fontSize: '0.8rem'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <Box
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                                            No forensic category data for this zone yet.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            {/* Inline legend for readability (labels removed from inside pie) */}
                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                {selectedZoneCategories.map(cat => (
                                    <Box
                                        key={cat.name}
                                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '999px',
                                                    bgcolor:
                                                        CATEGORY_COLORS[cat.name] || CATEGORY_COLORS.Uncategorized
                                                }}
                                            />
                                            <Typography variant="caption" sx={{ color: '#4b5563', fontWeight: 600 }}>
                                                {cat.name}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                            {cat.percentage}%
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid #e5e7eb',
                                bgcolor: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', fontFamily: 'Outfit' }}>
                                        Employee Workload &amp; Delay Analysis
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.25 }}>
                                        Sorted by{' '}
                                        <strong>Documentation &amp; Compliance Issues</strong> share to highlight
                                        potential bottlenecks.
                                    </Typography>
                                </Box>
                                <Chip
                                    icon={<Users size={14} />}
                                    label={`${selectedZoneEmployees.length} employees`}
                                    size="small"
                                    sx={{
                                        height: 26,
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        bgcolor: '#f9fafb',
                                        color: '#4b5563',
                                        border: '1px solid #e5e7eb',
                                        '& .MuiChip-icon': {
                                            color: '#4b5563'
                                        }
                                    }}
                                />
                            </Box>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', py: 1.5 }}>
                                                EMPLOYEE
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', py: 1.5 }}>
                                                ROLE
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', py: 1.5 }}
                                            >
                                                TICKETS
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', py: 1.5 }}
                                            >
                                                AVG DELAY (DAYS)
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {pagedEmployees.length > 0 ? (
                                            pagedEmployees.map(emp => {
                                                const isDocHeavy = emp.documentationShare >= 0.4 && emp.ticketCount >= 3;
                                                return (
                                                    <TableRow
                                                        key={emp.name}
                                                        sx={{
                                                            transition: 'all 0.15s ease',
                                                            '&:hover': { bgcolor: isDocHeavy ? '#fef2f2' : '#f8fafc' },
                                                            borderLeft: isDocHeavy ? '3px solid #dc2626' : '3px solid transparent',
                                                            bgcolor: isDocHeavy ? '#fefcfc' : 'inherit',
                                                            '& td': { borderBottom: '1px solid #f1f5f9', py: 2 }
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        width: 36,
                                                                        height: 36,
                                                                        bgcolor: isDocHeavy
                                                                            ? alpha('#dc2626', 0.1)
                                                                            : '#f8fafc',
                                                                        color: isDocHeavy ? '#dc2626' : '#334155',
                                                                        border: isDocHeavy ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: 700,
                                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                                                    }}
                                                                >
                                                                    {emp.name.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography
                                                                        variant="body1"
                                                                        sx={{
                                                                            fontWeight: 600,
                                                                            color: '#0f172a',
                                                                            maxWidth: 200,
                                                                            whiteSpace: 'nowrap',
                                                                            textOverflow: 'ellipsis',
                                                                            overflow: 'hidden'
                                                                        }}
                                                                    >
                                                                        {emp.name}
                                                                    </Typography>
                                                                    {isDocHeavy && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: '#b91c1c',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.7rem'
                                                                            }}
                                                                        >
                                                                            High documentation-driven delay
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                                            {emp.role}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                                                            {emp.ticketCount}
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"
                                                            sx={{
                                                                fontSize: '0.85rem',
                                                                fontWeight: emp.avgDelay > 10 ? 700 : 600,
                                                                color: emp.avgDelay > 10 ? '#b91c1c' : '#334155'
                                                            }}
                                                        >
                                                            {emp.avgDelay.toFixed(0)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                                                    No employee-level delay patterns detected for this zone.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {selectedZoneEmployees.length > pageSize && (
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                                    <Pagination
                                        count={Math.ceil(selectedZoneEmployees.length / pageSize)}
                                        page={page}
                                        onChange={(_, value) => setPage(value)}
                                        size="small"
                                        color="primary"
                                    />
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* Strategic Insights & Recommendations */}
            {globalCategoryDistribution.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        mt: 5,
                        borderRadius: 2,
                        border: '1px solid #e5e7eb',
                        bgcolor: 'white',
                        p: 4,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                >
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="overline"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                color: currentProject?.statistics?.aiInsights?.severity === 'CRITICAL' ? '#dc2626' : '#64748b',
                                display: 'block',
                                lineHeight: 1,
                                mb: 1
                            }}
                        >
                            AI FORRENSIC INSIGHTS &amp; STRATEGY
                        </Typography>
                        <Typography
                            variant="h4"
                            sx={{ fontWeight: 800, color: '#0f172a', fontFamily: 'Outfit' }}
                        >
                            Strategic Performance Matrix
                        </Typography>
                    </Box>





                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Critical documentation hotspot */}
                        {alertZone && (
                            <Paper
                                elevation={0}
                                onClick={() => {
                                    setSelectedZoneName(alertZone.name);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    border: '1px solid #fecaca',
                                    borderLeft: '4px solid #dc2626',
                                    bgcolor: 'white',
                                    display: 'flex',
                                    gap: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    '&:hover': {
                                        borderColor: '#fca5a5',
                                        bgcolor: '#fef2f2',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 999,
                                        bgcolor: '#fee2e2',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#b91c1c',
                                        flexShrink: 0
                                    }}
                                >
                                    <AlertTriangle size={18} />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 700, color: '#b91c1c', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'Outfit', fontSize: '1rem' }}
                                    >
                                        Critical performance gap: {alertZone.name}
                                        <Chip label="Click to view details" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'transparent', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 600 }} />
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: '#7f1d1d', fontSize: '0.8rem', mb: 0.75 }}
                                    >
                                        This zone shows elevated average delay of{' '}
                                        <strong>{alertZone.avgTime.toFixed(0)} days</strong>, with a
                                        high concentration of documentation‑related bottlenecks. Tighten
                                        document checklist communication and approval SLAs for this zone.
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        {/* AI Generated Recommendations */}
                        {currentProject?.statistics?.aiInsights?.recommendations?.map((rec: string, index: number) => (
                            <Paper
                                key={`ai-rec-${index}`}
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    border: '1px solid #e2e8f0',
                                    borderLeft: '4px solid #4f46e5',
                                    bgcolor: 'white',
                                    display: 'flex',
                                    gap: 2,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: '#cbd5e1',
                                        bgcolor: '#f8fafc',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 999,
                                        bgcolor: alpha('#4f46e5', 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#4f46e5',
                                        flexShrink: 0,
                                        fontWeight: 700
                                    }}
                                >
                                    {index + 1}
                                </Box>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: '#475569', fontSize: '0.925rem', lineHeight: 1.6 }}
                                    >
                                        <MarkdownWrapper content={rec} />
                                    </Typography>
                                </Box>
                            </Paper>
                        ))}

                        {/* Efficiency blueprint (Keep as data-driven but style it) */}
                        {bestZone && !currentProject?.statistics?.aiInsights?.recommendations?.length && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 2,
                                    border: '1px solid #bbf7d0',
                                    borderLeft: '4px solid #16a34a',
                                    bgcolor: 'white',
                                    display: 'flex',
                                    gap: 2,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 999,
                                        bgcolor: '#bbf7d0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#15803d',
                                        flexShrink: 0
                                    }}
                                >
                                    <TrendingUp size={18} />
                                </Box>
                                <Box>
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 700, color: '#15803d', mb: 0.5, fontFamily: 'Outfit', fontSize: '1rem' }}
                                    >
                                        Efficiency blueprint: {bestZone.name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: '#14532d', fontSize: '0.8rem', mb: 0.75 }}
                                    >
                                        With an average delay of{' '}
                                        <strong>{bestZone.avgTime.toFixed(1)} days</strong> and{' '}
                                        <strong>{bestZone.onTime.toFixed(1)}%</strong> on‑time completion,
                                        this zone can be used as a reference playbook for staffing
                                        levels, document verification and escalation patterns.
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        {/* Global documentation footprint (Only show if AI recs are few or it's a major factor) */}
                        {(() => {
                            const docEntry = globalCategoryDistribution.find(
                                c => c.name === 'Documentation & Compliance Issues'
                            );
                            if (!docEntry || docEntry.percentage < 20) return null;

                            return (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 2,
                                        border: '1px solid #e5e7eb',
                                        borderLeft: '4px solid #6b7280',
                                        bgcolor: 'white',
                                        display: 'flex',
                                        gap: 2,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 999,
                                            bgcolor: '#e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#111827',
                                            flexShrink: 0
                                        }}
                                    >
                                        <MapPin size={18} />
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: '#374151', fontSize: '0.8rem' }}
                                        >
                                            Across all zones, {docEntry.percentage}% of analyzed tickets are primarily delayed due to Documentation & Compliance Issues. Introduce standard digital document verification and proactive applicant nudges to reduce this footprint.
                                        </Typography>
                                    </Box>
                                </Paper>
                            );
                        })()}
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

function useZoneAnalytics() {
    const { currentProject } = useProject();
    const [selectedZoneName, setSelectedZoneName] = useState<string | null>(null);

    const {
        zones,
        employeesByZone,
        categoriesByZone,
        globalCategoryDistribution,
        alertZone,
        bestZone
    } = useMemo(() => {
        if (!currentProject || !currentProject.workflowSteps) {
            return {
                zones: [] as ZoneSummary[],
                employeesByZone: {} as Record<string, EmployeeRowData[]>,
                categoriesByZone: {} as Record<string, { name: string; value: number; percentage: number }[]>,
                globalCategoryDistribution: [] as { name: string; value: number; percentage: number }[],
                alertZone: null as ZoneSummary | null,
                bestZone: null as ZoneSummary | null
            };
        }

        const steps = currentProject.workflowSteps;
        const zonePerformance = currentProject.statistics.zonePerformance || [];
        const reports = currentProject.statistics.aiInsights?.forensicReports || {};

        // Map base zone performance by name
        const baseByName: Record<string, { onTime: number; avgTime: number }> = {};
        zonePerformance.forEach(z => {
            baseByName[z.name] = { onTime: z.onTime, avgTime: z.avgTime };
        });

        const ticketsByZone = new Map<string, Set<string>>();
        const workflowStepsByZone = new Map<string, any[]>();
        const employeesByZoneInternal = new Map<string, Map<string, { role: string; tickets: Set<string>; totalDelay: number; docIssues: number }>>();
        const categoriesByZoneInternal = new Map<string, Map<string, number>>();
        const globalCategories: Record<string, number> = {};

        steps.forEach(step => {
            const zoneName = step.zoneId || 'Unknown';
            if (!ticketsByZone.has(zoneName)) {
                ticketsByZone.set(zoneName, new Set());
            }
            ticketsByZone.get(zoneName)!.add(step.ticketId);

            if (!workflowStepsByZone.has(zoneName)) {
                workflowStepsByZone.set(zoneName, []);
            }
            workflowStepsByZone.get(zoneName)!.push(step);

            // Employee aggregation (exclude applicant / citizen actions everywhere)
            const remarksSource = (step.lifetimeRemarksFrom || '').toUpperCase();
            const roleSource = (step.post || '').toUpperCase();
            const nameSource = (step.employeeName || '').toUpperCase();
            const excluded = [
                'APPLICANT',
                'CITIZEN',
                'SYSTEM',
                'NOTIFICATION SENT TO APPLICANT',
                'REPLY FROM APPLICANT'
            ];
            if (excluded.some(e =>
                remarksSource.includes(e) ||
                roleSource.includes(e) ||
                nameSource.includes(e)
            )) {
                return;
            }

            const displayName =
                (step.employeeName && step.employeeName.trim()) ||
                (step.post && step.post.trim()) ||
                'Unknown';

            if (!employeesByZoneInternal.has(zoneName)) {
                employeesByZoneInternal.set(zoneName, new Map());
            }
            const zoneMap = employeesByZoneInternal.get(zoneName)!;
            if (!zoneMap.has(displayName)) {
                zoneMap.set(displayName, {
                    role: step.post || 'Unknown',
                    tickets: new Set(),
                    totalDelay: 0,
                    docIssues: 0
                });
            }
            const emp = zoneMap.get(displayName)!;
            emp.tickets.add(step.ticketId);
            emp.totalDelay += step.totalDaysRested || 0;

            const rep = reports[step.ticketId];
            if (rep?.delayAnalysis?.primaryDelayCategory) {
                const cat = rep.delayAnalysis.primaryDelayCategory as string;
                if (cat === 'Documentation & Compliance Issues') {
                    emp.docIssues += 1;
                }
            }
        });

        // Per-ticket categories per zone
        ticketsByZone.forEach((tickets, zoneName) => {
            tickets.forEach(ticketId => {
                const rep = reports[ticketId];
                if (!rep?.delayAnalysis?.primaryDelayCategory) return;
                const cat = rep.delayAnalysis.primaryDelayCategory as string;

                if (!categoriesByZoneInternal.has(zoneName)) {
                    categoriesByZoneInternal.set(zoneName, new Map());
                }
                const zMap = categoriesByZoneInternal.get(zoneName)!;
                zMap.set(cat, (zMap.get(cat) || 0) + 1);

                globalCategories[cat] = (globalCategories[cat] || 0) + 1;
            });
        });

        const zones: ZoneSummary[] = Array.from(ticketsByZone.entries()).map(([zoneName, tickets]) => {
            const perf = baseByName[zoneName] || { onTime: 0, avgTime: 0 };
            const catMap = categoriesByZoneInternal.get(zoneName) || new Map();
            const totalCatTickets = Array.from(catMap.values()).reduce((a, b) => a + b, 0) || 1;
            const docCount = catMap.get('Documentation & Compliance Issues') || 0;
            const documentationDelayRate = docCount / totalCatTickets;

            // NEW: Calculate Total Delay based on Ticket Lifecycle (DeliveredOn - ApplicationDate)
            let totalLifecycleDelay = 0;
            let ticketsWithValidDates = 0;

            tickets.forEach(ticketId => {
                const ticketSteps = (workflowStepsByZone.get(zoneName) || []).filter(s => s.ticketId === ticketId);
                if (ticketSteps.length === 0) return;

                // Find dates (should be available in any step, but let's be safe)
                const firstStep = ticketSteps[0];
                const appDateStr = firstStep.applicationDate;
                const delDateStr = firstStep.deliveredOn;

                if (appDateStr && delDateStr && appDateStr !== 'NULL' && delDateStr !== 'NULL') {
                    try {
                        const start = new Date(appDateStr);
                        const end = new Date(delDateStr);
                        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                            const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                            if (diff >= 0) {
                                totalLifecycleDelay += diff;
                                ticketsWithValidDates++;
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to parse dates for ticket ${ticketId}`);
                    }
                }
            });

            const avgTotalDelay = ticketsWithValidDates > 0 ? totalLifecycleDelay / ticketsWithValidDates : 0;
            let internalDelay = 0;
            const zoneEmployees = employeesByZoneInternal.get(zoneName);

            if (zoneEmployees) {
                zoneEmployees.forEach((emp: any) => {
                    internalDelay += emp.totalDelay;
                });
            }

            const ticketCount = tickets.size;
            const avgInternalDelay = ticketCount > 0 ? internalDelay / ticketCount : 0;

            return {
                name: zoneName,
                avgTime: perf.avgTime || 0,
                avgTotalDelay,
                onTime: perf.onTime || 0,
                ticketCount,
                internalDelay,
                avgInternalDelay,
                documentationDelayRate
            };
        }).sort((a, b) => a.avgTotalDelay - b.avgTotalDelay);

        // Employees mapped to table rows per zone
        const employeesByZone: Record<string, EmployeeRowData[]> = {};
        employeesByZoneInternal.forEach((empMap, zoneName) => {
            const rows: EmployeeRowData[] = [];
            empMap.forEach((emp, name) => {
                const ticketCount = emp.tickets.size;
                if (ticketCount === 0) return;
                const avgDelay = emp.totalDelay / ticketCount;
                const documentationShare = ticketCount > 0 ? emp.docIssues / ticketCount : 0;
                rows.push({
                    name,
                    role: emp.role,
                    ticketCount,
                    avgDelay,
                    documentationIssues: emp.docIssues,
                    documentationShare
                });
            });
            rows.sort((a, b) => b.documentationShare - a.documentationShare || b.ticketCount - a.ticketCount);
            employeesByZone[zoneName] = rows;
        });

        // Categories per zone in chart-friendly shape
        const categoriesByZone: Record<string, { name: string; value: number; percentage: number }[]> = {};
        categoriesByZoneInternal.forEach((catMap, zoneName) => {
            const total = Array.from(catMap.values()).reduce((a, b) => a + b, 0) || 1;
            categoriesByZone[zoneName] = Array.from(catMap.entries())
                .map(([name, value]) => ({
                    name,
                    value,
                    percentage: Math.round((value / total) * 100)
                }))
                .sort((a, b) => b.value - a.value);
        });

        const globalTotal = Object.values(globalCategories).reduce((a, b) => a + b, 0) || 1;
        const globalCategoryDistribution = Object.entries(globalCategories)
            .map(([name, value]) => ({
                name,
                value,
                percentage: Math.round((value / globalTotal) * 100)
            }))
            .sort((a, b) => b.value - a.value);

        const alertZone =
            zones
                .filter(z => z.avgTime > 7)
                .sort((a, b) => b.documentationDelayRate - a.documentationDelayRate || b.avgTime - a.avgTime)[0] || null;

        const bestZone = zones.length > 0 ? zones[0] : null;

        return {
            zones,
            employeesByZone,
            categoriesByZone,
            globalCategoryDistribution,
            alertZone,
            bestZone
        };
    }, [currentProject]);

    const effectiveSelectedZoneName = selectedZoneName || bestZone?.name || zones[0]?.name || null;

    return {
        zones,
        selectedZoneName: effectiveSelectedZoneName,
        setSelectedZoneName,
        selectedZoneEmployees: effectiveSelectedZoneName ? employeesByZone[effectiveSelectedZoneName] || [] : [],
        selectedZoneCategories: effectiveSelectedZoneName ? categoriesByZone[effectiveSelectedZoneName] || [] : [],
        globalCategoryDistribution,
        alertZone,
        bestZone
    };
}

export default ErrorAnalysisPage;
