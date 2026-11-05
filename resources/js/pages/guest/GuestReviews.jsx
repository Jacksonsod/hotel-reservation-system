import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    Button,
    Rating,
    Divider,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Alert,
    useTheme,
} from '@mui/material';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

import KpiCard from '../../components/common/KpiCard';
import axiosClient from '../../api/axiosClient';
import { formatDate } from '../../utils/formatters';

const GuestReviews = () => {
    const theme = useTheme();
    const navigate = useNavigate();

    const [reviews, setReviews] = useState([]);
    const [eligibleStays, setEligibleStays] = useState([]);
    const [loading, setLoading] = useState(true);

    // Review Dialog
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [selectedStay, setSelectedStay] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const fetchReviewsData = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/reviews');
            if (res.data?.success && res.data.data) {
                setReviews(res.data.data.reviews || []);
                setEligibleStays(res.data.data.eligible_stays || []);
            }
        } catch (err) {
            console.error('Failed to load reviews', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviewsData();
    }, []);

    const handleOpenReviewModal = (stay) => {
        setSelectedStay(stay);
        setRating(5);
        setComment('');
        setError(null);
        setReviewDialogOpen(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            setError('Please describe your stay experience.');
            return;
        }

        setSubmitting(true);
        try {
            await axiosClient.post('/reviews', {
                reservation_id: selectedStay.reservation_id,
                rating,
                comment,
            });
            setReviewDialogOpen(false);
            fetchReviewsData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length).toFixed(1)
        : '5.0';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header */}
            <Box>
                <Typography variant="h2" sx={{ fontWeight: 800 }}>
                    My Verified Reviews
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Review completed stays, share genuine hospitality feedback, and help future travelers explore Rwanda.
                </Typography>
            </Box>

            {/* KPIs */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <KpiCard
                        title="Completed Reviews"
                        value={reviews.length}
                        icon={<RateReviewOutlinedIcon />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <KpiCard
                        title="Average Rating Given"
                        value={`${avgRating} / 5.0`}
                        icon={<StarOutlinedIcon />}
                        color="secondary"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <KpiCard
                        title="Stays Awaiting Feedback"
                        value={eligibleStays.length}
                        icon={<HotelOutlinedIcon />}
                        color={eligibleStays.length > 0 ? 'info' : 'success'}
                    />
                </Grid>
            </Grid>

            {/* Pending Stays Section */}
            {eligibleStays.length > 0 && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        borderRadius: '16px',
                        border: `1px solid ${theme.palette.secondary.main}`,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <RateReviewOutlinedIcon color="secondary" />
                        <Typography variant="h3" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                            Stays Ready for Your Review ({eligibleStays.length})
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {eligibleStays.map((stay) => (
                            <Grid item xs={12} sm={6} key={stay.reservation_id}>
                                <Card variant="outlined" sx={{ borderRadius: '12px', p: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {stay.room?.hotel?.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Room {stay.room?.room_number} ({stay.room?.roomType?.type_name}) • Checked out on {formatDate(stay.check_out)}
                                    </Typography>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => handleOpenReviewModal(stay)}
                                        sx={{ color: '#0F172A', fontWeight: 700 }}
                                    >
                                        Write Review & Rate
                                    </Button>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Submitted Reviews List */}
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                Submitted Feedback History ({reviews.length})
            </Typography>

            {loading ? (
                <Typography variant="body2" color="text.secondary">Loading reviews...</Typography>
            ) : reviews.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
                    <RateReviewOutlinedIcon sx={{ fontSize: 56, color: 'secondary.main', mb: 1.5 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        No Reviews Submitted Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 440, mx: 'auto' }}>
                        Once you complete a stay, your eligible bookings will appear here for you to share hospitality feedback.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/guest/hotels')}
                    >
                        Browse Available Hotels
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {reviews.map((rev) => (
                        <Grid item xs={12} sm={6} key={rev.review_id}>
                            <Card variant="outlined" sx={{ borderRadius: '14px', p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                            {rev.hotel?.name || 'RP Hotel'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', fontWeight: 700 }}>
                                            Confirmation: {rev.reservation?.confirmation_code || '—'}
                                        </Typography>
                                    </Box>
                                    <Rating value={rev.rating} readOnly size="small" />
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.primary', flex: 1, mb: 1.5 }}>
                                    "{rev.comment}"
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Submitted on {formatDate(rev.created_at)}
                                </Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Review Modal */}
            <Dialog
                open={reviewDialogOpen}
                onClose={() => !submitting && setReviewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            Review Your Stay
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {selectedStay?.room?.hotel?.name} (Room {selectedStay?.room?.room_number} • {selectedStay?.room?.roomType?.type_name})
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setReviewDialogOpen(false)} disabled={submitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSubmitReview}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Overall Guest Rating
                            </Typography>
                            <Rating
                                size="large"
                                value={rating}
                                onChange={(_, val) => setRating(val)}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Your Feedback & Comments"
                            placeholder="How was the room, cleanliness, customer service, and amenities?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setReviewDialogOpen(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Verified Review'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default GuestReviews;
