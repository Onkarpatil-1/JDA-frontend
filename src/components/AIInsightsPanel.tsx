import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { TrendingUp, AlertTriangle, Star, Lightbulb } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { AIBadge } from './AIBadge';

const AIInsightsPanel: React.FC = () => {
    const { currentProject } = useProject();

    if (!currentProject) {
        return (
            <Box sx={{
                bgcolor: 'white',
                p: 3,
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                textAlign: 'center'
            }}>
                <Lightbulb size={40} color="#cbd5e1" style={{ marginBottom: 16 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#94a3b8', mb: 1 }}>
                    No Project Selected
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload a CSV to see AI-powered insights
                </Typography>
            </Box>
        );
    }

    const { statistics } = currentProject;
    const { criticalBottleneck, anomalyCount, completionRate, topPerformers, aiInsights } = statistics;

    return (
        <Box sx={{
            bgcolor: 'white',
            p: 3,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lightbulb size={20} color="#667eea" />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        AI-Powered Insights
                    </Typography>
                </Box>
                {/* <AIBadge size="medium" /> */}
            </Box>

            {/* Critical Bottleneck */}
            {criticalBottleneck && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <AlertTriangle size={16} color="#dc2626" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#dc2626' }}>
                            CRITICAL: {criticalBottleneck.role} Bottleneck
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#7f1d1d', mb: 1.5, lineHeight: 1.6 }}>
                        {criticalBottleneck.cases} cases delayed by avg {criticalBottleneck.avgDelay} days
                        ({criticalBottleneck.thresholdExceeded}% above threshold)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 600 }}>
                        ⚡ Immediate action required
                    </Typography>
                </Box>
            )}

            {/* Trend Analysis - Using zone performance */}
            {statistics.zonePerformance && statistics.zonePerformance.length > 0 && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #fde68a' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUp size={16} color="#d97706" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d97706' }}>
                            TREND: {statistics.zonePerformance[0].name} Performance
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#78350f', mb: 1.5, lineHeight: 1.6 }}>
                        {statistics.zonePerformance[0].onTime.toFixed(1)}% on-time delivery, {statistics.zonePerformance[0].avgTime} days avg processing
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                        💡 Monitor workload distribution
                    </Typography>
                </Box>
            )}

            {/* Top Performer */}
            {topPerformers && topPerformers.length > 0 && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Star size={16} color="#16a34a" />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                            TOP PERFORMER: {topPerformers[0].name}
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#14532d', mb: 1.5, lineHeight: 1.6 }}>
                        {topPerformers[0].tasks} tasks completed, {topPerformers[0].avgTime.toFixed(1)} days avg
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>
                        ⭐ {topPerformers[0].role} excellence
                    </Typography>
                </Box>
            )}

            {/* AI-Generated Root Cause Analysis */}
            {aiInsights?.rootCause && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#faf5ff', borderRadius: 2, border: '1px solid #e9d5ff' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AlertTriangle size={16} color="#9333ea" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#9333ea' }}>
                                ROOT CAUSE ANALYSIS
                            </Typography>
                        </Box>
                        {/* <AIBadge /> */}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#581c87', lineHeight: 1.6 }}>
                        {aiInsights.rootCause.length > 200
                            ? aiInsights.rootCause.substring(0, 200) + '...'
                            : aiInsights.rootCause}
                    </Typography>
                </Box>
            )}

            {/* AI-Generated Predictions */}
            {aiInsights?.predictions && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #fde68a' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUp size={16} color="#d97706" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d97706' }}>
                                PREDICTIONS (Next 30 Days)
                            </Typography>
                        </Box>
                        {/* <AIBadge /> */}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#78350f', lineHeight: 1.6 }}>
                        {aiInsights.predictions.length > 200
                            ? aiInsights.predictions.substring(0, 200) + '...'
                            : aiInsights.predictions}
                    </Typography>
                </Box>
            )}

            {/* AI-Generated Recommendations */}
            {aiInsights?.recommendations && aiInsights.recommendations.length > 0 && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Lightbulb size={16} color="#1e40af" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e40af' }}>
                                AI RECOMMENDATIONS
                            </Typography>
                        </Box>
                        {/* <AIBadge /> */}
                    </Box>
                    <Stack spacing={1}>
                        {aiInsights.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                            <Typography key={idx} variant="body2" sx={{ color: '#1e3a8a', lineHeight: 1.6 }}>
                                {idx + 1}. {rec.length > 150 ? rec.substring(0, 150) + '...' : rec}
                            </Typography>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* Severity Indicator (if AI insights available) */}
            {aiInsights?.severity && (
                <Box sx={{ mb: 3, p: 2, bgcolor: aiInsights.severity === 'CRITICAL' ? '#fef2f2' : '#f0fdf4', borderRadius: 2, border: `1px solid ${aiInsights.severity === 'CRITICAL' ? '#fecaca' : '#bbf7d0'}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: aiInsights.severity === 'CRITICAL' ? '#dc2626' : '#16a34a', mb: 0.5 }}>
                                Severity: {aiInsights.severity}
                            </Typography>
                            <Typography variant="caption" sx={{ color: aiInsights.severity === 'CRITICAL' ? '#7f1d1d' : '#14532d' }}>
                                AI Confidence: {(aiInsights.confidence * 100).toFixed(0)}%
                            </Typography>
                        </Box>
                        {/* <AIBadge /> */}
                    </Box>
                </Box>
            )}

            {/* Stats Footer */}
            <Stack direction="row" spacing={2} sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#dc2626' }}>
                        {anomalyCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Anomalies
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#16a34a' }}>
                        {completionRate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Completion
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
};

export default AIInsightsPanel;
