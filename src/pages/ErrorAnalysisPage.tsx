import { useMemo, useState, useEffect } from 'react';
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
    LinearProgress,
    Pagination,
    alpha
} from '@mui/material';
import {
    Download,
    MapPin,
    AlertTriangle,
    TrendingUp,
    Users
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip
} from 'recharts';
import { useProject } from '../context/ProjectContext';

const CATEGORY_COLORS: Record<string, string> = {
    'Documentation & Compliance Issues': '#6366f1',
    'Process & Approval Bottlenecks': '#f59e0b',
    'Communication & Coordination Gaps': '#10b981',
    'External Dependencies & Third-Party Delays': '#ef4444',
    'Internal System & Employee Issues': '#3b82f6',
    Uncategorized: '#94a3b8'
};

interface ZoneSummary {
    name: string;
    avgTime: number;
    onTime: number;
    ticketCount: number;
    efficiencyScore: number;
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
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            bgcolor: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 2
        }}
    >
        <Box
            sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(accent, 0.1),
                color: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {title}
            </Typography>
            <Typography variant="h6" sx={{ color: '#0f172a', fontWeight: 800, mt: 0.5 }}>
                {value}
            </Typography>
            {subtext && (
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
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
        if (avgTime <= 3) return '#22c55e';
        if (avgTime <= 7) return '#facc15';
        return '#ef4444';
    };

    const bg = getColor(zone.avgTime);
    const zoneLabel = zone.name.replace(/zone/i, '').trim() || zone.name;

    return (
        <Paper
            elevation={0}
            onClick={onClick}
            sx={{
                p: 2.5,
                borderRadius: 3,
                cursor: 'pointer',
                border: isActive ? `2px solid ${bg}` : '1px solid #e2e8f0',
                bgcolor: isActive ? alpha(bg, 0.08) : 'white',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
                    transform: 'translateY(-2px)'
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#9ca3af', fontWeight: 700, letterSpacing: '0.12em' }}>
                        ZONE
                    </Typography>
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, color: '#0f172a', mt: 0.25, lineHeight: 1 }}
                    >
                        {zoneLabel}
                    </Typography>
                </Box>
                <Chip
                    size="small"
                    label={`${zone.ticketCount} tickets`}
                    sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        borderRadius: '999px',
                        bgcolor: '#0f172a',
                        color: 'white'
                    }}
                />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        Avg Delay
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {zone.avgTime.toFixed(1)} days
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                        On-time %
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {zone.onTime.toFixed(1)}%
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, ml: 2 }}>
                    <LinearProgress
                        variant="determinate"
                        value={zone.efficiencyScore}
                        sx={{
                            height: 6,
                            borderRadius: 999,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 999,
                                bgcolor: bg
                            }
                        }}
                    />
                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.65rem', mt: 0.5, display: 'block', textAlign: 'right' }}>
                        Efficiency {zone.efficiencyScore.toFixed(0)} / 100
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

const ErrorAnalysisPage = () => {
    const { currentProject } = useProject();
    const [page, setPage] = useState(1);
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
                    Download Zone Report
                </Button>
            </Box>

            {/* Alert + Top Zone */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <KPICard
                        title="Efficiency Alert"
                        value={alertZone ? `${alertZone.name} (Avg ${alertZone.avgTime.toFixed(1)} days)` : 'No critical zone'}
                        subtext={
                            alertZone
                                ? `${(alertZone.documentationDelayRate * 100).toFixed(0)}% of its delay is due to Documentation & Compliance`
                                : 'No documentation-heavy delays detected'
                        }
                        accent="#ef4444"
                        icon={<AlertTriangle size={20} />}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <KPICard
                        title="Top Performing Zone"
                        value={bestZone ? `${bestZone.name} (Avg ${bestZone.avgTime.toFixed(1)} days)` : 'Awaiting data'}
                        subtext={
                            bestZone
                                ? `${bestZone.onTime.toFixed(1)}% on-time completion with balanced documentation handling`
                                : 'Upload and analyze data to view insights'
                        }
                        accent="#22c55e"
                        icon={<TrendingUp size={20} />}
                    />
                </Grid>
            </Grid>

            {/* Zone Heatmap */}
            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    bgcolor: 'white',
                    p: 3
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Zone Efficiency Heatmap
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                            Each tile represents one zone. Color intensity reflects average processing delay.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 14, height: 8, borderRadius: 999, bgcolor: '#22c55e' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                Efficient (&lt;= 3 days)
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 14, height: 8, borderRadius: 999, bgcolor: '#facc15' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                Moderate (3–7 days)
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 14, height: 8, borderRadius: 999, bgcolor: '#ef4444' }} />
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
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
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                bgcolor: 'white',
                                height: '100%'
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
                                                    borderRadius: 12,
                                                    border: '1px solid #e5e7eb',
                                                    boxShadow: '0 10px 25px rgba(15,23,42,0.12)'
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
                                borderRadius: 4,
                                border: '1px solid #e2e8f0',
                                bgcolor: 'white'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                        Employee Workload &amp; Delay Analysis
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b' }}>
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
                                        bgcolor: '#0f172a',
                                        color: 'white',
                                        '& .MuiChip-icon': {
                                            color: 'white'
                                        }
                                    }}
                                />
                            </Box>

                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f9fafb' }}>
                                            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280' }}>
                                                EMPLOYEE
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280' }}>
                                                ROLE
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280' }}
                                            >
                                                TICKETS
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280' }}
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
                                                            '&:hover': { bgcolor: '#f9fafb' },
                                                            bgcolor: isDocHeavy ? '#fef2f2' : 'inherit'
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar
                                                                    sx={{
                                                                        width: 28,
                                                                        height: 28,
                                                                        bgcolor: isDocHeavy
                                                                            ? alpha('#ef4444', 0.1)
                                                                            : '#0f172a',
                                                                        color: isDocHeavy ? '#ef4444' : 'white',
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: 700
                                                                    }}
                                                                >
                                                                    {emp.name.charAt(0).toUpperCase()}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontWeight: 700,
                                                                            color: '#0f172a',
                                                                            maxWidth: 180,
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
                                                                                fontSize: '0.65rem'
                                                                            }}
                                                                        >
                                                                            High documentation-driven delay
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ fontSize: '0.75rem', color: '#4b5563' }}>
                                                            {emp.role}
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ fontSize: '0.8rem' }}>
                                                            {emp.ticketCount}
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"
                                                            sx={{
                                                                fontSize: '0.8rem',
                                                                fontWeight: emp.avgDelay > 10 ? 700 : 500,
                                                                color: emp.avgDelay > 10 ? '#b91c1c' : '#111827'
                                                            }}
                                                        >
                                                            {emp.avgDelay.toFixed(1)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#9ca3af' }}>
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
                        borderRadius: 4,
                        border: '1px solid #e2e8f0',
                        bgcolor: 'white',
                        p: 3.5
                    }}
                >
                    <Box sx={{ mb: 2.5 }}>
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.16em',
                                color: '#9ca3af'
                            }}
                        >
                            Strategic Insights &amp; Recommendations
                        </Typography>
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 800, color: '#0f172a', mt: 0.75 }}
                        >
                            Consolidated Action Matrix
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Critical documentation hotspot */}
                        {alertZone && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1px solid #fee2e2',
                                    bgcolor: '#fef2f2',
                                    display: 'flex',
                                    gap: 2
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
                                        sx={{ fontWeight: 800, color: '#b91c1c', mb: 0.5 }}
                                    >
                                        Critical performance gap: {alertZone.name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: '#7f1d1d', fontSize: '0.8rem', mb: 0.75 }}
                                    >
                                        This zone shows elevated average delay of{' '}
                                        <strong>{alertZone.avgTime.toFixed(1)} days</strong>, with a
                                        high concentration of documentation‑related bottlenecks. Tighten
                                        document checklist communication and approval SLAs for this zone.
                                    </Typography>
                                </Box>
                            </Paper>
                        )}

                        {/* Efficiency blueprint */}
                        {bestZone && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: '1px solid #bbf7d0',
                                    bgcolor: '#f0fdf4',
                                    display: 'flex',
                                    gap: 2
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
                                        sx={{ fontWeight: 800, color: '#15803d', mb: 0.5 }}
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

                        {/* Global documentation footprint */}
                        {(() => {
                            const docEntry = globalCategoryDistribution.find(
                                c => c.name === 'Documentation & Compliance Issues'
                            );
                            return (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: 3,
                                        border: '1px solid #e5e7eb',
                                        bgcolor: '#f9fafb',
                                        display: 'flex',
                                        gap: 2
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
                                            variant="subtitle2"
                                            sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}
                                        >
                                            System‑wide documentation impact
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: '#374151', fontSize: '0.8rem' }}
                                        >
                                            {docEntry
                                                ? `Across all zones, ${docEntry.percentage}% of analyzed tickets are primarily delayed due to Documentation & Compliance Issues. Introduce standard digital document verification and proactive applicant nudges to reduce this footprint.`
                                                : 'Documentation & Compliance Issues are not a dominant primary delay driver in the current dataset. Focus improvement efforts on process, communication or external dependency gaps instead.'}
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
        const employeesByZoneInternal = new Map<string, Map<string, { role: string; tickets: Set<string>; totalDelay: number; docIssues: number }>>();
        const categoriesByZoneInternal = new Map<string, Map<string, number>>();
        const globalCategories: Record<string, number> = {};

        steps.forEach(step => {
            const zoneName = step.zoneId || 'Unknown';
            if (!ticketsByZone.has(zoneName)) {
                ticketsByZone.set(zoneName, new Set());
            }
            ticketsByZone.get(zoneName)!.add(step.ticketId);

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

            const avgTime = perf.avgTime || 0;
            const onTime = perf.onTime || 0;
            const efficiencyScore = Math.max(0, Math.min(100, onTime - Math.min(avgTime * 2, 40) + 40));

            return {
                name: zoneName,
                avgTime,
                onTime,
                ticketCount: tickets.size,
                efficiencyScore,
                documentationDelayRate
            };
        }).sort((a, b) => a.avgTime - b.avgTime);

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
