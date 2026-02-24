import React, { useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Collapse, Typography, Button, Pagination } from '@mui/material';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { WorkflowStep } from '../types';

interface AnomalyTableProps {
    data: WorkflowStep[];
}

const Row = ({ row }: { row: WorkflowStep }) => {
    const [open, setOpen] = useState(false);

    // Calculate severity
    const delay = row.totalDaysRested || 0;
    const severity = delay > 20 ? 'CRITICAL' : delay > 10 ? 'HIGH' : 'MEDIUM';
    const severityColor = severity === 'CRITICAL' ? '#ef4444' : severity === 'HIGH' ? '#f97316' : '#eab308';

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, '&:hover': { bgcolor: '#f8fafc' } }}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                    {row.ticketId}
                </TableCell>
                <TableCell>
                    <Chip
                        label={severity}
                        size="small"
                        sx={{
                            bgcolor: `${severityColor}20`,
                            color: severityColor,
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            height: 20,
                            borderRadius: '4px'
                        }}
                    />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{row.serviceName}</TableCell>
                <TableCell>{row.zoneId}</TableCell>
                <TableCell>{row.post}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: severityColor }}>
                    {delay} days
                </TableCell>
                <TableCell align="right">
                    <Button size="small" variant="outlined" color="error" sx={{ minWidth: 0, p: '4px 8px', fontSize: '0.7rem' }}>
                        Escalate
                    </Button>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                            <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 700 }}>
                                Deep Analysis
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">APPLICANT NAME</Typography>
                                    <Typography variant="body2" fontWeight="600">{row.applicantName || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">APPLICATION DATE</Typography>
                                    <Typography variant="body2" fontWeight="600">{row.applicationDate}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">REMARKS HISTORY</Typography>
                                    <Typography variant="body2" fontWeight="600">{row.numberOfEntries} entries</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 1, border: '1px dashed #cbd5e1' }}>
                                <Typography variant="caption" sx={{ color: '#64748b', mb: 0.5, display: 'block' }}>LATEST REMARK</Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {row.lifetimeRemarks.split('\n').pop() || row.lifetimeRemarks}
                                </Typography>
                            </Box>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};

const AnomalyIntelligenceTable: React.FC<AnomalyTableProps> = ({ data }) => {
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Filter out Applicant/Citizen delays


    // Sort by delay descending
    const sortedData = [...data].sort((a, b) => (b.totalDaysRested || 0) - (a.totalDaysRested || 0));
    const paginatedData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    return (
        <Paper elevation={0} sx={{ width: '100%', overflow: 'hidden', borderRadius: 4, border: '1px solid #e2e8f0' }}>


            <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader aria-label="collapsible table" size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ bgcolor: '#f8fafc', width: 40 }} />
                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>TICKET ID</TableCell>
                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>SEVERITY</TableCell>
                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>SERVICE</TableCell>
                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>ZONE</TableCell>
                            <TableCell sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>ROLE</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>DELAY (DAYS)</TableCell>
                            <TableCell align="right" sx={{ bgcolor: '#f8fafc', fontWeight: 700, color: '#64748b', fontSize: '0.75rem' }}>ACTION</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginatedData.map((row) => (
                            <Row key={row.ticketId} row={row} />
                        ))}
                        {paginatedData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                                    <Clock size={48} style={{ marginBottom: 8, opacity: 0.5 }} />
                                    <Typography>No anomalies matching current filters.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0' }}>
                <Pagination
                    count={Math.ceil(data.length / rowsPerPage)}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    size="small"
                />
            </Box>
        </Paper>
    );
};

export default AnomalyIntelligenceTable;
