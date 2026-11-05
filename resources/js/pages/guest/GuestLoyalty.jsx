import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Typography,
    useTheme,
} from '@mui/material';
import LoyaltyOutlinedIcon from '@mui/icons-material/LoyaltyOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import { useNavigate } from 'react-router-dom';

import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import DataTableWrapper from '../../components/common/DataTableWrapper';
import axiosClient from '../../api/axiosClient';
import { formatCurrency, formatDate } from '../../utils/formatters';

const GuestLoyalty = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLoyalty = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/loyalty');
            if (res.data?.success && res.data.data) {
                setAccount(res.data.data.account || null);
                setTransactions(res.data.data.transactions || []);
            }
        } catch (err) {
            console.error('Failed to load loyalty account', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLoyalty();
    }, []);

    // Filter
    const filteredTransactions = useMemo(() => {
        return transactions.filter((tx) => {
            return (
                searchQuery === '' ||
                tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.transaction_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.reservation?.confirmation_code?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [transactions, searchQuery]);

    const totalEarned = account?.total_points ?? 0;
    const available = account?.available_points ?? 0;
    const rwfValue = available * 50;
    const totalRedeemed = Math.abs(
        transactions
            .filter((t) => t.transaction_type === 'redeemed')
            .reduce((sum, t) => sum + Number(t.points || 0), 0)
    );

    const columns = [
        {
            field: 'transaction_type',
            headerName: 'Activity Type',
            width: 150,
            renderCell: (params) => <StatusChip status={params.row.transaction_type} />,
        },
        {
            field: 'points',
            headerName: 'Points',
            width: 140,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const pts = Number(params.row.points);
                const isPositive = pts > 0;
                return (
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 700,
                            fontFamily: 'JetBrains Mono, monospace',
                            color: isPositive ? 'success.main' : 'error.main',
                        }}
                    >
                        {isPositive ? `+${pts.toLocaleString()}` : pts.toLocaleString()} pts
                    </Typography>
                );
            },
        },
        {
            field: 'description',
            headerName: 'Activity Description',
            flex: 2,
            minWidth: 260,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                    {params.row.description}
                </Typography>
            ),
        },
        {
            field: 'reservation',
            headerName: 'Associated Stay Code',
            flex: 1.2,
            minWidth: 170,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'primary.main' }}>
                    {params.row.reservation?.confirmation_code || '—'}
                </Typography>
            ),
        },
        {
            field: 'created_at',
            headerName: 'Date & Time',
            flex: 1.1,
            minWidth: 160,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {formatDate(params.row.created_at, true)}
                </Typography>
            ),
        },
    ];

    return (
        <Box>
            <DataTableWrapper
                title="RP Loyalty Club Rewards"
                subtitle="Earn 1 point for every 1,000 RWF spent on completed stays; redeem anytime for 50 RWF per point instant discount"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => setSearchQuery('')}
                emptyState={{
                    icon: <LoyaltyOutlinedIcon sx={{ fontSize: 52, color: 'secondary.main' }} />,
                    title: 'No Loyalty Transactions Yet',
                    subtitle: 'Complete stays across our Rwandan hotels to earn points automatically. 1 point earned per 1,000 RWF spent.',
                    actionLabel: 'Browse Available Hotels',
                    onAction: () => navigate('/guest/hotels'),
                }}
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Available Balance"
                                value={`${available.toLocaleString()} pts`}
                                icon={<AccountBalanceWalletOutlinedIcon />}
                                color="secondary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Instant Redemption Value"
                                value={formatCurrency(rwfValue)}
                                icon={<RedeemOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Lifetime Points Earned"
                                value={`${totalEarned.toLocaleString()} pts`}
                                icon={<TrendingUpOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Lifetime Points Redeemed"
                                value={`${totalRedeemed.toLocaleString()} pts`}
                                icon={<LoyaltyOutlinedIcon />}
                                color="info"
                            />
                        </Grid>
                    </Grid>
                }
                rows={filteredTransactions}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.transaction_id}
            />
        </Box>
    );
};

export default GuestLoyalty;
