import React from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import BedOutlinedIcon from '@mui/icons-material/BedOutlined';
import RoomServiceOutlinedIcon from '@mui/icons-material/RoomServiceOutlined';
import BookOnlineOutlinedIcon from '@mui/icons-material/BookOnlineOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import HotelIcon from '@mui/icons-material/Hotel';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export const SIDEBAR_WIDTH = 260;

const RoleSidebar = ({ mobileOpen, onMobileClose }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Menu definition per role strictly matching Section 5 of AGENT_SPECIFICATION.md
    const getMenuItems = (role) => {
        switch (role) {
            case 'admin':
                return [
                    { label: t('nav.dashboard'), path: '/admin/dashboard', icon: <DashboardOutlinedIcon /> },
                    { label: t('nav.hotels'), path: '/admin/hotels', icon: <ApartmentOutlinedIcon /> },
                    { label: t('nav.rooms'), path: '/admin/rooms', icon: <BedOutlinedIcon /> },
                    { label: t('nav.services'), path: '/admin/services', icon: <RoomServiceOutlinedIcon /> },
                    { label: t('nav.reservations'), path: '/admin/reservations', icon: <BookOnlineOutlinedIcon /> },
                    { label: t('nav.payments'), path: '/admin/payments', icon: <ReceiptLongOutlinedIcon /> },
                    { label: t('nav.operations'), path: '/admin/operations', icon: <CleaningServicesOutlinedIcon /> },
                    { label: t('nav.users'), path: '/admin/users', icon: <GroupOutlinedIcon /> },
                    { label: t('nav.reviews'), path: '/admin/reviews', icon: <RateReviewOutlinedIcon /> },
                    { label: t('nav.security'), path: '/admin/security', icon: <SecurityOutlinedIcon /> },
                    { label: t('nav.reports'), path: '/admin/reports', icon: <BarChartOutlinedIcon /> },
                    { label: t('nav.profile'), path: '/profile', icon: <PersonOutlineIcon /> },
                ];
            case 'receptionist':
                return [
                    { label: t('nav.dashboard'), path: '/reception/dashboard', icon: <DashboardOutlinedIcon /> },
                    { label: t('nav.checkInOut'), path: '/reception/check-in-out', icon: <HowToRegOutlinedIcon /> },
                    { label: t('nav.reservations'), path: '/reception/reservations', icon: <BookOnlineOutlinedIcon /> },
                    { label: t('nav.serviceOrders'), path: '/reception/services', icon: <RoomServiceOutlinedIcon /> },
                    { label: t('nav.payments'), path: '/reception/payments', icon: <ReceiptLongOutlinedIcon /> },
                    { label: t('nav.rooms'), path: '/reception/rooms', icon: <BedOutlinedIcon /> },
                    { label: t('nav.maintenance'), path: '/reception/maintenance', icon: <BuildOutlinedIcon /> },
                    { label: t('nav.profile'), path: '/profile', icon: <PersonOutlineIcon /> },
                ];
            case 'housekeeping':
                return [
                    { label: t('nav.housekeepingBoard'), path: '/housekeeping/dashboard', icon: <DashboardOutlinedIcon /> },
                    { label: t('nav.cleaningTasks'), path: '/housekeeping/tasks', icon: <AssignmentTurnedInOutlinedIcon /> },
                    { label: t('nav.maintenance'), path: '/housekeeping/maintenance', icon: <BuildOutlinedIcon /> },
                    { label: t('nav.profile'), path: '/profile', icon: <PersonOutlineIcon /> },
                ];
            case 'guest':
            default:
                return [
                    { label: t('nav.dashboard'), path: '/guest/dashboard', icon: <DashboardOutlinedIcon /> },
                    { label: t('nav.browseHotels'), path: '/guest/hotels', icon: <ApartmentOutlinedIcon /> },
                    { label: t('nav.myReservations'), path: '/guest/reservations', icon: <BookOnlineOutlinedIcon /> },
                    { label: t('nav.payments'), path: '/guest/payments', icon: <ReceiptLongOutlinedIcon /> },
                    { label: t('nav.loyalty'), path: '/guest/loyalty', icon: <StarsOutlinedIcon /> },
                    { label: t('nav.reviews'), path: '/guest/reviews', icon: <RateReviewOutlinedIcon /> },
                    { label: t('nav.profile'), path: '/profile', icon: <PersonOutlineIcon /> },
                ];
        }
    };

    const menuItems = getMenuItems(user?.role);

    const drawerContent = (
        <Box
            sx={{
                height: '100%',
                bgcolor: '#0F172A',
                color: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Sidebar Header / Logo */}
            <Box
                sx={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 3,
                    borderBottom: '1px solid #1E293B',
                }}
            >
                <HotelIcon sx={{ color: '#C59B27', fontSize: 30 }} />
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 700,
                            color: '#F8FAFC',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            letterSpacing: '-0.01em',
                        }}
                    >
                        RP HOTELS
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.6875rem' }}>
                        {user?.role ? user.role.toUpperCase() + ' PORTAL' : 'HOSPITALITY'}
                    </Typography>
                </Box>
            </Box>

            {/* Navigation Menu List */}
            <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
                <List disablePadding>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    onClick={() => {
                                        navigate(item.path);
                                        if (isMobile && onMobileClose) {
                                            onMobileClose();
                                        }
                                    }}
                                    sx={{
                                        py: 1.25,
                                        px: 3,
                                        bgcolor: isActive ? '#1E293B' : 'transparent',
                                        borderLeft: isActive ? '4px solid #C59B27' : '4px solid transparent',
                                        '&:hover': {
                                            bgcolor: '#1E293B',
                                        },
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: isActive ? '#C59B27' : '#94A3B8',
                                            minWidth: 40,
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: '0.875rem',
                                            fontWeight: isActive ? 600 : 500,
                                            color: isActive ? '#F8FAFC' : '#CBD5E1',
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            <Divider sx={{ borderColor: '#1E293B' }} />

            {/* User Quick Info Footer */}
            <Box sx={{ p: 2, bgcolor: '#090D16', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 600 }} noWrap>
                        {user?.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }} noWrap>
                        {user?.email}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { lg: SIDEBAR_WIDTH }, flexShrink: { lg: 0 } }}>
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', lg: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: SIDEBAR_WIDTH,
                        borderRight: 'none',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Fixed Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', lg: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: SIDEBAR_WIDTH,
                        borderRight: 'none',
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default RoleSidebar;
