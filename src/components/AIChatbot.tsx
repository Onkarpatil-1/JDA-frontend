import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, IconButton, List, ListItem,
    Chip, Avatar, Button, Stack, CircularProgress, Fade
} from '@mui/material';
import { Send, Bot, X, Sparkles, MessageCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import API_BASE from '../lib/api';
const AIChatbot: React.FC = () => {
    const { currentProject } = useProject();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello Officer. I am your AI Assistant. How can I help you with SLA management today?', timestamp: '12:00 PM' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const suggestedQuestions = [
        "Why is this application marked high risk?",
        "What documents are missing?",
        "Which SOP applies to this service?",
        "How can I avoid SLA breach here?"
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage = {
            role: 'user',
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Build conversation history (exclude timestamps, only role and content)
            const conversationHistory = messages.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
            }));

            // Call Ollama backend API with conversation history
            const response = await fetch(`${API_BASE}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: text,
                    conversationHistory: conversationHistory,
                    context: {
                        projectId: currentProject?.metadata?.id,
                        system: 'Government SLA Intelligence System',
                        data_source: 'Real ticket workflow data',
                        capabilities: [
                            'Anomaly detection in processing times',
                            'Workload prediction',
                            'Bottleneck identification',
                            'SLA compliance analysis'
                        ]
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer || 'I apologize, but I could not generate a response. Please try again.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } catch (error) {
            console.error('AI Chat Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ I\'m having trouble connecting to the AI service. Please ensure the Ollama backend is running on port 3001.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <Fade in={!isOpen}>
                    <Button
                        variant="contained"
                        onClick={() => setIsOpen(true)}
                        sx={{
                            position: 'fixed',
                            bottom: 32,
                            right: 32,
                            borderRadius: '12px', // Less round
                            textTransform: 'none',
                            px: 3,
                            py: 1.5,
                            bgcolor: '#3b82f6', // Blue 500
                            color: 'white',
                            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)', // Blue shadow
                            display: 'flex',
                            gap: 1.5,
                            zIndex: 1000,
                            fontSize: '1rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(59, 130, 246, 0.5)',
                                bgcolor: '#2563eb', // Blue 600
                            }
                        }}
                    >
                        <Sparkles size={20} />
                        AI Assistant
                    </Button>
                </Fade>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <Fade in={isOpen}>
                    <Paper
                        elevation={24}
                        sx={{
                            position: 'fixed',
                            bottom: 32,
                            right: 32,
                            width: 480,
                            height: 700,
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 4,
                            overflow: 'hidden',
                            zIndex: 1001,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        {/* Header with Solid Light Theme */}
                        <Box sx={{
                            p: 2.5,
                            bgcolor: 'white',
                            color: '#0f172a', // Slate 900
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{
                                    bgcolor: '#eff6ff', // Blue 50
                                    width: 40,
                                    height: 40,
                                    border: '1px solid #bfdbfe'
                                }}>
                                    <Bot color="#3b82f6" size={24} />
                                </Avatar>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="h6" fontSize="1rem" fontWeight="700">
                                            AI Officer Assistant
                                        </Typography>
                                        {/* <AIBadge size="small" /> */}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            bgcolor: '#10b981', // Emerald 500
                                        }} />
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                            Online • SLA Intelligence
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => setIsOpen(false)}
                                sx={{
                                    color: '#94a3b8',
                                    '&:hover': {
                                        color: '#334155',
                                        bgcolor: '#f1f5f9'
                                    }
                                }}
                            >
                                <X size={20} />
                            </IconButton>
                        </Box>

                        {/* Messages Area */}
                        <Box sx={{
                            flexGrow: 1,
                            overflowY: 'auto',
                            p: 3,
                            bgcolor: '#f8fafc', // Slate 50
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(0, 0, 0, 0.1)',
                                borderRadius: '10px'
                            }
                        }}>
                            <List disablePadding>
                                {messages.map((msg, idx) => (
                                    <ListItem key={idx} sx={{
                                        flexDirection: 'column',
                                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        px: 0,
                                        py: 1
                                    }}>
                                        <Box sx={{
                                            maxWidth: '85%',
                                            bgcolor: msg.role === 'user' ? '#2563eb' : 'white', // Blue 600 or White
                                            color: msg.role === 'user' ? 'white' : '#0f172a',
                                            p: 2,
                                            borderRadius: '12px',
                                            borderTopRightRadius: msg.role === 'user' ? '2px' : '12px',
                                            borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                            border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                                        }}>
                                            <Typography variant="body2" sx={{
                                                lineHeight: 1.6,
                                                fontSize: '0.9rem',
                                                whiteSpace: 'pre-wrap'
                                            }}>
                                                {msg.content}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" sx={{
                                            mt: 0.5,
                                            mx: 0.5,
                                            color: '#94a3b8',
                                            fontSize: '0.7rem',
                                            fontWeight: 500
                                        }}>
                                            {msg.timestamp}
                                        </Typography>
                                    </ListItem>
                                ))}
                                {isLoading && (
                                    <ListItem sx={{ px: 0, py: 1.5 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                            bgcolor: 'white',
                                            p: 2,
                                            borderRadius: '20px 20px 20px 4px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                                        }}>
                                            <CircularProgress size={20} sx={{ color: '#667eea' }} />
                                            <Typography variant="body2" color="text.secondary">
                                                AI is thinking...
                                            </Typography>
                                        </Box>
                                    </ListItem>
                                )}
                                <div ref={messagesEndRef} />
                            </List>
                        </Box>

                        {/* Suggestions */}
                        <Box sx={{
                            p: 2,
                            bgcolor: 'white',
                            borderTop: '1px solid #f1f5f9'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <MessageCircle size={14} color="#64748b" />
                                <Typography variant="caption" sx={{
                                    color: '#64748b',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontSize: '0.7rem'
                                }}>
                                    Quick Questions
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} sx={{
                                overflowX: 'auto',
                                pb: 0.5,
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': { display: 'none' }
                            }}>
                                {suggestedQuestions.map((q, i) => (
                                    <Chip
                                        key={i}
                                        label={q}
                                        size="small"
                                        onClick={() => handleSend(q)}
                                        sx={{
                                            cursor: 'pointer',
                                            bgcolor: '#f8fafc',
                                            color: '#475569',
                                            fontWeight: 500,
                                            fontSize: '0.75rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            '&:hover': {
                                                bgcolor: '#eff6ff',
                                                color: '#2563eb',
                                                borderColor: '#bfdbfe'
                                            }
                                        }}
                                    />
                                ))}
                            </Stack>
                        </Box>

                        {/* Input Area */}
                        <Box sx={{
                            p: 2,
                            bgcolor: 'white',
                            borderTop: '1px solid #f1f5f9'
                        }}>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                                    disabled={isLoading}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            bgcolor: '#f8fafc',
                                            fontSize: '0.9rem',
                                            '& fieldset': { borderColor: '#e2e8f0' },
                                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                                            '&.Mui-focused fieldset': { borderColor: '#3b82f6' }
                                        }
                                    }}
                                />
                                <IconButton
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    sx={{
                                        bgcolor: '#3b82f6', // Blue 500
                                        color: 'white',
                                        width: 40,
                                        height: 40,
                                        borderRadius: '8px',
                                        '&:hover': {
                                            bgcolor: '#2563eb' // Blue 600
                                        },
                                        '&:disabled': {
                                            bgcolor: '#f1f5f9',
                                            color: '#94a3b8'
                                        }
                                    }}
                                >
                                    <Send size={18} />
                                </IconButton>
                            </Box>
                        </Box>
                    </Paper>
                </Fade>
            )}
        </>
    );
};

export default AIChatbot;
