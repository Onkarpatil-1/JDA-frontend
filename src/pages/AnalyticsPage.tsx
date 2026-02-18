import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import AnalyticsSection from '../components/AnalyticsSection';
import { useProject } from '../context/ProjectContext';

const AnalyticsPage: React.FC = () => {
    const { currentProject } = useProject();

    if (!currentProject) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#94a3b8', mb: 2 }}>
                    No Project Selected
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Upload a CSV file to view performance analytics
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ fontFamily: 'Outfit', mb: 4 }}>
                Performance Analytics
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <AnalyticsSection
                        zoneData={currentProject.statistics.zonePerformance}
                        deptData={currentProject.statistics.deptPerformance}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default AnalyticsPage;
