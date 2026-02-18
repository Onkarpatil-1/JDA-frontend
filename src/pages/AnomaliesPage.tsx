import React, { useState, useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useProject } from '../context/ProjectContext';
import PerformanceMatrixGrid from '../components/PerformanceMatrixGrid';
import AnomalyIntelligenceTable from '../components/AnomalyIntelligenceTable';
import type { WorkflowStep } from '../types';

const AnomaliesPage: React.FC = () => {
    const { currentProject } = useProject();
    const [filter, setFilter] = useState<{ zone: string | null, role: string | null }>({ zone: null, role: null });

    // Handle filter from heatmap
    const handleHeatmapFilter = (zone: string | null, role: string | null) => {
        setFilter({ zone, role });
    };

    // Derived Data with Centralized Logic
    const {
        visualizedData, // Data for Heatmap & Table (Cleaned & Deduplicated)
        filteredForTable // Data specifically for the Table (after Zone/Role click)
    } = useMemo(() => {
        if (!currentProject?.workflowSteps) return { visualizedData: [], filteredForTable: [] };

        const allSteps = currentProject.workflowSteps;

        // 1. Clean & Deduplicate
        // Group by TicketID + Role to find the "worst" step for that role in that ticket
        const uniqueStepsMap = new Map<string, WorkflowStep>();

        allSteps.forEach(step => {
            // Exclude Applicants/Citizens
            const role = (step.post || '').toUpperCase();
            const owner = (step.employeeName || '').toUpperCase();
            if (role.includes('APPLICANT') || role.includes('CITIZEN') || owner.includes('APPLICANT') || owner.includes('CITIZEN')) {
                return;
            }

            const key = `${step.ticketId}-${step.post}`;
            const currentMax = uniqueStepsMap.get(key);

            if (!currentMax || (step.totalDaysRested || 0) > (currentMax.totalDaysRested || 0)) {
                uniqueStepsMap.set(key, step);
            }
        });

        const cleanedSteps = Array.from(uniqueStepsMap.values());

        // 2. Identify Anomalies (Threshold > 5 days) for the Table
        const anomalies = cleanedSteps.filter(step => (step.totalDaysRested || 0) > 5);

        // 3. Apply Heatmap Filters (Zone/role click)
        let tableData = anomalies;
        if (filter.zone && filter.role) {
            tableData = cleanedSteps.filter(a =>
                (a.zoneId?.includes(filter.zone!) || false) &&
                a.post === filter.role
            );
        }

        return {
            visualizedData: cleanedSteps, // Show FULL grid in heatmap
            filteredForTable: tableData
        };
    }, [currentProject, filter]);

    if (!currentProject) return null;

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="800" color="#0f172a" sx={{ fontFamily: 'Outfit', letterSpacing: '-0.02em' }}>
                        Operational Performance Matrix
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                        Real-time heatmap of operational efficiency and bottleneck detection.
                    </Typography>
                </Box>
                {filter.zone && (
                    <Chip
                        label={`FILTER: ${filter.role} in ${filter.zone}`}
                        onDelete={() => setFilter({ zone: null, role: null })}
                        color="primary"
                        sx={{ fontWeight: 700 }}
                    />
                )}
            </Box>



            {/* Detailed Table Section (Moved Up) */}
            <Box sx={{ mb: 4 }}>
                <AnomalyIntelligenceTable
                    data={filteredForTable as WorkflowStep[]}
                />
            </Box>

            {/* Heatmap Section */}
            <Box sx={{ mb: 4 }}>
                <PerformanceMatrixGrid data={visualizedData} onFilter={handleHeatmapFilter} />
            </Box>
        </Box>
    );
};



export default AnomaliesPage;
