
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
        documentClarityAnalysis?: {
            documentClarityProvided: boolean;
            documentNames: string[];
        };
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
    const [remarksText, setRemarksText] = useState('');
    const [fromText, setFromText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ForensicAnalysis | null>(null);

    const handleAnalyze = async () => {
        const hasRemarks = remarksText.trim().length > 0;
        const hasFrom = fromText.trim().length > 0;

        if (!hasRemarks && !hasFrom) return;

        // Build combined tab-separated lines to match backend expectations:
        // "LifeTimeRemarks\tLifeTimeRemarksFrom"
        let payloadText = '';
        if (hasRemarks && hasFrom) {
            const remarksLines = remarksText.split('\n');
            const fromLines = fromText.split('\n');
            const maxLen = Math.max(remarksLines.length, fromLines.length);
            const combined: string[] = [];
            for (let i = 0; i < maxLen; i++) {
                const r = (remarksLines[i] ?? '').trim();
                const f = (fromLines[i] ?? '').trim();
                if (!r && !f) continue;
                combined.push(`${r}\t${f}`);
            }
            payloadText = combined.join('\n');
        } else {
            // Fallback to single-column behaviour (old playground style)
            payloadText = (hasRemarks ? remarksText : fromText).trim();
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/v1/analyze/playground', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: payloadText })
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
                        RAW DATA INPUT (SEPARATE COLUMNS)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                        Paste each column independently, like in the main dashboard.
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#64748b', fontWeight: 600 }}>
                            LifeTimeRemarks (Raw remarks text)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={10}
                            variant="outlined"
                            placeholder="Example:
Document verified
Submitted on time
भवन योजना प्राप्त हुई। समीक्षा की जा रही है"
                            value={remarksText}
                            onChange={(e) => setRemarksText(e.target.value)}
                            sx={{
                                mb: 1, fontFamily: 'monospace',
                                bgcolor: '#f8fafc',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused fieldset': { borderColor: '#4f46e5' }
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#64748b', fontWeight: 600 }}>
                            LifeTimeRemarksFrom (Source: Notification / Reply etc.)
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={10}
                            variant="outlined"
                            placeholder="Example:
Notification sent to applicant
Reply from Applicant
Notification sent to applicant"
                            value={fromText}
                            onChange={(e) => setFromText(e.target.value)}
                            sx={{
                                mb: 1, fontFamily: 'monospace',
                                bgcolor: '#f8fafc',
                                borderRadius: 2,
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused fieldset': { borderColor: '#f97316' }
                                }
                            }}
                        />
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleAnalyze}
                        disabled={loading || (!remarksText.trim() && !fromText.trim())}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Play size={20} />} // Changed Microscope to Play for action
                        sx={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            boxShadow: '0 6px 18px rgba(79, 70, 229, 0.35)',
                            '&:hover': {
                                boxShadow: '0 8px 22px rgba(67, 56, 202, 0.45)',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 60%, #3730a3 100%)'
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

                        {/* Ticket Insight + Sentiment Summary */}
                        {(result.ticketInsightSummary || result.sentimentSummary) && (
                            <Grid container spacing={3} sx={{ mt: 4 }}>
                                {result.ticketInsightSummary && (
                                    <Grid size={{ xs: 12, md: 7 }}>
                                        <Box sx={{ p: 2.5, bgcolor: '#eff6ff', borderRadius: 2, border: '1px solid #bfdbfe' }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: '#1d4ed8',
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    display: 'block',
                                                    mb: 0.5
                                                }}
                                            >
                                                Ticket Insight Summary
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#1e3a8a', fontSize: '0.85rem' }}>
                                                {result.ticketInsightSummary}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                                {result.sentimentSummary && (
                                    <Grid size={{ xs: 12, md: 5 }}>
                                        <Box sx={{ p: 2.5, bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #facc15' }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: '#ca8a04',
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    display: 'block',
                                                    mb: 0.5
                                                }}
                                            >
                                                Sentiment Summary
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#713f12', fontSize: '0.85rem' }}>
                                                {result.sentimentSummary}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        )}
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default TextAnalyticsPlayground;
