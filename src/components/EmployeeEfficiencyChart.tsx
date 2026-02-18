import React, { useMemo } from 'react';
import { Box, Typography, LinearProgress, Avatar } from '@mui/material';
import { useProject } from '../context/ProjectContext';

const EmployeeEfficiencyChart: React.FC = () => {
    const { currentProject } = useProject();

    const employeeStats = useMemo(() => {
        if (!currentProject?.workflowSteps) return [];

        const stats: Record<string, { count: number, totalDelay: number, role: string }> = {};

        // Use pre-calculated behaviorMetrics if available
        if (currentProject.statistics.behaviorMetrics?.employeeRemarks) {
            return currentProject.statistics.behaviorMetrics.employeeRemarks.map(e => ({
                name: e.employeeName,
                avgDelay: 0,
                score: e.anomalyScore,
                role: 'Officer'
            })).sort((a, b) => b.score - a.score).slice(0, 5);
        }

        // Fallback: Aggregate by Post from workflowSteps
        currentProject.workflowSteps.forEach(step => {
            const key = step.post || 'Unknown';
            if (!stats[key]) stats[key] = { count: 0, totalDelay: 0, role: key };
            stats[key].count++;
            stats[key].totalDelay += (step.totalDaysRested || 0);
        });

        return Object.values(stats)
            .map(s => ({
                name: s.role,
                avgDelay: s.totalDelay / s.count,
                score: s.totalDelay / s.count, // Using avg delay as score for fallback
                role: 'Role Group'
            }))
            .sort((a, b) => b.avgDelay - a.avgDelay)
            .slice(0, 5);

    }, [currentProject]);

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" color="#64748b">PERFORMANCE RANKING (WORST DELAYS)</Typography>
                <Typography variant="caption" color="#94a3b8">Top 5 Bottlenecks</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {employeeStats.map((emp, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: index === 0 ? '#ef4444' : '#3b82f6' }}>
                                    {emp.name.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" fontWeight="600" color="#1e293b">
                                    {emp.name}
                                </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight="700" color={index === 0 ? '#ef4444' : '#64748b'}>
                                {emp.score.toFixed(1)} Days Avg
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={Math.min(100, (emp.score / (employeeStats[0]?.score || 1)) * 100)}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: '#f1f5f9',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: index === 0 ? '#ef4444' : (index === 1 ? '#f97316' : '#3b82f6')
                                }
                            }}
                        />
                    </Box>
                ))}
            </Box>

            {employeeStats.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No employee performance data available.
                </Typography>
            )}
        </Box>
    );
};

export default EmployeeEfficiencyChart;
