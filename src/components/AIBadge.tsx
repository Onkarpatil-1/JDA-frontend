import React from 'react';
import { Chip } from '@mui/material';
import { Sparkles } from 'lucide-react';

interface AIBadgeProps {
    size?: 'small' | 'medium';
}

export const AIBadge: React.FC<AIBadgeProps> = ({ size = 'small' }) => (
    <Chip
        icon={<Sparkles size={size === 'small' ? 12 : 14} />}
        // label="AI Powered"
        size={size}
        sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: 600,
            fontSize: size === 'small' ? '0.65rem' : '0.7rem',
            height: size === 'small' ? 20 : 24,
            '& .MuiChip-icon': {
                color: 'white',
                marginLeft: '6px'
            }
        }}
    />
);
