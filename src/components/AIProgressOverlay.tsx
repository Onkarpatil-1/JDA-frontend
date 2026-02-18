import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { Sparkles, CheckCircle, Terminal } from 'lucide-react';

interface ProgressEvent {
    stage: string;
    progress: number;
    details?: string;
}

const AIProgressOverlay: React.FC = () => {
    const [progress, setProgress] = useState<ProgressEvent | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const eventSource = new EventSource('http://localhost:3001/api/v1/progress');

        eventSource.onmessage = (event) => {
            const data: ProgressEvent = JSON.parse(event.data);
            setProgress(data);

            if (data.stage !== 'Idle') {
                const timestamp = new Date().toLocaleTimeString();
                setLogs(prev => [...prev, `[${timestamp}] ${data.stage}: ${data.details || ''}`].slice(-5)); // Keep last 5 logs
            }
        };

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (!progress || progress.stage === 'Idle') return null;

    return (
        <Box sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: 400,
            animation: 'slideIn 0.3s ease-out'
        }}>
            <Paper elevation={4} sx={{
                bgcolor: '#0f172a', // Slate 900
                border: '1px solid #1e293b',
                borderRadius: 2,
                overflow: 'hidden'
            }}>
                {/* Header */}
                <Box sx={{
                    p: 2,
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    bgcolor: 'rgba(56, 189, 248, 0.1)'
                }}>
                    <Sparkles size={18} color="#38bdf8" className="animate-pulse" />
                    <Typography variant="subtitle2" sx={{ color: '#f8fafc', fontWeight: 700 }}>
                        AI REASONING ENGINE
                    </Typography>
                </Box>

                {/* Body */}
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                            CURRENT TASK
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 700 }}>
                            {progress.progress}%
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: '#e2e8f0', mb: 2, fontWeight: 500 }}>
                        {progress.stage}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress.progress}
                        sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#1e293b',
                            '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' }
                        }}
                    />

                    {/* Terminal Log */}
                    <Box sx={{
                        mt: 3,
                        bgcolor: '#020617',
                        p: 1.5,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.7rem',
                        color: '#4ade80',
                        height: 100,
                        overflowY: 'auto'
                    }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: 4, opacity: i === logs.length - 1 ? 1 : 0.6 }}>
                                <span style={{ marginRight: 6 }}>$</span>
                                {log}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </Box>
                </Box>
            </Paper>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .5; }
                }
            `}</style>
        </Box>
    );
};

export default AIProgressOverlay;
