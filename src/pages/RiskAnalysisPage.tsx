import React from 'react';
import { Box, Typography, Grid, Card, LinearProgress, Stack, Avatar, Chip } from '@mui/material';
import { ShieldAlert, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const RiskAnalysisPage: React.FC = () => {
    const { currentProject } = useProject();

    if (!currentProject) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#94a3b8', mb: 2 }}>
                    No Project Selected
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Upload a CSV file to view risk analysis
                </Typography>
            </Box>
        );
    }

    const { statistics } = currentProject;
    const highRiskItems = statistics.riskApplications.slice(0, 3).map(app => ({
        id: app.id,
        factor: `${app.delay} days delay at ${app.role} stage`,
        probability: Math.min(app.risk, 100),
        impact: app.category,
        area: app.zone,
        zScore: app.zScore
    }));

    return (
        <Box>
            <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ fontFamily: 'Outfit', mb: 4 }}>
                Predictive Risk Intelligence
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>Active Risk Indicators</Typography>
                        <Stack spacing={3}>
                            {highRiskItems.map((item) => (
                                <Box key={item.id} sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                                <ShieldAlert size={20} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="700">{item.id}</Typography>
                                                <Typography variant="caption" color="text.secondary">{item.factor}</Typography>
                                            </Box>
                                        </Stack>
                                        <Chip label={item.impact} size="small" color="error" variant="outlined" sx={{ fontWeight: 600 }} />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={item.probability}
                                                sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#ef4444' } }}
                                            />
                                        </Box>
                                        <Typography variant="caption" fontWeight="bold" color="#ef4444">
                                            {item.probability}% Breach Probability
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Stack spacing={3}>
                        <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                            <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>Global Risk Trends</Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <TrendingUp size={16} color="#ef4444" />
                                        <Typography variant="body2" color="text.secondary">Critical Anomalies</Typography>
                                    </Stack>
                                    <Typography variant="subtitle2" fontWeight="700">{statistics.anomalyCount} cases</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Clock size={16} color="#3b82f6" />
                                        <Typography variant="body2" color="text.secondary">Avg. Processing Time</Typography>
                                    </Stack>
                                    <Typography variant="subtitle2" fontWeight="700">{statistics.avgDaysRested.toFixed(1)} Days</Typography>
                                </Box>
                            </Stack>
                        </Card>

                        <Box sx={{ p: 3, bgcolor: '#0f172a', borderRadius: 3, color: 'white' }}>
                            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                                <AlertCircle color="#3b82f6" />
                                <Typography variant="subtitle2" fontWeight="700">AI Priority Suggestion</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ opacity: 0.8, lineHeight: 1.6 }}>
                                {statistics.criticalBottleneck
                                    ? `Focus on optimizing ${statistics.criticalBottleneck.role} stage. This could reduce the ${statistics.criticalBottleneck.cases} delayed cases by 70% and save ${statistics.criticalBottleneck.avgDelay} days on average.`
                                    : 'System running efficiently. Continue monitoring for anomalies.'}
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default RiskAnalysisPage;
