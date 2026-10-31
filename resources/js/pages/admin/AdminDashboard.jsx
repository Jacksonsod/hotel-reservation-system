import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    useTheme,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import { RECHARTS_COLORS } from '../../theme/theme';

const AdminDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const isDark = theme.palette.mode === 'dark';

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState('all');

    // Recent reservations
    const [recentReservations, setRecentReservations] = useState([]);

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Broadcast Promo Modal
    const [promoModalOpen, setPromoModalOpen] = useState(false);
    const [promoTitle, setPromoTitle] = useState('');
    const [promoMessage, setPromoMessage] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);

    // Stay Reminders
    const [sendingReminders, setSendingReminders] = useState(false);

    // Load Hotels
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res = await axiosClient.get('/hotels');
                if (res.data.success) {
                    setHotels(res.data.data.data || res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load hotels', err);
            }
        };
        fetchHotels();
    }, []);

    // Load Analytics & Recent Bookings
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = selectedHotel !== 'all' ? { hotel_id: selectedHotel } : {};
            const [analyticsRes, reservationsRes] = await Promise.all([
                axiosClient.get('/reports/analytics', { params }),
                axiosClient.get('/reservations', { params: { per_page: 5, ...params } }),
            ]);

            if (analyticsRes.data.success) {
                setAnalytics(analyticsRes.data.data);
            }
            if (reservationsRes.data.success) {
                setRecentReservations(reservationsRes.data.data.data || []);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to load executive dashboard analytics.');
        } finally {
            setLoading(false);
        }
    }, [selectedHotel]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleBroadcastPromo = async () => {
        if (!promoTitle.trim() || !promoMessage.trim()) return;
        setIsBroadcasting(true);
        setErrorMsg('');
        try {
            const res = await axiosClient.post('/notifications/broadcast-promo', {
                title: promoTitle.trim(),
                message: promoMessage.trim(),
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Promotional notification broadcast to guests.');
                setPromoModalOpen(false);
                setPromoTitle('');
                setPromoMessage('');
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to broadcast promotion.');
        } finally {
            setIsBroadcasting(false);
        }
    };

    const handleSendReminders = async () => {
        setSendingReminders(true);
        setErrorMsg('');
        try {
            const res = await axiosClient.post('/notifications/send-reminders');
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Stay reminders dispatched successfully.');
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to dispatch stay reminders.');
        } finally {
            setSendingReminders(false);
        }
    };

    const kpis = analytics?.executive_kpis || {};
    const hkMaint = analytics?.housekeeping_maintenance_stats || { housekeeping: {}, maintenance: {} };

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* ROW 1: Header Bar */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        Executive Operations Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Real-time revenue metrics, multi-branch occupancy, live operational status, and automated guest engagement
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Hotel Branch</InputLabel>
                        <Select
                            value={selectedHotel}
                            label="Hotel Branch"
                            onChange={(e) => setSelectedHotel(e.target.value)}
                        >
                            <MenuItem value="all">All Hotel Branches</MenuItem>
                            {hotels.map((h) => (
                                <MenuItem key={h.hotel_id} value={h.hotel_id}>{h.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<CampaignOutlinedIcon />}
                        onClick={() => setPromoModalOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Broadcast Promo
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={sendingReminders ? <CircularProgress size={18} /> : <NotificationsActiveOutlinedIcon />}
                        onClick={handleSendReminders}
                        disabled={sendingReminders}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Send Stay Reminders
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PictureAsPdfOutlinedIcon />}
                        onClick={() => window.open('/api/v1/reports/export/pdf', '_blank')}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Export Executive PDF
                    </Button>

                    <Tooltip title="Refresh Metrics">
                        <IconButton
                            onClick={fetchDashboardData}
                            sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}
                        >
                            <RefreshOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {errorMsg && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {successMsg && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
                    {successMsg}
                </Alert>
            )}

            {/* ROW 2: Executive KPI Summary Strip (6 Widgets) */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <KpiCard
                        title="Total Revenue"
                        value={`RWF ${Number(kpis.total_revenue || 0).toLocaleString()}`}
                        icon={<MonetizationOnOutlinedIcon fontSize="large" />}
                        color="primary"
                        subtitle="Settled & paid stays"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <KpiCard
                        title="Occupancy Rate"
                        value={`${kpis.occupancy_rate_percent || 0}%`}
                        icon={<HotelOutlinedIcon fontSize="large" />}
                        color={kpis.occupancy_rate_percent > 70 ? 'success' : 'warning'}
                        subtitle={`${kpis.occupied_rooms || 0} / ${kpis.total_rooms || 0} rooms occupied`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <KpiCard
                        title="Available Rooms"
                        value={kpis.available_rooms || 0}
                        icon={<MeetingRoomOutlinedIcon fontSize="large" />}
                        color="success"
                        subtitle="Ready for check-in"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <KpiCard
                        title="Active Bookings"
                        value={kpis.active_reservations || 0}
                        icon={<PeopleOutlinedIcon fontSize="large" />}
                        color="info"
                        subtitle="Confirmed & checked-in"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <KpiCard
                        title="In-House Guests"
                        value={kpis.current_guests || 0}
                        icon={<HotelOutlinedIcon fontSize="large" />}
                        color="secondary"
                        subtitle="Currently staying"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}>
                    <KpiCard
                        title="Guest Satisfaction"
                        value={`★ ${kpis.avg_satisfaction_rating || 4.8}`}
                        icon={<StarOutlinedIcon fontSize="large" />}
                        color="secondary"
                        subtitle="Average across verified reviews"
                    />
                </Grid>
            </Grid>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* ROW 3: Recharts Visual Row 1 */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {/* REVENUE & BOOKING TREND */}
                        <Grid item xs={12} lg={8}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    height: '100%',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Revenue & Booking Velocity Trend
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Daily financial gross volume and reservation arrivals over the past 7 days
                                </Typography>

                                <Box sx={{ width: '100%', height: 320 }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={analytics?.revenue_trend || []}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={RECHARTS_COLORS[0]} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={RECHARTS_COLORS[0]} stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="period_label" stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                                            <RechartsTooltip
                                                formatter={(val, name) => [name === 'revenue' ? `RWF ${Number(val).toLocaleString()}` : val, name === 'revenue' ? 'Revenue' : 'Bookings']}
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="revenue" stroke={RECHARTS_COLORS[0]} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (RWF)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* ROOM STATUS DONUT CHART */}
                        <Grid item xs={12} lg={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    height: '100%',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Live Room Inventory Status
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Real-time distribution across cleaning, occupancy and maintenance
                                </Typography>

                                <Box sx={{ width: '100%', height: 320 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={analytics?.room_status_distribution?.filter((d) => d.value > 0) || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {(analytics?.room_status_distribution || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* ROW 4: Recharts Visual Row 2 - Branch Comparison */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Multi-Branch Performance & Occupancy Comparison
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Comparing Kigali, Karongi, and Rubavu properties across gross volume and occupancy rates
                                </Typography>

                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={analytics?.revenue_by_branch || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="hotel_name" stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis yAxisId="left" orientation="left" stroke={RECHARTS_COLORS[0]} fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                                            <YAxis yAxisId="right" orientation="right" stroke={RECHARTS_COLORS[1]} fontSize={12} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                            <RechartsTooltip
                                                formatter={(val, name) => [name === 'revenue' ? `RWF ${Number(val).toLocaleString()}` : `${val}%`, name === 'revenue' ? 'Gross Revenue' : 'Occupancy Rate']}
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                            />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="revenue" fill={RECHARTS_COLORS[0]} name="Gross Revenue (RWF)" radius={[4, 4, 0, 0]} />
                                            <Bar yAxisId="right" dataKey="occupancy_rate" fill={RECHARTS_COLORS[1]} name="Occupancy Rate (%)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* ROW 5: Operational Snapshots & Recent Reservations */}
                    <Grid container spacing={3}>
                        {/* RECENT RESERVATIONS */}
                        <Grid item xs={12} lg={8}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        Recent Reservations
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="text"
                                        onClick={() => navigate('/admin/reservations')}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        View All
                                    </Button>
                                </Box>

                                <TableContainer>
                                    <Table size="small">
                                        <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Guest</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Check-In</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {recentReservations.map((res) => (
                                                <TableRow key={res.reservation_id} hover>
                                                    <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                                                        {res.confirmation_code}
                                                    </TableCell>
                                                    <TableCell>{res.user?.name}</TableCell>
                                                    <TableCell>Room {res.room?.room_number}</TableCell>
                                                    <TableCell>{res.check_in}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        RWF {Number(res.total_amount).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip status={res.reservation_status} size="small" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        {/* OPERATIONAL ALERTS CARD */}
                        <Grid item xs={12} lg={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                                    Operational Health & Alert Center
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box
                                        onClick={() => navigate('/admin/operations')}
                                        sx={{
                                            p: 2,
                                            borderRadius: '8px',
                                            bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <BuildOutlinedIcon color="warning" />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Pending Maintenance
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {hkMaint.maintenance?.urgent_count || 0} urgent repairs
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip label={hkMaint.maintenance?.pending_count || 0} color="warning" size="small" />
                                    </Box>

                                    <Box
                                        onClick={() => navigate('/admin/operations')}
                                        sx={{
                                            p: 2,
                                            borderRadius: '8px',
                                            bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <MeetingRoomOutlinedIcon color="error" />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Dirty / Turnover Rooms
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Awaiting cleaning completion
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip label={hkMaint.housekeeping?.dirty_count || 0} color="error" size="small" />
                                    </Box>

                                    <Box
                                        onClick={() => navigate('/admin/security')}
                                        sx={{
                                            p: 2,
                                            borderRadius: '8px',
                                            bgcolor: isDark ? '#1E293B' : '#F8FAFC',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <ShieldOutlinedIcon color="error" />
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Security & Fraud Flags
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Velocity alerts and audit logs
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
                                            Review
                                        </Button>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}

            {/* BROADCAST PROMO DIALOG */}
            <Dialog
                open={promoModalOpen}
                onClose={() => !isBroadcasting && setPromoModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Broadcast Promotional Announcement
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <TextField
                            label="Promotion Title"
                            placeholder="e.g. 20% Off Weekend Lakeview Suites!"
                            value={promoTitle}
                            onChange={(e) => setPromoTitle(e.target.value)}
                            fullWidth
                            size="small"
                        />
                        <TextField
                            label="Promotion Message / Details"
                            placeholder="Describe the offer, discount code, validity period, and complimentary amenities..."
                            value={promoMessage}
                            onChange={(e) => setPromoMessage(e.target.value)}
                            multiline
                            rows={4}
                            fullWidth
                            size="small"
                        />
                        <Alert severity="info">
                            This message will be instantly sent as a high-priority in-app notification to all active registered guests across the platform.
                        </Alert>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setPromoModalOpen(false)} disabled={isBroadcasting} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleBroadcastPromo}
                        disabled={isBroadcasting || !promoTitle.trim() || !promoMessage.trim()}
                        startIcon={isBroadcasting ? <CircularProgress size={18} /> : <CampaignOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {isBroadcasting ? 'Broadcasting...' : 'Broadcast to Guests'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminDashboard;
