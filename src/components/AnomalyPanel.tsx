import React from 'react';
import { Box, Typography, Card, CardContent, Chip, Stack } from '@mui/material';
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Anomaly {
    id: string;
    type: string;
    explanation: string;
    severity: string;
}

interface Props {
    data: Anomaly[];
}

const AnomalyPanel: React.FC<Props> = ({ data }) => {
    const getSeverityStyles = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'high': return { icon: <AlertCircle color="#ef4444" size={20} />, color: '#ef4444', bg: '#fef2f2', chip: 'error' };
            case 'medium': return { icon: <AlertTriangle color="#f59e0b" size={20} />, color: '#f59e0b', bg: '#fffbeb', chip: 'warning' };
            default: return { icon: <ShieldCheck color="#10b981" size={20} />, color: '#10b981', bg: '#ecfdf5', chip: 'success' };
        }
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit !important' }}>
                    Process Anomalies
                </Typography>
                <Chip label={`${data.length} Detected`} size="small" sx={{ fontWeight: 600, bgcolor: '#f1f5f9' }} />
            </Box>

            <Stack spacing={2}>
                {data.map((item, index) => {
                    const styles = getSeverityStyles(item.severity);
                    return (
                        <Card
                            key={index}
                            elevation={0}
                            sx={{
                                borderRadius: 3,
                                border: '1px solid #e2e8f0',
                                transition: 'all 0.2s ease',
                                '&:hover': { border: `1px solid ${styles.color}`, transform: 'scale(1.01)' }
                            }}
                        >
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        bgcolor: styles.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        {styles.icon}
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                                {item.type}
                                            </Typography>
                                            <Chip
                                                label={item.id}
                                                size="small"
                                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f8fafc' }}
                                            />
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.4 }}>
                                            {item.explanation}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Stack>
        </Box>
    );
};

export default AnomalyPanel;
