import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Button,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Tooltip,
    Alert,
    Snackbar,
    Divider,
    useTheme,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';

import DataTableWrapper from '../../components/common/DataTableWrapper';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PaymentDialog from '../../components/common/PaymentDialog';
import axiosClient from '../../api/axiosClient';

const ReservationsManagementPage = () => {
    const theme = useTheme();

    const [reservations, setReservations] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [hotelFilter, setHotelFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [selectedReservationForPay, setSelectedReservationForPay] = useState(null);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    // Create form
    const [form, setForm] = useState({
        user_id: '',
        room_id: '',
        check_in: '',
        check_out: '',
        number_of_guests: 1,
    });
    const [formErrors, setFormErrors] = useState({});
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Toast
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Initial auxiliary load
    useEffect(() => {
        const fetchAux = async () => {
            try {
                const [hRes, rRes, uRes] = await Promise.all([
                    axiosClient.get('/hotels'),
                    axiosClient.get('/rooms'),
                    axiosClient.get('/users?role=guest'),
                ]);
                if (hRes.data?.success) setHotels(hRes.data.data || []);
                if (rRes.data?.success) setRooms(rRes.data.data || []);
                if (uRes.data?.success) setUsersList(uRes.data.data || []);
            } catch (err) {
                console.error('Failed to load auxiliary options', err);
            }
        };
        fetchAux();
    }, []);

    // Fetch reservations
    const fetchReservations = async () => {
        setLoading(true);
        try {
            const params = {};
            if (hotelFilter !== 'all') params.hotel_id = hotelFilter;
            if (statusFilter !== 'all') params.reservation_status = statusFilter;
            if (paymentFilter !== 'all') params.payment_status = paymentFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await axiosClient.get('/reservations', { params });
            if (res.data?.success) {
                setReservations(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load reservations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, [hotelFilter, statusFilter, paymentFilter, searchQuery]);

    // KPIs
    const kpis = useMemo(() => {
        const total = reservations.length;
        const upcoming = reservations.filter((r) => ['pending', 'confirmed'].includes(r.reservation_status)).length;
        const checkedIn = reservations.filter((r) => r.reservation_status === 'checked_in').length;
        const cancelled = reservations.filter((r) => r.reservation_status === 'cancelled').length;
        return { total, upcoming, checkedIn, cancelled };
    }, [reservations]);

    // Create reservation
    const handleOpenCreate = () => {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        setForm({
            user_id: usersList[0]?.user_id || '',
            room_id: rooms[0]?.room_id || '',
            check_in: today,
            check_out: tomorrow,
            number_of_guests: 1,
        });
        setFormErrors({});
        setCreateDialogOpen(true);
    };

    const handleCreateReservation = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setFormSubmitting(true);

        try {
            await axiosClient.post('/reservations', form);
            setToast({ open: true, message: 'Reservation created successfully.', severity: 'success' });
            setCreateDialogOpen(false);
            fetchReservations();
        } catch (err) {
            console.error('Failed to create reservation', err);
            setToast({ open: true, message: err.response?.data?.message || 'Booking failed.', severity: 'error' });
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            }
        } finally {
            setFormSubmitting(false);
        }
    };

    // Cancel reservation
    const handleCancelReservation = async () => {
        if (!reservationToCancel) return;
        try {
            await axiosClient.post(`/reservations/${reservationToCancel.reservation_id}/cancel`);
            setToast({ open: true, message: 'Reservation cancelled successfully.', severity: 'success' });
            fetchReservations();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Cancellation failed.', severity: 'error' });
        } finally {
            setConfirmCancelOpen(false);
            setReservationToCancel(null);
        }
    };

    const handleDownloadInvoice = (id) => {
        window.open(`/api/v1/invoices/${id}/pdf`, '_blank');
    };

    const columns = [
        {
            field: 'confirmation_code',
            headerName: 'Code',
            width: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'primary.main' }}>
                    {params.row.confirmation_code}
                </Typography>
            ),
        },
        {
            field: 'user',
            headerName: 'Guest',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {params.row.user?.name || 'Guest'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.user?.phone || params.row.user?.email}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'property_room',
            headerName: 'Property & Room',
            flex: 1.3,
            minWidth: 190,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {params.row.room?.hotel?.name || 'Hotel'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                        Room {params.row.room?.room_number} ({params.row.room?.roomType?.type_name})
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'stay_dates',
            headerName: 'Stay Dates',
            flex: 1.2,
            minWidth: 170,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {params.row.check_in} → {params.row.check_out}
                </Typography>
            ),
        },
        {
            field: 'total_amount',
            headerName: 'Total Amount',
            width: 140,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                    RWF {Number(params.row.total_amount).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: 'reservation_status',
            headerName: 'Booking',
            width: 120,
            renderCell: (params) => <StatusChip status={params.row.reservation_status} />,
        },
        {
            field: 'payment_status',
            headerName: 'Payment',
            width: 130,
            renderCell: (params) => <StatusChip status={params.row.payment_status} />,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 170,
            sortable: false,
            renderCell: (params) => {
                const canCancel = ['pending', 'confirmed'].includes(params.row.reservation_status);
                const isPaid = params.row.payment_status === 'paid';

                return (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                            <IconButton size="small" color="info" onClick={() => { setSelectedReservation(params.row); setViewDialogOpen(true); }}>
                                <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {!isPaid && params.row.reservation_status !== 'cancelled' && (
                            <Tooltip title="Record Payment">
                                <IconButton size="small" color="secondary" onClick={() => setSelectedReservationForPay(params.row)}>
                                    <PaymentsOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip title="Download Invoice PDF">
                            <IconButton size="small" color="primary" onClick={() => handleDownloadInvoice(params.row.reservation_id)}>
                                <PictureAsPdfOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {canCancel && (
                            <Tooltip title="Cancel Booking">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => { setReservationToCancel(params.row); setConfirmCancelOpen(true); }}
                                >
                                    <DeleteOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                );
            },
        },
    ];

    return (
        <Box>
            <DataTableWrapper
                title="All Reservations"
                subtitle="Front desk & executive overview of all guest bookings, room key allocations, payments, and cancellations"
                addNewLabel="Create Reservation"
                onAddNew={handleOpenCreate}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => {
                    setSearchQuery('');
                    setHotelFilter('all');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                }}
                filterSlot={
                    <>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Hotel Branch</InputLabel>
                            <Select
                                value={hotelFilter}
                                label="Hotel Branch"
                                onChange={(e) => setHotelFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Branches</MenuItem>
                                {hotels.map((h) => (
                                    <MenuItem key={h.hotel_id} value={h.hotel_id}>
                                        {h.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="confirmed">Confirmed</MenuItem>
                                <MenuItem value="checked_in">Checked In</MenuItem>
                                <MenuItem value="checked_out">Checked Out</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Payment</InputLabel>
                            <Select
                                value={paymentFilter}
                                label="Payment"
                                onChange={(e) => setPaymentFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Payments</MenuItem>
                                <MenuItem value="unpaid">Unpaid</MenuItem>
                                <MenuItem value="partially_paid">Partially Paid</MenuItem>
                                <MenuItem value="paid">Paid in Full</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                }
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Bookings"
                                value={kpis.total}
                                icon={<CalendarMonthOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Upcoming Confirmed"
                                value={kpis.upcoming}
                                icon={<CheckCircleOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="In-House (Checked In)"
                                value={kpis.checkedIn}
                                icon={<HotelOutlinedIcon />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Cancelled Stays"
                                value={kpis.cancelled}
                                icon={<CancelOutlinedIcon />}
                                color="error"
                            />
                        </Grid>
                    </Grid>
                }
                rows={reservations}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.reservation_id}
            />

            {/* Create Reservation Dialog */}
            <Dialog
                open={createDialogOpen}
                onClose={() => !formSubmitting && setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        Create Reservation on Behalf of Guest
                    </Typography>
                    <IconButton size="small" onClick={() => setCreateDialogOpen(false)} disabled={formSubmitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleCreateReservation}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small" required>
                            <InputLabel>Guest Account</InputLabel>
                            <Select
                                value={form.user_id}
                                label="Guest Account"
                                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                            >
                                {usersList.map((u) => (
                                    <MenuItem key={u.user_id} value={u.user_id}>
                                        {u.name} ({u.email} • {u.phone})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small" required>
                            <InputLabel>Room Assignment</InputLabel>
                            <Select
                                value={form.room_id}
                                label="Room Assignment"
                                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                            >
                                {rooms.map((r) => (
                                    <MenuItem key={r.room_id} value={r.room_id}>
                                        {r.hotel?.name} — Room {r.room_number} ({r.roomType?.type_name} • Max {r.capacity} guests • RWF {Number(r.price_per_night).toLocaleString()}/nt)
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Check-In Date"
                                    type="date"
                                    value={form.check_in}
                                    onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Check-Out Date"
                                    type="date"
                                    value={form.check_out}
                                    onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            size="small"
                            label="Number of Guests"
                            type="number"
                            inputProps={{ min: 1 }}
                            value={form.number_of_guests}
                            onChange={(e) => setForm({ ...form, number_of_guests: Number(e.target.value) })}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setCreateDialogOpen(false)} disabled={formSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={formSubmitting}>
                            {formSubmitting ? 'Creating...' : 'Create Reservation'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            Reservation Details
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', fontWeight: 600 }}>
                            Code #{selectedReservation?.confirmation_code}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                        <Typography variant="caption" color="text.secondary">Primary Guest</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                            {selectedReservation?.user?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedReservation?.user?.email} • {selectedReservation?.user?.phone}
                        </Typography>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                        <Typography variant="caption" color="text.secondary">Hotel & Room</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                            {selectedReservation?.room?.hotel?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Room {selectedReservation?.room?.room_number} ({selectedReservation?.room?.roomType?.type_name})
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Check-In</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReservation?.check_in}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Check-Out</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReservation?.check_out}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Booking Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {selectedReservation && <StatusChip status={selectedReservation.reservation_status} />}
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {selectedReservation && <StatusChip status={selectedReservation.payment_status} />}
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button variant="contained" color="primary" onClick={() => setViewDialogOpen(false)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Record Payment Dialog */}
            {selectedReservationForPay && (
                <PaymentDialog
                    open={Boolean(selectedReservationForPay)}
                    onClose={() => setSelectedReservationForPay(null)}
                    reservation={selectedReservationForPay}
                    onPaymentSuccess={() => fetchReservations()}
                />
            )}

            {/* Cancel Modal */}
            <ConfirmDialog
                open={confirmCancelOpen}
                title="Cancel Reservation"
                message={`Are you sure you want to cancel reservation #${reservationToCancel?.confirmation_code}? Any redeemed loyalty points will be refunded automatically.`}
                confirmText="Cancel Reservation"
                confirmColor="error"
                onConfirm={handleCancelReservation}
                onCancel={() => setConfirmCancelOpen(false)}
            />

            {/* Toast */}
            <Snackbar
                open={toast.open}
                autoHideDuration={5000}
                onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={toast.severity} variant="filled" onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ReservationsManagementPage;
