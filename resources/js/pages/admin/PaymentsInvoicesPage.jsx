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
    Typography,
    useTheme,
} from '@mui/material';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import DataTableWrapper from '../../components/common/DataTableWrapper';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import axiosClient from '../../api/axiosClient';

const PaymentsInvoicesPage = () => {
    const theme = useTheme();

    const [payments, setPayments] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [hotelFilter, setHotelFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        axiosClient.get('/hotels').then((res) => {
            if (res.data?.success) setHotels(res.data.data || []);
        }).catch(() => {});
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const params = {};
            if (hotelFilter !== 'all') params.hotel_id = hotelFilter;
            if (methodFilter !== 'all') params.payment_method = methodFilter;
            if (statusFilter !== 'all') params.payment_status = statusFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await axiosClient.get('/payments', { params });
            if (res.data?.success) {
                setPayments(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load payments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [hotelFilter, methodFilter, statusFilter, searchQuery]);

    // KPIs
    const kpis = useMemo(() => {
        const total = payments.length;
        const totalCollected = payments
            .filter((p) => p.payment_status === 'completed')
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const cardCount = payments.filter((p) => p.payment_method === 'card').length;
        const momoCount = payments.filter((p) => p.payment_method === 'mobile_money').length;
        return { total, totalCollected, cardCount, momoCount };
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
            headerName: 'Reference',
            flex: 1.2,
            minWidth: 170,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'primary.main' }}>
                    {params.row.transaction_reference}
                </Typography>
            ),
        },
        {
            field: 'reservation_code',
            headerName: 'Booking Code',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                    {params.row.reservation?.confirmation_code || '—'}
                </Typography>
            ),
        },
        {
            field: 'guest',
            headerName: 'Guest',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {params.row.reservation?.user?.name || 'Guest'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.reservation?.user?.phone}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'hotel',
            headerName: 'Branch & Room',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" noWrap>
                        {params.row.reservation?.room?.hotel?.name || 'Hotel'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                        Room {params.row.reservation?.room?.room_number}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'payment_method',
            headerName: 'Method',
            width: 140,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    {params.row.payment_method?.replace('_', ' ')}
                </Typography>
            ),
        },
        {
            field: 'amount',
            headerName: 'Amount Settled',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'success.main' }}>
                    RWF {Number(params.row.amount).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: 'paid_at',
            headerName: 'Timestamp',
            flex: 1.1,
            minWidth: 160,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {params.row.paid_at ? new Date(params.row.paid_at).toLocaleString() : '—'}
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
            headerName: 'PDF Documents',
            width: 190,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptLongOutlinedIcon />}
                        onClick={() => handleDownloadReceipt(params.row.payment_id)}
                        sx={{ fontSize: '0.7rem', py: 0.25 }}
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
                            sx={{ fontSize: '0.7rem', py: 0.25 }}
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
                title="Payments & Invoices"
                subtitle="Financial reconciliation, completed transaction references, and printable customer tax invoices"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => {
                    setSearchQuery('');
                    setHotelFilter('all');
                    setMethodFilter('all');
                    setStatusFilter('all');
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
                            <InputLabel>Method</InputLabel>
                            <Select
                                value={methodFilter}
                                label="Method"
                                onChange={(e) => setMethodFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Methods</MenuItem>
                                <MenuItem value="card">Card</MenuItem>
                                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                                <MenuItem value="cash">Cash</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 130 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="failed">Failed</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                }
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
                                title="Total Revenue Settled"
                                value={`RWF ${kpis.totalCollected.toLocaleString()}`}
                                icon={<PaymentsOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Credit / Debit Cards"
                                value={kpis.cardCount}
                                icon={<CreditCardOutlinedIcon />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Mobile Money (MoMo)"
                                value={kpis.momoCount}
                                icon={<PhoneAndroidOutlinedIcon />}
                                color="warning"
                            />
                        </Grid>
                    </Grid>
                }
                rows={payments}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.payment_id}
            />
        </Box>
    );
};

export default PaymentsInvoicesPage;
