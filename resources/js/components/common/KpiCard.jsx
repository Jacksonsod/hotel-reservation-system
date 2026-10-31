import React from 'react';
import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';

const KpiCard = ({ title, value, icon, color = 'primary', subtitle, sx = {} }) => {
    const theme = useTheme();

    // Map color token to palette or custom color
    const getIconColor = () => {
        if (theme.palette[color]?.main) {
            return theme.palette[color].main;
        }
        return color;
    };

    const iconColor = getIconColor();

    return (
        <Card
            sx={{
                height: 128,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                ...sx,
            }}
        >
            <CardContent
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    p: 2.5,
                    '&:last-child': { pb: 2.5 },
                }}
            >
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 0.5 }}>
                        {title}
                    </Typography>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        {value}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {/* 48x48px rounded icon box */}
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${iconColor}15`, // 15% opacity tint
                        color: iconColor,
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </Box>
            </CardContent>
        </Card>
    );
};

export default KpiCard;
