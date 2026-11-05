import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    CardMedia,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Alert,
    Slider,
    Divider,
    AppBar,
    Toolbar,
    useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import HotelIcon from '@mui/icons-material/Hotel';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import LoyaltyOutlinedIcon from '@mui/icons-material/LoyaltyOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import WifiIcon from '@mui/icons-material/Wifi';
import BalconyIcon from '@mui/icons-material/Balcony';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import TvIcon from '@mui/icons-material/Tv';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DeskIcon from '@mui/icons-material/Desk';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeModeContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import PaymentDialog from '../../components/common/PaymentDialog';
import { formatCurrency, formatDate, maskIdNumber, getImageUrl, handleImageError } from '../../utils/formatters';

const getAmenityIcon = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.includes('wi-fi') || lower.includes('wifi')) return <WifiIcon sx={{ fontSize: '0.85rem !important' }} />;
    if (lower.includes('balcony') || lower.includes('view') || lower.includes('lake')) return <BalconyIcon sx={{ fontSize: '0.85rem !important' }} />;
    if (lower.includes('ac') || lower.includes('air conditioning')) return <AcUnitIcon sx={{ fontSize: '0.85rem !important' }} />;
    if (lower.includes('tv')) return <TvIcon sx={{ fontSize: '0.85rem !important' }} />;
    if (lower.includes('bar') || lower.includes('mini')) return <LocalBarIcon sx={{ fontSize: '0.85rem !important' }} />;
    if (lower.includes('safe')) return <LockOutlinedIcon sx={{ fontSize: '0.85rem !important' }} />;
    if (lower.includes('breakfast')) return <RestaurantIcon sx={{ fontSize: '0.85rem !important' }} />;
    if (lower.includes('desk') || lower.includes('workspace')) return <DeskIcon sx={{ fontSize: '0.85rem !important' }} />;
    return <CheckCircleOutlinedIcon sx={{ fontSize: '0.85rem !important' }} />;
};

const LandingHotelSearch = ({ isPublic = false }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { mode, toggleThemeMode } = useThemeMode();
    const { t, i18n } = useTranslation();

    // Default dates: today & tomorrow
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const tomorrowStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
    }, []);

    // Filter states
    const [checkIn, setCheckIn] = useState(todayStr);
    const [checkOut, setCheckOut] = useState(tomorrowStr);
    const [location, setLocation] = useState('all');
    const [guests, setGuests] = useState(2);
    const [roomTypeId, setRoomTypeId] = useState('all');
    const [maxPrice, setMaxPrice] = useState('all');
    const [selectedAmenities, setSelectedAmenities] = useState([]);

    // Data lists
    const [availableRooms, setAvailableRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [amenitiesList, setAmenitiesList] = useState([]);
    const [hotelsList, setHotelsList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Booking Dialog state
    const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
    const [selectedRoomToBook, setSelectedRoomToBook] = useState(null);
    const [redeemPoints, setRedeemPoints] = useState(0);
    const [guestLoyaltyBalance, setGuestLoyaltyBalance] = useState(0);
    const [companionGuests, setCompanionGuests] = useState([]);
    const [bookingSubmitting, setBookingSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState(null);

    // Booking Success & Payment Modal
    const [createdReservation, setCreatedReservation] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    // Initial load
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [typesRes, amenRes, hotelsRes] = await Promise.all([
                    axiosClient.get('/public/room-types'),
                    axiosClient.get('/public/amenities'),
                    axiosClient.get('/public/hotels'),
                ]);
                if (typesRes.data?.success) setRoomTypes(typesRes.data.data || []);
                if (amenRes.data?.success) setAmenitiesList(amenRes.data.data || []);
                if (hotelsRes.data?.success) setHotelsList(hotelsRes.data.data || []);
            } catch (err) {
                console.error('Failed to load filter options', err);
            }
        };
        fetchFilters();
        handleSearch();
    }, []);

    // Fetch guest loyalty balance if logged in
    useEffect(() => {
        if (user && user.role === 'guest') {
            axiosClient.get('/loyalty').then((res) => {
                if (res.data?.success && res.data.data?.account) {
                    setGuestLoyaltyBalance(res.data.data.account.available_points || 0);
                }
            }).catch(() => {});
        }
    }, [user]);

    // Search rooms
    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {
                check_in: checkIn,
                check_out: checkOut,
                number_of_guests: guests,
            };
            if (location !== 'all') params.location = location;
            if (roomTypeId !== 'all') params.room_type_id = roomTypeId;
            if (maxPrice !== 'all') params.max_price = Number(maxPrice);
            if (selectedAmenities.length > 0) params.amenity_ids = selectedAmenities;

            const res = await axiosClient.get('/public/availability', { params });
            if (res.data?.success) {
                setAvailableRooms(res.data.data || []);
            }
        } catch (err) {
            console.error('Availability search failed', err);
        } finally {
            setLoading(false);
        }
    };

    // Open booking modal
    const handleOpenBooking = (room) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedRoomToBook(room);
        setRedeemPoints(0);
        setCompanionGuests([]);
        setBookingError(null);
        setBookingDialogOpen(true);
    };

    // Calculate nights & pricing preview
    const nights = useMemo(() => {
        if (!checkIn || !checkOut) return 1;
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff);
    }, [checkIn, checkOut]);

    const priceBreakdown = useMemo(() => {
        if (!selectedRoomToBook) return { subtotal: 0, discount: 0, tax: 0, total: 0 };
        const rate = Number(selectedRoomToBook.price_per_night || 0);
        const subtotal = rate * nights;
        const discount = Math.min(subtotal, redeemPoints * 50);
        const taxable = Math.max(0, subtotal - discount);
        const tax = Math.round(taxable * 0.18);
        const total = taxable + tax;
        return { subtotal, discount, tax, total };
    }, [selectedRoomToBook, nights, redeemPoints]);

    // Companion guest management
    const handleAddCompanion = () => {
        setCompanionGuests([...companionGuests, { full_name: '', identification_number: '', contact_phone: '' }]);
    };

    const handleUpdateCompanion = (index, field, value) => {
        const updated = [...companionGuests];
        updated[index][field] = value;
        setCompanionGuests(updated);
    };

    const handleRemoveCompanion = (index) => {
        setCompanionGuests(companionGuests.filter((_, i) => i !== index));
    };

    // Submit Booking
    const handleSubmitBooking = async (e) => {
        e.preventDefault();
        setBookingError(null);
        setBookingSubmitting(true);

        try {
            const payload = {
                room_id: selectedRoomToBook.room_id,
                check_in: checkIn,
                check_out: checkOut,
                number_of_guests: guests,
                redeem_points: redeemPoints,
                companion_guests: companionGuests.filter((g) => g.full_name.trim() !== ''),
            };

            const res = await axiosClient.post('/reservations', payload);
            if (res.data?.success) {
                setCreatedReservation(res.data.data);
                setBookingDialogOpen(false);
                handleSearch();
            }
        } catch (err) {
            console.error('Booking failed', err);
            setBookingError(err.response?.data?.message || 'Failed to complete booking. Please check dates.');
        } finally {
            setBookingSubmitting(false);
        }
    };

    return (
        <Box sx={{ pb: 6 }}>
            {/* Optional Public Top Navigation when viewed at root by unauthenticated guest */}
            {isPublic && !user && (
                <AppBar
                    position="static"
                    elevation={0}
                    sx={{
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        mb: 3,
                    }}
                >
                    <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <HotelIcon sx={{ color: '#C59B27', fontSize: 32 }} />
                            <Box>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        fontWeight: 800,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        letterSpacing: '-0.01em',
                                        color: theme.palette.mode === 'dark' ? '#F8FAFC' : '#1B365D',
                                    }}
                                >
                                    RP HOTELS & RESORTS
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    Karongi • Kigali • Rubavu
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {/* Language Switcher */}
                            <FormControl size="small" sx={{ minWidth: 70, display: { xs: 'none', sm: 'block' } }}>
                                <Select
                                    value={i18n.language ? i18n.language.substring(0, 2) : 'en'}
                                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                                    sx={{ height: 36, fontSize: '0.8125rem' }}
                                >
                                    <MenuItem value="en">EN</MenuItem>
                                    <MenuItem value="fr">FR</MenuItem>
                                    <MenuItem value="rw">RW</MenuItem>
                                </Select>
                            </FormControl>

                            {/* Dark/Light Mode */}
                            <IconButton onClick={toggleThemeMode} size="small" color="inherit">
                                {mode === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
                            </IconButton>

                            {/* Auth Links */}
                            <Button
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<LoginIcon />}
                                onClick={() => navigate('/login')}
                            >
                                Sign In
                            </Button>
                            <Button
                                variant="contained"
                                color="secondary"
                                size="small"
                                startIcon={<PersonAddAlt1Icon />}
                                onClick={() => navigate('/register')}
                                sx={{ color: '#0F172A', fontWeight: 700 }}
                            >
                                Register
                            </Button>
                        </Box>
                    </Toolbar>
                </AppBar>
            )}

            {/* Hero Search Banner */}
            <Paper
                elevation={0}
                sx={{
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
                        : 'linear-gradient(135deg, #1B365D 0%, #0F2342 100%)',
                    color: '#FFFFFF',
                    borderRadius: '16px',
                    p: { xs: 3, md: 5 },
                    mb: 4,
                }}
            >
                <Typography variant="h1" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1 }}>
                    Experience Royal Rwandan Hospitality
                </Typography>
                <Typography variant="body1" sx={{ color: '#E2E8F0', mb: 4, maxWidth: 640 }}>
                    Book your luxury lakefront stay in Karongi, convention suites in Kigali, or palm resorts in Rubavu with instant confirmation.
                </Typography>

                {/* Search Bar Panel */}
                <Paper
                    elevation={3}
                    sx={{
                        p: { xs: 2, md: 3 },
                        borderRadius: '14px',
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        {/* Destination / Branch */}
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Destination / Hotel</InputLabel>
                                <Select
                                    value={location}
                                    label="Destination / Hotel"
                                    onChange={(e) => setLocation(e.target.value)}
                                >
                                    <MenuItem value="all">All Locations (Rwanda)</MenuItem>
                                    <MenuItem value="Kigali">Kigali Grand Convention</MenuItem>
                                    <MenuItem value="Karongi">RP Karongi Lake Resort</MenuItem>
                                    <MenuItem value="Rubavu">Rubavu Waterfront Palms</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Check In */}
                        <Grid item xs={12} sm={6} md={2.5}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Check-In Date"
                                type="date"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: todayStr }}
                            />
                        </Grid>

                        {/* Check Out */}
                        <Grid item xs={12} sm={6} md={2.5}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Check-Out Date"
                                type="date"
                                value={checkOut}
                                onChange={(e) => setCheckOut(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: checkIn || todayStr }}
                            />
                        </Grid>

                        {/* Guests */}
                        <Grid item xs={12} sm={6} md={2}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Guests</InputLabel>
                                <Select
                                    value={guests}
                                    label="Guests"
                                    onChange={(e) => setGuests(Number(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 8].map((num) => (
                                        <MenuItem key={num} value={num}>
                                            {num} {num === 1 ? 'Guest' : 'Guests'}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Search Button */}
                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                color="secondary"
                                size="large"
                                startIcon={<SearchIcon />}
                                onClick={handleSearch}
                                sx={{ height: 42, fontWeight: 700, color: '#0F172A' }}
                            >
                                Search
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Secondary Filters: Room Type, Max Price & Amenities */}
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Room Type Tier</InputLabel>
                                <Select
                                    value={roomTypeId}
                                    label="Room Type Tier"
                                    onChange={(e) => setRoomTypeId(e.target.value)}
                                >
                                    <MenuItem value="all">All Room Types</MenuItem>
                                    {roomTypes.map((t) => (
                                        <MenuItem key={t.room_type_id} value={t.room_type_id}>
                                            {t.type_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Max Price (RWF)</InputLabel>
                                <Select
                                    value={maxPrice}
                                    label="Max Price (RWF)"
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                >
                                    <MenuItem value="all">All Budgets (No Limit)</MenuItem>
                                    <MenuItem value="50000">Up to RWF 50,000</MenuItem>
                                    <MenuItem value="80000">Up to RWF 80,000</MenuItem>
                                    <MenuItem value="120000">Up to RWF 120,000</MenuItem>
                                    <MenuItem value="180000">Up to RWF 180,000</MenuItem>
                                    <MenuItem value="250000">Up to RWF 250,000</MenuItem>
                                    <MenuItem value="400000">Up to RWF 400,000</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    Amenities:
                                </Typography>
                                {amenitiesList.map((a) => {
                                    const isSelected = selectedAmenities.includes(a.amenity_id);
                                    return (
                                        <Chip
                                            key={a.amenity_id}
                                            icon={getAmenityIcon(a.amenity_name)}
                                            label={a.amenity_name}
                                            size="small"
                                            clickable
                                            color={isSelected ? 'primary' : 'default'}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedAmenities(selectedAmenities.filter((id) => id !== a.amenity_id));
                                                } else {
                                                    setSelectedAmenities([...selectedAmenities, a.amenity_id]);
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Paper>

            {/* Available Rooms Grid */}
            <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h2" sx={{ fontWeight: 800 }}>
                    Available Rooms ({availableRooms.length})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Stay: <strong>{formatDate(checkIn)}</strong> to <strong>{formatDate(checkOut)}</strong> ({nights} {nights === 1 ? 'night' : 'nights'})
                </Typography>
            </Box>

            {loading ? (
                <Typography variant="body1" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                    Searching available suites across all branches...
                </Typography>
            ) : availableRooms.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
                    <HotelOutlinedIcon sx={{ fontSize: 56, color: 'secondary.main', mb: 1.5 }} />
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        No Rooms Available for These Dates
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
                        All suites matching your criteria are booked or under scheduled maintenance. Please try alternative dates or clear selected filters.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setLocation('all');
                            setRoomTypeId('all');
                            setSelectedAmenities([]);
                            handleSearch();
                        }}
                    >
                        Browse All Suites
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {availableRooms.map((room) => {
                        const img = room.images?.[0]?.image_path;
                        const roomTypeName = room.room_type?.type_name || room.roomType?.type_name || 'Standard Room';
                        return (
                            <Grid item xs={12} sm={6} md={6} lg={4} key={room.room_id}>
                                <Card
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        border: `1px solid ${theme.palette.divider}`,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: theme.shadows[6],
                                            borderColor: theme.palette.secondary.main,
                                        },
                                    }}
                                >
                                    <Box sx={{ position: 'relative', height: 190, bgcolor: 'action.hover', overflow: 'hidden' }}>
                                        <CardMedia
                                            component="img"
                                            height="190"
                                            image={getImageUrl(img, 'room')}
                                            onError={handleImageError('room')}
                                            alt={`Room ${room.room_number}`}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                        <Chip
                                            label={roomTypeName}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 10,
                                                left: 10,
                                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                                color: '#FFFFFF',
                                                fontWeight: 600,
                                                fontSize: '0.75rem',
                                            }}
                                        />
                                        <Chip
                                            label={`Room ${room.room_number}`}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 10,
                                                right: 10,
                                                fontFamily: 'JetBrains Mono, monospace',
                                                bgcolor: 'secondary.main',
                                                color: '#0F172A',
                                                fontWeight: 700,
                                                fontSize: '0.75rem',
                                            }}
                                        />
                                    </Box>

                                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                                        <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {room.hotel?.name} • {room.hotel?.location}
                                        </Typography>
                                        <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, mb: 0.5, fontSize: '1.15rem' }}>
                                            {roomTypeName}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, flex: 1, minHeight: 36, fontSize: '0.8125rem' }} noWrap>
                                            {room.description || `${roomTypeName} with premium Rwandan hospitality service.`}
                                        </Typography>

                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                                            <Chip
                                                icon={<PersonOutlineOutlinedIcon sx={{ fontSize: '0.8rem !important' }} />}
                                                label={`Up to ${room.capacity || 2} Guests`}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ fontSize: '0.7rem', fontWeight: 600, height: 24 }}
                                            />
                                            {(room.amenities || []).slice(0, 3).map((a) => (
                                                <Chip
                                                    key={a.amenity_id}
                                                    icon={getAmenityIcon(a.amenity_name)}
                                                    label={a.amenity_name}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: 24 }}
                                                />
                                            ))}
                                            {(room.amenities || []).length > 3 && (
                                                <Chip
                                                    label={`+${(room.amenities || []).length - 3}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: 24 }}
                                                />
                                            )}
                                        </Box>

                                        <Divider sx={{ my: 1 }} />

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 0.5 }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                                                    Per Night
                                                </Typography>
                                                <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'JetBrains Mono, monospace' }}>
                                                    {formatCurrency(room.price_per_night)}
                                                </Typography>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                onClick={() => handleOpenBooking(room)}
                                                sx={{ fontWeight: 700, px: 2, py: 0.75, borderRadius: '8px' }}
                                            >
                                                Book Now
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Reservation Booking Dialog */}
            <Dialog
                open={bookingDialogOpen}
                onClose={() => !bookingSubmitting && setBookingDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            Confirm Your Stay Reservation
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {selectedRoomToBook?.hotel?.name} • Room {selectedRoomToBook?.room_number} ({selectedRoomToBook?.room_type?.type_name || selectedRoomToBook?.roomType?.type_name || 'Standard Room'})
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setBookingDialogOpen(false)} disabled={bookingSubmitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleSubmitBooking}>
                    <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
                        {bookingError && (
                            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                                {bookingError}
                            </Alert>
                        )}

                        <Grid container spacing={3}>
                            {/* Left Column: Stay Configuration, Loyalty & Companions */}
                            <Grid item xs={12} md={7}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    {/* Stay Dates Banner */}
                                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover' }}>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="caption" color="text.secondary">Check-In</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(checkIn)}</Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="caption" color="text.secondary">Check-Out</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(checkOut)}</Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="caption" color="text.secondary">Duration</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{nights} {nights === 1 ? 'Night' : 'Nights'}</Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Typography variant="caption" color="text.secondary">Guests</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{guests} Guests</Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Loyalty Points Redemption (if available) */}
                                    {guestLoyaltyBalance > 0 && (
                                        <Box sx={{ p: 2, borderRadius: '10px', border: `1px solid ${theme.palette.secondary.light}`, bgcolor: 'background.paper' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LoyaltyOutlinedIcon color="secondary" />
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                                                        Redeem Loyalty Points
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                    Balance: {guestLoyaltyBalance.toLocaleString()} pts (Max discount: {formatCurrency(guestLoyaltyBalance * 50)})
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                                1 Point = 50 RWF instant discount off room subtotal
                                            </Typography>
                                            <Slider
                                                value={redeemPoints}
                                                min={0}
                                                max={Math.min(guestLoyaltyBalance, Math.floor(priceBreakdown.subtotal / 50))}
                                                step={10}
                                                onChange={(_, val) => setRedeemPoints(val)}
                                                valueLabelDisplay="auto"
                                                color="secondary"
                                            />
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'secondary.main', textAlign: 'right' }}>
                                                Redeeming {redeemPoints} points = - {formatCurrency(redeemPoints * 50)} Discount
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Companion Guests */}
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                Companion Guests (Optional)
                                            </Typography>
                                            <Button size="small" startIcon={<AddIcon />} onClick={handleAddCompanion}>
                                                Add Guest
                                            </Button>
                                        </Box>
                                        {companionGuests.map((cg, idx) => (
                                            <Grid container spacing={1.5} key={idx} sx={{ mb: 1 }} alignItems="center">
                                                <Grid item xs={12} sm={4}>
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        placeholder="Full Name"
                                                        value={cg.full_name}
                                                        onChange={(e) => handleUpdateCompanion(idx, 'full_name', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={4}>
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        placeholder="ID / Passport #"
                                                        value={cg.identification_number}
                                                        onChange={(e) => handleUpdateCompanion(idx, 'identification_number', e.target.value)}
                                                        helperText={cg.identification_number ? `Masked: ${maskIdNumber(cg.identification_number)}` : ''}
                                                    />
                                                </Grid>
                                                <Grid item xs={5} sm={3}>
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        placeholder="Phone"
                                                        value={cg.contact_phone}
                                                        onChange={(e) => handleUpdateCompanion(idx, 'contact_phone', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={1}>
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveCompanion(idx)}>
                                                        <DeleteOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        ))}
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Right Column: Visual Live Receipt Card */}
                            <Grid item xs={12} md={5}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2.5,
                                        borderRadius: '12px',
                                        border: `1px solid ${theme.palette.secondary.main}`,
                                        bgcolor: theme.palette.mode === 'dark' ? '#0F172A' : '#F8FAFC',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                        <ReceiptLongOutlinedIcon sx={{ color: 'secondary.main' }} />
                                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                            Reservation Folio
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                        {selectedRoomToBook?.hotel?.name} • Room {selectedRoomToBook?.room_number}
                                    </Typography>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* Line items */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {nights} {nights === 1 ? 'night' : 'nights'} × {formatCurrency(selectedRoomToBook?.price_per_night)}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                                            {formatCurrency(priceBreakdown.subtotal)}
                                        </Typography>
                                    </Box>

                                    {priceBreakdown.discount > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" sx={{ color: 'secondary.main', fontWeight: 600 }}>
                                                Loyalty Discount:
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'secondary.main', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                                                - {formatCurrency(priceBreakdown.discount)}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Taxable Subtotal:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                            {formatCurrency(Math.max(0, priceBreakdown.subtotal - priceBreakdown.discount))}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            VAT (18%):
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                            {formatCurrency(priceBreakdown.tax)}
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                            Total Amount:
                                        </Typography>
                                        <Typography variant="h2" sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'JetBrains Mono, monospace' }}>
                                            {formatCurrency(priceBreakdown.total)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <VerifiedUserOutlinedIcon sx={{ fontSize: 20, color: 'success.main' }} />
                                        <Typography variant="caption" color="text.secondary">
                                            Best rate guarantee • Instant reservation confirmation
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setBookingDialogOpen(false)} disabled={bookingSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={bookingSubmitting}>
                            {bookingSubmitting ? 'Confirming Booking...' : 'Confirm & Reserve Now'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Booking Confirmed Success Modal */}
            <Dialog
                open={Boolean(createdReservation)}
                onClose={() => setCreatedReservation(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main' }}>
                        Reservation Confirmed!
                    </Typography>
                    <IconButton size="small" onClick={() => setCreatedReservation(null)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 64, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Your reservation has been created and confirmed in our system.
                    </Typography>

                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: 'action.hover', width: '100%', textAlign: 'center', mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">Confirmation Code</Typography>
                        <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'primary.main', my: 0.5 }}>
                            {createdReservation?.confirmation_code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Total Due: {formatCurrency(createdReservation?.total_amount || 0)} (Unpaid)
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        onClick={() => {
                            setCreatedReservation(null);
                            navigate('/guest/reservations');
                        }}
                    >
                        View My Reservations
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PaymentsOutlinedIcon />}
                        onClick={() => {
                            setPaymentModalOpen(true);
                        }}
                    >
                        Pay Balance Now
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Dialog Triggered from Booking */}
            {createdReservation && (
                <PaymentDialog
                    open={paymentModalOpen}
                    onClose={() => {
                        setPaymentModalOpen(false);
                        setCreatedReservation(null);
                        navigate('/guest/reservations');
                    }}
                    reservation={createdReservation}
                    onPaymentSuccess={(payment) => {
                        // Refresh reservation status
                    }}
                />
            )}
        </Box>
    );
};

export default LandingHotelSearch;
