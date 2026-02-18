import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, Chip, Box, LinearProgress, TablePagination
} from '@mui/material';
import { Info } from 'lucide-react';

interface ApplicationRisk {
    id: string;
    service: string;
    zone: string;
    role: string;
    dueDate: string;
    risk: number;
    category: string;
}

interface Props {
    data: ApplicationRisk[];
}

const SLARiskTable: React.FC<Props> = ({ data }) => {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getRiskLabelColor = (risk: number) => {
        if (risk > 80) return '#ef4444';
        if (risk > 50) return '#f59e0b';
        return '#10b981';
    };

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Outfit !important', display: 'flex', alignItems: 'center', gap: 1 }}>
                    Predictive Intelligence Feed
                    <Info size={18} color="#94a3b8" />
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                    Live Monitoring · {data.length} Active Records
                </Typography>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#475569', py: 2 }}>Application</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Service & Zone</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Officer</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Due Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569', width: '25%' }}>SLA Risk Prediction</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#475569', textAlign: 'right' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((row) => (
                                <TableRow
                                    key={row.id}
                                    sx={{
                                        transition: 'background-color 0.2s',
                                        '&:hover': { bgcolor: '#f1f5f9' },
                                        bgcolor: row.risk > 80 ? 'rgba(239, 68, 68, 0.02)' : 'inherit'
                                    }}
                                >
                                    <TableCell sx={{ py: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{row.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{row.service}</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b' }}>{row.zone} Zone</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                                                {row.role.split(' ')[1]}
                                            </Box>
                                            <Typography variant="body2" sx={{ color: '#475569' }}>{row.role}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ color: '#475569' }}>{row.dueDate}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ flexGrow: 1 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={row.risk}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: '#f1f5f9',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: getRiskLabelColor(row.risk),
                                                            borderRadius: 3
                                                        }
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: getRiskLabelColor(row.risk), minWidth: 28 }}>
                                                {row.risk}%
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'right' }}>
                                        <Chip
                                            label={row.category}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: '0.7rem',
                                                bgcolor: row.risk > 80 ? '#fee2e2' : row.risk > 50 ? '#fef3c7' : '#dcfce7',
                                                color: row.risk > 80 ? '#991b1b' : row.risk > 50 ? '#92400e' : '#166534',
                                                borderRadius: 1.5
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </Box>
    );
};

export default SLARiskTable;
