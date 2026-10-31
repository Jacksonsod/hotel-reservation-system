import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Divider,
    useTheme,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import RoomServiceOutlinedIcon from '@mui/icons-material/RoomServiceOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';

const ReceptionDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        expected_arrivals: [],
        current_guests: [],
        scheduled_departures: [],
        room_status_summary: {
            total: 0,
            available: 0,
            reserved: 0,
            occupied: 0,
            dirty: 0,
            clean: 0,
            under_maintenance: 0,
        },
    });

    const [hotels, setHotels] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [activeTab, setActiveTab] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Quick Check-out Modal State
    const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

    // Fetch Hotels for Filter
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res = await axiosClient.get('/hotels');
                if (res.data.success) {
                    setHotels(res.data.data.data || res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load hotels list', err);
            }
        };
        fetchHotels();
    }, []);

    // Fetch Dashboard Data
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = selectedHotel !== 'all' ? { hotel_id: selectedHotel } : {};
            const res = await axiosClient.get('/reception/dashboard', { params });
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to load front desk dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [selectedHotel]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleOpenCheckout = (reservation) => {
        setSelectedReservation(reservation);
        setPaymentMethod('cash');
        setCheckoutModalOpen(true);
    };

    const handleConfirmCheckout = async () => {
        if (!selectedReservation) return;
        setIsSubmittingCheckout(true);
        setErrorMsg('');
        try {
            const res = await axiosClient.post(`/reservations/${selectedReservation.reservation_id}/checkout`, {
                payment_method: paymentMethod,
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Checkout completed successfully.');
                setCheckoutModalOpen(false);
                fetchDashboardData();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to complete guest checkout.');
        } finally {
            setIsSubmittingCheckout(false);
        }
    };

    const roomSummary = data.room_status_summary || {};
    const totalRooms = roomSummary.total || 0;
    const occupiedRooms = roomSummary.occupied || 0;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* ROW 1: Page Header Bar */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        Front Desk Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Today's arrivals, departures, room occupancy board, and guest service coordination
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Hotel Branch</InputLabel>
                        <Select
                            value={selectedHotel}
                            label="Hotel Branch"
                            onChange={(e) => setSelectedHotel(e.target.value)}
                        >
                            <MenuItem value="all">All Branches</MenuItem>
                            {hotels.map((h) => (
                                <MenuItem key={h.hotel_id} value={h.hotel_id}>
                                    {h.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        startIcon={<LoginOutlinedIcon />}
                        onClick={() => navigate('/reception/check-in-out')}
                        sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                        Check-In / Out Desk
                    </Button>

                    <Tooltip title="Refresh Dashboard">
                        <IconButton
                            onClick={fetchDashboardData}
                            sx={{
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px',
                            }}
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

            {/* ROW 2: KPI Summary Strip */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Today's Expected Arrivals"
                        value={data.expected_arrivals?.length || 0}
                        icon={<LoginOutlinedIcon fontSize="large" />}
                        color="primary"
                        subtitle="Awaiting guest check-in"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Current In-House Guests"
                        value={data.current_guests?.length || 0}
                        icon={<HotelOutlinedIcon fontSize="large" />}
                        color="secondary"
                        subtitle="Active checked-in rooms"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Scheduled Departures"
                        value={data.scheduled_departures?.length || 0}
                        icon={<LogoutOutlinedIcon fontSize="large" />}
                        color="warning"
                        subtitle="Pending checkout settlement"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Occupancy Rate"
                        value={`${occupancyRate}%`}
                        icon={<MeetingRoomOutlinedIcon fontSize="large" />}
                        color={occupancyRate > 75 ? 'success' : 'info'}
                        subtitle={`${occupiedRooms} of ${totalRooms} rooms occupied`}
                    />
                </Grid>
            </Grid>

            {/* ROW 3: Room Status Snapshot Strip */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#F8FAFC',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Live Room Status Matrix
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        <Chip
                            icon={<CheckCircleOutlinedIcon />}
                            label={`Available: ${roomSummary.available || 0}`}
                            sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#064E3B' : '#D1FAE5', color: theme.palette.mode === 'dark' ? '#6EE7B7' : '#065F46', fontWeight: 600 }}
                        />
                        <Chip
                            icon={<HotelOutlinedIcon />}
                            label={`Occupied: ${roomSummary.occupied || 0}`}
                            sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1E3A8A' : '#DBEAFE', color: theme.palette.mode === 'dark' ? '#93C5FD' : '#1E40AF', fontWeight: 600 }}
                        />
                        <Chip
                            icon={<WarningAmberOutlinedIcon />}
                            label={`Reserved: ${roomSummary.reserved || 0}`}
                            sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#78350F' : '#FEF3C7', color: theme.palette.mode === 'dark' ? '#FCD34D' : '#92400E', fontWeight: 600 }}
                        />
                        <Chip
                            icon={<CleaningServicesOutlinedIcon />}
                            label={`Dirty (Turnover): ${roomSummary.dirty || 0}`}
                            sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#450A0A' : '#FEE2E2', color: theme.palette.mode === 'dark' ? '#FCA5A5' : '#991B1B', fontWeight: 600 }}
                        />
                        <Chip
                            label={`Clean: ${roomSummary.clean || 0}`}
                            sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#064E3B' : '#D1FAE5', color: theme.palette.mode === 'dark' ? '#6EE7B7' : '#065F46', fontWeight: 600 }}
                        />
                        <Chip
                            label={`Under Maintenance: ${roomSummary.under_maintenance || 0}`}
                            sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#450A0A' : '#FEE2E2', color: theme.palette.mode === 'dark' ? '#FCA5A5' : '#991B1B', fontWeight: 600 }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* ROW 4: Operational Data Tabs */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        px: 2,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                    }}
                >
                    <Tab
                        label={`Today's Expected Arrivals (${data.expected_arrivals?.length || 0})`}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    />
                    <Tab
                        label={`In-House Guests (${data.current_guests?.length || 0})`}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    />
                    <Tab
                        label={`Departures Today (${data.scheduled_departures?.length || 0})`}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    />
                </Tabs>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ p: 0 }}>
                        {/* TAB 0: EXPECTED ARRIVALS */}
                        {activeTab === 0 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Confirmation</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Guest Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Hotel & Room</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Guests</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.expected_arrivals?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No expected arrivals scheduled for today.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.expected_arrivals?.map((res) => (
                                                <TableRow key={res.reservation_id} hover>
                                                    <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                                                        {res.confirmation_code}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {res.user?.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {res.user?.phone || res.user?.email}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            Room {res.room?.room_number} ({res.room?.room_type?.type_name})
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {res.room?.hotel?.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" display="block">
                                                            In: {res.check_in}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block">
                                                            Out: {res.check_out}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>{res.number_of_guests}</TableCell>
                                                    <TableCell>
                                                        <StatusChip status={res.payment_status} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<LoginOutlinedIcon />}
                                                            onClick={() => navigate(`/reception/check-in-out?code=${res.confirmation_code}`)}
                                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                                        >
                                                            Check In
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* TAB 1: CURRENT IN-HOUSE GUESTS */}
                        {activeTab === 1 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Guest Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Confirmation</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Check-In Time</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Check-Out Due</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Folio Total</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.current_guests?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No in-house guests currently checked in.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.current_guests?.map((res) => (
                                                <TableRow key={res.reservation_id} hover>
                                                    <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                                                        Room {res.room?.room_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {res.user?.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {res.user?.phone}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                        {res.confirmation_code}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" display="block">
                                                            {res.check_in?.checkin_time ? new Date(res.check_in.checkin_time).toLocaleString() : res.check_in}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
                                                            {res.check_out}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            RWF {Number(res.total_amount).toLocaleString()}
                                                        </Typography>
                                                        <StatusChip status={res.payment_status} size="small" />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<RoomServiceOutlinedIcon />}
                                                                onClick={() => navigate(`/reception/services?code=${res.confirmation_code}`)}
                                                                sx={{ textTransform: 'none' }}
                                                            >
                                                                Services
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="warning"
                                                                startIcon={<LogoutOutlinedIcon />}
                                                                onClick={() => handleOpenCheckout(res)}
                                                                sx={{ textTransform: 'none', fontWeight: 600 }}
                                                            >
                                                                Checkout
                                                            </Button>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* TAB 2: SCHEDULED DEPARTURES */}
                        {activeTab === 2 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Guest Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Confirmation</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Check-Out Date</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.scheduled_departures?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No scheduled departures remaining for today.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            data.scheduled_departures?.map((res) => (
                                                <TableRow key={res.reservation_id} hover>
                                                    <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                                                        Room {res.room?.room_number}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {res.user?.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {res.user?.phone}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                        {res.confirmation_code}
                                                    </TableCell>
                                                    <TableCell>{res.check_out}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        RWF {Number(res.total_amount).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <StatusChip status={res.payment_status} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="warning"
                                                            startIcon={<LogoutOutlinedIcon />}
                                                            onClick={() => handleOpenCheckout(res)}
                                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                                        >
                                                            Process Checkout
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                )}
            </Paper>

            {/* QUICK CHECKOUT SETTLEMENT DIALOG */}
            <Dialog
                open={checkoutModalOpen}
                onClose={() => !isSubmittingCheckout && setCheckoutModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Process Guest Checkout & Balance Settlement
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    {selectedReservation && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC', borderRadius: '8px' }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Reservation Code
                                </Typography>
                                <Typography variant="h6" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                                    {selectedReservation.confirmation_code}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    <strong>Guest:</strong> {selectedReservation.user?.name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Room:</strong> Room {selectedReservation.room?.room_number} ({selectedReservation.room?.room_type?.type_name})
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Folio Total:</strong> RWF {Number(selectedReservation.total_amount).toLocaleString()}
                                </Typography>
                            </Box>

                            <FormControl fullWidth size="small">
                                <InputLabel>Settlement Payment Method</InputLabel>
                                <Select
                                    value={paymentMethod}
                                    label="Settlement Payment Method"
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <MenuItem value="cash">Cash (Front Desk)</MenuItem>
                                    <MenuItem value="card">Credit / Debit Card</MenuItem>
                                    <MenuItem value="mobile_money">Mobile Money (MTN / Airtel)</MenuItem>
                                </Select>
                            </FormControl>

                            <Alert severity="info">
                                Completing checkout will finalize the folio, mark the room status as <strong>Dirty</strong>, and automatically assign a turnover cleaning task to Housekeeping.
                            </Alert>
                        </Box>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setCheckoutModalOpen(false)}
                        disabled={isSubmittingCheckout}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleConfirmCheckout}
                        disabled={isSubmittingCheckout}
                        startIcon={isSubmittingCheckout ? <CircularProgress size={18} /> : <LogoutOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {isSubmittingCheckout ? 'Processing...' : 'Settle & Check Out'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReceptionDashboard;
