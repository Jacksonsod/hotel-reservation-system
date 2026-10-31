import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Button, useTheme } from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AddIcon from '@mui/icons-material/Add';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';

const ModulePlaceholder = ({ title, subtitle, phase = 'Next Phase' }) => {
    const theme = useTheme();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Row 1 — Page Header Bar */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                }}
            >
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography variant="h2" sx={{ fontWeight: 700 }}>
                            {title}
                        </Typography>
                        <StatusChip status="clean" label={phase} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                </Box>
                <Button variant="contained" color="primary" startIcon={<AddIcon />}>
                    Add New {title.split(' ')[0]}
                </Button>
            </Box>

            {/* Row 2 — KPI Summary Strip */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Total Records"
                        value="18"
                        icon={<DashboardOutlinedIcon />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Active Status"
                        value="14"
                        icon={<CheckCircleOutlinedIcon />}
                        color="secondary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Pending / Review"
                        value="4"
                        icon={<HourglassEmptyIcon />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Completion Rate"
                        value="98.5%"
                        icon={<CheckCircleOutlinedIcon />}
                        color="success"
                    />
                </Grid>
            </Grid>

            {/* Content Preview Container */}
            <Card sx={{ p: 4, borderRadius: '12px', textAlign: 'center', bgcolor: 'background.paper' }}>
                <CardContent>
                    <Typography variant="h3" sx={{ fontWeight: 600, mb: 1 }}>
                        {title} Management Workspace
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                        This module is provisioned with 3NF MySQL schema, Eloquent relationships, and realistic seed data.
                        Its interactive DataGrid, custom filters, and modals will be activated in upcoming phases.
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ModulePlaceholder;
