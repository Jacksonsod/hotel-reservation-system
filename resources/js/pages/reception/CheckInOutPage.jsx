import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Divider,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
} from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import RoomServiceOutlinedIcon from '@mui/icons-material/RoomServiceOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatusChip from '../../components/common/StatusChip';

const CheckInOutPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [lookupCode, setLookupCode] = useState(searchParams.get('code') || '');
    const [loading, setLoading] = useState(false);
    const [reservationData, setReservationData] = useState(null);
    const [alternativeRooms, setAlternativeRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [companionGuests, setCompanionGuests] = useState([]);
    const [newGuestName, setNewGuestName] = useState('');
    const [newGuestId, setNewGuestId] = useState('');
    const [newGuestPhone, setNewGuestPhone] = useState('');

    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Checkout modal state
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState('cash');

    const handleLookup = useCallback(async (codeToLookup) => {
        const code = (codeToLookup || lookupCode).trim();
        if (!code) return;

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        setReservationData(null);

        try {
            const res = await axios.get(`/api/v1/reception/lookup/${encodeURIComponent(code)}`);
            if (res.data.success) {
                const { reservation, alternative_available_rooms } = res.data.data;
                setReservationData(reservation);
                setAlternativeRooms(alternative_available_rooms || []);
                setSelectedRoomId(reservation.room_id || '');
                setSpecialRequests(reservation.check_in?.special_requests || '');
                setCompanionGuests(reservation.guests || []);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'No reservation found with this confirmation code.');
        } finally {
            setLoading(false);
        }
    }, [lookupCode]);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            setLookupCode(code);
            handleLookup(code);
        }
    }, [searchParams, handleLookup]);

    const handleAddCompanion = () => {
        if (!newGuestName.trim()) return;
        setCompanionGuests([
            ...companionGuests,
            {
                full_name: newGuestName.trim(),
                identification_number: newGuestId.trim(),
                contact_phone: newGuestPhone.trim(),
            },
        ]);
        setNewGuestName('');
        setNewGuestId('');
        setNewGuestPhone('');
    };

    const handleRemoveCompanion = (index) => {
        setCompanionGuests(companionGuests.filter((_, idx) => idx !== index));
    };

    const handleCheckIn = async () => {
        if (!reservationData) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const payload = {
                room_id: selectedRoomId || reservationData.room_id,
                special_requests: specialRequests,
                companion_guests: companionGuests,
            };

            const res = await axios.post(`/api/v1/reservations/${reservationData.reservation_id}/check-in`, payload);
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Guest checked in successfully!');
                handleLookup(reservationData.confirmation_code);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to process check-in.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!reservationData) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await axios.post(`/api/v1/reservations/${reservationData.reservation_id}/checkout`, {
                payment_method: checkoutPaymentMethod,
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Guest checkout completed successfully!');
                setCheckoutOpen(false);
                handleLookup(reservationData.confirmation_code);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to complete checkout.');
        } finally {
            setActionLoading(false);
        }
    };

    const totalPaid = reservationData?.payments?.reduce((sum, p) => p.payment_status === 'completed' ? sum + Number(p.amount) : sum, 0) || 0;
    const totalAmount = Number(reservationData?.total_amount || 0);
    const balance = Math.max(0, totalAmount - totalPaid);

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                    Check-In & Check-Out Desk
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Lookup reservations by confirmation code, register guest arrivals, reassign rooms, post folios, and process departures
                </Typography>
            </Box>

            {/* Confirmation Code Search Bar */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                }}
            >
                <TextField
                    label="Confirmation Code"
                    placeholder="e.g. KGL-2026-XXXXXX"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 320 }, fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchOutlinedIcon />}
                    onClick={() => handleLookup()}
                    disabled={loading || !lookupCode.trim()}
                    sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
                >
                    Lookup Reservation
                </Button>
            </Paper>

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

            {reservationData && (
                <Grid container spacing={3}>
                    {/* LEFT COLUMN: GUEST & STAY DETAILS */}
                    <Grid item xs={12} md={7}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: '12px',
                                border: `1px solid ${theme.palette.divider}`,
                                mb: 3,
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                        {reservationData.user?.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Email: {reservationData.user?.email} | Phone: {reservationData.user?.phone || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <StatusChip status={reservationData.reservation_status} />
                                    <StatusChip status={reservationData.payment_status} />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" color="text.secondary">Confirmation</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                                        {reservationData.confirmation_code}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" color="text.secondary">Dates of Stay</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {reservationData.check_in} → {reservationData.check_out}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" color="text.secondary">Total Guests</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {reservationData.number_of_guests} Guest(s)
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <Typography variant="caption" color="text.secondary">Hotel Branch</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {reservationData.room?.hotel?.name}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Room Assignment & Alternative Options */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Room Assignment & Reassignment
                                </Typography>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Assigned Room</InputLabel>
                                    <Select
                                        value={selectedRoomId}
                                        label="Assigned Room"
                                        disabled={reservationData.reservation_status === 'checked_out'}
                                        onChange={(e) => setSelectedRoomId(e.target.value)}
                                    >
                                        <MenuItem value={reservationData.room_id}>
                                            Room {reservationData.room?.room_number} ({reservationData.room?.room_type?.type_name}) - Currently Assigned
                                        </MenuItem>
                                        {alternativeRooms
                                            ?.filter((r) => r.room_id !== reservationData.room_id)
                                            ?.map((ar) => (
                                                <MenuItem key={ar.room_id} value={ar.room_id}>
                                                    Room {ar.room_number} ({ar.room_type?.type_name}) - Cap: {ar.capacity} (Available)
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            {/* Special Requests */}
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Special Requests / Front Desk Notes"
                                    multiline
                                    rows={2}
                                    size="small"
                                    value={specialRequests}
                                    onChange={(e) => setSpecialRequests(e.target.value)}
                                    disabled={reservationData.reservation_status === 'checked_out'}
                                />
                            </Box>

                            {/* Companion Guests Table */}
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                                    Registered Companion Guests
                                </Typography>

                                {reservationData.reservation_status === 'confirmed' && (
                                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                        <TextField
                                            size="small"
                                            placeholder="Guest Full Name"
                                            value={newGuestName}
                                            onChange={(e) => setNewGuestName(e.target.value)}
                                            sx={{ flexGrow: 1, minWidth: 150 }}
                                        />
                                        <TextField
                                            size="small"
                                            placeholder="ID / Passport Number"
                                            value={newGuestId}
                                            onChange={(e) => setNewGuestId(e.target.value)}
                                            sx={{ width: 160 }}
                                        />
                                        <TextField
                                            size="small"
                                            placeholder="Phone Number"
                                            value={newGuestPhone}
                                            onChange={(e) => setNewGuestPhone(e.target.value)}
                                            sx={{ width: 140 }}
                                        />
                                        <Button
                                            variant="outlined"
                                            startIcon={<PersonAddOutlinedIcon />}
                                            onClick={handleAddCompanion}
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Add
                                        </Button>
                                    </Box>
                                )}

                                <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                                    <Table size="small">
                                        <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>ID / Passport</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                                                {reservationData.reservation_status === 'confirmed' && (
                                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                                                )}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {companionGuests.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                                                        No additional companion guests registered.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                companionGuests.map((g, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell>{g.full_name}</TableCell>
                                                        <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace' }}>{g.identification_number || '—'}</TableCell>
                                                        <TableCell>{g.contact_phone || '—'}</TableCell>
                                                        {reservationData.reservation_status === 'confirmed' && (
                                                            <TableCell align="right">
                                                                <IconButton size="small" color="error" onClick={() => handleRemoveCompanion(idx)}>
                                                                    <DeleteOutlinedIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* RIGHT COLUMN: FOLIO, BILLING & ACTIONS */}
                    <Grid item xs={12} md={5}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: '12px',
                                border: `1px solid ${theme.palette.divider}`,
                                mb: 3,
                            }}
                        >
                            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
                                Billing & Folio Summary
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Total Folio Charges</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        RWF {totalAmount.toLocaleString()}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Total Payments Received</Typography>
                                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                                        - RWF {totalPaid.toLocaleString()}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 1 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        Outstanding Balance
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 800,
                                            color: balance > 0 ? 'error.main' : 'success.main',
                                            fontFamily: 'JetBrains Mono, monospace',
                                        }}
                                    >
                                        RWF {balance.toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* PRIMARY ACTIONS BASED ON STATUS */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {reservationData.reservation_status === 'confirmed' && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="large"
                                        startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <LoginOutlinedIcon />}
                                        onClick={handleCheckIn}
                                        disabled={actionLoading}
                                        sx={{ textTransform: 'none', fontWeight: 700, py: 1.5 }}
                                    >
                                        {actionLoading ? 'Checking In...' : 'Register & Complete Check-In'}
                                    </Button>
                                )}

                                {reservationData.reservation_status === 'checked_in' && (
                                    <>
                                        <Button
                                            variant="outlined"
                                            startIcon={<RoomServiceOutlinedIcon />}
                                            onClick={() => navigate(`/reception/services?code=${reservationData.confirmation_code}`)}
                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                        >
                                            Add Guest Services / Room Folio
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="warning"
                                            size="large"
                                            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <LogoutOutlinedIcon />}
                                            onClick={() => setCheckoutOpen(true)}
                                            disabled={actionLoading}
                                            sx={{ textTransform: 'none', fontWeight: 700, py: 1.5 }}
                                        >
                                            Process Check-Out
                                        </Button>
                                    </>
                                )}

                                {reservationData.reservation_status === 'checked_out' && (
                                    <Alert severity="success" sx={{ fontWeight: 600 }}>
                                        Guest checked out. Stay is completed.
                                    </Alert>
                                )}

                                <Button
                                    variant="outlined"
                                    startIcon={<ReceiptLongOutlinedIcon />}
                                    onClick={() => window.open(`/api/v1/invoices/${reservationData.reservation_id}/pdf`, '_blank')}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Download Tax Invoice (PDF)
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* CHECKOUT CONFIRMATION & SETTLEMENT MODAL */}
            <Dialog
                open={checkoutOpen}
                onClose={() => !actionLoading && setCheckoutOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Confirm Guest Check-Out
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC', borderRadius: '8px' }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Guest:</strong> {reservationData?.user?.name}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Room:</strong> Room {reservationData?.room?.room_number}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                                <strong>Total Charges:</strong> RWF {totalAmount.toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: balance > 0 ? 'error.main' : 'success.main' }}>
                                <strong>Remaining Balance to Settle:</strong> RWF {balance.toLocaleString()}
                            </Typography>
                        </Box>

                        {balance > 0 && (
                            <FormControl fullWidth size="small">
                                <InputLabel>Settlement Payment Method</InputLabel>
                                <Select
                                    value={checkoutPaymentMethod}
                                    label="Settlement Payment Method"
                                    onChange={(e) => setCheckoutPaymentMethod(e.target.value)}
                                >
                                    <MenuItem value="cash">Cash (Front Desk)</MenuItem>
                                    <MenuItem value="card">Credit / Debit Card</MenuItem>
                                    <MenuItem value="mobile_money">Mobile Money (MTN / Airtel)</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        <Alert severity="info">
                            Checking out will finalize the invoice, transition the room to <strong>Dirty</strong>, and auto-dispatch a turnover task to the Housekeeping team.
                        </Alert>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setCheckoutOpen(false)}
                        disabled={actionLoading}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleCheckout}
                        disabled={actionLoading}
                        startIcon={actionLoading ? <CircularProgress size={18} /> : <LogoutOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {actionLoading ? 'Finalizing...' : balance > 0 ? `Settle RWF ${balance.toLocaleString()} & Check Out` : 'Complete Check Out'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CheckInOutPage;
