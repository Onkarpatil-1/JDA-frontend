import React, { useMemo } from 'react';
import { Box, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Collapse, Chip, IconButton } from '@mui/material';
import { Layers, Building2, FileText, Activity, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import type { JDAIntelligence } from '../types';

const DataDistributionDashboard: React.FC = () => {
    const { currentProject } = useProject();

    // -------------------------------------------------------------------------
    // DATA AGGREGATION
    // -------------------------------------------------------------------------
    const analyticsData = useMemo(() => {
        if (!currentProject?.statistics?.jdaHierarchy || !currentProject.workflowSteps) return null;

        const hierarchy = currentProject.statistics.jdaHierarchy as JDAIntelligence;
        const departments = hierarchy.departments || [];

        // 0. Pre-calculate Ticket Dates (App Date & Delivered On)
        const ticketDateMap = new Map<string, { appDate: Date | null, deliveredDate: Date | null, status: string }>();

        currentProject.workflowSteps.forEach(step => {
            if (!ticketDateMap.has(step.ticketId)) {
                // Parse dates. Assuming format could be MM/DD/YYYY or YYYY-MM-DD
                const parseDate = (dateStr: string) => {
                    if (!dateStr) return null;
                    const d = new Date(dateStr);
                    return isNaN(d.getTime()) ? null : d;
                };

                const appDate = parseDate(step.applicationDate);
                const deliveredDate = parseDate(step.deliveredOn);

                ticketDateMap.set(step.ticketId, {
                    appDate,
                    deliveredDate,
                    status: deliveredDate ? 'Closed' : 'Open'
                });
            }
        });

        // 1. Department Volume
        const deptVolume = departments.map(d => {
            const uniqueTickets = new Set<string>();
            d.parentServices.forEach(ps => {
                ps.services.forEach(s => {
                    s.tickets.forEach(t => uniqueTickets.add(t.ticketId));
                });
            });
            return { name: d.name, count: uniqueTickets.size };
        }).sort((a, b) => b.count - a.count);

        // 2. Parent Services Volume
        const parentServiceMap = new Map<string, Set<string>>();
        // 3. Service Types Volume
        const serviceTypeMap = new Map<string, Set<string>>();

        // Global Set for Total Unique Tickets
        const globalUniqueTickets = new Set<string>();

        // 4. Detailed Performance Metrics per Department
        const deptPerformance = departments.map(d => {
            const deptTickets = new Set<string>(); // For total count
            const ticketDurationMap = new Map<string, number>(); // ticketId -> duration in days
            const ticketsList: any[] = [];

            d.parentServices.forEach(ps => {
                const psName = ps.name;
                if (!parentServiceMap.has(psName)) parentServiceMap.set(psName, new Set());

                ps.services.forEach(s => {
                    const sName = s.name;
                    if (!serviceTypeMap.has(sName)) serviceTypeMap.set(sName, new Set());

                    s.tickets.forEach(ticket => {
                        const tId = ticket.ticketId;
                        deptTickets.add(tId);
                        globalUniqueTickets.add(tId);
                        parentServiceMap.get(psName)?.add(tId);
                        serviceTypeMap.get(sName)?.add(tId);

                        // Calculate Date Span for "Days to Close" (Simple delivered - application span)
                        const dates = ticketDateMap.get(tId);
                        let duration = 0;
                        if (dates?.appDate && dates?.deliveredDate) {
                            const diffTime = Math.abs(dates.deliveredDate.getTime() - dates.appDate.getTime());
                            duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        }

                        // Avoid duplicates in the statistical map
                        if (!ticketDurationMap.has(tId)) {
                            ticketDurationMap.set(tId, duration);
                        }

                        // Build the list for the expanded table
                        ticketsList.push({
                            ticketId: tId,
                            parentName: psName,
                            serviceName: sName,
                            daysRested: duration,
                            status: dates?.status || 'Open'
                        });
                    });
                });
            });

            // Recalculate averages based on UNIQUE tickets
            const uniqueTicketCount = deptTickets.size;
            let sumDuration = 0;
            ticketDurationMap.forEach((days) => sumDuration += days);

            // Deduplicate the display list (only show one entry per unique ticket)
            const uniqueTicketsListMap = new Map<string, any>();
            ticketsList.forEach(item => {
                if (!uniqueTicketsListMap.has(item.ticketId)) {
                    uniqueTicketsListMap.set(item.ticketId, item);
                }
            });

            return {
                name: d.name,
                totalTickets: uniqueTicketCount,
                avgProcessingTime: uniqueTicketCount > 0 ? Math.round(sumDuration / uniqueTicketCount) : 0,
                servicesList: Array.from(uniqueTicketsListMap.values()).sort((a, b) => b.daysRested - a.daysRested)
            };
        }).sort((a, b) => b.totalTickets - a.totalTickets);

        // Convert Maps to Arrays and Sort for the summary widgets
        const parentServices = Array.from(parentServiceMap.entries())
            .map(([name, set]) => ({ name, count: set.size }))
            .sort((a, b) => b.count - a.count);

        const serviceTypes = Array.from(serviceTypeMap.entries())
            .map(([name, set]) => ({ name, count: set.size }))
            .sort((a, b) => b.count - a.count);

        return {
            deptVolume,
            parentServices,
            serviceTypes,
            deptPerformance,
            totalUniqueTickets: globalUniqueTickets.size
        };
    }, [currentProject]);

    if (!analyticsData) return <Box sx={{ p: 3 }}>No Data Available</Box>;


    return (
        <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', p: { xs: 2, md: 4 } }}>
            {/* 1. Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 5 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Admin {'>'} Performance Dashboard
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        Data Distribution and Performance Dashboard
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 700 }}>
                        Analyzing application processing efficiency and ticket distribution across Jaipur Development Authority departments.
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{
                    p: 2, px: 3,
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                }}>
                    <Box sx={{
                        width: 48, height: 48,
                        borderRadius: 2.5,
                        bgcolor: '#6366f1',
                        color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Activity size={24} />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                            TOTAL UNIQUE TICKETS
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                            {analyticsData.totalUniqueTickets.toLocaleString()}
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            {/* 2. Three Widget Columns */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryWidget
                        title="DEPARTMENT NAME"
                        icon={<Building2 size={18} />}
                        data={analyticsData.deptVolume}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryWidget
                        title="PARENT SERVICES NAME"
                        icon={<Layers size={18} />}
                        data={analyticsData.parentServices}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <SummaryWidget
                        title="SERVICE NAME"
                        icon={<FileText size={18} />}
                        data={analyticsData.serviceTypes}
                    />
                </Grid>
            </Grid>

            {/* 3. Department Performance Analysis Table */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: '#6366f1', color: 'white', display: 'flex' }}>
                    <Activity size={16} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Department Performance Analysis
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2 }}>
                                    Department Name
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2 }}>
                                    Total Unique Tickets
                                </TableCell>
                                <TableCell align="right" sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', py: 2 }}>
                                    Avg. Processing Time (Days)
                                </TableCell>
                                <TableCell sx={{ width: 50 }} />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {analyticsData.deptPerformance.map((dept, index) => (
                                <ExpandableDeptRow key={index} dept={dept} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Displaying performance data for {analyticsData.deptPerformance.length} departments & zones
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

// -------------------------------------------------------------------------
// EXTRACTED SUB-COMPONENTS
// -------------------------------------------------------------------------

const SummaryWidget = ({ title, icon, data }: { title: string, icon: React.ReactNode, data: { name: string, count: number }[] }) => {
    const [page, setPage] = React.useState(0);
    const rowsPerPage = 5;
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    const paginatedData = data.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const handlePrev = () => setPage(p => Math.max(0, p - 1));
    const handleNext = () => setPage(p => Math.min(totalPages - 1, p + 1));

    return (
        <Paper elevation={0} sx={{
            p: 2.5,
            height: '100%',
            borderRadius: 4,
            border: '1px solid #e2e8f0',
            bgcolor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            '&:hover': {
                boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                borderColor: '#cbd5e1'
            }
        }}>
            {/* Widget Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: '#f1f5f9',
                        color: '#475569',
                        display: 'flex'
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="subtitle2" sx={{
                        fontWeight: 800,
                        color: '#475569',
                        fontSize: '0.75rem',
                        letterSpacing: '0.02em'
                    }}>
                        {title}
                    </Typography>
                </Box>
                <Chip
                    label={`${data.length} Total`}
                    size="small"
                    sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '6px'
                    }}
                />
            </Box>

            {/* List with Integrated Bars */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                flex: 1,
                minHeight: 280
            }}>
                {paginatedData.map((item, index) => (
                    <Box key={index} sx={{ position: 'relative', px: 1.5, py: 1.25, borderRadius: 2, bgcolor: '#f8fafc', overflow: 'hidden' }}>
                        {/* Background Progress Layer */}
                        <Box sx={{
                            position: 'absolute',
                            left: 0, top: 0, bottom: 0,
                            width: `${(item.count / maxVal) * 100}%`,
                            bgcolor: (page * rowsPerPage + index) < 3 ? '#e0e7ff' : '#f1f5f9', // Indigo tint for top items
                            zIndex: 1,
                            transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                        }} />

                        {/* Content Layer */}
                        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{
                                color: '#1e293b',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                lineHeight: 1.4,
                                pr: 2,
                                flexGrow: 1
                            }}>
                                {item.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>
                                    {item.count.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.6rem', mt: -0.2 }}>
                                    Tickets
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                ))}
                {data.length === 0 && (
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4, opacity: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            No Records Found
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Pagination Controls */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem' }}>
                    PAGE {page + 1} OF {totalPages || 1}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={handlePrev}
                        disabled={page === 0}
                        sx={{
                            borderRadius: '8px',
                            bgcolor: page === 0 ? 'transparent' : '#f8fafc',
                            '&:hover': { bgcolor: '#eff6ff', color: '#3b82f6' }
                        }}
                    >
                        <ChevronLeft size={14} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={handleNext}
                        disabled={page >= totalPages - 1}
                        sx={{
                            borderRadius: '8px',
                            bgcolor: page >= totalPages - 1 ? 'transparent' : '#f8fafc',
                            '&:hover': { bgcolor: '#eff6ff', color: '#3b82f6' }
                        }}
                    >
                        <ChevronRight size={14} />
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
};


// Extracted Row Component for Expansion Logic
const ExpandableDeptRow = ({ dept }: { dept: any }) => {
    const [open, setOpen] = React.useState(false);

    return (
        <React.Fragment>
            <TableRow
                sx={{
                    '&:hover': { bgcolor: '#f8fafc' },
                    transition: 'all 0.1s',
                    cursor: 'pointer',
                    bgcolor: open ? '#f8fafc' : 'inherit'
                }}
                onClick={() => setOpen(!open)}
            >
                <TableCell component="th" scope="row" sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#f1f5f9', color: '#64748b' }}>
                            <Building2 size={16} />
                        </Avatar>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {dept.name}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell align="center" sx={{ py: 2.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {dept.totalTickets.toLocaleString()}
                    </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: dept.avgProcessingTime > 15 ? '#ef4444' : '#0f172a' }}>
                            {Math.round(dept.avgProcessingTime)} Days
                        </Typography>
                        {dept.avgProcessingTime > 15 && <Activity size={14} color="#ef4444" />}
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <ChevronDown size={16} color="#cbd5e1" />
                    </Box>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, ml: 8 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                                Service Breakdown
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '0.7rem', color: '#64748b' }}>TICKET ID</TableCell>
                                        <TableCell sx={{ fontSize: '0.7rem', color: '#64748b' }}>PARENT SERVICE</TableCell>
                                        <TableCell sx={{ fontSize: '0.7rem', color: '#64748b' }}>SERVICE NAME</TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.7rem', color: '#64748b' }}>DAYS TO CLOSE</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dept.servicesList.map((svc: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ color: '#6366f1', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 500 }}>
                                                #{svc.ticketId || 'N/A'}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', color: '#334155' }}>
                                                {svc.parentName}
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.75rem', color: '#334155' }}>
                                                {svc.serviceName}
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                <span style={{
                                                    color: svc.daysRested > 7 ? '#ef4444' : '#16a34a',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    backgroundColor: svc.daysRested > 7 ? '#fef2f2' : '#f0fdf4'
                                                }}>
                                                    {svc.daysRested} Days
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {dept.servicesList.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 2, color: '#94a3b8', fontSize: '0.8rem' }}>
                                                No service data available
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {/* Removed "View all" link since we are showing all */}
                            <Box sx={{ mt: 1, textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                                    Total: {dept.servicesList.length} tickets
                                </Typography>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

export default DataDistributionDashboard;
