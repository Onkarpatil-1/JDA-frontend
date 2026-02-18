import { Box, Typography, TextField, Stack, Breadcrumbs, Link } from '@mui/material';
import { ChevronRight, Search } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const Header: React.FC = () => {
    const { filters, setFilters } = useProject();

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: event.target.value }));
    };

    return (
        <Box sx={{
            p: 2,
            px: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Breadcrumbs separator={<ChevronRight size={14} />} aria-label="breadcrumb">
                        <Link underline="hover" color="inherit" href="/" sx={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748b' }}>
                            Admin
                        </Link>
                        <Typography color="text.primary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Analytics Dashboard</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" fontWeight="700" color="#0f172a" sx={{ fontFamily: 'Outfit !important', mt: 0.5 }}>
                        SLA & Process Intelligence
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        bgcolor: '#f1f5f9',
                        px: 1.5,
                        py: 0.8,
                        borderRadius: 2.5,
                        border: '1px solid #e2e8f0',
                        width: 320
                    }}>
                        <Search size={16} color="#64748b" />
                        <TextField
                            placeholder="Search (ID, Name, Zone)..."
                            variant="standard"
                            InputProps={{ disableUnderline: true, sx: { ml: 1, fontSize: '0.875rem' } }}
                            fullWidth
                            value={filters.search}
                            onChange={handleSearchChange}
                        />
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
};

export default Header;
