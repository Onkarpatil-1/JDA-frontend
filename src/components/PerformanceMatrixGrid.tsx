import React, { useMemo } from 'react';
import { Box, Typography, Tooltip, Paper } from '@mui/material';


import type { WorkflowStep } from '../types';

const PerformanceMatrixGrid: React.FC<{ data: WorkflowStep[], onFilter: (zone: string | null, role: string | null) => void }> = ({ data: inputData, onFilter }) => {


    const matrixData = useMemo(() => {
        if (!inputData || inputData.length === 0) return { zones: [], roles: [], data: {} };

        const zones = new Set<string>();
        const roles = new Set<string>();
        const data: Record<string, Record<string, { count: number, totalDelay: number }>> = {};

        inputData.forEach(step => {
            if (!step.zoneId || !step.post) return;
            // Clean up zone/role names
            const zone = step.zoneId.replace('Zone ', 'Z');
            const role = step.post;

            zones.add(zone);
            roles.add(role);

            if (!data[role]) data[role] = {};
            if (!data[role][zone]) data[role][zone] = { count: 0, totalDelay: 0 };

            data[role][zone].count++;
            data[role][zone].totalDelay += (step.totalDaysRested || 0);
        });

        return {
            zones: Array.from(zones).sort(),
            roles: Array.from(roles).sort(),
            data
        };
    }, [inputData]);



    return (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a', fontFamily: 'Outfit' }}>
                        EFFICIENCY HEATMAP
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Avg. Delay by Role & Zone
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ width: 16, height: 16, bgcolor: '#eff6ff', borderRadius: 0.5, border: '1px solid #dbeafe' }} title="< 2 Days" />
                    <Box sx={{ width: 16, height: 16, bgcolor: '#93c5fd', borderRadius: 0.5 }} title="2-5 Days" />
                    <Box sx={{ width: 16, height: 16, bgcolor: '#3b82f6', borderRadius: 0.5 }} title="5-10 Days" />
                    <Box sx={{ width: 16, height: 16, bgcolor: '#1e3a8a', borderRadius: 0.5 }} title="> 10 Days" />
                </Box>
            </Box>

            <Box sx={{ overflowX: 'auto', pb: 1 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: `180px repeat(${matrixData.zones.length}, 1fr)`, borderTop: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>
                    {/* Header Row */}
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" fontWeight="bold" color="#64748b">ROLE / ZONE</Typography>
                    </Box>
                    {matrixData.zones.map(zone => (
                        <Box key={zone} sx={{ p: 1.5, bgcolor: '#f8fafc', textAlign: 'center', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                            <Typography variant="caption" fontWeight="700" color="#475569">{zone}</Typography>
                        </Box>
                    ))}

                    {/* Data Rows */}
                    {matrixData.roles.map(role => (
                        <React.Fragment key={role}>
                            {/* Row Label */}
                            <Box sx={{
                                p: 1.5,
                                bgcolor: '#fff',
                                borderBottom: '1px solid #e2e8f0',
                                borderRight: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Typography variant="caption" fontWeight="600" color="#334155" noWrap title={role}>
                                    {role}
                                </Typography>
                            </Box>

                            {/* Cells */}
                            {matrixData.zones.map(zone => {
                                const cell = matrixData.data[role]?.[zone];
                                const avgDelay = cell ? cell.totalDelay / cell.count : 0;

                                // Blue Scale Colors
                                let bg = '#fff';
                                let text = '#94a3b8';

                                if (cell) {
                                    if (avgDelay > 10) { bg = '#1e3a8a'; text = 'white'; } // Navy
                                    else if (avgDelay > 5) { bg = '#3b82f6'; text = 'white'; } // Blue 500
                                    else if (avgDelay > 2) { bg = '#93c5fd'; text = '#1e3a8a'; } // Blue 300
                                    else { bg = '#eff6ff'; text = '#3b82f6'; } // Blue 50
                                }

                                return (
                                    <Tooltip
                                        key={`${role}-${zone}`}
                                        title={cell ? `${role} in ${zone}: ${cell.count} cases, Avg Delay ${avgDelay.toFixed(1)} days` : 'No Data'}
                                        arrow
                                    >
                                        <Box
                                            onClick={() => cell && onFilter(zone, role)}
                                            sx={{
                                                height: 48,
                                                bgcolor: cell ? bg : '#fff',
                                                borderBottom: '1px solid #e2e8f0',
                                                borderRight: '1px solid #e2e8f0',
                                                cursor: cell ? 'pointer' : 'default',
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: cell ? bg : '#f8fafc', filter: 'brightness(0.95)' },
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {cell && (
                                                <>
                                                    <Typography variant="body2" sx={{ color: text, fontWeight: 700, lineHeight: 1 }}>
                                                        {avgDelay.toFixed(0)}d
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: text, opacity: 0.7, fontSize: '0.6rem' }}>
                                                        {cell.count}
                                                    </Typography>
                                                </>
                                            )}
                                        </Box>
                                    </Tooltip>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </Box>
            </Box>
        </Paper>
    );
};

export default PerformanceMatrixGrid;
