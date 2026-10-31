import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Rating,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    useTheme,
} from '@mui/material';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import LoyaltyOutlinedIcon from '@mui/icons-material/LoyaltyOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';

import DataTableWrapper from '../../components/common/DataTableWrapper';
import KpiCard from '../../components/common/KpiCard';
import axiosClient from '../../api/axiosClient';

const AdminReviewsPage = () => {
    const theme = useTheme();

    const [reviews, setReviews] = useState([]);
    const [loyaltyAccounts, setLoyaltyAccounts] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [hotelFilter, setHotelFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');

    useEffect(() => {
        const fetchAux = async () => {
            try {
                const [hRes, loyRes] = await Promise.all([
                    axiosClient.get('/hotels'),
                    axiosClient.get('/loyalty'),
                ]);
                if (hRes.data?.success) setHotels(hRes.data.data || []);
                if (loyRes.data?.success && loyRes.data.data?.accounts) {
                    setLoyaltyAccounts(loyRes.data.data.accounts || []);
                }
            } catch (err) {
                console.error('Failed to load auxiliary options', err);
            }
        };
        fetchAux();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = {};
            if (hotelFilter !== 'all') params.hotel_id = hotelFilter;
            if (ratingFilter !== 'all') params.rating = ratingFilter;

            const res = await axiosClient.get('/reviews', { params });
            if (res.data?.success) {
                setReviews(res.data.data?.reviews || []);
            }
        } catch (err) {
            console.error('Failed to load reviews', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [hotelFilter, ratingFilter]);

    // Filter
    const filteredReviews = useMemo(() => {
        return reviews.filter((r) => {
            return (
                searchQuery === '' ||
                r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.hotel?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.comment?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [reviews, searchQuery]);

    // KPIs
    const kpis = useMemo(() => {
        const total = reviews.length;
        const avg = total > 0
            ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total).toFixed(1)
            : '0.0';
        const totalAccounts = loyaltyAccounts.length;
        const totalPoints = loyaltyAccounts.reduce((sum, a) => sum + Number(a.available_points || 0), 0);
        return { total, avg, totalAccounts, totalPoints };
    }, [reviews, loyaltyAccounts]);

    const columns = [
        {
            field: 'user',
            headerName: 'Guest Name',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {params.row.user?.name || 'Guest'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.user?.email}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'hotel',
            headerName: 'Hotel Property',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.row.hotel?.name || 'RP Hotel'}
                </Typography>
            ),
        },
        {
            field: 'rating',
            headerName: 'Rating',
            width: 140,
            renderCell: (params) => <Rating value={Number(params.row.rating)} readOnly size="small" />,
        },
        {
            field: 'comment',
            headerName: 'Guest Feedback',
            flex: 2,
            minWidth: 260,
            renderCell: (params) => (
                <Typography variant="body2" color="text.primary" noWrap>
                    "{params.row.comment}"
                </Typography>
            ),
        },
        {
            field: 'reservation_code',
            headerName: 'Booking Code',
            width: 150,
            renderCell: (params) => (
                <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', fontWeight: 600 }}>
                    #{params.row.reservation?.confirmation_code || '—'}
                </Typography>
            ),
        },
        {
            field: 'created_at',
            headerName: 'Date',
            width: 130,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {params.row.created_at ? new Date(params.row.created_at).toLocaleDateString() : '—'}
                </Typography>
            ),
        },
    ];

    return (
        <Box>
            <DataTableWrapper
                title="Reviews & Loyalty Program"
                subtitle="Monitor verified customer ratings, inspect feedback across hotel properties, and track circulating points"
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => {
                    setSearchQuery('');
                    setHotelFilter('all');
                    setRatingFilter('all');
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
                            <InputLabel>Star Rating</InputLabel>
                            <Select
                                value={ratingFilter}
                                label="Star Rating"
                                onChange={(e) => setRatingFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Ratings</MenuItem>
                                <MenuItem value="5">5 Stars</MenuItem>
                                <MenuItem value="4">4 Stars</MenuItem>
                                <MenuItem value="3">3 Stars</MenuItem>
                                <MenuItem value="2">2 Stars</MenuItem>
                                <MenuItem value="1">1 Star</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                }
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Reviews"
                                value={kpis.total}
                                icon={<RateReviewOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Average Star Rating"
                                value={`${kpis.avg} / 5.0`}
                                icon={<StarOutlinedIcon />}
                                color="warning"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Loyalty Accounts"
                                value={kpis.totalAccounts}
                                icon={<LoyaltyOutlinedIcon />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Circulating Points"
                                value={`${kpis.totalPoints.toLocaleString()} pts`}
                                subtitle={`Worth RWF ${(kpis.totalPoints * 50).toLocaleString()}`}
                                icon={<AccountBalanceWalletOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                    </Grid>
                }
                rows={filteredReviews}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.review_id}
            />
        </Box>
    );
};

export default AdminReviewsPage;
