import React, { useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useProject } from '../context/ProjectContext';
import { ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';

const RiskRadarWrapper: React.FC = () => {
    const { currentProject } = useProject();

    // Identify high-risk tickets (close to breach or breached)
    const atRiskTickets = useMemo(() => {
        if (!currentProject?.workflowSteps) return [];

        // Thresholds: Breach > 15 days (example), Warning > 7 days
        return currentProject.workflowSteps
            .filter(step => (step.totalDaysRested || 0) > 7)
            .sort((a, b) => (b.totalDaysRested || 0) - (a.totalDaysRested || 0))
            .slice(0, 6); // Top 6 risks

    }, [currentProject]);

    const getRiskLevel = (days: number) => {
        if (days > 15) return { label: 'BREACHED', color: '#ef4444', icon: <AlertCircle size={14} /> };
        if (days > 10) return { label: 'CRITICAL', color: '#f97316', icon: <ShieldAlert size={14} /> };
        return { label: 'WARNING', color: '#eab308', icon: <AlertCircle size={14} /> };
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="700" color="#64748b">ACTIVE THREAT MONITOR</Typography>
                <Chip icon={<ShieldAlert size={14} />} label={`${atRiskTickets.length} THREATS`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
                {atRiskTickets.map((ticket, i) => {
                    const days = ticket.totalDaysRested || 0;
                    const maxDays = 20; // assumed max for visual scale
                    const percentage = Math.min(100, (days / maxDays) * 100);
                    const status = getRiskLevel(days);

                    return (
                        <Box key={i} sx={{
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            p: 2,
                            bgcolor: '#f8fafc',
                            transition: '0.2s',
                            '&:hover': { bgcolor: '#fff', borderColor: status.color, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption" fontFamily="monospace" fontWeight="700" color="#475569">
                                    {ticket.ticketId}
                                </Typography>
                                <Typography variant="caption" fontWeight="800" sx={{ color: status.color }}>
                                    {days} DAYS
                                </Typography>
                            </Box>

                            <Box sx={{ height: 4, bgcolor: '#e2e8f0', borderRadius: 2, mb: 1.5, overflow: 'hidden' }}>
                                <Box sx={{ width: `${percentage}%`, height: '100%', bgcolor: status.color }} />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                    {ticket.post}
                                </Typography>
                                <Chip
                                    label={status.label}
                                    size="small"
                                    sx={{
                                        height: 16,
                                        fontSize: '0.6rem',
                                        bgcolor: `${status.color}20`,
                                        color: status.color,
                                        fontWeight: 700
                                    }}
                                />
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {atRiskTickets.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6, opacity: 0.6 }}>
                    <CheckCircle2 size={32} color="#22c55e" style={{ marginBottom: 8 }} />
                    <Typography variant="body2" color="text.secondary">No immediate breach risks detected.</Typography>
                </Box>
            )}
        </Box>
    );
};

export default RiskRadarWrapper;
