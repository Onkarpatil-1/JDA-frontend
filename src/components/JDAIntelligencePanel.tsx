import React from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Paper,
    Avatar,
    Tooltip
} from '@mui/material';
import {
    ChevronDown,
    AlertCircle,
    FileText,
    CheckCircle,
    Clock,
    Building2,
    Layers,
    Shield,
    Briefcase
} from 'lucide-react';
import type { JDAIntelligence, JDAService } from '../types';

interface JDAIntelligencePanelProps {
    data: JDAIntelligence;
}

const getCategoryDescription = (category: string) => {
    switch (category) {
        case 'Employee/System-Side Issues': return 'Internal procedural delays, official negligence, or technical system errors.';
        case 'Process Bottlenecks': return 'Structural delays in workflow, waiting for approvals, or heavy workload at specific desks.';
        case 'Documentation Issues': return 'Missing forms, incorrect file attachments, or incomplete application details.';
        case 'Communication Gaps': return 'Lack of coordination between departments or failure to notify the applicant/officer.';
        case 'Applicant-Side Issues': return 'Delays caused by the citizen (payment pending, documents not submitted, etc).';
        case 'External Dependencies': return 'Waiting for reports or clearances from outside departments/agencies.';
        case 'Complexity/Special Cases': return 'Cases involving legal disputes, court orders, or complex land verification.';
        default: return 'General process delay category.';
    }
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Employee/System-Side Issues': return 'error';
        case 'Process Bottlenecks': return 'warning';
        case 'Documentation Issues': return 'info';
        case 'Communication Gaps': return 'secondary';
        case 'Applicant-Side Issues': return 'warning';
        case 'External Dependencies': return 'primary';
        case 'Complexity/Special Cases': return 'success';
        default: return 'default';
    }
};

const categoryIcon = (category: string) => {
    switch (category) {
        case 'Employee/System-Side Issues': return <AlertCircle size={12} />;
        case 'Documentation Issues': return <FileText size={12} />;
        case 'Process Bottlenecks': return <Clock size={12} />;
        case 'External Dependencies': return <Layers size={12} />;
        default: return <CheckCircle size={12} />;
    }
};


export const JDAIntelligencePanel: React.FC<JDAIntelligencePanelProps> = ({ data }) => {

    if (!data || !data.departments || data.departments.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                <Typography variant="body2" color="text.secondary">
                    No JDA Intelligence Data Available. Please ensure the dataset contains 'DepartmentName' and 'ParentServiceName' columns.
                </Typography>
            </Box>
        );
    }

    const getTicketColor = (ticketId: string) => {
        let hash = 0;
        for (let i = 0; i < ticketId.length; i++) {
            hash = ticketId.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Generate consistent pastel color
        // Lightness 96-98% for very very light background
        // Saturation 25-35% for a hint of color
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 30%, 97%)`;
    };

    const renderServiceAccordion = (service: JDAService, isMerged: boolean = false) => {
        // Calculate service health
        const delayedTickets = service.tickets.filter(t => t.daysRested > 7).length;
        const isCritical = delayedTickets > 0;

        return (
            <Accordion
                disableGutters
                elevation={0}
                slotProps={{ transition: { unmountOnExit: true } }}
                sx={{
                    '&:before': { display: 'none' },
                    borderTop: '1px solid #f1f5f9',
                    '&:first-of-type': { borderTop: 'none' },
                    bgcolor: 'transparent'
                }}
            >
                <AccordionSummary
                    expandIcon={<ChevronDown size={14} color="#94a3b8" />}
                    sx={{
                        minHeight: 48, // Taller rows for better touch target
                        px: isMerged ? 2 : 3,
                        bgcolor: isMerged ? '#fff' : 'transparent',
                        '&:hover': { bgcolor: '#f8fafc' }, // Hover effect
                        '& .MuiAccordionSummary-content': { my: 0.5 }
                    }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {/* Icon: status color coded */}
                            <Box sx={{
                                width: 24, height: 24, borderRadius: '6px',
                                bgcolor: isCritical ? '#fef2f2' : '#f0fdf4',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {isMerged ? <Layers size={14} color={isCritical ? '#ef4444' : '#16a34a'} /> : <Briefcase size={14} color={isCritical ? '#ef4444' : '#16a34a'} />}
                            </Box>

                            <Box>
                                <Typography variant="body2" sx={{
                                    color: '#0f172a',
                                    fontWeight: 600,
                                    fontSize: '0.85rem'
                                }}>
                                    {service.name}
                                </Typography>
                                {/* Micro-subtitle for merging */}
                                {isMerged && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block', lineHeight: 1 }}>
                                        Single Service
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* Visual Health Indicator */}
                            {isCritical && (
                                <Chip
                                    label={`${delayedTickets} Delayed`}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                                        bgcolor: '#fee2e2', color: '#dc2626'
                                    }}
                                />
                            )}

                            <Chip
                                label={service.serviceLevelInsight}
                                size="small"
                                variant="outlined"
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    borderColor: '#e2e8f0',
                                    color: '#64748b',
                                    bgcolor: '#fff'
                                }}
                            />
                        </Box>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {service.tickets
                            .filter(t => {
                                const role = (t.stepOwnerRole || '').toUpperCase();
                                const name = (t.stepOwnerName || '').toUpperCase();
                                return !role.includes('APPLICANT') && !role.includes('CITIZEN') &&
                                    !name.includes('APPLICANT') && !name.includes('CITIZEN');
                            })
                            .map((ticket, tIndex) => (
                                <Box
                                    key={tIndex}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        py: 0.75,
                                        px: isMerged ? 2 : 3,
                                        borderBottom: '1px solid #f1f5f9',
                                        bgcolor: getTicketColor(ticket.ticketId), // Apply generated color
                                        '&:last-child': { borderBottom: 'none' },
                                        '&:hover': { filter: 'brightness(98%)' }, // Subtle hover darkening
                                        transition: 'all 0.1s'
                                    }}
                                >
                                    {/* ID Column */}
                                    <Typography sx={{
                                        width: 140,
                                        flexShrink: 0,
                                        fontFamily: 'monospace',
                                        fontSize: '0.7rem',
                                        color: '#475569',
                                        fontWeight: 500
                                    }}>
                                        {ticket.ticketId}
                                    </Typography>

                                    {/* Stage/Remark Column (Flex Grow) */}
                                    <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                                        <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                                            {ticket.stepOwnerName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 500, display: 'block' }}>
                                            {ticket.stepOwnerRole}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem', display: 'block', mt: 0.25 }}>
                                            {ticket.remarkEnglishSummary || '-'}
                                        </Typography>
                                    </Box>

                                    {/* Delay/Status Badge */}
                                    <Box sx={{ width: 80, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                                        {ticket.deliveredOn ? (
                                            <span style={{
                                                color: '#16a34a',
                                                fontWeight: 700,
                                                fontSize: '0.6rem',
                                                backgroundColor: '#f0fdf4',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                display: 'inline-block',
                                                textAlign: 'center',
                                                border: '1px solid #dcfce7'
                                            }}>
                                                Completed
                                            </span>
                                        ) : (
                                            <span style={{
                                                color: ticket.daysRested > 7 ? '#ef4444' : '#16a34a',
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                                backgroundColor: ticket.daysRested > 7 ? '#fef2f2' : '#f0fdf4',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                display: 'inline-block',
                                                textAlign: 'center',
                                                minWidth: 32
                                            }}>
                                                {ticket.daysRested}d
                                            </span>
                                        )}
                                    </Box>

                                    {/* Category Chip */}
                                    <Box sx={{ width: 140, flexShrink: 0, display: 'flex', justifyContent: 'flex-end', pl: 1 }}>
                                        <Tooltip title={getCategoryDescription(ticket.detectedCategory)} arrow placement="top">
                                            <Chip
                                                icon={categoryIcon(ticket.detectedCategory)}
                                                label={ticket.detectedCategory.split(' ')[0]}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    height: 18,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 600,
                                                    border: 'none',
                                                    bgcolor: (theme) => {
                                                        const colorKey = getCategoryColor(ticket.detectedCategory);
                                                        if (colorKey === 'default') return theme.palette.action.selected;
                                                        return (theme.palette[colorKey as 'primary']?.main || theme.palette.primary.main) + '15';
                                                    },
                                                    color: (theme) => {
                                                        const colorKey = getCategoryColor(ticket.detectedCategory);
                                                        if (colorKey === 'default') return theme.palette.text.secondary;
                                                        return theme.palette[colorKey as 'primary']?.main || theme.palette.primary.main;
                                                    },
                                                    '& .MuiChip-icon': { width: 12, height: 12, color: 'inherit' },
                                                    '& .MuiChip-label': { px: 1 },
                                                    cursor: 'help'
                                                }}
                                            />
                                        </Tooltip>
                                    </Box>
                                </Box>
                            ))}
                    </Box>
                </AccordionDetails>
            </Accordion>
        );
    };

    return (
        <Box sx={{ width: '100%' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 1.5 }}>
                        <Shield size={20} color="#2563eb" />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ color: '#0f172a', fontWeight: 800, lineHeight: 1.2 }}>
                            Hierarchy Breakdown
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Analyze delays by Department & Service
                        </Typography>
                    </Box>
                </Box>
                <Chip label={`${data.departments.length} Zones Active`} color="primary" size="small" sx={{ fontWeight: 600, bgcolor: '#eff6ff', color: '#2563eb' }} />
            </Box>

            {data.departments.map((dept, deptIndex) => (
                <Paper
                    key={deptIndex}
                    elevation={0}
                    sx={{
                        mb: 2,
                        borderRadius: 3,
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: '#cbd5e1',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                        }
                    }}
                >
                    <Accordion
                        disableGutters
                        elevation={0}
                        defaultExpanded={deptIndex === 0}
                        slotProps={{ transition: { unmountOnExit: true } }}
                        sx={{
                            '&:before': { display: 'none' },
                            '& .MuiAccordionSummary-root': {
                                minHeight: 56,
                                bgcolor: '#f8fafc',
                                px: 2,
                                borderBottom: '1px solid transparent',
                                '&.Mui-expanded': { borderBottom: '1px solid #e2e8f0' }
                            }
                        }}
                    >
                        <AccordionSummary expandIcon={<ChevronDown size={18} color="#64748b" />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                                    <Building2 size={16} color="#475569" />
                                </Avatar>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                                    {dept.name}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, bgcolor: '#fff' }}>
                            {dept.parentServices.map((pService, psIndex) => {
                                // FLATTENING STRATEGY
                                const isSingleChild = pService.services.length === 1;

                                if (isSingleChild) {
                                    const service = pService.services[0];
                                    const parentName = pService.name.trim();
                                    const serviceName = service.name.trim();

                                    // Check redundancy
                                    const cleanP = parentName.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    const cleanS = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    const isRedundantName = cleanP === cleanS || cleanS.includes(cleanP) || cleanP.includes(cleanS);

                                    const displayService = {
                                        ...service,
                                        name: isRedundantName ? service.name : `${pService.name}: ${service.name}`
                                    };

                                    return (
                                        <Box key={psIndex} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                            {renderServiceAccordion(displayService, true)}
                                        </Box>
                                    );
                                }

                                return (
                                    <Box key={psIndex} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                        {/* Group Header */}
                                        <Box sx={{
                                            px: 2,
                                            py: 1.5,
                                            bgcolor: '#fcfcfc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            borderLeft: '3px solid #cbd5e1',
                                            borderBottom: '1px solid #f1f5f9'
                                        }}>
                                            <Layers size={14} color="#64748b" />
                                            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {pService.name}
                                            </Typography>
                                        </Box>

                                        {/* Children */}
                                        <Box>
                                            {pService.services.map((service, sIndex) => (
                                                <Box key={sIndex}>
                                                    {renderServiceAccordion(service, false)}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </AccordionDetails>
                    </Accordion>
                </Paper>
            ))}
        </Box>
    );
};
