import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, Alert, FormControl, InputLabel, Select, MenuItem, Paper, TextField, InputAdornment, IconButton } from '@mui/material';
import { FolderOpen, Upload, Calendar, FileText, TrendingUp, BrainCircuit, Shield, Activity, Eye, EyeOff } from 'lucide-react';
import CSVUploader from '../components/CSVUploader';
import { useProject } from '../context/ProjectContext';

interface ProjectsPageProps {
    selectedProvider?: string;
    onProviderChange?: (provider: string) => void;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ selectedProvider = 'ollama', onProviderChange }) => {
    const { projects, currentProject, loading, error, uploadCSV, selectProject } = useProject();
    const [showUploader, setShowUploader] = React.useState(false);
    const [apiKey, setApiKey] = React.useState('');
    const [showApiKey, setShowApiKey] = React.useState(false);

    const handleUpload = async (file: File, projectName: string) => {
        await uploadCSV(file, projectName, selectedProvider, apiKey);
        setShowUploader(false);
        setApiKey(''); // Reset key after upload
    };

    const hasError = (!apiKey && selectedProvider !== 'ollama') || (selectedProvider === 'openai' && !!apiKey && !apiKey.trim().startsWith('sk-'));

    const helperTextContent = !apiKey
        ? "Enter your personal API key to proceed"
        : selectedProvider === 'openai' && !apiKey.trim().startsWith('sk-')
            ? "⚠️ OpenAI keys usually start with 'sk-'"
            : "Key is never stored";

    return (
        <Box sx={{
            minHeight: '100%',
            background: 'linear-gradient(180deg, #fafbff 0%, #f1f5f9 50%, #ffffff 100%)',
            borderRadius: 3,
            p: { xs: 2, sm: 3 }
        }}>
            {/* Hero */}
            <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 3,
                mb: 5
            }}>
                <Box sx={{ flex: 1, maxWidth: 640 }}>
                    <Chip
                        label="Mission Control"
                        size="small"
                        sx={{
                            mb: 1.5,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            letterSpacing: '0.06em',
                            bgcolor: 'rgba(102, 126, 234, 0.12)',
                            color: '#667eea',
                            border: '1px solid rgba(102, 126, 234, 0.25)',
                            fontFamily: 'Outfit, sans-serif'
                        }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                        <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)'
                        }}>
                            <Shield size={26} />
                        </Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                color: '#0f172a',
                                letterSpacing: '-0.03em',
                                lineHeight: 1.2,
                                fontFamily: 'Outfit, sans-serif'
                            }}
                        >
                            JDA Pulse Mission Control
                        </Typography>
                    </Box>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#64748b',
                            maxWidth: 560,
                            lineHeight: 1.65,
                            fontSize: '1rem'
                        }}
                    >
                        Centralized command for SLA monitoring, risk assessment, and operational intelligence.
                        Initialize a new analysis stream below.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Upload size={20} />}
                    onClick={() => setShowUploader(!showUploader)}
                    sx={{
                        px: 3.5,
                        py: 1.75,
                        fontWeight: 600,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                        textTransform: 'none',
                        fontFamily: 'Outfit, sans-serif',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)'
                        }
                    }}
                >
                    {showUploader ? 'Cancel' : 'New Project'}
                </Button>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        borderRadius: 2,
                        fontFamily: 'Outfit, sans-serif'
                    }}
                >
                    {error}
                </Alert>
            )}

            {showUploader && (
                <Paper
                    elevation={0}
                    sx={{
                        mb: 5,
                        p: { xs: 2.5, sm: 4 },
                        borderRadius: 3,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid rgba(102, 126, 234, 0.12)',
                        boxShadow: '0 4px 24px rgba(102, 126, 234, 0.08), 0 1px 3px rgba(0,0,0,0.04)'
                    }}
                >
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: 'rgba(102, 126, 234, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Activity size={22} color="#667eea" />
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}>
                                Initialize Analysis Stream
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#64748b', pl: 6, lineHeight: 1.6 }}>
                            Ingest raw telemetry CSV data and configure the primary intelligence engine.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: 'rgba(102, 126, 234, 0.06)',
                                border: '1px solid rgba(102, 126, 234, 0.15)',
                                height: '100%'
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#667eea', fontFamily: 'Outfit, sans-serif' }}>
                                    Configuration
                                </Typography>

                                <Box sx={{ mb: 3, maxWidth: 300 }}>
                                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                        <InputLabel id="upload-provider-label">AI Analysis Brain</InputLabel>
                                        <Select
                                            labelId="upload-provider-label"
                                            value={selectedProvider}
                                            label="AI Analysis Brain"
                                            onChange={(e) => onProviderChange?.(e.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <BrainCircuit size={16} />
                                                    {selected === 'ollama' ? 'Llama 3 8B (Local)' :
                                                        selected === 'openai' ? 'GPT-4o' :
                                                            selected === 'gemini' ? 'Gemini 1.5 Pro' :
                                                                selected === 'claude' ? 'Claude 3.5 Sonnet' : selected}
                                                </Box>
                                            )}
                                        >
                                            <MenuItem value="ollama">Llama 3.2 (Local)</MenuItem>
                                            <MenuItem value="openai">GPT-4o (OpenAI)</MenuItem>
                                            <MenuItem value="gemini">Gemini 1.5 Pro (Google)</MenuItem>
                                            <MenuItem value="claude">Claude 3.5 Sonnet (Anthropic)</MenuItem>
                                        </Select>
                                    </FormControl>

                                    {selectedProvider !== 'ollama' && (
                                        <FormControl fullWidth size="small">
                                            <TextField
                                                label="API Key (Required)"
                                                type={showApiKey ? 'text' : 'password'}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                placeholder="sk-..."
                                                size="small"
                                                required
                                                error={hasError}
                                                InputProps={{
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                aria-label="toggle password visibility"
                                                                onClick={() => setShowApiKey(!showApiKey)}
                                                                edge="end"
                                                                size="small"
                                                            >
                                                                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                helperText={helperTextContent}
                                            />
                                        </FormControl>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <CSVUploader
                                    onUpload={handleUpload}
                                    loading={loading}
                                    disabled={selectedProvider !== 'ollama' && !apiKey}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {projects.length === 0 && !showUploader ? (
                <Paper
                    elevation={0}
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        px: 3,
                        borderRadius: 3,
                        border: '1px dashed rgba(102, 126, 234, 0.25)',
                        bgcolor: 'rgba(102, 126, 234, 0.02)'
                    }}
                >
                    <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'rgba(102, 126, 234, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2
                    }}>
                        <FolderOpen size={40} color="#667eea" strokeWidth={1.5} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, fontFamily: 'Outfit, sans-serif' }}>
                        No Projects Yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3, maxWidth: 360, mx: 'auto', lineHeight: 1.6 }}>
                        Upload a CSV file to create your first project and start analyzing with {selectedProvider === 'ollama' ? 'Llama (local)' : selectedProvider}.
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Upload size={20} />}
                        onClick={() => setShowUploader(true)}
                        sx={{
                            px: 3.5,
                            py: 1.5,
                            fontWeight: 600,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 14px rgba(102, 126, 234, 0.35)',
                            textTransform: 'none',
                            fontFamily: 'Outfit, sans-serif',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.45)'
                            }
                        }}
                    >
                        Upload CSV
                    </Button>
                </Paper>
            ) : (
                <>
                <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}>
                        Your projects
                    </Typography>
                </Box>
                <Grid container spacing={3}>
                    {projects.map((project) => {
                        const isActive = currentProject?.metadata.id === project.id;
                        return (
                            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.25s ease',
                                        borderRadius: 3,
                                        border: isActive ? '2px solid #667eea' : '1px solid #e2e8f0',
                                        borderLeft: isActive ? '4px solid #667eea' : undefined,
                                        bgcolor: isActive ? 'rgba(102, 126, 234, 0.04)' : '#ffffff',
                                        boxShadow: isActive ? '0 4px 20px rgba(102, 126, 234, 0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                                        '&:hover': {
                                            boxShadow: isActive ? '0 8px 24px rgba(102, 126, 234, 0.18)' : '0 8px 24px rgba(0,0,0,0.08)',
                                            transform: 'translateY(-2px)',
                                            borderColor: isActive ? '#667eea' : '#cbd5e1'
                                        }
                                    }}
                                    onClick={() => selectProject(project.id)}
                                >
                                    <CardContent sx={{ p: 2.75 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                            <Box sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                bgcolor: isActive ? 'rgba(102, 126, 234, 0.12)' : '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FileText size={24} color={isActive ? '#667eea' : '#475569'} />
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        fontWeight: 600,
                                                        fontSize: '0.98rem',
                                                        fontFamily: 'Outfit, sans-serif',
                                                        color: '#0f172a'
                                                    }}
                                                    noWrap
                                                    title={project.name}
                                                >
                                                    {project.name}
                                                </Typography>
                                                {isActive && (
                                                    <Chip
                                                        label="Active"
                                                        size="small"
                                                        sx={{
                                                            mt: 0.75,
                                                            fontWeight: 600,
                                                            bgcolor: 'rgba(102, 126, 234, 0.15)',
                                                            color: '#667eea',
                                                            border: '1px solid rgba(102, 126, 234, 0.3)',
                                                            fontFamily: 'Outfit, sans-serif'
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <Calendar size={14} color="#64748b" />
                                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                                                Uploaded {new Date(project.uploadedAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ py: 2, borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.25 }}>
                                                        Tickets
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
                                                        {project.totalTickets}
                                                    </Typography>
                                                </Grid>
                                                {/* <Grid size={{ xs: 6 }}>
                                                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.25 }}>
                                                        Avg Time
                                                    </Typography>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#0f172a' }}>
                                                        {project.avgProcessingTime.toFixed(1)}d
                                                    </Typography>
                                                </Grid> */}
                                            </Grid>
                                        </Box>

                                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TrendingUp size={16} color={project.completionRate >= 80 ? '#16a34a' : '#f59e0b'} />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontFamily: 'Outfit, sans-serif',
                                                    color: project.completionRate >= 80 ? '#16a34a' : '#f59e0b'
                                                }}
                                            >
                                                {project.completionRate.toFixed(0)}% Complete
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
                </>
            )}
        </Box>
    );
};

export default ProjectsPage;
