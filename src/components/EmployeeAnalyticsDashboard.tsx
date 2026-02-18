import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography, Collapse, Pagination, LinearProgress } from '@mui/material';
import { Search, ChevronDown, ChevronRight, User } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import type { JDAIntelligence } from '../types';

interface EmployeeStats {
    name: string;
    role: string;
    totalTickets: number;
    totalDelay: number;
    avgDelay: number;
    uniqueTicketCount: number; // New field
    tickets: any[];
}

const EmployeeAnalyticsDashboard: React.FC = () => {
    const { currentProject } = useProject();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const rowsPerPage = 10;

    // -------------------------------------------------------------------------
    // DATA AGGREGATION
    // -------------------------------------------------------------------------
    const employeeStats = useMemo(() => {
        if (!currentProject?.statistics?.jdaHierarchy) return [];

        const hierarchy = currentProject.statistics.jdaHierarchy as JDAIntelligence;
        const statsMap = new Map<string, EmployeeStats>();

        hierarchy.departments.forEach(dept => {
            dept.parentServices.forEach(ps => {
                ps.services.forEach(svc => {
                    svc.tickets.forEach(ticket => {
                        // Use stepOwnerName as the identifier (Actual Name)
                        // Fallback to role if name is missing (unlikely with new logic)
                        const employeeName = ticket.stepOwnerName || ticket.stepOwnerRole || "Unknown Officer";
                        const employeeRole = ticket.stepOwnerRole || "Officer";

                        // Skip if it's the applicant or system
                        if (['APPLICANT', 'CITIZEN', 'SYSTEM'].includes(employeeName.toUpperCase()) ||
                            ['APPLICANT', 'CITIZEN'].includes(employeeRole.toUpperCase())) return;

                        if (!statsMap.has(employeeName)) {
                            statsMap.set(employeeName, {
                                name: employeeName,
                                role: employeeRole,
                                totalTickets: 0,
                                totalDelay: 0,
                                avgDelay: 0,
                                uniqueTicketCount: 0,
                                tickets: []
                            });
                        }

                        const stats = statsMap.get(employeeName)!;
                        stats.totalTickets++; // Keep tracking total tasks/actions
                        stats.totalDelay += (ticket.daysRested || 0);

                        // Check if ticket is already in the list for this employee (Deduplicate)
                        const existingTicketIndex = stats.tickets.findIndex(t => t.ticketId === ticket.ticketId);

                        if (existingTicketIndex === -1) {
                            stats.tickets.push({
                                ...ticket,
                                serviceName: svc.name,
                                maxDelay: ticket.daysRested || 0
                            });
                        } else {
                            // If exists, update with max delay if current is higher
                            const existing = stats.tickets[existingTicketIndex];
                            if ((ticket.daysRested || 0) > existing.maxDelay) {
                                stats.tickets[existingTicketIndex] = {
                                    ...ticket,
                                    serviceName: svc.name,
                                    maxDelay: ticket.daysRested || 0
                                };
                            }
                        }
                    });
                });
            });
        });

        // Calculate Averages and Sort
        return Array.from(statsMap.values())
            .map(stat => ({
                ...stat,
                uniqueTicketCount: stat.tickets.length, // Valid unique count
                avgDelay: Math.round(parseFloat((stat.totalDelay / stat.totalTickets).toFixed(1)))
            }))
            .sort((a, b) => b.uniqueTicketCount - a.uniqueTicketCount); // Sort by unique volume

    }, [currentProject]);

    // Filtering & Pagination
    const filteredStats = useMemo(() => {
        return employeeStats.filter(e =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [employeeStats, searchQuery]);

    const totalPages = Math.ceil(filteredStats.length / rowsPerPage);
    const displayedEmployees = filteredStats.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    if (!currentProject) return <Box>Loading...</Box>;

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', p: { xs: 2, md: 4 } }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Admin {'>'} Employee Performance Analytics
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', mt: 1 }}>
                        Employee Performance Analytics
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            width: 300
                        }}
                    >
                        <Search size={18} color="#94a3b8" />
                        <input
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: '#475569', width: '100%' }}
                            placeholder="Search employees..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </Paper>
                    <Box sx={{ padding: '8px 16px', bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ p: 0.5, bgcolor: '#eff6ff', borderRadius: 1 }}><User size={16} color="#3b82f6" /></Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">TOTAL EMPLOYEES</Typography>
                                <Typography variant="subtitle2" fontWeight={700}>{employeeStats.length}</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* List Header */}
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '80px 2fr 1fr 1fr 50px', p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>INITIALS</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>EMPLOYEE NAME / ROLE</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>UNIQUE TICKETS</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8' }}>AVG. DAYS RESTED</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textAlign: 'right' }}>DETAILS</Typography>
                </Box>

                {displayedEmployees.map((emp, idx) => (
                    <EmployeeRow key={idx} employee={emp} />
                ))}

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0' }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                    />
                </Box>
            </Paper>

        </Box>
    );
};

const EmployeeRow = ({ employee }: { employee: EmployeeStats }) => {
    const [open, setOpen] = useState(false);

    // Sort tickets by delay for the detail view
    const sortedTickets = [...employee.tickets].sort((a, b) => (b.daysRested || 0) - (a.daysRested || 0));

    return (
        <React.Fragment>
            <Box
                onClick={() => setOpen(!open)}
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '80px 2fr 1fr 1fr 50px',
                    p: 2,
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    bgcolor: open ? '#f8fafc' : 'white',
                    '&:hover': { bgcolor: '#f8fafc' },
                    alignItems: 'center',
                    transition: 'all 0.1s'
                }}
            >
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.8rem' }}>
                    {employee.name.substring(0, 2).toUpperCase()}
                </Box>
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>{employee.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.8rem' }}>{employee.role}</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569' }}>
                    {employee.uniqueTicketCount}
                    <Typography component="span" variant="caption" sx={{ color: '#94a3b8', ml: 0.5 }}>
                        ({employee.totalTickets} tasks)
                    </Typography>
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: employee.avgDelay > 7 ? '#f59e0b' : '#10b981' }}>
                    {employee.avgDelay} Days
                </Typography>
                <Box sx={{ justifySelf: 'end' }}>
                    {open ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
                </Box>
            </Box>

            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', mb: 2, display: 'block' }}>ACTIVE & RECENT TICKET ASSIGNMENTS</Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {sortedTickets.map((ticket, idx) => (
                            <Paper key={idx} elevation={0} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>TICKET ID</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>#{ticket.ticketId}</Typography>
                                </Box>

                                <Box sx={{ flex: 1, mx: 4 }}>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>SERVICE NAME</Typography>
                                    <Typography variant="body2" sx={{ color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
                                        {ticket.serviceName}
                                    </Typography>
                                </Box>

                                <Box sx={{ width: 150 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>DELAY</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: ticket.maxDelay > 15 ? '#ef4444' : '#64748b' }}>
                                            {ticket.maxDelay} Days
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min((ticket.maxDelay / 30) * 100, 100)}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: '#f1f5f9',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: ticket.maxDelay > 15 ? '#ef4444' : (ticket.maxDelay > 7 ? '#f59e0b' : '#10b981')
                                            }
                                        }}
                                    />
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </Box>
            </Collapse>
        </React.Fragment>
    );
};

export default EmployeeAnalyticsDashboard;
