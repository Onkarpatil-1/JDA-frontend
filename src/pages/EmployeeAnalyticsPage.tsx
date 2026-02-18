import React from 'react';
import { Box } from '@mui/material';
import EmployeeAnalyticsDashboard from '../components/EmployeeAnalyticsDashboard';

const EmployeeAnalyticsPage: React.FC = () => {
    return (
        <Box sx={{ width: '100%', height: '100%', overflow: 'auto', bgcolor: '#f8fafc' }}>
            <EmployeeAnalyticsDashboard />
        </Box>
    );
};

export default EmployeeAnalyticsPage;
