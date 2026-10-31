import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { STATUS_CHIP_COLORS } from '../../theme/theme';
import { useTranslation } from 'react-i18next';

const StatusChip = ({ status, label: customLabel, size = 'small', sx = {} }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const isDark = theme.palette.mode === 'dark';

    const normalizedStatus = (status || '').toLowerCase().replace(/\s+/g, '_');

    // Find matching category
    let matchedCategory = 'neutral';
    for (const [category, config] of Object.entries(STATUS_CHIP_COLORS)) {
        if (config.statuses.includes(normalizedStatus)) {
            matchedCategory = category;
            break;
        }
    }

    const colorConfig = STATUS_CHIP_COLORS[matchedCategory] || STATUS_CHIP_COLORS.neutral;
    const colors = isDark ? colorConfig.dark : colorConfig.light;

    // Display label (either translated or human readable)
    const displayLabel =
        customLabel ||
        (t(`status.${normalizedStatus}`, {
            defaultValue: (status || '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
        }));

    return (
        <Chip
            size={size}
            label={displayLabel}
            sx={{
                height: 26,
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.75rem',
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${isDark ? 'transparent' : 'rgba(0, 0, 0, 0.05)'}`,
                ...sx,
            }}
        />
    );
};

export default StatusChip;
