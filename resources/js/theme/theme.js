import { createTheme } from '@mui/material/styles';

export const RECHARTS_COLORS = [
    '#1B365D', // Royal Navy (Primary Revenue / Occupancy)
    '#C59B27', // Warm Gold (Secondary Comparison / Room Type)
    '#10B981', // Emerald (Available / Clean / Completed)
    '#3B82F6', // Blue (Occupied / Checked In)
    '#F59E0B', // Amber (Reserved / Pending)
    '#EF4444', // Coral Red (Cancellations / Maintenance / Dirty)
];

export const STATUS_CHIP_COLORS = {
    success: {
        solid: '#10B981',
        light: { bg: '#D1FAE5', text: '#065F46' },
        dark: { bg: '#064E3B', text: '#6EE7B7' },
        statuses: ['available', 'clean', 'paid', 'confirmed', 'completed', 'resolved', 'low', 'active'],
    },
    warning: {
        solid: '#F59E0B',
        light: { bg: '#FEF3C7', text: '#92400E' },
        dark: { bg: '#78350F', text: '#FCD34D' },
        statuses: ['reserved', 'pending', 'cleaning', 'partially_paid', 'in_progress', 'medium'],
    },
    info: {
        solid: '#3B82F6',
        light: { bg: '#DBEAFE', text: '#1E40AF' },
        dark: { bg: '#1E3A8A', text: '#93C5FD' },
        statuses: ['occupied', 'checked_in', 'assigned'],
    },
    error: {
        solid: '#EF4444',
        light: { bg: '#FEE2E2', text: '#991B1B' },
        dark: { bg: '#7F1D1D', text: '#FCA5A5' },
        statuses: ['dirty', 'under_maintenance', 'cancelled', 'unpaid', 'flagged', 'high', 'urgent', 'suspended', 'failed'],
    },
    neutral: {
        solid: '#64748B',
        light: { bg: '#F1F5F9', text: '#334155' },
        dark: { bg: '#334155', text: '#CBD5E1' },
        statuses: ['checked_out', 'inactive', 'deactivated', 'dismissed', 'reviewed'],
    },
};

export const getAppTheme = (mode = 'light') => {
    const isDark = mode === 'dark';

    return createTheme({
        palette: {
            mode,
            primary: {
                main: isDark ? '#38BDF8' : '#1B365D',
                light: isDark ? '#7DD3FC' : '#2C5282',
                dark: isDark ? '#0284C7' : '#0F2342',
                contrastText: isDark ? '#0F172A' : '#FFFFFF',
            },
            secondary: {
                main: isDark ? '#FBBF24' : '#C59B27',
                light: isDark ? '#FCD34D' : '#D4AF37',
                dark: isDark ? '#D97706' : '#9A7818',
                contrastText: '#0F172A',
            },
            background: {
                default: isDark ? '#0B1120' : '#F8FAFC',
                paper: isDark ? '#1E293B' : '#FFFFFF',
            },
            text: {
                primary: isDark ? '#F8FAFC' : '#0F172A',
                secondary: isDark ? '#94A3B8' : '#475569',
                disabled: isDark ? '#64748B' : '#94A3B8',
            },
            divider: isDark ? '#334155' : '#E2E8F0',
            custom: {
                sidebar: {
                    background: isDark ? '#090D16' : '#0F172A',
                    text: '#F8FAFC',
                    activeBg: '#1E293B',
                    activeBorder: isDark ? '#FBBF24' : '#C59B27',
                },
            },
        },
        typography: {
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            h1: {
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: '2.25rem', // 36px
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
            },
            h2: {
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: '1.625rem', // 26px
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.01em',
            },
            h3: {
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: '1.25rem', // 20px
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '-0.01em',
            },
            h4: {
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: '1.0625rem', // 17px
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '0em',
            },
            h5: {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9375rem', // 15px
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '0em',
            },
            h6: {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.75rem', // 12px
                fontWeight: 700,
                lineHeight: 1.4,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
            },
            body1: {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9375rem', // 15px
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: '0em',
            },
            body2: {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem', // 14px
                fontWeight: 400,
                lineHeight: 1.5,
                letterSpacing: '0em',
            },
            caption: {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.75rem', // 12px
                fontWeight: 500,
                lineHeight: 1.4,
                letterSpacing: '0.01em',
            },
            button: {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem', // 14px
                fontWeight: 600,
                lineHeight: 1.4,
                textTransform: 'none',
            },
        },
        shape: {
            borderRadius: 8,
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                        boxShadow: isDark
                            ? '0 4px 6px -1px rgba(0, 0, 0, 0.35)'
                            : '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    rounded: {
                        borderRadius: 12,
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        textTransform: 'none',
                        fontWeight: 600,
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 16,
                    },
                },
            },
        },
    });
};
