import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { ArrowUpRight, ArrowDownRight, Minus, AppWindow, ShieldAlert, Zap, Clock } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    trend: string;
    status: 'success' | 'warning' | 'error' | 'info';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, trend, status }) => {
    const getIcon = () => {
        switch (title) {
            case 'On-Time Delivery %': return <AppWindow size={20} />;
            case 'Applications at SLA Risk': return <ShieldAlert size={20} />;
            case 'Anomalies Detected Today': return <Zap size={20} />;
            default: return <Clock size={20} />;
        }
    };

    const getColors = () => {
        switch (status) {
            case 'success': return { main: '#10b981', bg: '#ecfdf5', text: '#065f46' };
            case 'warning': return { main: '#f59e0b', bg: '#fffbeb', text: '#92400e' };
            case 'error': return { main: '#ef4444', bg: '#fef2f2', text: '#991b1b' };
            default: return { main: '#3b82f6', bg: '#eff6ff', text: '#1e40af' };
        }
    };

    const colors = getColors();
    const isPositive = trend.startsWith('+');
    const isNeutral = trend.startsWith('0') || trend === '-';

    return (
        <Card sx={{
            borderRadius: 4,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 4px 6px -1px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)'
            },
            height: '100%'
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{
                        p: 1.2,
                        borderRadius: 2.5,
                        bgcolor: colors.bg,
                        color: colors.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {getIcon()}
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: isNeutral ? '#64748b' : (isPositive ? '#10b981' : '#ef4444'),
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: isNeutral ? '#f1f5f9' : (isPositive ? '#ecfdf5' : '#fef2f2'),
                        px: 1,
                        py: 0.3,
                        borderRadius: 1.5
                    }}>
                        {isNeutral ? <Minus size={12} /> : (isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
                        <Typography variant="caption" sx={{ ml: 0.3, fontWeight: 700 }}>{trend}</Typography>
                    </Box>
                </Box>

                <Typography variant="caption" color="#64748b" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a', fontFamily: 'Outfit !important' }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default KPICard;
