import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    Chip,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    useTheme,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import LoyaltyOutlinedIcon from '@mui/icons-material/LoyaltyOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';

import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import PaymentDialog from '../../components/common/PaymentDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { formatCurrency, formatDate } from '../../utils/formatters';

const GuestDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [reservations, setReservations] = useState([]);
    const [loyaltyAccount, setLoyaltyAccount] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Payment & Cancel dialogs
    const [selectedReservationForPay, setSelectedReservationForPay] = useState(null);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resRes, loyRes, notifRes] = await Promise.all([
                axiosClient.get('/reservations'),
                axiosClient.get('/loyalty'),
                axiosClient.get('/notifications'),
            ]);

            if (resRes.data?.success) setReservations(resRes.data.data || []);
            if (loyRes.data?.success && loyRes.data.data?.account) {
                setLoyaltyAccount(loyRes.data.data.account);
            }
            if (notifRes.data?.success && notifRes.data.data) {
                setNotifications(notifRes.data.data.notifications || []);
                setUnreadNotifCount(notifRes.data.data.unread_count || 0);
            }
        } catch (err) {
            console.error('Failed to load guest dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // KPIs
    const kpis = useMemo(() => {
        const upcoming = reservations.filter((r) =>
            ['pending', 'confirmed'].includes(r.reservation_status)
        ).length;
        const completed = reservations.filter((r) => r.reservation_status === 'checked_out').length;
        const points = loyaltyAccount?.available_points ?? 0;
        const rwfEquivalent = points * 50;
        return { upcoming, completed, points, rwfEquivalent };
    }, [reservations, loyaltyAccount]);

    // Active upcoming reservations
    const upcomingList = useMemo(() => {
        return reservations
            .filter((r) => ['pending', 'confirmed'].includes(r.reservation_status))
            .slice(0, 3);
    }, [reservations]);

    const handleCancelReservation = async () => {
        if (!reservationToCancel) return;
        try {
            await axiosClient.post(`/reservations/${reservationToCancel.reservation_id}/cancel`);
            fetchData();
        } catch (err) {
            console.error('Cancel failed', err);
        } finally {
            setConfirmCancelOpen(false);
            setReservationToCancel(null);
        }
    };

    const handleDownloadInvoice = (id) => {
        window.open(`/api/v1/invoices/${id}/pdf`, '_blank');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header / Welcome Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 800 }}>
                        Welcome back, {user?.name}!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your luxury stays, loyalty rewards, invoices, and verified reviews.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/guest/hotels')}
                >
                    Book a New Stay
                </Button>
            </Box>

            {/* 4 KPI Cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Upcoming Stays"
                        value={kpis.upcoming}
                        icon={<CalendarMonthOutlinedIcon />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Completed Stays"
                        value={kpis.completed}
                        icon={<CheckCircleOutlinedIcon />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Available Loyalty Points"
                        value={`${kpis.points.toLocaleString()} pts`}
                        subtitle={`Worth ${formatCurrency(kpis.rwfEquivalent)}`}
                        icon={<LoyaltyOutlinedIcon />}
                        color="secondary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Unread Notifications"
                        value={unreadNotifCount}
                        icon={<NotificationsOutlinedIcon />}
                        color="info"
                    />
                </Grid>
            </Grid>

            {/* Main Content: Upcoming Stays & Notifications Feed */}
            <Grid container spacing={3}>
                {/* Left: Upcoming Stays List */}
                <Grid item xs={12} lg={8}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                Upcoming Reservations
                            </Typography>
                            <Button size="small" onClick={() => navigate('/guest/reservations')}>
                                View All ({reservations.length})
                            </Button>
                        </Box>

                        {upcomingList.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <HotelOutlinedIcon sx={{ fontSize: 52, color: 'secondary.main', mb: 1.5 }} />
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    No upcoming reservations found
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 440, mx: 'auto' }}>
                                    Ready for a relaxing getaway? Explore our resorts in Karongi, Kigali, and Rubavu.
                                </Typography>
                                <Button variant="contained" color="primary" onClick={() => navigate('/guest/hotels')}>
                                    Browse Available Hotels
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {upcomingList.map((res) => {
                                    const paidSoFar = (res.payments || [])
                                        .filter((p) => p.payment_status === 'completed')
                                        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                                    const balance = Math.max(0, Number(res.total_amount || 0) - paidSoFar);

                                    return (
                                        <Card
                                            key={res.reservation_id}
                                            variant="outlined"
                                            sx={{ borderRadius: '12px', p: 2 }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                                            {res.room?.hotel?.name}
                                                        </Typography>
                                                        <StatusChip status={res.reservation_status} />
                                                        <StatusChip status={res.payment_status} />
                                                    </Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                        Room {res.room?.room_number} • {res.room?.roomType?.type_name} • {res.room?.hotel?.location}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', fontWeight: 700 }}>
                                                        Confirmation: {res.confirmation_code}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                    <Typography variant="caption" color="text.secondary">Total Stay Cost</Typography>
                                                    <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                                                        {formatCurrency(res.total_amount)}
                                                    </Typography>
                                                    {balance > 0 && (
                                                        <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, display: 'block' }}>
                                                            Due: {formatCurrency(balance)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Divider sx={{ my: 1.5 }} />

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Stay: <strong>{formatDate(res.check_in)}</strong> to <strong>{formatDate(res.check_out)}</strong> ({res.number_of_guests} {res.number_of_guests === 1 ? 'Guest' : 'Guests'})
                                                </Typography>

                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<PictureAsPdfOutlinedIcon />}
                                                        onClick={() => handleDownloadInvoice(res.reservation_id)}
                                                    >
                                                        Invoice PDF
                                                    </Button>
                                                    {balance > 0 && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="secondary"
                                                            startIcon={<PaymentsOutlinedIcon />}
                                                            onClick={() => setSelectedReservationForPay(res)}
                                                            sx={{ color: '#0F172A', fontWeight: 700 }}
                                                        >
                                                            Pay Balance
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setReservationToCancel(res);
                                                            setConfirmCancelOpen(true);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Card>
                                    );
                                })}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Right: Notifications & Quick Rewards */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Loyalty Card */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: '16px',
                                background: theme.palette.mode === 'dark'
                                    ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
                                    : 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)',
                                border: `1px solid ${theme.palette.secondary.light}`,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <LoyaltyOutlinedIcon color="secondary" />
                                <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                    RP Loyalty Club
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                You earn 1 point for every 1,000 RWF spent on completed stays.
                            </Typography>
                            <Typography variant="h1" sx={{ fontWeight: 800, color: 'secondary.main', mb: 0.5 }}>
                                {(loyaltyAccount?.available_points ?? 0).toLocaleString()} <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>pts</span>
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Instant Redemption Value: <strong>RWF {((loyaltyAccount?.available_points ?? 0) * 50).toLocaleString()}</strong>
                            </Typography>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="secondary"
                                size="small"
                                onClick={() => navigate('/guest/loyalty')}
                            >
                                View Rewards History
                            </Button>
                        </Paper>

                        {/* Recent Notifications */}
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                                Recent Alerts
                            </Typography>
                            {notifications.length === 0 ? (
                                <Typography variant="caption" color="text.secondary">
                                    No notifications received yet.
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {notifications.slice(0, 4).map((n) => (
                                        <ListItem
                                            key={n.notification_id}
                                            disableGutters
                                            sx={{ py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <NotificationsOutlinedIcon fontSize="small" color={n.is_read ? 'action' : 'primary'} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body2" sx={{ fontWeight: n.is_read ? 400 : 700 }}>
                                                        {n.title}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box component="span">
                                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                                                            {n.message}
                                                        </Typography>
                                                        <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                                            {formatDate(n.created_at, true)}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Box>
                </Grid>
            </Grid>

            {/* Simulated Payment Dialog */}
            {selectedReservationForPay && (
                <PaymentDialog
                    open={Boolean(selectedReservationForPay)}
                    onClose={() => setSelectedReservationForPay(null)}
                    reservation={selectedReservationForPay}
                    onPaymentSuccess={() => {
                        fetchData();
                    }}
                />
            )}

            {/* Cancel Confirmation Dialog */}
            <ConfirmDialog
                open={confirmCancelOpen}
                title="Cancel Reservation"
                message={`Are you sure you want to cancel reservation ${reservationToCancel?.confirmation_code}? Any redeemed loyalty points will be automatically refunded.`}
                confirmText="Cancel Reservation"
                confirmColor="error"
                onConfirm={handleCancelReservation}
                onCancel={() => setConfirmCancelOpen(false)}
            />
        </Box>
    );
};

export default GuestDashboard;
