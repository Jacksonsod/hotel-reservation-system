import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Tooltip,
    IconButton,
    useTheme,
} from '@mui/material';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import axiosClient from '../../api/axiosClient';
import StatusChip from '../../components/common/StatusChip';

const ReceptionRoomBoardPage = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);

    // Filters
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Room Detail Modal
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);

    // Initial Fetch Options
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [hRes, tRes] = await Promise.all([
                    axiosClient.get('/hotels'),
                    axiosClient.get('/room-types'),
                ]);
                if (hRes.data.success) {
                    setHotels(hRes.data.data.data || hRes.data.data || []);
                }
                if (tRes.data.success) {
                    setRoomTypes(tRes.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load filter dependencies', err);
            }
        };
        fetchFilters();
    }, []);

    // Fetch Rooms Matrix
    const fetchRooms = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedHotel !== 'all') params.hotel_id = selectedHotel;
            if (selectedType !== 'all') params.room_type_id = selectedType;
            if (selectedStatus !== 'all') params.status = selectedStatus;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const res = await axiosClient.get('/rooms', { params });
            if (res.data.success) {
                setRooms(res.data.data.data || res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch rooms matrix', err);
        } finally {
            setLoading(false);
        }
    }, [selectedHotel, selectedType, selectedStatus, searchTerm]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleRoomClick = (room) => {
        setSelectedRoom(room);
        setDetailModalOpen(true);
    };

    const getStatusBorderColor = (status) => {
        switch (status) {
            case 'available':
            case 'clean':
                return '#10B981';
            case 'occupied':
                return '#3B82F6';
            case 'reserved':
                return '#F59E0B';
            case 'dirty':
                return '#EF4444';
            case 'under_maintenance':
                return '#DC2626';
            default:
                return theme.palette.divider;
        }
    };

    const counts = {
        total: rooms.length,
        available: rooms.filter((r) => r.status === 'available').length,
        occupied: rooms.filter((r) => r.status === 'occupied').length,
        reserved: rooms.filter((r) => r.status === 'reserved').length,
        dirty: rooms.filter((r) => r.status === 'dirty').length,
        clean: rooms.filter((r) => r.status === 'clean').length,
        maintenance: rooms.filter((r) => r.status === 'under_maintenance').length,
    };

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* Row 1: Header */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        Room Availability Board
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Live visual room matrix and operational turnover status across all hotel branches
                    </Typography>
                </Box>
                <Tooltip title="Refresh Matrix">
                    <IconButton
                        onClick={fetchRooms}
                        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}
                    >
                        <RefreshOutlinedIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Row 2: Status Filter Strip */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Hotel Branch</InputLabel>
                    <Select
                        value={selectedHotel}
                        label="Hotel Branch"
                        onChange={(e) => setSelectedHotel(e.target.value)}
                    >
                        <MenuItem value="all">All Branches</MenuItem>
                        {hotels.map((h) => (
                            <MenuItem key={h.hotel_id} value={h.hotel_id}>{h.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Room Type</InputLabel>
                    <Select
                        value={selectedType}
                        label="Room Type"
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <MenuItem value="all">All Types</MenuItem>
                        {roomTypes.map((t) => (
                            <MenuItem key={t.room_type_id} value={t.room_type_id}>{t.type_name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Room Status</InputLabel>
                    <Select
                        value={selectedStatus}
                        label="Room Status"
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="available">Available</MenuItem>
                        <MenuItem value="occupied">Occupied</MenuItem>
                        <MenuItem value="reserved">Reserved</MenuItem>
                        <MenuItem value="dirty">Dirty</MenuItem>
                        <MenuItem value="clean">Clean</MenuItem>
                        <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    placeholder="Search room #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 160 }}
                />

                <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={`Total: ${counts.total}`} size="small" />
                    <Chip label={`Available: ${counts.available}`} size="small" sx={{ bgcolor: isDark ? '#064E3B' : '#D1FAE5', color: isDark ? '#6EE7B7' : '#065F46', fontWeight: 600 }} />
                    <Chip label={`Occupied: ${counts.occupied}`} size="small" sx={{ bgcolor: isDark ? '#1E3A8A' : '#DBEAFE', color: isDark ? '#93C5FD' : '#1E40AF', fontWeight: 600 }} />
                    <Chip label={`Dirty: ${counts.dirty}`} size="small" sx={{ bgcolor: isDark ? '#450A0A' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#991B1B', fontWeight: 600 }} />
                    <Chip label={`Maintenance: ${counts.maintenance}`} size="small" sx={{ bgcolor: isDark ? '#450A0A' : '#FEE2E2', color: isDark ? '#FCA5A5' : '#991B1B', fontWeight: 600 }} />
                </Box>
            </Paper>

            {/* Row 3 & 4: Visual Room Matrix Grid */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : rooms.length === 0 ? (
                <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '12px' }}>
                    <Typography color="text.secondary">No rooms match the selected filters.</Typography>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {rooms.map((room) => {
                        const borderColor = getStatusBorderColor(room.status);
                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={room.room_id}>
                                <Card
                                    onClick={() => handleRoomClick(room)}
                                    sx={{
                                        cursor: 'pointer',
                                        borderRadius: '12px',
                                        border: `2px solid ${borderColor}`,
                                        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: isDark
                                                ? '0 8px 16px -2px rgba(0,0,0,0.5)'
                                                : '0 8px 16px -2px rgba(15,23,42,0.12)',
                                        },
                                    }}
                                >
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography
                                                variant="h4"
                                                sx={{
                                                    fontFamily: 'JetBrains Mono, monospace',
                                                    fontWeight: 800,
                                                    color: theme.palette.text.primary,
                                                }}
                                            >
                                                #{room.room_number}
                                            </Typography>
                                            <StatusChip status={room.status} size="small" />
                                        </Box>

                                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, noWrap: true }}>
                                            {room.room_type?.type_name || 'Standard'}
                                        </Typography>

                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                            {room.hotel?.name} | Cap: {room.capacity}
                                        </Typography>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, pt: 1, borderTop: `1px dashed ${theme.palette.divider}` }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Rate / Night
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                                RWF {Number(room.price_per_night).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ROOM DETAIL MODAL */}
            <Dialog
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Room #{selectedRoom?.room_number} Details
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    {selectedRoom && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h4" sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
                                    Room {selectedRoom.room_number}
                                </Typography>
                                <StatusChip status={selectedRoom.status} />
                            </Box>

                            <Typography variant="body2">
                                <strong>Hotel:</strong> {selectedRoom.hotel?.name} ({selectedRoom.hotel?.location})
                            </Typography>
                            <Typography variant="body2">
                                <strong>Type:</strong> {selectedRoom.room_type?.type_name}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Maximum Capacity:</strong> {selectedRoom.capacity} Guests
                            </Typography>
                            <Typography variant="body2">
                                <strong>Price Per Night:</strong> RWF {Number(selectedRoom.price_per_night).toLocaleString()}
                            </Typography>

                            {selectedRoom.description && (
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Description:</strong> {selectedRoom.description}
                                </Typography>
                            )}

                            {selectedRoom.amenities?.length > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                                        Amenities:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selectedRoom.amenities.map((am) => (
                                            <Chip key={am.amenity_id} label={am.amenity_name} size="small" />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailModalOpen(false)} sx={{ textTransform: 'none' }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReceptionRoomBoardPage;
