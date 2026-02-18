
import { useState } from 'react';
import { Box, Typography, Paper, Button, TextField, Chip, CircularProgress, Grid } from '@mui/material';
import { Microscope, Play, Building2, User } from 'lucide-react';

interface ForensicAnalysis {
    employeeRemarkAnalysis: {
        summary: string;
        totalEmployeeRemarks: number;
        keyActions: string[];
        responseTimeliness: string;
        communicationClarity: string;
        inactionFlags: Array<{
            observation: string;
            evidence: string;
        }>;
    };
    applicantRemarkAnalysis: {
        summary: string;
        totalApplicantRemarks: number;
        keyActions: string[];
        responseTimeliness: string;
        sentimentTrend: string;
        complianceLevel: string;
    };
    delayAnalysis: {
        primaryDelayCategory: string;
        primaryCategoryConfidence: number;
        categorySummary: string;
        allApplicableCategories: Array<{
            category: string;
            confidence: number;
            reasoning: string;
        }>;
        processGaps: string[];
        painPoints: string[];
        forcefulDelays: Array<{
            reason: string;
            confidence: number;
            category: string;
            evidence: string;
            recommendation: string;
        }>;
    };
    overallRemarkAnalysis?: {
        employeeRemarksOverall: {
            totalEmployeeRemarks: number;
            summary: string;
            commonThemes: string[];
            communicationQuality: string;
            responseTimeliness: string;
            inactionPatterns: string[];
            topEmployeeActions: string[];
        };
        applicantRemarksOverall: {
            totalApplicantRemarks: number;
            summary: string;
            commonThemes: string[];
            complianceLevel: string;
            sentimentTrend: string;
            delayPatterns: string[];
            topApplicantConcerns: string[];
        };
    };
    sentimentSummary: string;
    ticketInsightSummary: string;
}

const TextAnalyticsPlayground = () => {
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ForensicAnalysis | null>(null);

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/v1/analyze/playground', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText })
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 0, height: '100%' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1, letterSpacing: '-0.5px' }}>
                    Text Analytics Demo Playground
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', maxWidth: '800px' }}>
                    Test and showcase LLM-powered capabilities for analyzing departmental remarks. Paste your Excel data to identify operational friction and alignment.
                </Typography>
            </Box>

            {/* Input Section */}
            <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>
                        RAW DATA INPUT (LIFETIMEREMARKS & LIFETIMEREMARKSFROM)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        Note: Excel formatting and columns will be preserved for LLM processing.
                    </Typography>
                </Box>
                <TextField
                    fullWidth
                    multiline
                    rows={10}
                    variant="outlined"
                    placeholder="Paste content here...

Supported Formats:
1. Excel Copy-Paste: Copy columns 'LifeTimeRemarks' and 'LifeTimeRemarksFrom'
2. Raw Text: Just paste the remarks

Example Excel Paste:
Document verified    Notification sent to applicant
Submitted on time    Reply from Applicant"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    sx={{
                        mb: 1, fontFamily: 'monospace',
                        bgcolor: '#f8fafc',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: '#e2e8f0' },
                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                            '&.Mui-focused fieldset': { borderColor: '#6366f1' }
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleAnalyze}
                        disabled={loading || !inputText.trim()}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Play size={20} />} // Changed Microscope to Play for action
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            '&:hover': {
                                boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)'
                            }
                        }}
                    >
                        {loading ? 'Analyzing...' : 'Run AI Analysis'}
                    </Button>
                </Box>
            </Paper>

            {/* Results Section */}
            {result && (
                <Box sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <Box sx={{ p: 0.5, bgcolor: '#d1fae5', borderRadius: 1, color: '#059669' }}><Microscope size={16} /></Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>Real-time AI Results</Typography>
                    </Box>

                    {/* Global Analysis Section */}
                    {result.overallRemarkAnalysis && (
                        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #cbd5e1', bgcolor: '#f8fafc' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Global Forensic Overview
                                </Typography>
                            </Box>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1 }}>EMPLOYEE OPERATIONS</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Remarks: {result.overallRemarkAnalysis.employeeRemarksOverall.totalEmployeeRemarks}</Typography>
                                            <Chip label={result.overallRemarkAnalysis.employeeRemarksOverall.communicationQuality + " Quality"} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#e0e7ff', color: '#4338ca' }} />
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', mb: 1.5 }}>
                                            {result.overallRemarkAnalysis.employeeRemarksOverall.summary}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {result.overallRemarkAnalysis.employeeRemarksOverall.commonThemes.map((theme, i) => (
                                                <Chip key={i} label={theme} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 1 }}>APPLICANT ENGAGEMENT</Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Remarks: {result.overallRemarkAnalysis.applicantRemarksOverall.totalApplicantRemarks}</Typography>
                                            <Chip label={result.overallRemarkAnalysis.applicantRemarksOverall.complianceLevel + " Compliance"} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: '#f0fdf4', color: '#15803d' }} />
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem', mb: 1.5 }}>
                                            {result.overallRemarkAnalysis.applicantRemarksOverall.summary}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {result.overallRemarkAnalysis.applicantRemarksOverall.commonThemes.map((theme, i) => (
                                                <Chip key={i} label={theme} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                                            ))}
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}

                    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                        {/* Summary Header */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, pb: 4, borderBottom: '1px solid #f1f5f9' }}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', mb: 1, display: 'block' }}>PRIMARY CATEGORY</Typography>
                                <Chip
                                    label={result.delayAnalysis?.primaryDelayCategory || "Uncategorized"}
                                    sx={{
                                        bgcolor: '#fef3c7',
                                        color: '#d97706',
                                        fontWeight: 800,
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        height: 32
                                    }}
                                />
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', mb: 1, display: 'block' }}>SENTIMENT SCORE</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: result.applicantRemarkAnalysis.sentimentTrend === 'Frustrated' ? '#ef4444' : '#0f172a' }}>
                                    {result.applicantRemarkAnalysis.sentimentTrend === 'Frustrated' && '● '}
                                    {result.applicantRemarkAnalysis.sentimentTrend}
                                </Typography>
                            </Box>
                        </Box>

                        <Grid container spacing={4}>
                            {/* Employee Side */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                    <Box sx={{ color: '#6366f1' }}><Building2 size={16} /></Box>
                                    <Typography variant="overline" sx={{ fontWeight: 800, color: '#6366f1', letterSpacing: '0.1em' }}>EMPLOYEE REMARK ANALYSIS</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 3 }}>
                                    {result.employeeRemarkAnalysis.summary}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {result.employeeRemarkAnalysis.keyActions.map((action, i) => (
                                        <Chip key={i} label={action} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.7rem' }} />
                                    ))}
                                </Box>
                            </Grid>

                            {/* Applicant Side */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                    <Box sx={{ color: '#ec4899' }}><User size={16} /></Box>
                                    <Typography variant="overline" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: '0.1em' }}>APPLICANT REMARK ANALYSIS</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, mb: 3 }}>
                                    {result.applicantRemarkAnalysis.summary}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {result.applicantRemarkAnalysis.sentimentTrend === 'Frustrated' && (
                                        <Chip label="FRUSTRATION DETECTED" size="small" sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }} />
                                    )}
                                    <Chip label={result.applicantRemarkAnalysis.complianceLevel + " COMPLIANCE"} size="small" sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: '0.7rem' }} />
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default TextAnalyticsPlayground;
