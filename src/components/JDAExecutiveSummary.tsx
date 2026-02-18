import React, { useMemo } from 'react';
import { Box, Typography, Paper, Card, CardContent } from '@mui/material';
import {
    AlertTriangle,
    Clock,
    DollarSign,
    TrendingDown,
    Activity
} from 'lucide-react';
import type { JDAIntelligence } from '../types';

interface JDAExecutiveSummaryProps {
    data: JDAIntelligence;
}

const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: string; isPositive: boolean };
}> = ({ title, value, subtitle, icon, color, trend }) => (
    <Card elevation={0} sx={{ border: '1px solid #e2e8f0', height: '100%', borderRadius: 2 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${color}15` }}>
                    {icon}
                </Box>
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: trend.isPositive ? '#ecfdf5' : '#fef2f2', px: 1, py: 0.5, borderRadius: 1 }}>
                        <Activity size={14} color={trend.isPositive ? '#10b981' : '#ef4444'} />
                        <Typography variant="caption" sx={{ color: trend.isPositive ? '#059669' : '#dc2626', fontWeight: 600 }}>
                            {trend.value}
                        </Typography>
                    </Box>
                )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, letterSpacing: '-0.02em' }}>
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {title}
            </Typography>
            {subtitle && (
                <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                    {subtitle}
                </Typography>
            )}
        </CardContent>
    </Card>
);

export const JDAExecutiveSummary: React.FC<JDAExecutiveSummaryProps> = ({ data }) => {
    // 1. Calculate Metrics
    const metrics = useMemo(() => {
        const uniqueTickets = new Set<string>();
        const delayedUniqueTickets = new Set<string>();
        const ticketDelayMap = new Map<string, number>();
        const deptDelays: Record<string, number> = {};

        data.departments.forEach(dept => {
            dept.parentServices.forEach(ps => {
                ps.services.forEach(s => {
                    s.tickets.forEach(t => {
                        // Filter out applicant/citizen/system from counts
                        const role = (t.stepOwnerRole || '').toUpperCase();
                        const name = (t.stepOwnerName || '').toUpperCase();
                        if (['APPLICANT', 'CITIZEN', 'SYSTEM'].includes(role) ||
                            ['APPLICANT', 'CITIZEN', 'SYSTEM'].includes(name)) return;

                        uniqueTickets.add(t.ticketId);

                        // Track total delay per ticket
                        ticketDelayMap.set(t.ticketId, (ticketDelayMap.get(t.ticketId) || 0) + (t.daysRested || 0));

                        if (t.daysRested > 7) {
                            if (!delayedUniqueTickets.has(t.ticketId)) {
                                delayedUniqueTickets.add(t.ticketId);
                                // Track by department
                                deptDelays[dept.name] = (deptDelays[dept.name] || 0) + 1;
                            }
                        }
                    });
                });
            });
        });

        const totalTickets = uniqueTickets.size;
        const delayedTickets = delayedUniqueTickets.size;
        const totalDelayDays = Array.from(ticketDelayMap.values()).reduce((sum, d) => sum + d, 0);
        const avgDelay = delayedTickets > 0 ? Math.round(totalDelayDays / totalTickets) : 0; // Avg delay of ALL unique tickets or just delayed ones? Usually ALL tickets' processing time.
        const estimatedRevenueLoss = (delayedTickets * 15000).toLocaleString(); // Projection: 15k INR per delayed impact

        // 2. Find Top Bottleneck Dept/Zones
        const sortedDepts = Object.entries(deptDelays).sort(([, a], [, b]) => b - a);
        const topBottleneck = sortedDepts.length > 0 ? sortedDepts[0] : ['-', 0];

        // 3. Find Top 3 Bottleneck Services
        const serviceDelays: Record<string, { count: number, zones: Set<string> }> = {};
        data.departments.forEach(dept => {
            dept.parentServices.forEach(ps => {
                ps.services.forEach(s => {
                    const uniqueCriticalForService = new Set<string>();
                    s.tickets.forEach(t => {
                        const role = (t.stepOwnerRole || '').toUpperCase();
                        const name = (t.stepOwnerName || '').toUpperCase();
                        if (['APPLICANT', 'CITIZEN', 'SYSTEM'].includes(role) ||
                            ['APPLICANT', 'CITIZEN', 'SYSTEM'].includes(name)) return;

                        if (t.daysRested > 7) {
                            uniqueCriticalForService.add(t.ticketId);
                        }
                    });

                    if (uniqueCriticalForService.size > 0) {
                        if (!serviceDelays[s.name]) serviceDelays[s.name] = { count: 0, zones: new Set() };
                        serviceDelays[s.name].count += uniqueCriticalForService.size;
                        serviceDelays[s.name].zones.add(dept.name.split('(')[0].trim());
                    }
                });
            });
        });

        const top3Bottlenecks = Object.entries(serviceDelays)
            .map(([name, stats]) => ({
                name,
                count: stats.count,
                zones: Array.from(stats.zones).slice(0, 2).join(' • ')
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);

        return {
            totalTickets,
            delayedTickets,
            avgDelay,
            estimatedRevenueLoss,
            topBottleneck,
            top3Bottlenecks
        };
    }, [data]);

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            {/* KPI Grid */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                gap: 3,
                mb: 4
            }}>
                <MetricCard
                    title="Projected Revenue Impact*"
                    value={`₹${metrics.estimatedRevenueLoss}`}
                    subtitle="Est. ₹15k opportunity cost per delayed file"
                    icon={<DollarSign size={24} color="#ef4444" />}
                    color="#ef4444"
                />
                <MetricCard
                    title="Critical Delays"
                    value={metrics.delayedTickets}
                    subtitle={`${Math.round((metrics.delayedTickets / metrics.totalTickets) * 100)}% of files stalled`}
                    icon={<AlertTriangle size={24} color="#f59e0b" />}
                    color="#f59e0b"
                />
                <MetricCard
                    title="Avg. Delay Duration"
                    value={`${metrics.avgDelay} Days`}
                    subtitle="Average idle time per stalled file"
                    icon={<Clock size={24} color="#3b82f6" />}
                    color="#3b82f6"
                />
                <MetricCard
                    title="Top Bottleneck Zone"
                    value={(metrics.topBottleneck[0] as string).split('(')[0].replace('Deputy Commissioner', 'Zone').trim()}
                    subtitle={`${metrics.topBottleneck[1]} critical files pending`}
                    icon={<TrendingDown size={24} color="#6366f1" />}
                    color="#6366f1"
                />
            </Box>

            {/* Top Bottleneck Analysis (Dynamic) */}
            <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#0f172a' }}>
                    Top {metrics.top3Bottlenecks.length} Bottleneck Areas
                </Typography>
                <Box>
                    {metrics.top3Bottlenecks.map((item, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: i < metrics.top3Bottlenecks.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
                                    {i + 1}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155' }}>
                                        {item.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {item.zones}
                                    </Typography>
                                </Box>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#ef4444' }}>
                                {item.count} Critical Files
                            </Typography>
                        </Box>
                    ))}
                    {metrics.top3Bottlenecks.length === 0 && (
                        <Typography variant="body2" color="text.secondary">No critical bottlenecks detected.</Typography>
                    )}
                </Box>
            </Paper>

        </Box>
    );
};
