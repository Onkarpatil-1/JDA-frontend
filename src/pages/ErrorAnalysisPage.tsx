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
    MenuItem,
    Popover,
    TextField,
    Stack,
    Divider
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Download,
    MapPin,
    AlertTriangle,
    TrendingUp,
    Users,
    ChevronDown,
    Tag,
    Calendar
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
import { parseDateString } from '../utils/dateUtils';

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
    weightedScore: number;
}

interface EmployeeRowData {
    name: string;
    role: string;
    ticketCount: number;
    avgDelay: number;
    documentationIssues: number;
    documentationShare: number;
}

const ZoneTile = ({
    zone,
    isActive,
    onClick
}: {
    zone: ZoneSummary;
    isActive: boolean;
    onClick: () => void;
}) => {
    // Actual JS implementation for interpolation
    const lerpColor = (c1: string, c2: string, weight: number) => {
        const hex = (x: string) => x.replace('#', '');
        const r1 = parseInt(hex(c1).substring(0, 2), 16);
        const g1 = parseInt(hex(c1).substring(2, 4), 16);
        const b1 = parseInt(hex(c1).substring(4, 6), 16);
        const r2 = parseInt(hex(c2).substring(0, 2), 16);
        const g2 = parseInt(hex(c2).substring(2, 4), 16);
        const b2 = parseInt(hex(c2).substring(4, 6), 16);
        const r = Math.round(r1 + (r2 - r1) * weight);
        const g = Math.round(g1 + (g2 - g1) * weight);
        const b = Math.round(b1 + (b2 - b1) * weight);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    const getDynamicColor = (val: number) => {
        // Match legend: Efficient (< 20d), Delayed (60d+)
        if (val <= 20) return '#15803d'; // Success Green (up to 20 days)
        if (val >= 60) return '#991b1b'; // Danger Red (60+ days)
        if (val <= 40) return lerpColor('#15803d', '#d97706', (val - 20) / 20); // 20 -> 40
        return lerpColor('#d97706', '#991b1b', (val - 40) / 20); // 40 -> 60
    };

    // Color intensity based on Performance Score
    const bg = getDynamicColor(zone.weightedScore);

    const fullLabel = zone.name.replace(/zone/i, '').trim() || zone.name;
    const zoneLabel = fullLabel.length > 20 ? fullLabel.substring(0, 20) + '...' : fullLabel;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 1.5,
                borderRadius: 1.5,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: isActive ? '#0f172a' : 'transparent',
                bgcolor: bg,
                color: 'white',
                transform: isActive ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isActive ? '0 10px 15px -3px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 85,
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                    transform: 'translateY(-2px) scale(1.01)',
                    boxShadow: '0 12px 20px -5px rgba(0,0,0,0.1)',
                    '& .hover-overlay': { opacity: 1 }
                }
            }}
        >
            <Box
                className="hover-overlay"
                sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'none'
                }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, position: 'relative', zIndex: 1 }}>
                <Box>
                    <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.65rem' }}>
                        ZONE
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, color: 'white', mt: -0.5, fontFamily: 'Outfit', fontSize: '1.25rem' }}
                    >
                        {zoneLabel}
                    </Typography>
                </Box>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', px: 1, py: 0.5, borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {zone.ticketCount} tkt
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 'auto', position: 'relative', zIndex: 1 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'block', mb: 0 }}>
                        Avg Delay
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', lineHeight: 1 }}>
                        {zone.avgTotalDelay.toFixed(0)} <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>days</Typography>
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', opacity: 0.9 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'block' }}>
                        Bottleneck Intensity Index
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'white' }}>
                        {zone.weightedScore.toFixed(1)}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

const DateRangePicker = ({ onRangeChange }: { onRangeChange: (start: Date | null, end: Date | null) => void }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [label, setLabel] = useState('Last 30 Days');

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handlePreset = (preset: string) => {
        setLabel(preset);
        handleClose();
        // Logical implementation would go here
    };

    const open = Boolean(anchorEl);

    return (
        <Box>
            <Button
                onClick={handleClick}
                startIcon={<Calendar size={18} />}
                endIcon={<ChevronDown size={16} />}
                sx={{
                    bgcolor: 'white',
                    color: '#111827',
                    fontWeight: 600,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    px: 3,
                    py: 1,
                    borderRadius: '999px',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    '&:hover': {
                        bgcolor: '#f8fafc',
                        borderColor: '#cbd5e1',
                    }
                }}
            >
                {label}
            </Button>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        p: 2,
                        width: 320,
                        borderRadius: 3,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 12px 24px -4px rgba(0,0,0,0.1)',
                    }
                }}
            >
                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block' }}>
                    Quick Select
                </Typography>
                <Stack spacing={0.5}>
                    {['Today', 'Last 7 Days', 'Last 30 Days', 'This Month', 'Fiscal Year'].map((preset) => (
                        <MenuItem
                            key={preset}
                            onClick={() => handlePreset(preset)}
                            sx={{
                                borderRadius: 1.5,
                                fontSize: '0.875rem',
                                fontWeight: label === preset ? 700 : 500,
                                color: label === preset ? '#3b82f6' : '#334155',
                                bgcolor: label === preset ? alpha('#3b82f6', 0.05) : 'transparent',
                            }}
                        >
                            {preset}
                        </MenuItem>
                    ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, mb: 1, display: 'block' }}>
                    Custom Range
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                        type="date"
                        size="small"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                    />
                    <Typography sx={{ color: '#94a3b8' }}>→</Typography>
                    <TextField
                        type="date"
                        size="small"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                    />
                </Stack>
                <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    disabled={!startDate || !endDate}
                    onClick={() => {
                        onRangeChange(new Date(startDate), new Date(endDate));
                        setLabel(`${startDate} - ${endDate}`);
                        handleClose();
                    }}
                    sx={{
                        mt: 2,
                        bgcolor: '#0f172a',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#1e293b' }
                    }}
                >
                    Apply Range
                </Button>
            </Popover>
        </Box>
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
        bestZone,
        employeesByZone
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
                    body: JSON.stringify({ aiProvider: 'ollama', zoneName })
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

            const isAll = zoneName === 'ALL';
            const targetZone = isAll ? null : zones.find(z => z.name === zoneName);

            // 1.5 Prepare employee data for the selected context
            let employeesToExport: EmployeeRowData[] = [];
            if (isAll) {
                // Aggregate all employees from all zones, filter unique, and sort
                const allEmpMap = new Map<string, EmployeeRowData>();
                Object.values(employeesByZone).forEach((empList: EmployeeRowData[]) => {
                    empList.forEach((e: EmployeeRowData) => {
                        if (!allEmpMap.has(e.name)) {
                            allEmpMap.set(e.name, { ...e });
                        } else {
                            const existing = allEmpMap.get(e.name)!;
                            // Simple aggregation for multi-zone employees
                            existing.ticketCount += e.ticketCount;
                            existing.avgDelay = (existing.avgDelay + e.avgDelay) / 2; // Rough average
                            existing.documentationIssues += e.documentationIssues;
                            existing.documentationShare = existing.ticketCount > 0 ? existing.documentationIssues / existing.ticketCount : 0;
                        }
                    });
                });
                employeesToExport = Array.from(allEmpMap.values())
                    .sort((a, b) => b.avgDelay - a.avgDelay || b.ticketCount - a.ticketCount);
            } else if (zoneName && employeesByZone[zoneName]) {
                employeesToExport = employeesByZone[zoneName];
            }

            // 2. Generate PDF with outlier data (or without if fetch failed)
            generateZoneReportPDF({
                projectName: currentProject.metadata.name,
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                targetZoneName: isAll ? undefined : zoneName,
                overallStats: {
                    totalTickets: isAll ? currentProject.statistics.totalTickets : (targetZone ? targetZone.ticketCount : 0),
                    avgProcessingTime: isAll ? currentProject.metadata.avgProcessingTime : (targetZone ? targetZone.avgTotalDelay : 0),
                    completionRate: isAll ? currentProject.statistics.completionRate : (targetZone ? targetZone.onTime : 0)
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
                zones: isAll ? zones : zones.filter(z => z.name === zoneName),
                outlierReport,
                employees: employeesToExport
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


                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DateRangePicker onRangeChange={(s, e) => console.log(s, e)} />
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
                                    overflow: 'hidden',
                                    filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.1))',
                                    border: '1px solid #e5e7eb',
                                    minWidth: 260,
                                    maxHeight: 360,
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }
                            }}
                        >
                            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                                <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1 }}>
                                    SELECT A ZONE TO EXPORT
                                </Typography>
                            </Box>
                            <Box sx={{ py: 0.5, maxHeight: 6 * 44, overflowY: 'auto' }}>
                                <MenuItem
                                    onClick={() => handleDownloadReport('ALL')}
                                    sx={{
                                        fontSize: '0.875rem',
                                        py: 1.2,
                                        px: 2,
                                        fontWeight: 700,
                                        color: '#0f172a',
                                        borderBottom: '2px solid #f1f5f9',
                                        bgcolor: alpha('#3b82f6', 0.04),
                                        '&:hover': { bgcolor: alpha('#3b82f6', 0.1) }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Tag size={14} />
                                        All Zones Overview
                                    </Box>
                                </MenuItem>
                                {zones.map(z => (
                                    <MenuItem
                                        key={z.name}
                                        onClick={() => handleDownloadReport(z.name)}
                                        sx={{
                                            fontSize: '0.875rem',
                                            py: 1.2,
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
                            </Box>
                        </Menu>
                    </Box>
                </Box>
            </Box>

            {/* Efficiency Alert + Top Zone Insight Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
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
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700, color: '#b91c1c', mb: 1, display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'Outfit', fontSize: '1rem' }}
                                >
                                    Efficiency Alert
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    <Box>
                                        <Typography variant="overline" sx={{ color: '#b91c1c', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>ZONE</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#7f1d1d' }}>{alertZone.name}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="overline" sx={{ color: '#b91c1c', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>Avg Delay</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#7f1d1d' }}>{alertZone.avgTotalDelay.toFixed(0)} days</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="overline" sx={{ color: '#b91c1c', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>Bottleneck Intensity Index</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#7f1d1d' }}>{alertZone.weightedScore.toFixed(1)}</Typography>
                                    </Box>
                                </Box>

                            </Box>
                        </Paper>
                    )}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    {bestZone && (
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
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700, color: '#15803d', mb: 1, fontFamily: 'Outfit', fontSize: '1rem' }}
                                >
                                    Top Performing Zone
                                </Typography>

                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                    <Box>
                                        <Typography variant="overline" sx={{ color: '#15803d', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>ZONE</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>{bestZone.name}</Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="overline" sx={{ color: '#15803d', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>Avg Delay</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>{bestZone.avgTotalDelay.toFixed(0)} days</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="overline" sx={{ color: '#15803d', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>Bottleneck Intensity Index</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>{bestZone.weightedScore.toFixed(1)}</Typography>
                                    </Box>
                                </Box>

                            </Box>
                        </Paper>
                    )}
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

                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800 }}>Efficient (&lt; 20)</Typography>
                        <Box sx={{
                            width: 120,
                            height: 10,
                            borderRadius: 1,
                            background: 'linear-gradient(to right, #15803d, #d97706, #991b1b)',
                            border: '1px solid #e2e8f0'
                        }} />
                        <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 800 }}>Delayed (60+)</Typography>
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
            </Paper >

            {/* Detailed Analysis for Selected Zone */}
            {
                activeZone && (
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
                                            Sorted by <strong>Average Delay</strong> to highlight potential bottlenecks.
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
                                                    const isDelayHeavy = emp.avgDelay > 10;
                                                    return (
                                                        <TableRow
                                                            key={emp.name}
                                                            sx={{
                                                                transition: 'all 0.15s ease',
                                                                '&:hover': { bgcolor: isDelayHeavy ? '#fef2f2' : '#f8fafc' },
                                                                borderLeft: isDelayHeavy ? '3px solid #dc2626' : '3px solid transparent',
                                                                bgcolor: isDelayHeavy ? '#fefcfc' : 'inherit',
                                                                '& td': { borderBottom: '1px solid #f1f5f9', py: 2 }
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                    <Avatar
                                                                        sx={{
                                                                            width: 36,
                                                                            height: 36,
                                                                            bgcolor: isDelayHeavy
                                                                                ? alpha('#dc2626', 0.1)
                                                                                : '#f8fafc',
                                                                            color: isDelayHeavy ? '#dc2626' : '#334155',
                                                                            border: isDelayHeavy ? '1px solid #fca5a5' : '1px solid #e2e8f0',
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
                )
            }

            {/* Strategic Insights & Recommendations */}
            {
                globalCategoryDistribution.length > 0 && (
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
                                            component="div"
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
                                            sx={{ fontWeight: 700, color: '#15803d', mb: 1, fontFamily: 'Outfit', fontSize: '1rem' }}
                                        >
                                            Top Performing Zone
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                            <Box>
                                                <Typography variant="overline" sx={{ color: '#15803d', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>ZONE</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>{bestZone.name}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="overline" sx={{ color: '#15803d', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>TICKETS</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>{bestZone.ticketCount} tkt</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="overline" sx={{ color: '#15803d', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>Avg Delay</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>{bestZone.avgTotalDelay.toFixed(0)} days</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="overline" sx={{ color: '#15803d', fontWeight: 700, opacity: 0.8, display: 'block', lineHeight: 1 }}>Avg Internal (Employee‑only)</Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>{bestZone.avgInternalDelay.toFixed(1)}d</Typography>
                                            </Box>
                                        </Box>


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
                )
            }
        </Box >
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
        // Per-zone, per-ticket internal delay accumulator (avoids double-counting tickets across employees)
        const ticketInternalDelayByZone = new Map<string, Map<string, number>>();
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

            // Employee aggregation: exclude applicant/system-facing steps so "internal" is employee-only
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
            const isApplicantSide = excluded.some(e =>
                remarksSource.includes(e) ||
                roleSource.includes(e) ||
                nameSource.includes(e)
            );

            if (isApplicantSide) {
                // We still want lifecycle and ticket counts for this step,
                // but do NOT count its delay towards employee/internal metrics.
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

            // Track per-ticket internal delay at zone level (employee-only)
            if (!ticketInternalDelayByZone.has(zoneName)) {
                ticketInternalDelayByZone.set(zoneName, new Map());
            }
            const zoneTicketMap = ticketInternalDelayByZone.get(zoneName)!;
            const prevDelay = zoneTicketMap.get(step.ticketId) || 0;
            const stepDelay = Math.max(0, step.totalDaysRested || 0);
            zoneTicketMap.set(step.ticketId, prevDelay + stepDelay);

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

        // Determine 'Latest Date' in dataset to use as 'Today' for pending tickets
        let latestDate = new Date(0);
        steps.forEach(s => {
            const d = parseDateString(s.deliveredOn) || parseDateString(s.applicationDate);
            if (d && d > latestDate) latestDate = d;
        });
        // If no dates, use actual Today as absolute fallback
        const referenceDate = latestDate.getTime() > 0 ? latestDate : new Date();

        const zones: ZoneSummary[] = Array.from(ticketsByZone.entries()).map(([zoneName, tickets]) => {
            const perf = baseByName[zoneName] || { onTime: 0, avgTime: 0 };
            const catMap = categoriesByZoneInternal.get(zoneName) || new Map();
            const totalCatTickets = Array.from(catMap.values()).reduce((a, b) => a + b, 0) || 1;
            const docCount = catMap.get('Documentation & Compliance Issues') || 0;
            const documentationDelayRate = docCount / totalCatTickets;

            // CORRECTED: Calculate Total Delay including pending tickets
            let totalLifecycleDelay = 0;
            let ticketsWithValidDates = 0;

            tickets.forEach(ticketId => {
                const ticketSteps = (workflowStepsByZone.get(zoneName) || []).filter(s => s.ticketId === ticketId);
                if (ticketSteps.length === 0) return;

                const firstStep = ticketSteps[0];
                const appDateStr = firstStep.applicationDate;
                const delDateStr = firstStep.deliveredOn;

                const appDate = parseDateString(appDateStr);
                const delDate = (delDateStr && delDateStr !== 'NULL') ? parseDateString(delDateStr) : referenceDate;

                if (appDate && delDate) {
                    const diff = Math.floor((delDate.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
                    if (diff >= 0) {
                        totalLifecycleDelay += diff;
                        ticketsWithValidDates++;
                    }
                }
            });

            const avgTotalDelay = ticketsWithValidDates > 0 ? totalLifecycleDelay / ticketsWithValidDates : 0;
            // Internal delay per ticket (sum of step-level resting days, once per ticket)
            let internalDelayValue = 0;
            const zoneTicketInternal = ticketInternalDelayByZone.get(zoneName);
            if (zoneTicketInternal) {
                zoneTicketInternal.forEach(delay => {
                    internalDelayValue += delay;
                });
            }

            const totalTicketCount = tickets.size;
            const avgInternalDelay = totalTicketCount > 0 ? internalDelayValue / totalTicketCount : 0;

            // Calculate Weighted Performance Score: AvgDelay * (1 + 10/TicketCount)
            // Lower score is better. High volume pulls score down towards actual average.
            const weightedScore = avgInternalDelay * (1 + 10 / totalTicketCount);

            return {
                name: zoneName,
                avgTime: perf.avgTime || 0,
                avgTotalDelay,
                onTime: perf.onTime || 0,
                ticketCount: totalTicketCount,
                internalDelay: internalDelayValue,
                avgInternalDelay,
                documentationDelayRate,
                weightedScore
            };
        }).sort((a, b) => a.weightedScore - b.weightedScore || a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

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
            rows.sort((a, b) => b.avgDelay - a.avgDelay || b.ticketCount - a.ticketCount);
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

        // Align summary cards with heatmap ordering:
        // - bestZone: same as first tile in heatmap (lowest avgInternalDelay)
        // - alertZone: same as last tile in heatmap (highest avgInternalDelay)
        const bestZone = zones.length > 0 ? zones[0] : null;
        const alertZone = zones.length > 0 ? zones[zones.length - 1] : null;

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
        bestZone,
        employeesByZone
    };
}

export default ErrorAnalysisPage;
