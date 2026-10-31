import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Typography,
    Paper,
    useTheme,
} from '@mui/material';
import LoyaltyOutlinedIcon from '@mui/icons-material/LoyaltyOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';

import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import DataTableWrapper from '../../components/common/DataTableWrapper';
import axiosClient from '../../api/axiosClient';

const GuestLoyalty = () => {
    const theme = useTheme();

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
            field: 'transaction_id',
            headerName: 'TX ID',
            width: 90,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                    #{params.row.transaction_id}
                </Typography>
            ),
        },
        {
            field: 'transaction_type',
            headerName: 'Type',
            width: 130,
            renderCell: (params) => <StatusChip status={params.row.transaction_type} />,
        },
        {
            field: 'points',
            headerName: 'Points',
            width: 130,
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
                        {isPositive ? `+${pts}` : pts} pts
                    </Typography>
                );
            },
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 2,
            minWidth: 260,
            renderCell: (params) => (
                <Typography variant="body2" color="text.primary">
                    {params.row.description}
                </Typography>
            ),
        },
        {
            field: 'reservation',
            headerName: 'Booking Code',
            flex: 1,
            minWidth: 160,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'primary.main' }}>
                    {params.row.reservation?.confirmation_code || '—'}
                </Typography>
            ),
        },
        {
            field: 'created_at',
            headerName: 'Date Recorded',
            flex: 1,
            minWidth: 160,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {params.row.created_at ? new Date(params.row.created_at).toLocaleString() : '—'}
                </Typography>
            ),
        },
    ];

    return (
        <Box>
            <DataTableWrapper
                title="RP Loyalty Club Rewards"
                subtitle="Earn 1 point for every 1,000 RWF spent on completed stays; redeem anytime for 50 RWF per point discount"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => setSearchQuery('')}
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Available Balance"
                                value={`${available.toLocaleString()} pts`}
                                icon={<AccountBalanceWalletOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Instant RWF Value"
                                value={`RWF ${rwfValue.toLocaleString()}`}
                                subtitle="Applicable on next stay"
                                icon={<LoyaltyOutlinedIcon />}
                                color="warning"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Lifetime Earned Points"
                                value={`${totalEarned.toLocaleString()} pts`}
                                icon={<TrendingUpOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Points Redeemed"
                                value={`${totalRedeemed.toLocaleString()} pts`}
                                icon={<RedeemOutlinedIcon />}
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
