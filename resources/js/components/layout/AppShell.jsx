import React, { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { Outlet, Navigate } from 'react-router-dom';
import TopHeader from './TopHeader';
import RoleSidebar, { SIDEBAR_WIDTH } from './RoleSidebar';
import { useAuth } from '../../context/AuthContext';

const AppShell = () => {
    const theme = useTheme();
    const { user, token, loading } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (loading) {
        return null;
    }

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    const handleToggleMobileSidebar = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
            {/* Sidebar */}
            <RoleSidebar
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            {/* Main Application Column */}
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                }}
            >
                {/* Fixed Top Header */}
                <TopHeader onToggleMobileSidebar={handleToggleMobileSidebar} />

                {/* Main Content Workspace */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: { xs: 2, sm: 2.5, md: 3 },
                        maxWidth: 1600,
                        width: '100%',
                        mx: 'auto',
                        boxSizing: 'border-box',
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default AppShell;
