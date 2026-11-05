import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    Box,
    Typography,
    IconButton,
    Select,
    MenuItem,
    Badge,
    Popover,
    List,
    ListItem,
    ListItemText,
    Button,
    Avatar,
    Menu,
    Chip,
    Divider,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeModeContext';
import axiosClient from '../../api/axiosClient';
import { humanizeStatus, formatDate } from '../../utils/formatters';

const TopHeader = ({ onToggleMobileSidebar }) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
    const navigate = useNavigate();

    const { user, logout, selectedBranchId, setSelectedBranchId } = useAuth();
    const { mode, toggleThemeMode } = useThemeMode();

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifAnchor, setNotifAnchor] = useState(null);

    // Profile menu state
    const [profileAnchor, setProfileAnchor] = useState(null);

    // Hotel branches for context filter
    const [branches, setBranches] = useState([]);

    const fetchBranches = async () => {
        try {
            const res = await axiosClient.get('/hotels');
            if (res.data?.success && Array.isArray(res.data?.data)) {
                setBranches(res.data.data.map((h) => ({ id: h.hotel_id, name: h.name })));
            }
        } catch (err) {
            console.error('Failed to load branches', err);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchBranches();
        }
    }, [user]);

    const hotelBranches = [
        { id: 'all', name: t('nav.allBranches') },
        ...branches,
    ];

    const fetchNotifications = async () => {
        try {
            const res = await axiosClient.get('/notifications');
            if (res.data?.success && res.data?.data) {
                setNotifications(res.data.data.notifications || []);
                setUnreadCount(res.data.data.unread_count || 0);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Polling notifications every 60 seconds
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleMarkAllRead = async () => {
        try {
            await axiosClient.post('/notifications/read-all');
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Failed to mark all read', err);
        }
    };

    const handleLanguageChange = (e) => {
        i18n.changeLanguage(e.target.value);
    };

    const handleLogout = async () => {
        setProfileAnchor(null);
        await logout();
        navigate('/login');
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                height: 64,
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                justifyContent: 'center',
                px: { xs: 1, sm: 2, md: 3 },
                zIndex: theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar disableGutters sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between' }}>
                {/* Left side: Mobile Toggle & Brand / Title */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {isMobile && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={onToggleMobileSidebar}
                            size="small"
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <HotelOutlinedIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                            display: { xs: 'none', sm: 'block' },
                            letterSpacing: '-0.02em',
                        }}
                    >
                        RP HOTELS
                    </Typography>
                </Box>

                {/* Right side controls in exact specification order */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                    {/* 1. Hotel Branch Context Selector (Admin only) */}
                    {user?.role === 'admin' && (
                        <Select
                            size="small"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                            sx={{
                                height: 38,
                                minWidth: { xs: 110, sm: 180 },
                                fontSize: '0.8125rem',
                                '& .MuiSelect-select': { py: 0.75 },
                            }}
                        >
                            {hotelBranches.map((branch) => (
                                <MenuItem key={branch.id} value={branch.id} sx={{ fontSize: '0.8125rem' }}>
                                    {branch.name}
                                </MenuItem>
                            ))}
                        </Select>
                    )}

                    {/* 2. Language Switcher (EN, FR, RW) */}
                    <Select
                        size="small"
                        value={i18n.language || 'en'}
                        onChange={handleLanguageChange}
                        sx={{
                            height: 38,
                            minWidth: { xs: 65, sm: 75 },
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                        }}
                    >
                        <MenuItem value="en">EN</MenuItem>
                        <MenuItem value="fr">FR</MenuItem>
                        <MenuItem value="rw">RW</MenuItem>
                    </Select>

                    {/* 3. Dark/Light Mode Toggle (half-moon in light mode, sun in dark mode) */}
                    <IconButton
                        onClick={toggleThemeMode}
                        color="inherit"
                        size="small"
                        title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        sx={{ p: 1 }}
                    >
                        {mode === 'light' ? (
                            <DarkModeOutlinedIcon sx={{ fontSize: 22 }} />
                        ) : (
                            <LightModeOutlinedIcon sx={{ fontSize: 22, color: theme.palette.secondary.main }} />
                        )}
                    </IconButton>

                    {/* 4. Notification Bell with Popover */}
                    <IconButton
                        size="small"
                        onClick={(e) => setNotifAnchor(e.currentTarget)}
                        color="inherit"
                        sx={{ p: 1 }}
                    >
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
                        </Badge>
                    </IconButton>
                    <Popover
                        open={Boolean(notifAnchor)}
                        anchorEl={notifAnchor}
                        onClose={() => setNotifAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        PaperProps={{
                            sx: { width: 340, maxHeight: 420, p: 1, borderRadius: 2 },
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                Notifications
                            </Typography>
                            {unreadCount > 0 && (
                                <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem' }}>
                                    {t('actions.markAllRead')}
                                </Button>
                            )}
                        </Box>
                        <Divider />
                        <List dense sx={{ maxHeight: 320, overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <ListItem>
                                    <ListItemText
                                        primary="No notifications"
                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                    />
                                </ListItem>
                            ) : (
                                notifications.map((n) => (
                                    <ListItem
                                        key={n.notification_id}
                                        sx={{
                                            bgcolor: n.is_read ? 'transparent' : 'action.hover',
                                            borderRadius: 1,
                                            mb: 0.5,
                                        }}
                                    >
                                        <ListItemText
                                            primary={n.title}
                                            secondary={
                                                <Box component="span">
                                                    <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                        {n.message}
                                                    </Typography>
                                                    <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontSize: '0.675rem' }}>
                                                        {formatDate(n.created_at, true)}
                                                    </Typography>
                                                </Box>
                                            }
                                            primaryTypographyProps={{
                                                variant: 'body2',
                                                fontWeight: n.is_read ? 400 : 600,
                                            }}
                                        />
                                    </ListItem>
                                ))
                            )}
                        </List>
                    </Popover>

                    {/* 5. User Profile Chip & Menu */}
                    <Box
                        onClick={(e) => setProfileAnchor(e.currentTarget)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            p: 0.5,
                            borderRadius: 2,
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                    >
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.primary.contrastText,
                                fontSize: '0.875rem',
                                fontWeight: 600,
                            }}
                        >
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {user?.name || 'Guest User'}
                            </Typography>
                            <Chip
                                label={humanizeStatus(user?.role || 'guest')}
                                size="small"
                                sx={{
                                    height: 18,
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                    bgcolor: theme.palette.secondary.light,
                                    color: theme.palette.secondary.contrastText,
                                }}
                            />
                        </Box>
                    </Box>
                    <Menu
                        anchorEl={profileAnchor}
                        open={Boolean(profileAnchor)}
                        onClose={() => setProfileAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <MenuItem
                            onClick={() => {
                                setProfileAnchor(null);
                                navigate('/profile');
                            }}
                        >
                            <PersonOutlineIcon sx={{ mr: 1, fontSize: 20 }} />
                            {t('nav.profile')}
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                            <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
                            {t('actions.logout')}
                        </MenuItem>
                    </Menu>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default TopHeader;
