import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import { AlertTriangle, TrendingUp, Sparkles, MapPin, Activity, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useProject } from '../context/ProjectContext';
import PerformanceMatrixGrid from './PerformanceMatrixGrid';
import EmployeeEfficiencyChart from './EmployeeEfficiencyChart';
import RiskRadarWrapper from './RiskRadarWrapper';

const AIInsightsBanner: React.FC = () => {
    const { currentProject } = useProject();
    const [activeTab, setActiveTab] = useState(0);

    if (!currentProject?.statistics.aiInsights) {
        return null;
    }

    const { aiInsights, criticalBottleneck } = currentProject.statistics;

    return (
        <Box sx={{ mb: 4, position: 'relative' }}>
            {/* Mission Control Header */}
            <Box sx={{
                background: '#0f172a', // Slate 900
                borderRadius: '16px 16px 0 0',
                p: 3,
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '8px',
                        bgcolor: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Activity size={20} color="#38bdf8" />
                    </Box>
                    <Box>
                        <Typography variant="overline" sx={{ color: '#94a3b8', lineHeight: 1, letterSpacing: '0.1em' }}>
                            JDA PULSE INTELLIGENCE
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 800, lineHeight: 1.2 }}>
                            MISSION CONTROL
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 4 }}>
                    <StatusIndicator label="SYSTEM STATUS" value="ONLINE" color="#10b981" />
                    <StatusIndicator label="CONFIDENCE" value={`${(aiInsights.confidence * 100).toFixed(0)}%`} color="#f59e0b" />
                    <StatusIndicator label="ANOMALIES" value={currentProject.statistics.anomalyCount} color="#ef4444" />
                    <StatusIndicator label="BOTTLENECK" value={criticalBottleneck?.role || "NONE"} color="#ec4899" />
                </Box>
            </Box>

            {/* Main Command Center Deck */}
            <Box sx={{
                bgcolor: '#1e293b', // Slate 800
                p: 3,
                borderRadius: '0 0 16px 16px',
                border: '1px solid #334155',
                borderTop: 'none'
            }}>
                {/* Top Level Criticals Row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, mb: 3 }}>

                    {/* Primary Insight / Root Cause */}
                    <Box sx={{
                        bgcolor: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        p: 2.5
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <AlertTriangle size={18} color="#ef4444" />
                            <Typography variant="subtitle2" sx={{ color: '#ef4444', fontWeight: 700, letterSpacing: '0.05em' }}>
                                CRITICAL ROOT CAUSE DETECTED
                            </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ color: '#e2e8f0', fontWeight: 500, fontFamily: 'monospace', mb: 2 }}>
                            {aiInsights.rootCause}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            {aiInsights.recommendations.slice(0, 2).map((rec, i) => (
                                <Box key={i} sx={{
                                    flex: 1,
                                    bgcolor: 'rgba(56, 189, 248, 0.1)',
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                    borderRadius: '8px',
                                    p: 1.5
                                }}>
                                    <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700, display: 'block', mb: 0.5 }}>
                                        ACTION {i + 1}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#bae6fd' }}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{rec}</ReactMarkdown>
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Prediction / Risk Monitor */}
                    <Box sx={{
                        bgcolor: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        p: 2.5,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <TrendingUp size={18} color="#f59e0b" />
                            <Typography variant="subtitle2" sx={{ color: '#f59e0b', fontWeight: 700, letterSpacing: '0.05em' }}>
                                30-DAY RISK FORECAST
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <Typography variant="body2" component="div" sx={{ color: '#cbd5e1', fontSize: '0.85rem', '& p': { m: 0, mb: 1 } }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiInsights.predictions}</ReactMarkdown>
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Second Row: Detailed Intelligence */}
                <Box sx={{
                    bgcolor: 'white',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, n) => setActiveTab(n)}
                        sx={{
                            borderBottom: '1px solid #e2e8f0',
                            bgcolor: '#f1f5f9',
                            minHeight: 48,
                            '& .MuiTab-root': { py: 1.5, minHeight: 48, fontWeight: 700, fontSize: '0.75rem' }
                        }}
                    >
                        <Tab label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Activity size={16} /> DEEP DIAGNOSTICS
                            </Box>
                        } />
                        <Tab label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MapPin size={16} /> ZONE PERFORMANCE
                            </Box>
                        } />
                        <Tab label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ShieldAlert size={16} /> BREACH RISKS
                            </Box>
                        } />
                        {/* <Tab label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AlertTriangle size={16} /> BEHAVIORAL RED FLAGS
                            </Box>
                        } /> */}
                        <Tab label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Sparkles size={16} /> REMARK ANALYSIS (NLP)
                            </Box>
                        } />
                    </Tabs>

                    <Box sx={{ p: 0, bgcolor: '#fff', minHeight: 300 }}>
                        <TabPanel value={activeTab} index={0}>
                            <EmployeeEfficiencyChart />
                        </TabPanel>
                        <TabPanel value={activeTab} index={1}>
                            <Box sx={{ p: 2 }}>
                                <PerformanceMatrixGrid data={currentProject?.workflowSteps || []} onFilter={() => { }} />
                            </Box>
                        </TabPanel>
                        <TabPanel value={activeTab} index={2}>
                            <RiskRadarWrapper />
                        </TabPanel>
                    </Box>
                </Box>
            </Box>

            {/* Styles reuse */}
            <style>{`
                .markdown-table-container table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
                .markdown-table-container th { text-align: left; padding: 12px; background: #f8fafc; color: #475569; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
                .markdown-table-container td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
                .markdown-table-container tr:hover { background: #f1f5f9; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.05); }
                }
            `}</style>
        </Box>
    );
};

const StatusIndicator = ({ label, value, color }: any) => (
    <Box>
        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, display: 'block' }}>
            {label}
        </Typography>
        <Typography variant="subtitle2" sx={{ color: color, fontWeight: 700, fontFamily: 'monospace' }}>
            {value}
        </Typography>
    </Box>
);

const TabPanel = (props: { children?: React.ReactNode, index: number, value: number }) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && children}
        </div>
    );
};

export default AIInsightsBanner;
