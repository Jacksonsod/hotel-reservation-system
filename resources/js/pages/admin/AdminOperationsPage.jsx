import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper, Typography, useTheme } from '@mui/material';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import HousekeepingBoard from '../housekeeping/HousekeepingBoard';
import MaintenanceRequestsPage from '../housekeeping/MaintenanceRequestsPage';

const AdminOperationsPage = () => {
    const theme = useTheme();
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* Header & Tabs */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                    Hotel Operations Command Center
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Centralized management of room turnover cleaning tasks, facilities maintenance, and engineering requests
                </Typography>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    mb: 3,
                    bgcolor: theme.palette.mode === 'dark' ? '#0F172A' : '#F8FAFC',
                }}
            >
                <Tabs
                    value={tabIndex}
                    onChange={(e, val) => setTabIndex(val)}
                    sx={{ px: 2 }}
                >
                    <Tab
                        icon={<CleaningServicesOutlinedIcon />}
                        iconPosition="start"
                        label="Housekeeping & Room Turnover"
                        sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
                    />
                    <Tab
                        icon={<BuildOutlinedIcon />}
                        iconPosition="start"
                        label="Facilities & Maintenance Requests"
                        sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
                    />
                </Tabs>
            </Paper>

            {tabIndex === 0 && <HousekeepingBoard />}
            {tabIndex === 1 && <MaintenanceRequestsPage />}
        </Box>
    );
};

export default AdminOperationsPage;
