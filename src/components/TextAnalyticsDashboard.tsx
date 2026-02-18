import React, { useState, useMemo } from 'react';
import { Box, Paper, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Collapse, Chip, Pagination, Avatar } from '@mui/material';
import { Search, Bell, ChevronDown, ChevronRight, User, Filter, Activity, Microscope, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useProject } from '../context/ProjectContext';
import type { JDAIntelligence } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
    'Documentation Issues': '#6366f1',
    'Process Bottlenecks': '#f59e0b',
    'Communication Gaps': '#10b981',
    'External Dependencies': '#ef4444',
    'Employee/System-Side Issues': '#3b82f6',
    'Complexity & Legal': '#8b5cf6',
    'Applicant-Side Issues': '#ec4899',
    'Uncategorized': '#06b6d4',

    // Display Name Mappings for Charts
    'Internal System': '#3b82f6',
    'Process & Approval': '#f59e0b',
    'Documentation & Compliance': '#6366f1',
    'Communication & Coordination': '#10b981'
};

const DEPT_COLORS: Record<string, string> = {
    'TOWN PLANNING': '#6366f1',
    'REVENUE SECTION': '#10b981',
    'LAND MANAGEMENT': '#ef4444',
    'IT SECTION': '#64748b',
    'ENGINEERING': '#3b82f6',
    'ALLOTMENT': '#f59e0b',
    'ESTATE': '#8b5cf6',
    'DEPUTY COMMISSIONER (ZONE 09)': '#8b5cf6',
    'DEPUTY COMMISSIONER (ZONE 14)': '#3b82f6',
    'DEFAULT': '#64748b'
};

const TextAnalyticsDashboard: React.FC = () => {
    // ... existing hook calls ...
    const { currentProject } = useProject();
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const rowsPerPage = 10;
    // ... rest of component ...

    // ... (Skipping to ExpandableTicketRow) ...

    const { tickets, insights, categoryData, totalTicketsWithCategory } = useMemo(() => {
        if (!currentProject?.statistics?.jdaHierarchy) {
            return { tickets: [], insights: null, categoryData: [], totalTicketsWithCategory: 0 };
        }

        const hierarchy = currentProject.statistics.jdaHierarchy as JDAIntelligence;
        const processedTickets = new Map<string, any>();
        const categoryCounts: Record<string, number> = {};

        hierarchy.departments.forEach(dept => {
            dept.parentServices.forEach(ps => {
                ps.services.forEach(svc => {
                    svc.tickets.forEach(ticket => {
                        const existing = processedTickets.get(ticket.ticketId);
                        const currentDelay = ticket.daysRested || 0;

                        const owner = (ticket.stepOwnerName || '').toUpperCase();
                        const role = (ticket.stepOwnerRole || '').toUpperCase();

                        if (owner === 'APPLICANT' || owner === 'CITIZEN' || role === 'APPLICANT' || role === 'CITIZEN') {
                            return;
                        }

                        if (!existing || currentDelay > existing.delay) {
                            processedTickets.set(ticket.ticketId, {
                                ...ticket,
                                departmentName: dept.name,
                                parentService: ps.name,
                                serviceName: svc.name,
                                delay: currentDelay,
                                allRemarks: existing ? [...(existing.allRemarks || []), ticket.remarkOriginal] : [ticket.remarkOriginal]
                            });
                        }
                    });
                });
            });
        });

        const allTickets = Array.from(processedTickets.values());
        const totalCount = allTickets.length;

        // Calculate category counts from DEDUPED tickets
        allTickets.forEach(ticket => {
            const cat = (ticket.detectedCategory || 'Uncategorized')
                .replace('Employee/System-Side Issues', 'Internal System')
                .replace('Process Bottlenecks', 'Process & Approval')
                .replace('Documentation Issues', 'Documentation & Compliance')
                .replace('Communication Gaps', 'Communication & Coordination');

            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        // Format category data for Recharts
        const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
            name,
            value,
            percentage: ((value / totalCount) * 100).toFixed(0)
        })).sort((a, b) => b.value - a.value);

        const aiInsights = currentProject.statistics.aiInsights;

        // Extract Process Gaps and Pain Points from the new detailed structure OR legacy structure
        // Cast to any to handle the transition between old and new types gracefully
        const analysis = aiInsights?.remarkAnalysis as any;

        // PRIORITIZE NEW "OVERALL" ANALYSIS if available
        let processGaps = analysis?.overallRemarkAnalysis?.employeeRemarksOverall?.topEmployeeActions || [];
        let painPoints = analysis?.overallRemarkAnalysis?.applicantRemarksOverall?.topApplicantConcerns || [];

        // Fallback to old structure if new one is missing
        if (!processGaps || processGaps.length === 0) {
            processGaps = analysis?.delayAnalysis?.processGaps || analysis?.processGaps || [];
        }
        if (!painPoints || painPoints.length === 0) {
            painPoints = analysis?.delayAnalysis?.painPoints || analysis?.painPoints || [];
        }

        // Identify the "Spotlight Ticket" (Likely the one with the highest delay)
        // The backend analyzes the single highest risk application.
        // We will attach the full forensic analysis to the ticket with the Max Delay in this list.
        const sortedTickets = allTickets.sort((a, b) => b.delay - a.delay);

        if (aiInsights?.forensicReports) {
            // Attach forensic analysis to ALL matching tickets
            Object.entries(aiInsights.forensicReports).forEach(([ticketId, report]) => {
                const ticket = allTickets.find(t => t.ticketId === ticketId);
                if (ticket) {
                    ticket.forensicAnalysis = report;
                }
            });
        } else if (sortedTickets.length > 0 && aiInsights?.remarkAnalysis) {
            // Fallback: Attach forensic analysis to the top ticket (legacy)
            sortedTickets[0].forensicAnalysis = aiInsights.remarkAnalysis;
        }

        return {
            tickets: sortedTickets,
            insights: { processGaps, painPoints },
            categoryData,
            totalTicketsWithCategory: totalCount
        };
    }, [currentProject]);

    // -------------------------------------------------------------------------
    // FILTERS & STATE
    // -------------------------------------------------------------------------
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedService, setSelectedService] = useState<string>('All');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
    const [selectedZone, setSelectedZone] = useState<string>('All');
    const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);
    const [sortKey, setSortKey] = useState<'delay' | 'ticketId' | 'departmentName' | 'stepOwnerName'>('delay');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Extract Unique Options for Dropdowns
    const uniqueCategories = useMemo(() => {
        const cats = new Set(tickets.map(t => t.detectedCategory).filter(Boolean));
        return ['All', ...Array.from(cats)].sort();
    }, [tickets]);

    const uniqueServices = useMemo(() => {
        const svcs = new Set(tickets.map(t => t.serviceName).filter(Boolean));
        return ['All', ...Array.from(svcs)].sort();
    }, [tickets]);

    const uniqueDepartments = useMemo(() => {
        const depts = new Set(tickets.map(t => t.departmentName).filter(Boolean));
        return ['All', ...Array.from(depts)].sort();
    }, [tickets]);

    const uniqueZones = useMemo(() => {
        const zones = new Set(tickets.map(t => t.zoneId).filter(Boolean));
        return ['All', ...Array.from(zones)].sort();
    }, [tickets]);

    const hasActiveFilters = useMemo(() => {
        return selectedCategory !== 'All' ||
            selectedService !== 'All' ||
            selectedDepartment !== 'All' ||
            selectedZone !== 'All' ||
            showCriticalOnly ||
            searchQuery !== '';
    }, [selectedCategory, selectedService, selectedDepartment, selectedZone, showCriticalOnly, searchQuery]);

    const handleClearFilters = () => {
        setSelectedCategory('All');
        setSelectedService('All');
        setSelectedDepartment('All');
        setSelectedZone('All');
        setShowCriticalOnly(false);
        setSearchQuery('');
        setPage(1);
    };

    // Apply Filters & Sorting
    const processedTicketsList = useMemo(() => {
        let result = tickets.filter(t => {
            const matchCategory = selectedCategory === 'All' || t.detectedCategory === selectedCategory;
            const matchService = selectedService === 'All' || t.serviceName === selectedService;
            const matchDepartment = selectedDepartment === 'All' || t.departmentName === selectedDepartment;
            const matchZone = selectedZone === 'All' || t.zoneId === selectedZone;
            const matchCritical = !showCriticalOnly || t.delay > 15;

            const searchLower = searchQuery.toLowerCase();
            const matchSearch = !searchQuery ||
                t.ticketId.toLowerCase().includes(searchLower) ||
                (t.remarkOriginal || '').toLowerCase().includes(searchLower) ||
                (t.departmentName || '').toLowerCase().includes(searchLower) ||
                (t.serviceName || '').toLowerCase().includes(searchLower);

            return matchCategory && matchService && matchDepartment && matchZone && matchCritical && matchSearch;
        });

        // Apply Sorting
        return result.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'delay') {
                comparison = (a.delay || 0) - (b.delay || 0);
            } else if (sortKey === 'ticketId') {
                comparison = a.ticketId.localeCompare(b.ticketId);
            } else if (sortKey === 'departmentName') {
                comparison = (a.departmentName || '').localeCompare(b.departmentName || '');
            } else if (sortKey === 'stepOwnerName') {
                comparison = (a.stepOwnerName || '').localeCompare(b.stepOwnerName || '');
            }
            return sortDirection === 'desc' ? -comparison : comparison;
        });
    }, [tickets, selectedCategory, selectedService, selectedDepartment, selectedZone, showCriticalOnly, searchQuery, sortKey, sortDirection]);

    const filteredTickets = processedTicketsList;

    // Update Pagination based on filtered results
    const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);
    const displayedTickets = filteredTickets.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    if (!currentProject) return (
        <Box sx={{ p: 4, textAlign: 'center', mt: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: 120, height: 120, bgcolor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Activity size={60} color="#94a3b8" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>No Project Selected</Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 400 }}>
                Please upload a CSV file to begin your forensic remark analysis and generate qualitative insights.
            </Typography>
        </Box>
    );

    return (
        <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto', p: { xs: 2, md: 4 } }}>

            {/* 1. Header Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography
                            variant="caption"
                            onClick={() => window.location.reload()}
                            sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', '&:hover': { color: '#6366f1' } }}
                        >
                            Admin
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{'>'}</Typography>
                        <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Remarks Analysis
                        </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                        Employee & Applicant Remarks Analysis
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', mt: 1, maxWidth: 800 }}>
                        Detailed qualitative insights derived from employee and applicant remarks to identify systemic process bottlenecks through categorical classification.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: '8px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.2,
                            bgcolor: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: 2.5,
                            width: 320,
                            transition: 'all 0.2s',
                            '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' }
                        }}
                    >
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search tickets or remarks..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                width: '100%',
                                outline: 'none',
                                color: '#1e293b',
                                fontWeight: 500,
                                fontSize: '0.875rem'
                            }}
                        />
                    </Paper>
                    <IconButton sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2.5, width: 44, height: 44 }}>
                        <Bell size={20} color="#64748b" />
                    </IconButton>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#6366f1', fontSize: '0.9rem', fontWeight: 700, borderRadius: 2.5 }}>
                        JD
                    </Avatar>
                </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2, display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Activity size={16} /> GLOBAL QUALITATIVE INSIGHTS
            </Typography>

            {/* 2. Global Insights Cards - 3 Column Layout */}
            <Grid container spacing={3} sx={{ mb: 6 }}>
                {/* Column 1: Category Distribution */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eff6ff', color: '#3b82f6', display: 'flex' }}>
                                <Microscope size={18} />
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>Category Distribution</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minHeight: 220 }}>
                            <Box sx={{ width: '50%', height: 200, position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={CATEGORY_COLORS[entry.name] || '#06b6d4'}
                                                    onClick={() => {
                                                        setSelectedCategory(entry.name);
                                                        setPage(1);
                                                    }}
                                                    style={{ cursor: 'pointer', filter: selectedCategory === entry.name ? 'brightness(0.8)' : 'none' }}
                                                />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                                        {totalTicketsWithCategory.toLocaleString()}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                        Tickets
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 1, pl: 2 }}>
                                {categoryData.slice(0, 5).map((entry, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CATEGORY_COLORS[entry.name] || '#06b6d4' }} />
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem', display: 'block', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {entry.name}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 700, fontSize: '0.7rem' }}>
                                            {entry.percentage}%
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Column 2: Employee Remarks */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <InsightsCard
                        title="Employee Remarks"
                        icon={<Building2 size={18} />}
                        iconColor="#6366f1"
                        items={insights?.processGaps || []}
                        tag="TOP BOTTLENECKS"
                        dotColor="#f59e0b"
                    />
                </Grid>

                {/* Column 3: Applicant Remarks */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <InsightsCard
                        title="Applicant Remarks"
                        icon={<User size={18} />}
                        iconColor="#f59e0b"
                        items={insights?.painPoints || []}
                        tag="COMMON PAIN POINTS"
                        dotColor="#ef4444"
                    />
                </Grid>
            </Grid>

            {/* 3. Ticket Insights Table with Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Filter size={16} /> TICKET INSIGHTS TABLE
                </Typography>

                {/* Filter Controls */}
                <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 1000 }}>
                    {/* Zone Filter */}
                    <select
                        value={selectedZone}
                        onChange={(e) => { setSelectedZone(e.target.value); setPage(1); }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: selectedZone !== 'All' ? '#eff6ff' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: selectedZone !== 'All' ? '#3b82f6' : '#475569',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Zones</option>
                        {uniqueZones.filter(z => z !== 'All').map(z => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>

                    {/* Department Filter */}
                    <select
                        value={selectedDepartment}
                        onChange={(e) => { setSelectedDepartment(e.target.value); setPage(1); }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: selectedDepartment !== 'All' ? '#eff6ff' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: selectedDepartment !== 'All' ? '#3b82f6' : '#475569',
                            outline: 'none',
                            cursor: 'pointer',
                            maxWidth: '180px'
                        }}
                    >
                        <option value="All">All Departments</option>
                        {uniqueDepartments.filter(d => d !== 'All').map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: selectedCategory !== 'All' ? '#eff6ff' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: selectedCategory !== 'All' ? '#3b82f6' : '#475569',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Categories</option>
                        {uniqueCategories.filter(c => c !== 'All').map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Service Filter */}
                    <select
                        value={selectedService}
                        onChange={(e) => { setSelectedService(e.target.value); setPage(1); }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: selectedService !== 'All' ? '#eff6ff' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: selectedService !== 'All' ? '#3b82f6' : '#475569',
                            outline: 'none',
                            cursor: 'pointer',
                            maxWidth: '180px'
                        }}
                    >
                        <option value="All">All Services</option>
                        {uniqueServices.filter(s => s !== 'All').map(s => (
                            <option key={s} value={s}>{s.length > 25 ? s.substring(0, 25) + '...' : s}</option>
                        ))}
                    </select>

                    {/* Sort Selector */}
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', bgcolor: 'white', overflow: 'hidden' }}>
                        <select
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value as any)}
                            style={{
                                padding: '8px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: '#475569',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="delay">Sort by Delay</option>
                            <option value="ticketId">Sort by Ticket ID</option>
                            <option value="departmentName">Sort by Dept</option>
                            <option value="stepOwnerName">Sort by Officer</option>
                        </select>
                        <Box
                            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                            sx={{
                                px: 1,
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#f8fafc' },
                                borderLeft: '1px solid #e2e8f0',
                                height: '100%'
                            }}
                        >
                            <ChevronDown size={14} style={{ transform: sortDirection === 'asc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </Box>
                    </Box>

                    {/* Critical Only Toggle */}
                    <Box
                        onClick={() => { setShowCriticalOnly(!showCriticalOnly); setPage(1); }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            borderRadius: '8px',
                            border: showCriticalOnly ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                            bgcolor: showCriticalOnly ? '#fef2f2' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': { bgcolor: showCriticalOnly ? '#fef2f2' : '#f8fafc' }
                        }}
                    >
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: showCriticalOnly ? '#ef4444' : '#cbd5e1' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: showCriticalOnly ? '#ef4444' : '#64748b', fontSize: '0.7rem' }}>
                            CRITICAL
                        </Typography>
                    </Box>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <Box
                            onClick={handleClearFilters}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.8,
                                px: 1.5,
                                py: 0.8,
                                borderRadius: '8px',
                                bgcolor: '#f1f5f9',
                                color: '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: '#e2e8f0', color: '#0f172a' }
                            }}
                        >
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.65rem' }}>
                                CLEAR
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>TICKET ID</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>DEPARTMENT NAME</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>PRIMARY CATEGORY</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>PARENT SERVICE</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', py: 2 }}>SERVICE NAME</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayedTickets.map((ticket, index) => (
                                <ExpandableTicketRow key={index} ticket={ticket} forensicAnalysis={ticket.forensicAnalysis} />
                            ))}
                            {displayedTickets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                                            <Filter size={48} strokeWidth={1} style={{ marginBottom: 16 }} />
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>No tickets found matching current filters.</Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination Footer */}
                <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                        Showing {displayedTickets.length} of {filteredTickets.length.toLocaleString()} tickets
                    </Typography>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        size="small"
                        sx={{
                            '& .MuiPaginationItem-root': { fontWeight: 700, borderRadius: 1.5 },
                            '& .Mui-selected': { bgcolor: '#0f172a !important', color: 'white' }
                        }}
                    />
                    <Box sx={{ width: 100 }} /> {/* Spacer */}
                </Box>
            </Paper>
        </Box>
    );
};

// Expandable Row Component with Forensic Visualization
const ExpandableTicketRow = ({ ticket, forensicAnalysis }: { ticket: any, forensicAnalysis?: any }) => {
    const [open, setOpen] = useState(false);

    // Helper to get color safely
    const deptColor = useMemo(() => {
        const dept = (ticket.departmentName || ticket.department || '').toUpperCase();
        if (DEPT_COLORS[dept]) return DEPT_COLORS[dept];
        if (dept.includes('DEPUTY COMMISSIONER (ZONE 09)')) return DEPT_COLORS['DEPUTY COMMISSIONER (ZONE 09)'];
        if (dept.includes('DEPUTY COMMISSIONER (ZONE 14)')) return DEPT_COLORS['DEPUTY COMMISSIONER (ZONE 14)'];
        return DEPT_COLORS['DEFAULT'];
    }, [ticket.departmentName, ticket.department]);

    return (
        <>
            <TableRow
                onClick={() => setOpen(!open)}
                sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f8fafc' },
                    bgcolor: open ? '#f8fafc' : 'white',
                    transition: 'all 0.1s',
                    '& td': { borderBottom: open ? 'none' : '1px solid #f1f5f9' }
                }}
            >
                <TableCell sx={{ fontWeight: 800, color: '#1e293b', fontFamily: 'monospace', fontSize: '0.85rem', pl: 3 }}>
                    #{ticket.ticketId}
                </TableCell>
                <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            color: deptColor,
                            lineHeight: 1.2,
                            mb: 0.5
                        }}>
                            {ticket.departmentName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 500 }}>
                            {ticket.zoneId}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Chip
                        label={ticket.detectedCategory || 'Uncategorized'}
                        size="small"
                        sx={{
                            height: 26,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: 'white',
                            color: ticket.detectedCategory ? CATEGORY_COLORS[ticket.detectedCategory] : '#6366f1',
                            border: `1.5px solid ${(ticket.detectedCategory ? CATEGORY_COLORS[ticket.detectedCategory] : '#06b6d4')}`,
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                            '& .MuiChip-label': { px: 1.5 }
                        }}
                    />
                </TableCell>
                <TableCell sx={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                    {ticket.parentService}
                </TableCell>
                <TableCell>
                    <Typography sx={{
                        color: '#334155',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                    }}>
                        {ticket.serviceName}
                    </Typography>
                </TableCell>
                <TableCell sx={{ pr: 2 }} align="right">
                    <IconButton size="small" sx={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <ChevronDown size={18} />
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 4, pt: 1, pb: 4, bgcolor: '#f8fafc' }}>
                            {forensicAnalysis ? (
                                // FORENSIC VIEW
                                <Grid container spacing={4}>
                                    <Grid size={{ xs: 12 }}>
                                        <Box sx={{ mb: 2, p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e40af', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Microscope size={16} /> TICKET INSIGHT
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#1e3a8a', fontSize: '0.85rem' }}>
                                                {forensicAnalysis.ticketInsightSummary}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    {/* Employee Side */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <ForensicColumn
                                            title="EMPLOYEE ACTION FORENSICS"
                                            icon={<Building2 size={16} />}
                                            color="#6366f1"
                                            summary={forensicAnalysis.employeeRemarkAnalysis?.summary}
                                            // actions={forensicAnalysis.employeeRemarkAnalysis?.keyActions || []}
                                            issues={forensicAnalysis.employeeRemarkAnalysis?.inactionFlags || []}
                                        // metricLabel="TIMELINESS"
                                        // metricValue={forensicAnalysis.employeeRemarkAnalysis?.responseTimeliness || 'N/A'}
                                        />
                                    </Grid>
                                    {/* Applicant Side */}
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <ForensicColumn
                                            title="APPLICANT SENTIMENT FORENSICS"
                                            icon={<User size={16} />}
                                            color="#f59e0b"
                                            summary={forensicAnalysis.applicantRemarkAnalysis?.summary}
                                        // actions={forensicAnalysis.applicantRemarkAnalysis?.keyActions || []}
                                        // metricLabel="COMPLIANCE"
                                        // metricValue={forensicAnalysis.applicantRemarkAnalysis?.complianceLevel || 'N/A'}
                                        />
                                    </Grid>
                                    {/* Sentiment Summary */}
                                    {forensicAnalysis.sentimentSummary && (
                                        <Grid size={{ xs: 12 }}>
                                            <Box sx={{ mt: 1, p: 2.5, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #facc15' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#ca8a04', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                                                    Sentiment Summary
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#713f12', fontSize: '0.85rem' }}>
                                                    {forensicAnalysis.sentimentSummary}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            ) : (
                                // STANDARD VIEW (Fallback)
                                <Grid container spacing={4}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                <Box sx={{ color: '#94a3b8' }}><Building2 size={16} /></Box>
                                                <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', fontSize: '0.7rem' }}>EMPLOYEE REMARK</Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.7, mb: 3, flex: 1 }}>
                                                "{ticket.remarkOriginal || "Analysis pending..."}"
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>OFFICER</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{ticket.stepOwnerName || 'Unknown'}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>ROLE</Typography>
                                                    <Chip label={ticket.stepOwnerRole || 'N/A'} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b' }} />
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                <Box sx={{ color: '#f59e0b' }}><User size={16} /></Box>
                                                <Typography variant="overline" sx={{ fontWeight: 800, color: '#d97706', letterSpacing: '0.1em', fontSize: '0.7rem' }}>APPLICANT SUMMARY</Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.7, mb: 3, flex: 1 }}>
                                                "{ticket.remarkEnglishSummary || "Analysis not available."}"
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>DETECTED CATEGORY</Typography>
                                                    <Chip label={ticket.detectedCategory || 'Uncategorized'} size="small" sx={{ height: 24, fontSize: '0.65rem', fontWeight: 700, bgcolor: (ticket.detectedCategory ? CATEGORY_COLORS[ticket.detectedCategory] : '#06b6d4') + '15', color: ticket.detectedCategory ? CATEGORY_COLORS[ticket.detectedCategory] : '#6366f1', border: 'none', borderRadius: '6px' }} />
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            )}
                        </Box>
                    </Collapse>
                </TableCell >
            </TableRow >
        </>
    );
};

// Helper Component for Forensic Columns
const ForensicColumn = ({ title, icon, color, summary, actions, issues, metricLabel, metricValue }: any) => (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ color: color }}>{icon}</Box>
            <Typography variant="overline" sx={{ fontWeight: 800, color: color, letterSpacing: '0.1em', fontSize: '0.7rem' }}>
                {title}
            </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 500, lineHeight: 1.6, mb: 3 }}>
            {summary || "No data available."}
        </Typography>

        {/* Content Section */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {/* Actions (Positive/Neutral) */}
            {actions && actions.length > 0 && (
                <Box>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, mb: 1, display: 'block' }}>KEY ACTIONS</Typography>
                    {actions.slice(0, 3).map((action: string, idx: number) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#10b981', mt: 0.8, flexShrink: 0 }} />
                            <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem' }}>{action}</Typography>
                        </Box>
                    ))}
                </Box>
            )}

            {/* Issues (Negative/Warnings) */}
            {issues && issues.length > 0 && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700, mb: 1, display: 'block' }}>FLAGGED ISSUES</Typography>
                    {issues.slice(0, 3).map((issue: any, idx: number) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 1.5 }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#ef4444', mt: 0.8, flexShrink: 0 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>
                                    {issue.observation}
                                </Typography>
                                {issue.evidence && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', fontStyle: 'italic', display: 'block', mt: 0.5, bgcolor: '#f8fafc', p: 0.5, borderRadius: 1 }}>
                                        "{issue.evidence}"
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>

        <Box sx={{ pt: 2, borderTop: '1px solid #f1f5f9' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block', mb: 0.5 }}>{metricLabel}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{metricValue}</Typography>
        </Box>
    </Paper>
);

// Reusable Insights Card with Pagination
const InsightsCard = ({ title, icon, iconColor, items, tag, dotColor }: {
    title: string,
    icon: React.ReactNode,
    iconColor: string,
    items: string[],
    tag: string,
    dotColor: string
}) => {
    const [page, setPage] = useState(0);
    const rowsPerPage = 3;
    const totalPages = Math.ceil(items.length / rowsPerPage);

    const paginatedItems = items.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setPage(p => Math.max(0, p - 1)); };
    const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setPage(p => Math.min(totalPages - 1, p + 1)); };

    if (!items || items.length === 0) {
        return (
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ color: iconColor, display: 'flex' }}>{icon}</Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{title}</Typography>
                    </Box>
                    <Chip label={tag} size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 800, fontSize: '0.6rem', borderRadius: '6px' }} />
                </Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                    No insights available.
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: iconColor + '15', color: iconColor, display: 'flex' }}>
                        {icon}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b' }}>{title}</Typography>
                </Box>
                <Chip label={tag} size="small" sx={{ bgcolor: iconColor + '10', color: iconColor, fontWeight: 800, fontSize: '0.6rem', borderRadius: '6px' }} />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                {paginatedItems.map((item: string, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 1.8, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #f1f5f9' }}>
                        <Box sx={{ mt: 0.8, width: 6, height: 6, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.5 }}>
                            {item}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #f1f5f9' }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, fontSize: '0.65rem' }}>
                    {page + 1} OF {totalPages}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={handlePrev} disabled={page === 0} sx={{ borderRadius: 1.5 }}>
                        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />
                    </IconButton>
                    <IconButton size="small" onClick={handleNext} disabled={page >= totalPages - 1} sx={{ borderRadius: 1.5 }}>
                        <ChevronRight size={14} />
                    </IconButton>
                </Box>
            </Box>
        </Paper>
    );
};

export default TextAnalyticsDashboard;
