import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, MenuItem, Select, FormControl, InputLabel, Switch, FormControlLabel } from '@mui/material';
import { useProject } from '../context/ProjectContext';
import { JDAIntelligencePanel } from '../components/JDAIntelligencePanel';
import { Filter, Tag } from 'lucide-react';

const JDAIntelligencePage: React.FC = () => {
    const { currentProject } = useProject();
    const [selectedZone, setSelectedZone] = useState<string>('All');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);

    // Assuming jdaHierarchy is part of statistics
    const rawData = currentProject?.statistics?.jdaHierarchy;

    // Filter Logic
    const filteredData = useMemo(() => {
        if (!rawData) return null;

        // 1. Filter by Zone
        let filteredDepts = rawData.departments;
        if (selectedZone !== 'All') {
            filteredDepts = rawData.departments.filter(d => d.name === selectedZone);
        }

        // 2. Filter by Category & Criticality (Recursive)
        // We do this in one pass to avoid iterating too many times
        filteredDepts = filteredDepts.map(dept => {
            const filteredParentServices = dept.parentServices.map(ps => {
                const filteredServices = ps.services.map(s => {
                    // Filter Tickets inside Service
                    const validTickets = s.tickets.filter(t => {
                        const matchesCritical = showCriticalOnly ? t.daysRested > 7 : true;
                        const matchesCategory = selectedCategory === 'All' ? true : t.detectedCategory === selectedCategory;
                        return matchesCritical && matchesCategory;
                    });

                    if (validTickets.length === 0) return null;
                    return { ...s, tickets: validTickets };
                }).filter(Boolean) as any[];

                if (filteredServices.length === 0) return null;
                return { ...ps, services: filteredServices };
            }).filter(Boolean) as any[];

            if (filteredParentServices.length === 0) return null;
            return { ...dept, parentServices: filteredParentServices };
        }).filter(Boolean) as any[];

        return { ...rawData, departments: filteredDepts };
    }, [rawData, selectedZone, selectedCategory, showCriticalOnly]);

    if (!currentProject) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography>Please select a project to view JDA Intelligence.</Typography>
            </Box>
        );
    }

    // Get unique zones for dropdown
    const availableZones = rawData?.departments.map(d => d.name).sort() || [];

    // Extract unique categories dynamically
    const availableCategories = useMemo(() => {
        if (!rawData) return [];
        const categories = new Set<string>();
        rawData.departments.forEach(d => {
            d.parentServices.forEach(ps => {
                ps.services.forEach(s => {
                    s.tickets.forEach(t => {
                        if (t.detectedCategory) categories.add(t.detectedCategory);
                    });
                });
            });
        });
        return Array.from(categories).sort();
    }, [rawData]);

    return (
        <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Box>
                        <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: '0.1em' }}>
                            Admin {'>'} Analytics Dashboard
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mt: 1, letterSpacing: '-0.02em' }}>
                            SLA & Process Intelligence
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#475569', mt: 1, maxWidth: 800 }}>
                            Deep hierarchical analysis of application processing across Departments, Services, and Roles.
                            Powered by Hybrid AI to detect structural delays and process bottlenecks.
                        </Typography>
                    </Box>
                </Box>

                {/* Filter Bar */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e2e8f0',
                        bgcolor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        flexWrap: 'wrap'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                            <Filter size={18} />
                            <Typography variant="subtitle2" fontWeight={600}>Filters:</Typography>
                        </Box>

                        {/* Zone Selector */}
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Select Zone</InputLabel>
                            <Select
                                value={selectedZone}
                                label="Select Zone"
                                onChange={(e) => setSelectedZone(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="All">All Zones</MenuItem>
                                {availableZones.map(zone => (
                                    <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Tag/Category Selector */}
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel>Delay Category</InputLabel>
                            <Select
                                value={selectedCategory}
                                label="Delay Category"
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                sx={{ borderRadius: 2 }}
                                startAdornment={<Tag size={14} style={{ marginRight: 8, color: '#94a3b8' }} />}
                            >
                                <MenuItem value="All">All Categories</MenuItem>
                                {availableCategories.map(cat => (
                                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* Critical Toggle */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showCriticalOnly}
                                    onChange={(e) => setShowCriticalOnly(e.target.checked)}
                                    color="error"
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ fontWeight: 600, color: showCriticalOnly ? '#ef4444' : '#64748b' }}>
                                    Show Critical Delays Only
                                </Typography>
                            }
                            sx={{
                                border: showCriticalOnly ? '1px solid #fecaca' : '1px solid transparent', // visual cue
                                pr: 2,
                                borderRadius: 2,
                                bgcolor: showCriticalOnly ? '#fef2f2' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        />
                    </Box>

                    {/* Result Count */}
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#94a3b8' }}>
                        Showing {filteredData?.departments.length || 0} Zones
                    </Typography>
                </Paper>
            </Box>

            {/* Content Area */}
            <Box sx={{ mt: 2 }}>
                {filteredData ? (
                    <JDAIntelligencePanel data={filteredData} />
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                        <Typography variant="body1" color="text.secondary">
                            No JDA Intelligence Data Available.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default JDAIntelligencePage;
