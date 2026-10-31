import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Divider,
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    useTheme,
} from '@mui/material';
import RoomServiceOutlinedIcon from '@mui/icons-material/RoomServiceOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatusChip from '../../components/common/StatusChip';

const ServiceOrdersPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [lookupCode, setLookupCode] = useState(searchParams.get('code') || '');
    const [loading, setLoading] = useState(false);
    const [reservation, setReservation] = useState(null);
    const [serviceOrders, setServiceOrders] = useState([]);
    const [availableServices, setAvailableServices] = useState([]);

    // Add Service Order Dialog
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [submittingOrder, setSubmittingOrder] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchReservationFolio = useCallback(async (code) => {
        const queryCode = (code || lookupCode).trim();
        if (!queryCode) return;

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await axios.get(`/api/v1/reception/lookup/${encodeURIComponent(queryCode)}`);
            if (res.data.success) {
                const resData = res.data.data.reservation;
                setReservation(resData);
                setServiceOrders(resData.service_orders || []);

                // Load available services for this hotel branch
                if (resData.room?.hotel_id) {
                    const servicesRes = await axios.get('/api/v1/services', {
                        params: { hotel_id: resData.room.hotel_id, status: 'active' },
                    });
                    if (servicesRes.data.success) {
                        setAvailableServices(servicesRes.data.data.data || servicesRes.data.data || []);
                    }
                }
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Could not find reservation folio.');
            setReservation(null);
            setServiceOrders([]);
        } finally {
            setLoading(false);
        }
    }, [lookupCode]);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            setLookupCode(code);
            fetchReservationFolio(code);
        }
    }, [searchParams, fetchReservationFolio]);

    const handleAddServiceOrder = async () => {
        if (!reservation || !selectedServiceId) return;
        setSubmittingOrder(true);
        setErrorMsg('');
        try {
            const res = await axios.post(`/api/v1/reservations/${reservation.reservation_id}/services`, {
                service_id: selectedServiceId,
                quantity: Number(quantity),
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Service added to guest folio successfully.');
                setOrderDialogOpen(false);
                setSelectedServiceId('');
                setQuantity(1);
                fetchReservationFolio(reservation.confirmation_code);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to post service order.');
        } finally {
            setSubmittingOrder(false);
        }
    };

    const handleDeleteServiceOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to remove this service charge from the folio?')) return;
        setErrorMsg('');
        try {
            const res = await axios.delete(`/api/v1/service-orders/${orderId}`);
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Service order removed from folio.');
                fetchReservationFolio(reservation.confirmation_code);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to remove service order.');
        }
    };

    const selectedService = availableServices.find((s) => s.service_id === selectedServiceId);
    const calculatedOrderTotal = selectedService ? Number(selectedService.price) * quantity : 0;

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* Row 1: Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        Guest Service Orders & Folio
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Post room service, airport transfers, spa, and extra amenities directly to guest room accounts
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackOutlinedIcon />}
                    onClick={() => navigate('/reception/dashboard')}
                    sx={{ textTransform: 'none' }}
                >
                    Back to Dashboard
                </Button>
            </Box>

            {/* Row 2: Search Bar */}
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
                    label="Reservation Confirmation Code"
                    placeholder="e.g. KGL-2026-XXXXXX"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && fetchReservationFolio()}
                    size="small"
                    sx={{ width: { xs: '100%', sm: 320 }, fontFamily: 'JetBrains Mono, monospace' }}
                />
                <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchOutlinedIcon />}
                    onClick={() => fetchReservationFolio()}
                    disabled={loading || !lookupCode.trim()}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                    Lookup Folio
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

            {reservation && (
                <Grid container spacing={3}>
                    {/* LEFT: RESERVATION SNAPSHOT */}
                    <Grid item xs={12} md={4}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: '12px',
                                border: `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                                {reservation.user?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Confirmation: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{reservation.confirmation_code}</strong>
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <StatusChip status={reservation.reservation_status} />
                                <StatusChip status={reservation.payment_status} />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Typography variant="body2">
                                    <strong>Hotel:</strong> {reservation.room?.hotel?.name}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Room:</strong> Room {reservation.room?.room_number} ({reservation.room?.room_type?.type_name})
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Stay Period:</strong> {reservation.check_in} → {reservation.check_out}
                                </Typography>
                                <Typography variant="body2">
                                    <strong>Total Folio:</strong> RWF {Number(reservation.total_amount).toLocaleString()}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<ReceiptLongOutlinedIcon />}
                                onClick={() => window.open(`/api/v1/invoices/${reservation.reservation_id}/pdf`, '_blank')}
                                sx={{ textTransform: 'none' }}
                            >
                                Download Tax Invoice (PDF)
                            </Button>
                        </Paper>
                    </Grid>

                    {/* RIGHT: FOLIO SERVICE ORDERS TABLE */}
                    <Grid item xs={12} md={8}>
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
                                    Posted Service Orders
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddOutlinedIcon />}
                                    onClick={() => setOrderDialogOpen(true)}
                                    disabled={reservation.reservation_status === 'checked_out'}
                                    sx={{ textTransform: 'none', fontWeight: 600 }}
                                >
                                    Charge New Service
                                </Button>
                            </Box>

                            <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                                <Table>
                                    <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Ordered At</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {serviceOrders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                    No additional services posted to this folio yet.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            serviceOrders.map((order) => (
                                                <TableRow key={order.order_id} hover>
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        {order.service?.service_name || 'Service'}
                                                    </TableCell>
                                                    <TableCell>
                                                        RWF {Number(order.unit_price).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>{order.quantity}</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>
                                                        RWF {Number(order.total_price).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString() : '—'}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Remove Charge">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteServiceOrder(order.order_id)}
                                                                disabled={reservation.reservation_status === 'checked_out'}
                                                            >
                                                                <DeleteOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* CHARGE SERVICE DIALOG */}
            <Dialog
                open={orderDialogOpen}
                onClose={() => !submittingOrder && setOrderDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Post Service Charge to Guest Folio
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Service</InputLabel>
                            <Select
                                value={selectedServiceId}
                                label="Select Service"
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                            >
                                {availableServices.map((srv) => (
                                    <MenuItem key={srv.service_id} value={srv.service_id}>
                                        {srv.service_name} — RWF {Number(srv.price).toLocaleString()}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Quantity"
                            type="number"
                            size="small"
                            value={quantity}
                            inputProps={{ min: 1, max: 20 }}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        />

                        {selectedService && (
                            <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC', borderRadius: '8px' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Subtotal to Charge:
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                    RWF {calculatedOrderTotal.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    (Tax of 18% will be factored into the updated folio invoice)
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setOrderDialogOpen(false)}
                        disabled={submittingOrder}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddServiceOrder}
                        disabled={submittingOrder || !selectedServiceId}
                        startIcon={submittingOrder ? <CircularProgress size={18} /> : <RoomServiceOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {submittingOrder ? 'Charging...' : 'Confirm Charge'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ServiceOrdersPage;
