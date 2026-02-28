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
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Shield size={32} color="#4f46e5" />
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', letterSpacing: '-0.5px' }}>
                            JDA Pulse Mission Control
                        </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                        Centralized command for SLA monitoring, risk assessment, and operational intelligence.
                        Initialize a new analysis stream below.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Upload size={20} />}
                    onClick={() => setShowUploader(!showUploader)}
                    sx={{ px: 3, py: 1.5, fontWeight: 600 }}
                >
                    {showUploader ? 'Cancel' : 'New Project'}
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {showUploader && (
                <Paper
                    elevation={0}
                    sx={{
                        mb: 4,
                        p: 3,
                        borderRadius: 3,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                >
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                            <Activity size={24} color="#6366f1" />
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                Initialize Analysis Stream
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Ingest raw telemetry CSV data and configure the primary intelligence engine.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'rgba(99, 102, 241, 0.04)',
                                border: '1px solid rgba(99, 102, 241, 0.1)',
                                height: '100%'
                            }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#4338ca' }}>
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
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <FolderOpen size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                        No Projects Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Upload a CSV file to create your first project using {selectedProvider}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Upload size={20} />}
                        onClick={() => setShowUploader(true)}
                    >
                        Upload CSV
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={project.id}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    border: currentProject?.metadata.id === project.id ? '2px solid #0f172a' : '1px solid #e2e8f0', // Slate active border
                                    '&:hover': {
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                                onClick={() => selectProject(project.id)}
                            >
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                bgcolor: '#f1f5f9', // Slate 100
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <FileText size={24} color="#0f172a" />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                                {project.name}
                                            </Typography>
                                            {currentProject?.metadata.id === project.id && (
                                                <Chip label="Active" size="small" color="primary" sx={{ mt: 0.5 }} />
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Calendar size={16} color="#64748b" />
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(project.uploadedAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Tickets
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {project.totalTickets}
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Avg Time
                                                </Typography>
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    {project.avgProcessingTime.toFixed(1)}d
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    <Box sx={{ mt: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <TrendingUp size={16} color={project.completionRate >= 80 ? '#16a34a' : '#f59e0b'} />
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: project.completionRate >= 80 ? '#16a34a' : '#f59e0b'
                                                }}
                                            >
                                                {project.completionRate.toFixed(0)}% Complete
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default ProjectsPage;
