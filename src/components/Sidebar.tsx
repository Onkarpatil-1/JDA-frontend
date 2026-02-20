
import React, { useState } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
    Settings, ShieldCheck, ArrowLeft, ChevronLeft, ChevronRight,
    Microscope,
    LayoutDashboard, MessageSquareText, Users, Play, Zap // Updated Icons
} from 'lucide-react';

interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
    onCollapse?: (isCollapsed: boolean) => void;
    currentProject?: {
        metadata: {
            id: string;
            name: string;
            uploadedAt: string;
        };
    } | null;
    selectedProvider?: string;
    onProviderChange?: (provider: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, onCollapse, currentProject, selectedProvider = 'ollama', onProviderChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleToggle = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        onCollapse?.(newState);
    };

    const menuItems = [
        { text: 'Data Distribution', icon: <LayoutDashboard size={20} />, id: 'Data Distribution' },
        // { text: 'Detail Intelligence', icon: <Microscope size={20} />, id: 'JDA Intelligence' },
        { text: 'Remarks Analysis', icon: <MessageSquareText size={20} />, id: 'Text Analytics' },
        { text: 'Employee Analytics', icon: <Users size={20} />, id: 'Employee Analytics' },
        { text: 'Error Analysis', icon: <Zap size={20} />, id: 'Error Analysis' },
        { text: 'Playground', icon: <Play size={20} />, id: 'Playground' },
        // { text: 'Applications', icon: <AppWindow size={20} />, id: 'Applications' },
        // { text: 'Anomalies', icon: <AlertTriangle size={20} />, id: 'Anomalies' },
    ];

    return (
        <Box sx={{
            width: isCollapsed ? 80 : 260,
            height: '100vh',
            bgcolor: '#0f172a',
            color: '#94a3b8',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 1100,
            borderRight: '1px solid rgba(255,255,255,0.05)',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
        }}>
            {/* Brand & Toggle */}
            <Box sx={{
                p: isCollapsed ? 2 : 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                gap: 1.5,
                transition: 'padding 0.3s ease'
            }}>
                {!isCollapsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 36,
                            height: 36,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }}>
                            <ShieldCheck size={22} />
                        </Box>
                        <Typography variant="h6" fontWeight="700" color="white" sx={{
                            fontFamily: 'Outfit !important',
                            letterSpacing: '-0.5px'
                        }}>
                            JDA Pulse AI
                        </Typography>
                    </Box>
                )}

                <Tooltip title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right">
                    <IconButton
                        onClick={handleToggle}
                        sx={{
                            color: '#94a3b8',
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            width: 32,
                            height: 32,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                bgcolor: 'rgba(102, 126, 234, 0.2)',
                                color: '#667eea',
                                transform: 'scale(1.1)'
                            }
                        }}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </IconButton>
                </Tooltip>
            </Box>


            {/* Collapsed Project Indicator */}
            {currentProject && isCollapsed && (
                <Tooltip title={currentProject.metadata.name} placement="right">
                    <Box sx={{
                        mx: 2,
                        mb: 2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 0 12px rgba(102, 126, 234, 0.6)',
                        alignSelf: 'center'
                    }} />
                </Tooltip>
            )}

            {/* Menu */}
            <Box sx={{ px: isCollapsed ? 1 : 2, flexGrow: 1, transition: 'padding 0.3s ease' }}>
                {!isCollapsed && (
                    <Typography variant="caption" fontWeight="bold" sx={{
                        px: 2,
                        mb: 1,
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        opacity: 0.5,
                        fontSize: '0.7rem'
                    }}>
                        Main Menu
                    </Typography>
                )}
                <List disablePadding>
                    {menuItems.map((item) => {
                        const isActive = activePage === item.id;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                                <Tooltip title={isCollapsed ? item.text : ""} placement="right">
                                    <ListItemButton
                                        onClick={() => onNavigate(item.id)}
                                        sx={{
                                            borderRadius: 2,
                                            background: isActive
                                                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                                                : 'transparent',
                                            color: isActive ? '#667eea' : 'inherit',
                                            justifyContent: isCollapsed ? 'center' : 'flex-start',
                                            px: isCollapsed ? 1.5 : 2,
                                            py: 1.5,
                                            transition: 'all 0.2s ease',
                                            position: 'relative',
                                            '&:hover': {
                                                bgcolor: 'rgba(102, 126, 234, 0.1)',
                                                transform: 'translateX(4px)'
                                            },
                                            '&::before': isActive ? {
                                                content: '""',
                                                position: 'absolute',
                                                left: 0,
                                                top: '20%',
                                                height: '60%',
                                                width: 3,
                                                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                                                borderRadius: '0 4px 4px 0'
                                            } : {}
                                        }}
                                    >
                                        <ListItemIcon sx={{
                                            color: 'inherit',
                                            minWidth: isCollapsed ? 0 : 40,
                                            justifyContent: 'center'
                                        }}>
                                            {item.icon}
                                        </ListItemIcon>
                                        {!isCollapsed && (
                                            <ListItemText
                                                primary={item.text}
                                                primaryTypographyProps={{
                                                    fontSize: '0.875rem',
                                                    fontWeight: isActive ? 600 : 500
                                                }}
                                            />
                                        )}
                                    </ListItemButton>
                                </Tooltip>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Current Project Info */}
            {currentProject && !isCollapsed && (
                <Box sx={{ px: 3, mb: 3 }}>
                    <Box sx={{
                        p: 2,
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: 2,
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)'
                    }}>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.65rem' }}>
                            Current Project
                        </Typography>
                        <Typography fontWeight="600" color="#667eea" sx={{ mb: 1, fontSize: '0.7rem' }}>
                            {currentProject.metadata.name}
                        </Typography>

                    </Box>
                </Box>
            )}

            {/* Footer Tools */}
            <Box sx={{
                p: isCollapsed ? 1 : 2,
                borderTop: '1px solid rgba(255,255,255,0.05)',
                transition: 'padding 0.3s ease'
            }}>
                <List disablePadding>
                    {currentProject && (
                        <ListItem disablePadding sx={{ mb: 0.5 }}>
                            <Tooltip title={isCollapsed ? "Back to Projects" : ""} placement="right">
                                <ListItemButton
                                    sx={{
                                        borderRadius: 2,
                                        color: '#667eea',
                                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                                        px: isCollapsed ? 1.5 : 2,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            bgcolor: 'rgba(102, 126, 234, 0.1)',
                                            transform: 'translateX(4px)'
                                        }
                                    }}
                                    onClick={() => window.location.reload()}
                                >
                                    <ListItemIcon sx={{
                                        color: 'inherit',
                                        minWidth: isCollapsed ? 0 : 40,
                                        justifyContent: 'center'
                                    }}>
                                        <ArrowLeft size={18} />
                                    </ListItemIcon>
                                    {!isCollapsed && (
                                        <ListItemText
                                            primary="Back to Projects"
                                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                                        />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    )}
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <Tooltip title={isCollapsed ? "Settings" : ""} placement="right">
                            <ListItemButton sx={{
                                borderRadius: 2,
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                px: isCollapsed ? 1.5 : 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    transform: 'translateX(4px)'
                                }
                            }}>
                                <ListItemIcon sx={{
                                    color: 'inherit',
                                    minWidth: isCollapsed ? 0 : 40,
                                    justifyContent: 'center'
                                }}>
                                    <Settings size={18} />
                                </ListItemIcon>
                                {!isCollapsed && (
                                    <ListItemText
                                        primary="Settings"
                                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    />
                                )}
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>

                    {/* AI Provider Selector */}
                    <ListItem disablePadding sx={{ mb: 0.5, mt: 1 }}>
                        <Box sx={{
                            px: isCollapsed ? 1.5 : 2,
                            width: '100%',
                            display: 'flex',
                            justifyContent: isCollapsed ? 'center' : 'flex-start'
                        }}>
                            {!isCollapsed ? (
                                <FormControl fullWidth size="small" variant="outlined" sx={{
                                    '.MuiOutlinedInput-root': {
                                        color: '#94a3b8',
                                        '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                        '&:hover fieldset': { borderColor: 'rgba(102, 126, 234, 0.5)' },
                                        '&.Mui-focused fieldset': { borderColor: '#667eea' },
                                    },
                                    '.MuiSelect-icon': { color: '#94a3b8' },
                                    '.MuiInputLabel-root': { color: '#64748b' },
                                    '.MuiInputLabel-root.Mui-focused': { color: '#667eea' }
                                }}>
                                    <InputLabel id="ai-provider-label">AI Brain</InputLabel>
                                    <Select
                                        labelId="ai-provider-label"
                                        value={selectedProvider}
                                        label="AI Brain"
                                        onChange={(e) => onProviderChange?.(e.target.value)}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Microscope size={16} />
                                                {selected === 'ollama' ? 'Llama 3.2' :
                                                    selected === 'openai' ? 'GPT-4o' :
                                                        selected === 'gemini' ? 'Gemini' :
                                                            selected === 'claude' ? 'Claude' : selected}
                                            </Box>
                                        )}
                                    >
                                        <MenuItem value="ollama">
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2">Llama 3.2</Typography>
                                                <Typography variant="caption" color="text.secondary">Local (Private)</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="openai">
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2">GPT-4o</Typography>
                                                <Typography variant="caption" color="text.secondary">OpenAI</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="gemini">
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2">Gemini 1.5 Pro</Typography>
                                                <Typography variant="caption" color="text.secondary">Google</Typography>
                                            </Box>
                                        </MenuItem>
                                        <MenuItem value="claude">
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2">Claude 3.5 Sonnet</Typography>
                                                <Typography variant="caption" color="text.secondary">Anthropic</Typography>
                                            </Box>
                                        </MenuItem>
                                    </Select>
                                </FormControl>
                            ) : (
                                <Tooltip title={`AI Provider: ${selectedProvider} `} placement="right">
                                    <Box sx={{
                                        color: '#94a3b8',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        '&:hover': { color: '#667eea' }
                                    }}>
                                        <Microscope size={20} />
                                    </Box>
                                </Tooltip>
                            )}
                        </Box>
                    </ListItem>
                </List>
            </Box>
        </Box>
    );
};

export default Sidebar;
