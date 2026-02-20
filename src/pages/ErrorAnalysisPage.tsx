import { useState, useMemo } from 'react';
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
    IconButton,
    Collapse,
    LinearProgress,
    alpha
} from '@mui/material';
import {
    Download,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Zap
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const KPICard = ({ title, value, subtext, icon, color, trend }: any) => (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', fontSize: '0.7rem' }}>
                    {title}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, mb: 0.5, fontWeight: 800, color: '#1e293b' }}>
                    {value}
                </Typography>
                {subtext && (
                    <Typography variant="caption" sx={{ color: trend === 'down' ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                        {subtext}
                    </Typography>
                )}
            </Box>
            <Box sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(color, 0.1),
                color: color,
                display: 'flex'
            }}>
                {icon}
            </Box>
        </Box>
    </Paper>
);

const DepartmentRow = ({ dept }: { dept: any }) => {
    const [expanded, setExpanded] = useState(false);

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Process & Approval': '#fef3c7',
            'Documentation & Compliance': '#e0e7ff',
            'External Dependencies': '#fee2e2',
            'Communication & Coordination': '#d1fae5',
            'Incomplete Documentation': '#e0e7ff',
            'Process Bottleneck': '#fef3c7',
            'Internal System': '#f1f5f9'
        };
        const textColors: Record<string, string> = {
            'Process & Approval': '#d97706',
            'Documentation & Compliance': '#4f46e5',
            'External Dependencies': '#dc2626',
            'Communication & Coordination': '#059669',
            'Incomplete Documentation': '#4f46e5',
            'Process Bottleneck': '#d97706',
            'Internal System': '#475569'
        };
        return { bg: colors[category] || '#f1f5f9', text: textColors[category] || '#64748b' };
    };

    const style = getCategoryColor(dept.mostFrequentCategory);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => setExpanded(!expanded)}>
                <TableCell sx={{ py: 3, pl: 4 }}>
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>{dept.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{dept.parentService || 'General Processing'}</Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Chip
                        label={dept.mostFrequentCategory}
                        size="small"
                        sx={{
                            height: 24,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: style.bg,
                            color: style.text
                        }}
                    />
                </TableCell>
                <TableCell align="right" sx={{ pr: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {dept.ticketCount}
                        </Typography>
                        <IconButton size="small">
                            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </IconButton>
                    </Box>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 4, bgcolor: '#f8fafc', borderRadius: 4, m: 2, border: '1px solid #e2e8f0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>
                                    CATEGORY DISTRIBUTION
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                    Data synced from AI Forensic Reports
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {dept.categories.map((cat: any, idx: number) => (
                                    <Box key={idx}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                                                {cat.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                                {cat.count} tickets ({cat.percentage}%)
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={cat.percentage}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: '#e2e8f0',
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: cat.color,
                                                    borderRadius: 4
                                                }
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

// Need to add this icon component as Lucide LayoutGrid is actually LayoutGrid in some versions but Layout in others
const LayoutGridIcon = ({ size, color }: any) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

const ErrorAnalysisPage = () => {
    const { currentProject } = useProject();

    const { departmentData, topFailingDept, topCategory, totalReports } = useMemo(() => {
        if (!currentProject || !currentProject.workflowSteps) {
            return { departmentData: [], topFailingDept: 'N/A', topCategory: 'N/A', totalReports: 0 };
        }

        const reports = currentProject.statistics.aiInsights?.forensicReports || {};
        const depts: Record<string, {
            name: string;
            parentService: string;
            ticketIds: Set<string>;
            categories: Record<string, number>;
            forcefulDelayCount: number;
        }> = {};
        const globalCategoryCount: Record<string, number> = {};
        const globalTicketIds = new Set<string>();
        let deptWithMostForceful = { name: 'N/A', count: 0 };

        // 1. Group unique tickets by department
        currentProject.workflowSteps.forEach(step => {
            const deptName = step.departmentName || 'Unknown';
            if (!depts[deptName]) {
                depts[deptName] = {
                    name: deptName,
                    parentService: step.parentServiceName || 'General Processing',
                    ticketIds: new Set(),
                    categories: {},
                    forcefulDelayCount: 0
                };
            }
            depts[deptName].ticketIds.add(step.ticketId);
            globalTicketIds.add(step.ticketId);
        });

        // 2. Aggregate AI data for each unique ticket in each department
        Object.values(depts).forEach(dept => {
            dept.ticketIds.forEach(ticketId => {
                const report = reports[ticketId];
                if (report && report.delayAnalysis) {
                    const category = report.delayAnalysis.primaryDelayCategory || 'Uncategorized';
                    dept.categories[category] = (dept.categories[category] || 0) + 1;

                    if (report.delayAnalysis.forcefulDelays?.length > 0) {
                        dept.forcefulDelayCount += report.delayAnalysis.forcefulDelays.length;
                    }
                }
            });

            if (dept.forcefulDelayCount > deptWithMostForceful.count) {
                deptWithMostForceful = { name: dept.name, count: dept.forcefulDelayCount };
            }
        });

        // Calculate global category count correctly (once per unique ticket)
        globalTicketIds.forEach(ticketId => {
            const report = reports[ticketId];
            if (report && report.delayAnalysis) {
                const category = report.delayAnalysis.primaryDelayCategory || 'Uncategorized';
                globalCategoryCount[category] = (globalCategoryCount[category] || 0) + 1;
            }
        });

        // Format for UI
        const formattedData = Object.values(depts).map(d => {
            const sortedCats = Object.entries(d.categories)
                .map(([name, count]) => ({
                    name,
                    count: count as number,
                    percentage: Math.round(((count as number) / (d.ticketIds.size || 1)) * 100),
                    color: name.includes('Documentation') ? '#6366f1' :
                        name.includes('Process') ? '#f59e0b' :
                            name.includes('External') ? '#ef4444' :
                                name.includes('Communication') ? '#10b981' : '#94a3b8'
                }))
                .sort((a, b) => b.count - a.count);

            return {
                name: d.name,
                parentService: d.parentService,
                ticketCount: d.ticketIds.size,
                mostFrequentCategory: sortedCats[0]?.name || 'Analysis Pending',
                categories: sortedCats
            };
        }).sort((a, b) => b.ticketCount - a.ticketCount);

        const bestCategory = Object.entries(globalCategoryCount)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            departmentData: formattedData,
            topFailingDept: deptWithMostForceful.name,
            topCategory: bestCategory ? bestCategory[0] : 'N/A',
            totalReports: Object.keys(reports).length
        };
    }, [currentProject]);

    if (!currentProject) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Please select a project to view error analysis.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 8 }}>
            {/* Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
                <Box>
                    <Typography variant="h4" sx={{
                        fontFamily: 'Outfit',
                        fontWeight: 800,
                        color: '#0f172a',
                        mb: 1
                    }}>
                        Departmental Error Analysis Dashboard
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 700 }}>
                        Real-time processing error insights aggregated from {totalReports} AI forensic reports.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Download size={18} />}
                    sx={{
                        bgcolor: 'white',
                        color: '#0f172a',
                        fontWeight: 700,
                        border: '1px solid #e2e8f0',
                        boxShadow: 'none',
                        px: 3,
                        py: 1.5,
                        borderRadius: 3,
                        '&:hover': {
                            bgcolor: '#f8fafc',
                            borderColor: '#cbd5e1',
                            boxShadow: 'none'
                        }
                    }}
                >
                    Export Report
                </Button>
            </Box>

            {/* Top KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <KPICard
                        title="DEPT WITH MOST FORCEFUL DELAYS"
                        value={topFailingDept}
                        subtext="Identified via AI Forensic Analysis"
                        trend="down"
                        icon={<AlertCircle size={24} />}
                        color="#ef4444"
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <KPICard
                        title="MOST COMMON ERROR CATEGORY"
                        value={topCategory}
                        subtext={`Aggregated across ${totalReports} analyzed tickets`}
                        icon={<Zap size={24} />}
                        color="#6366f1"
                    />
                </Grid>
            </Grid>

            {/* Performance Table Section */}
            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: 'white' }}>
                <Box sx={{ p: 3, px: 4, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #f1f5f9' }}>
                    <LayoutGridIcon size={20} color="#94a3b8" />
                    <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>
                        DEPARTMENT PERFORMANCE DISTRIBUTION
                    </Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ pl: 4, fontWeight: 800, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>DEPARTMENT NAME</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>MOST FREQUENT CATEGORY</TableCell>
                                <TableCell align="right" sx={{ pr: 4, fontWeight: 800, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>TICKET COUNT</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {departmentData.length > 0 ? (
                                departmentData.map((dept: any, idx: number) => (
                                    <DepartmentRow key={idx} dept={dept} />
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} sx={{ py: 8, textAlign: 'center', color: '#64748b' }}>
                                        No departmental data found. Run AI analysis to populate this view.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ErrorAnalysisPage;
