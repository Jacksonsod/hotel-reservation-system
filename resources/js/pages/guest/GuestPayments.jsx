import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Grid,
    Button,
    useTheme,
} from '@mui/material';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import { useNavigate } from 'react-router-dom';

import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import DataTableWrapper from '../../components/common/DataTableWrapper';
import axiosClient from '../../api/axiosClient';
import { formatCurrency, formatDate, formatPaymentMethod } from '../../utils/formatters';

const GuestPayments = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/payments');
            if (res.data?.success) {
                setPayments(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load payments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    // Filter
    const filteredPayments = useMemo(() => {
        return payments.filter((p) => {
            return (
                searchQuery === '' ||
                p.transaction_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.reservation?.confirmation_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.reservation?.invoice?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [payments, searchQuery]);

    // KPIs
    const kpis = useMemo(() => {
        const total = payments.length;
        const totalAmount = payments
            .filter((p) => p.payment_status === 'completed')
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const cardCount = payments.filter((p) => p.payment_method === 'card').length;
        const momoCount = payments.filter((p) => p.payment_method === 'mobile_money').length;
        return { total, totalAmount, cardCount, momoCount };
    }, [payments]);

    const handleDownloadReceipt = (id) => {
        window.open(`/api/v1/payments/${id}/receipt-pdf`, '_blank');
    };

    const handleDownloadInvoice = (resId) => {
        window.open(`/api/v1/invoices/${resId}/pdf`, '_blank');
    };

    const columns = [
        {
            field: 'transaction_reference',
            headerName: 'Payment Reference',
            flex: 1.2,
            minWidth: 170,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'primary.main' }}>
                    {params.row.transaction_reference}
                </Typography>
            ),
        },
        {
            field: 'reservation',
            headerName: 'Booking & Room',
            flex: 1.3,
            minWidth: 180,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'text.primary' }}>
                        {params.row.reservation?.confirmation_code || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Room {params.row.reservation?.room?.room_number} • {params.row.reservation?.room?.hotel?.name}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'invoice_number',
            headerName: 'Invoice #',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                    {params.row.reservation?.invoice?.invoice_number || '—'}
                </Typography>
            ),
        },
        {
            field: 'payment_method',
            headerName: 'Payment Method',
            width: 170,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatPaymentMethod(params.row.payment_method)}
                </Typography>
            ),
        },
        {
            field: 'amount',
            headerName: 'Amount Paid',
            width: 160,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'success.main' }}>
                    {formatCurrency(params.row.amount)}
                </Typography>
            ),
        },
        {
            field: 'paid_at',
            headerName: 'Paid Date & Time',
            flex: 1.2,
            minWidth: 160,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {formatDate(params.row.paid_at, true)}
                </Typography>
            ),
        },
        {
            field: 'payment_status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => <StatusChip status={params.row.payment_status} />,
        },
        {
            field: 'actions',
            headerName: 'Documents',
            width: 190,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptLongOutlinedIcon />}
                        onClick={() => handleDownloadReceipt(params.row.payment_id)}
                        sx={{ fontSize: '0.725rem', py: 0.25 }}
                    >
                        Receipt
                    </Button>
                    {params.row.reservation_id && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            startIcon={<PictureAsPdfOutlinedIcon />}
                            onClick={() => handleDownloadInvoice(params.row.reservation_id)}
                            sx={{ fontSize: '0.725rem', py: 0.25 }}
                        >
                            Invoice
                        </Button>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <DataTableWrapper
                title="Payments & Official Invoices"
                subtitle="Review your simulated payment transactions, download official tax receipts, and view issued invoices"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => setSearchQuery('')}
                emptyState={{
                    icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 52, color: 'secondary.main' }} />,
                    title: 'No Payment Records Found',
                    subtitle: 'When you book and settle hotel reservations, your transaction references, receipts, and invoices will appear here.',
                    actionLabel: 'Browse Available Hotels',
                    onAction: () => navigate('/guest/hotels'),
                }}
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Transactions"
                                value={kpis.total}
                                icon={<ReceiptLongOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Amount Settled"
                                value={formatCurrency(kpis.totalAmount)}
                                icon={<PaymentsOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Card Transactions"
                                value={kpis.cardCount}
                                icon={<PaymentsOutlinedIcon />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Mobile Money Transactions"
                                value={kpis.momoCount}
                                icon={<PaymentsOutlinedIcon />}
                                color="secondary"
                            />
                        </Grid>
                    </Grid>
                }
                rows={filteredPayments}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.payment_id}
            />
        </Box>
    );
};

export default GuestPayments;
