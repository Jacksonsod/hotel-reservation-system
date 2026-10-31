import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    TextField,
    Box,
    RadioGroup,
    FormControlLabel,
    Radio,
    InputAdornment,
    Alert,
    IconButton,
    Grid,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import axiosClient from '../../api/axiosClient';

const PaymentDialog = ({ open, onClose, reservation, onPaymentSuccess }) => {
    const theme = useTheme();

    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('card');
    const [momoPhone, setMomoPhone] = useState('');
    const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    // Compute balance
    const totalAmount = Number(reservation?.total_amount || 0);
    const paidSoFar = (reservation?.payments || [])
        .filter((p) => p.payment_status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const outstandingBalance = Math.max(0, totalAmount - paidSoFar);

    useEffect(() => {
        if (open) {
            setAmount(outstandingBalance > 0 ? outstandingBalance : '');
            setError(null);
            setSuccessData(null);
            setMethod('card');
        }
    }, [open, outstandingBalance]);

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        setError(null);

        const numAmount = Number(amount);
        if (numAmount <= 0) {
            setError('Payment amount must be greater than 0.');
            return;
        }
        if (numAmount > outstandingBalance) {
            setError(`Payment amount cannot exceed outstanding balance of RWF ${outstandingBalance.toLocaleString()}`);
            return;
        }

        setLoading(true);
        try {
            const res = await axiosClient.post(`/reservations/${reservation.reservation_id}/payments`, {
                amount: numAmount,
                payment_method: method,
            });

            if (res.data?.success) {
                setSuccessData(res.data.data);
                if (onPaymentSuccess) {
                    onPaymentSuccess(res.data.data);
                }
            }
        } catch (err) {
            console.error('Payment processing failed', err);
            setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReceipt = () => {
        if (!successData?.payment_id) return;
        window.open(`/api/v1/payments/${successData.payment_id}/receipt-pdf`, '_blank');
    };

    return (
        <Dialog
            open={open}
            onClose={() => !loading && onClose()}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {successData ? 'Payment Receipt' : 'Record Payment'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                        Reservation #{reservation?.confirmation_code}
                    </Typography>
                </Box>
                <IconButton size="small" onClick={onClose} disabled={loading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {successData ? (
                <>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                        <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: 'success.main', mb: 1.5 }} />
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 0.5 }}>
                            Payment Successful!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Transaction Reference: <strong style={{ fontFamily: 'JetBrains Mono, monospace' }}>{successData.transaction_reference}</strong>
                        </Typography>
                        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', width: '100%', textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                            <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.main', my: 0.5 }}>
                                RWF {Number(successData.amount).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Method: {successData.payment_method?.toUpperCase()}
                            </Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                        <Button variant="outlined" color="primary" onClick={handleDownloadReceipt}>
                            Download Receipt PDF
                        </Button>
                        <Button variant="contained" color="primary" onClick={onClose}>
                            Done
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <form onSubmit={handleProcessPayment}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {error && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {/* Balance Summary Box */}
                        <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', border: `1px solid ${theme.palette.divider}` }}>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Total Cost</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                                        RWF {totalAmount.toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Paid to Date</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main', fontFamily: 'JetBrains Mono, monospace' }}>
                                        RWF {paidSoFar.toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={4}>
                                    <Typography variant="caption" color="text.secondary">Due Balance</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main', fontFamily: 'JetBrains Mono, monospace' }}>
                                        RWF {outstandingBalance.toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        <TextField
                            fullWidth
                            size="small"
                            label="Payment Amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">RWF</InputAdornment>,
                            }}
                            helperText={`Max payable: RWF ${outstandingBalance.toLocaleString()}`}
                            required
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Payment Method
                            </Typography>
                            <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                    }}
                                >
                                    <Box
                                        onClick={() => setMethod('card')}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            borderRadius: '8px',
                                            border: `1px solid ${method === 'card' ? theme.palette.primary.main : theme.palette.divider}`,
                                            bgcolor: method === 'card' ? 'action.selected' : 'background.paper',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <FormControlLabel
                                            value="card"
                                            control={<Radio size="small" />}
                                            label="Credit / Debit Card (Visa, Mastercard)"
                                            sx={{ m: 0 }}
                                        />
                                        <CreditCardOutlinedIcon color={method === 'card' ? 'primary' : 'action'} />
                                    </Box>

                                    <Box
                                        onClick={() => setMethod('mobile_money')}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            borderRadius: '8px',
                                            border: `1px solid ${method === 'mobile_money' ? theme.palette.primary.main : theme.palette.divider}`,
                                            bgcolor: method === 'mobile_money' ? 'action.selected' : 'background.paper',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <FormControlLabel
                                            value="mobile_money"
                                            control={<Radio size="small" />}
                                            label="Mobile Money (MTN MoMo / Airtel Money)"
                                            sx={{ m: 0 }}
                                        />
                                        <PhoneAndroidOutlinedIcon color={method === 'mobile_money' ? 'primary' : 'action'} />
                                    </Box>

                                    <Box
                                        onClick={() => setMethod('cash')}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            p: 1.5,
                                            borderRadius: '8px',
                                            border: `1px solid ${method === 'cash' ? theme.palette.primary.main : theme.palette.divider}`,
                                            bgcolor: method === 'cash' ? 'action.selected' : 'background.paper',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <FormControlLabel
                                            value="cash"
                                            control={<Radio size="small" />}
                                            label="Cash (Front Desk Counter)"
                                            sx={{ m: 0 }}
                                        />
                                        <PaymentsOutlinedIcon color={method === 'cash' ? 'primary' : 'action'} />
                                    </Box>
                                </Box>
                            </RadioGroup>
                        </Box>

                        {method === 'mobile_money' && (
                            <TextField
                                fullWidth
                                size="small"
                                label="Mobile Money Phone Number"
                                placeholder="+250 78X XXX XXX"
                                value={momoPhone}
                                onChange={(e) => setMomoPhone(e.target.value)}
                            />
                        )}

                        {method === 'card' && (
                            <TextField
                                fullWidth
                                size="small"
                                label="Card Number (Simulated)"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                            />
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading || outstandingBalance <= 0}
                        >
                            {loading ? 'Processing...' : `Pay RWF ${Number(amount || 0).toLocaleString()}`}
                        </Button>
                    </DialogActions>
                </form>
            )}
        </Dialog>
    );
};

export default PaymentDialog;
