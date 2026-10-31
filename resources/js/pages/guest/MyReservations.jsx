import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Rating,
    Alert,
    Snackbar,
    Paper,
    useTheme,
} from '@mui/material';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

import StatusChip from '../../components/common/StatusChip';
import PaymentDialog from '../../components/common/PaymentDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import axiosClient from '../../api/axiosClient';

const MyReservations = () => {
    const theme = useTheme();

    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Dialogs
    const [selectedReservationForPay, setSelectedReservationForPay] = useState(null);
    const [selectedReservationForView, setSelectedReservationForView] = useState(null);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

    // Review Dialog
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewReservation, setReviewReservation] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState(null);

    // Toast
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/reservations');
            if (res.data?.success) {
                setReservations(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load reservations', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    // Filtered reservations
    const filteredReservations = useMemo(() => {
        return reservations.filter((r) => {
            const matchesStatus = statusFilter === 'all' || r.reservation_status === statusFilter;
            const matchesSearch =
                searchQuery === '' ||
                r.confirmation_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.room?.hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.room?.room_number?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [reservations, statusFilter, searchQuery]);

    // Cancel action
    const handleCancelReservation = async () => {
        if (!reservationToCancel) return;
        try {
            await axiosClient.post(`/reservations/${reservationToCancel.reservation_id}/cancel`);
            setToast({ open: true, message: 'Reservation cancelled successfully.', severity: 'success' });
            fetchReservations();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to cancel reservation.', severity: 'error' });
        } finally {
            setConfirmCancelOpen(false);
            setReservationToCancel(null);
        }
    };

    // Review submit
    const handleOpenReview = (res) => {
        setReviewReservation(res);
        setReviewRating(5);
        setReviewComment('');
        setReviewError(null);
        setReviewDialogOpen(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewComment.trim()) {
            setReviewError('Please write a brief comment describing your stay experience.');
            return;
        }

        setReviewSubmitting(true);
        try {
            await axiosClient.post('/reviews', {
                reservation_id: reviewReservation.reservation_id,
                rating: reviewRating,
                comment: reviewComment,
            });
            setToast({ open: true, message: 'Review submitted. Thank you for your feedback!', severity: 'success' });
            setReviewDialogOpen(false);
            fetchReservations();
        } catch (err) {
            setReviewError(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleDownloadInvoice = (id) => {
        window.open(`/api/v1/invoices/${id}/pdf`, '_blank');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 800 }}>
                        My Reservations
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        View active bookings, download official tax invoices, settle outstanding balances, and write verified reviews.
                    </Typography>
                </Box>
            </Box>

            {/* Filter Toolbar */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Search by code, hotel, or room..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                    InputProps={{
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                />

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        label="Status"
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="checked_in">Checked In</MenuItem>
                        <MenuItem value="checked_out">Checked Out (Completed)</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                    </Select>
                </FormControl>

                {(searchQuery || statusFilter !== 'all') && (
                    <Button size="small" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                        Reset Filters
                    </Button>
                )}
            </Paper>

            {/* Reservations List */}
            {loading ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                    Loading your reservation records...
                </Typography>
            ) : filteredReservations.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
                    <HotelOutlinedIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        No Reservations Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {statusFilter !== 'all' ? 'No bookings match the selected status filter.' : 'You have not booked any stays yet.'}
                    </Typography>
                </Paper>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {filteredReservations.map((res) => {
                        const paidSoFar = (res.payments || [])
                            .filter((p) => p.payment_status === 'completed')
                            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
                        const balance = Math.max(0, Number(res.total_amount || 0) - paidSoFar);

                        const canCancel = ['pending', 'confirmed'].includes(res.reservation_status);
                        const canReview = res.reservation_status === 'checked_out' && !res.review;

                        return (
                            <Card
                                key={res.reservation_id}
                                variant="outlined"
                                sx={{
                                    borderRadius: '14px',
                                    p: 2.5,
                                    transition: 'border-color 0.2s',
                                    '&:hover': { borderColor: theme.palette.primary.main },
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                                {res.room?.hotel?.name}
                                            </Typography>
                                            <StatusChip status={res.reservation_status} />
                                            <StatusChip status={res.payment_status} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Room {res.room?.room_number} • {res.room?.roomType?.type_name} • {res.room?.hotel?.location}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', fontWeight: 700 }}>
                                            CONFIRMATION #{res.confirmation_code}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                        <Typography variant="caption" color="text.secondary">Total Stay Cost</Typography>
                                        <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'text.primary' }}>
                                            RWF {Number(res.total_amount).toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: balance > 0 ? 'error.main' : 'success.main', fontWeight: 600 }}>
                                            {balance > 0 ? `Outstanding: RWF ${balance.toLocaleString()}` : '✓ Fully Settled'}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Dates: <strong>{res.check_in}</strong> to <strong>{res.check_out}</strong> ({res.number_of_guests} {res.number_of_guests === 1 ? 'Guest' : 'Guests'})
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => setSelectedReservationForView(res)}
                                        >
                                            View Details
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<PictureAsPdfOutlinedIcon />}
                                            onClick={() => handleDownloadInvoice(res.reservation_id)}
                                        >
                                            Invoice PDF
                                        </Button>

                                        {balance > 0 && res.reservation_status !== 'cancelled' && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="secondary"
                                                startIcon={<PaymentsOutlinedIcon />}
                                                onClick={() => setSelectedReservationForPay(res)}
                                                sx={{ color: '#0F172A', fontWeight: 700 }}
                                            >
                                                Pay RWF {balance.toLocaleString()}
                                            </Button>
                                        )}

                                        {canReview && (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<RateReviewOutlinedIcon />}
                                                onClick={() => handleOpenReview(res)}
                                            >
                                                Leave Review
                                            </Button>
                                        )}

                                        {canCancel && (
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={() => {
                                                    setReservationToCancel(res);
                                                    setConfirmCancelOpen(true);
                                                }}
                                            >
                                                Cancel Stay
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            </Card>
                        );
                    })}
                </Box>
            )}

            {/* View Details Modal */}
            <Dialog
                open={Boolean(selectedReservationForView)}
                onClose={() => setSelectedReservationForView(null)}
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
                            #{selectedReservationForView?.confirmation_code}
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setSelectedReservationForView(null)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                        <Typography variant="caption" color="text.secondary">Property & Room</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                            {selectedReservationForView?.room?.hotel?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Room {selectedReservationForView?.room?.room_number} ({selectedReservationForView?.room?.roomType?.type_name})
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Check-In</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReservationForView?.check_in}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Check-Out</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReservationForView?.check_out}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {selectedReservationForView && <StatusChip status={selectedReservationForView.reservation_status} />}
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {selectedReservationForView && <StatusChip status={selectedReservationForView.payment_status} />}
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Companion guests */}
                    {selectedReservationForView?.guests?.length > 0 && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Registered Companion Guests:
                            </Typography>
                            {selectedReservationForView.guests.map((g) => (
                                <Typography key={g.guest_id} variant="body2" color="text.secondary">
                                    • {g.full_name} {g.identification_number ? `(${g.identification_number})` : ''}
                                </Typography>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button variant="contained" color="primary" onClick={() => setSelectedReservationForView(null)}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Leave Review Dialog */}
            <Dialog
                open={reviewDialogOpen}
                onClose={() => !reviewSubmitting && setReviewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            Write a Review
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {reviewReservation?.room?.hotel?.name} (Room {reviewReservation?.room?.room_number})
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReviewDialogOpen(false)} disabled={reviewSubmitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmitReview}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {reviewError && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {reviewError}
                            </Alert>
                        )}

                        <Box sx={{ textAlign: 'center', py: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Overall Guest Rating
                            </Typography>
                            <Rating
                                size="large"
                                value={reviewRating}
                                onChange={(_, val) => setReviewRating(val)}
                            />
                        </Box>

                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Your Experience & Comments"
                            placeholder="Describe the hospitality, cleanliness, dining, and scenic surroundings..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setReviewDialogOpen(false)} disabled={reviewSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={reviewSubmitting}>
                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Payment Modal */}
            {selectedReservationForPay && (
                <PaymentDialog
                    open={Boolean(selectedReservationForPay)}
                    onClose={() => setSelectedReservationForPay(null)}
                    reservation={selectedReservationForPay}
                    onPaymentSuccess={() => {
                        fetchReservations();
                    }}
                />
            )}

            {/* Cancel Modal */}
            <ConfirmDialog
                open={confirmCancelOpen}
                title="Cancel Reservation"
                message={`Are you sure you want to cancel reservation #${reservationToCancel?.confirmation_code}? Any redeemed points will be refunded to your account balance.`}
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
                <Alert
                    severity={toast.severity}
                    variant="filled"
                    onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default MyReservations;
