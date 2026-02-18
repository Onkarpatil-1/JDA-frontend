import React from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, TablePagination } from '@mui/material';
import { Search } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { riskApplications as mockRiskApplications } from '../data/mockData';

const ApplicationsPage: React.FC = () => {
    const { currentProject } = useProject();

    // Use project data if available, otherwise fall back to mock data
    // Use all workflow steps if available, otherwise fall back to risk applications
    const sourceData = currentProject?.workflowSteps || currentProject?.statistics.riskApplications || mockRiskApplications;

    // Create unique applications by grouping by ticket ID
    const uniqueAppsMap = new Map();
    sourceData.forEach((item: any) => {
        // Normalize data structure
        const id = item.ticketId || item.id;
        const delay = item.totalDaysRested !== undefined ? item.totalDaysRested : item.delay;

        if (!uniqueAppsMap.has(id)) {
            uniqueAppsMap.set(id, {
                id,
                service: item.serviceName || item.service,
                zone: item.zoneId || item.zone,
                dueDate: item.applicationDate || item.dueDate,
                deliveredOn: item.deliveredOn || '',
                delay,
                zScore: item.zScore || 0
            });
        } else {
            const existing = uniqueAppsMap.get(id);
            // If any step has a delivery date, the whole ticket is completed
            const deliveredOn = item.deliveredOn || existing.deliveredOn || '';
            if (delay > existing.delay || (!existing.deliveredOn && deliveredOn)) {
                uniqueAppsMap.set(id, {
                    ...existing,
                    delay: Math.max(delay, existing.delay),
                    deliveredOn,
                    service: item.serviceName || item.service,
                    zone: item.zoneId || item.zone,
                    dueDate: item.applicationDate || item.dueDate
                });
            }
        }
    });

    const applications = Array.from(uniqueAppsMap.values()).map(app => {
        let status = 'In Progress';
        if (app.deliveredOn && app.deliveredOn.trim() !== '') {
            status = 'Completed';
        } else if (app.delay > 100) {
            status = 'Critical Delay';
        } else if (app.delay > 50) {
            status = 'Delayed';
        } else if (app.delay > 10) {
            status = 'In Progress';
        } else {
            status = 'On Track';
        }

        return {
            id: app.id,
            service: app.service,
            zone: app.zone,
            status,
            applicationDate: app.dueDate,
            deliveredOn: app.deliveredOn,
            delay: app.delay,
            zScore: app.zScore
        };
    });

    // Pagination state
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [searchTerm, setSearchTerm] = React.useState('');

    // Filter based on search
    const filteredApps = applications.filter(app =>
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.zone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'On Track': return 'success';
            case 'In Progress': return 'info';
            case 'Delayed': return 'warning';
            case 'Critical Delay': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="700" color="#0f172a" sx={{ fontFamily: 'Outfit' }}>
                    Applications Archive
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search by ID, Service or Zone"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search size={18} color="#64748b" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 2, bgcolor: 'white' }
                        }}
                    />
                </Box>
            </Box>

            <TableContainer component={Card} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Application ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Service Type</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Zone</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Application Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Delivered On</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredApps
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((app) => (
                                <TableRow key={app.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{app.id}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{app.service}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{app.zone}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{app.applicationDate}</TableCell>
                                    <TableCell sx={{ color: '#64748b' }}>{app.deliveredOn || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={app.status}
                                            size="small"
                                            color={getStatusColor(app.status) as any}
                                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredApps.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </TableContainer>
        </Box>
    );
};

export default ApplicationsPage;
