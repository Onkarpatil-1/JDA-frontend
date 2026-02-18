import React, { useState } from 'react';
import { Box, Typography, Button, LinearProgress, Alert, Chip } from '@mui/material';
import { Upload, CheckCircle } from 'lucide-react';

interface CSVUploaderProps {
    onUpload: (file: File, projectName: string) => Promise<void>;
    loading?: boolean;
    disabled?: boolean;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onUpload, loading = false, disabled = false }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // File size limits
    const MAX_FILE_SIZE_MB = 100;
    const WARN_FILE_SIZE_MB = 50;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        // Validate file type
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a CSV file');
            return;
        }

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
            setError(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        // Warn about large files
        if (fileSizeMB > WARN_FILE_SIZE_MB) {
            console.warn(`Large file detected (${fileSizeMB.toFixed(1)}MB). Processing may take a moment...`);
        }

        setSelectedFile(file);
        setProjectName(file.name.replace('.csv', ''));
        setError(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // Simulate progress for large files
            const fileSizeMB = selectedFile.size / (1024 * 1024);
            if (fileSizeMB > 10) {
                setUploadProgress(30);
            }

            await onUpload(selectedFile, projectName || selectedFile.name);

            setUploadProgress(100);
            setSelectedFile(null);
            setProjectName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <Box>
            <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                    border: '2px dashed',
                    borderColor: dragActive ? 'primary.main' : '#cbd5e1',
                    borderRadius: 3,
                    p: 6,
                    textAlign: 'center',
                    bgcolor: dragActive ? 'primary.light' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.light'
                    }
                }}
            >
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    id="csv-upload"
                />
                <label htmlFor="csv-upload" style={{ cursor: 'pointer' }}>
                    {selectedFile ? (
                        <Box>
                            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: 16 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a', mb: 1 }}>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                                {selectedFile.size / (1024 * 1024) > WARN_FILE_SIZE_MB && (
                                    <Chip
                                        label="Large file"
                                        size="small"
                                        color="warning"
                                        sx={{ ml: 1 }}
                                    />
                                )}
                            </Typography>
                        </Box>
                    ) : (
                        <Box>
                            <Upload size={48} color="#64748b" style={{ marginBottom: 16 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                Drop your CSV file here
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                or click to browse
                            </Typography>
                        </Box>
                    )}
                </label>
            </Box>

            {selectedFile && (
                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Project Name
                    </Typography>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            fontSize: '14px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            outline: 'none',
                            fontFamily: 'Inter, sans-serif'
                        }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleUpload}
                        disabled={uploading || loading || disabled}
                        sx={{ mt: 2, py: 1.5, fontWeight: 600 }}
                    >
                        {uploading ? `Uploading... ${uploadProgress}%` : 'Create Project'}
                    </Button>

                    {uploading && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress variant="determinate" value={uploadProgress} />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                                {uploadProgress < 30 ? 'Uploading file...' : uploadProgress < 100 ? 'Processing data...' : 'Complete!'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
};

export default CSVUploader;
