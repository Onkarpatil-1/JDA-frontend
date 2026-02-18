import React, { useMemo } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useProject } from '../context/ProjectContext';
import { AlertTriangle, Flag, ArrowRight } from 'lucide-react';

const BehavioralRedFlagsTable: React.FC = () => {
    const { currentProject } = useProject();

    const redFlags = useMemo(() => {
        if (!currentProject?.statistics.behaviorMetrics?.redFlags) return [];
        return currentProject.statistics.behaviorMetrics.redFlags;
    }, [currentProject]);

    // If no explicit red flags from backend, simpler fallback or use parsed 'Process Loops'
    const displayFlags = redFlags.length > 0 ? redFlags : [
        // Mock fallback if API returns empty but we want to show UI structure
        // In real app, we might show "No anomalies" empty state
    ];

    if (displayFlags.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: '#94a3b8' }}>
                <Flag size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <Typography variant="body2">No behavioral anomalies currently detected.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gap: 2 }}>
                {displayFlags.map((flag, index) => (
                    <Paper key={index} elevation={0} sx={{
                        p: 2,
                        border: '1px solid #fed7aa',
                        bgcolor: '#fff7ed',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2
                    }}>
                        <Box sx={{ mt: 0.5, p: 1, bgcolor: '#ffedd5', borderRadius: '50%' }}>
                            <AlertTriangle size={18} color="#f97316" />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="subtitle2" fontWeight="800" color="#c2410c">
                                    {flag.type.toUpperCase()}
                                </Typography>
                                <Typography variant="caption" fontWeight="700" color={flag.severity === 'CRITICAL' ? '#ef4444' : '#f97316'}>
                                    {flag.severity}
                                </Typography>
                            </Box>

                            <Typography variant="body2" sx={{ color: '#431407', mb: 1, fontWeight: 500 }}>
                                {flag.entity}
                            </Typography>

                            <Typography variant="body2" sx={{ color: '#9a3412', fontSize: '0.85rem', bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px dashed #fdba74' }}>
                                Evidence: {flag.evidence}
                            </Typography>
                        </Box>

                        <Button
                            size="small"
                            variant="text"
                            endIcon={<ArrowRight size={14} />}
                            sx={{ color: '#c2410c', alignSelf: 'center', fontWeight: 700 }}
                        >
                            INVESTIGATE
                        </Button>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
};

export default BehavioralRedFlagsTable;
