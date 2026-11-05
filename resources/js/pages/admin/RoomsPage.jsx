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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Tooltip,
    Avatar,
    Alert,
    Snackbar,
    Chip,
    InputAdornment,
    OutlinedInput,
    useTheme,
} from '@mui/material';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';

import DataTableWrapper from '../../components/common/DataTableWrapper';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImageUploaderPreview from '../../components/common/ImageUploaderPreview';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { getImageUrl, handleImageError } from '../../utils/formatters';

const RoomsPage = () => {
    const theme = useTheme();
    const { selectedBranchId } = useAuth();

    // Data lists
    const [rooms, setRooms] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [amenitiesList, setAmenitiesList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [hotelFilter, setHotelFilter] = useState(selectedBranchId || 'all');
    const [roomTypeFilter, setRoomTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'

    // Form state
    const [formData, setFormData] = useState({
        hotel_id: '',
        room_number: '',
        room_type_id: '',
        price_per_night: '',
        capacity: 1,
        description: '',
        status: 'available',
        amenity_ids: [],
    });
    const [newImages, setNewImages] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Delete confirmation
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);

    // Toast
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Sync with top branch selector if changed
    useEffect(() => {
        if (selectedBranchId) {
            setHotelFilter(selectedBranchId);
        }
    }, [selectedBranchId]);

    // Fetch initial auxiliary data
    const fetchAuxiliaryData = async () => {
        try {
            const [hotelsRes, typesRes, amenitiesRes] = await Promise.all([
                axiosClient.get('/hotels'),
                axiosClient.get('/room-types'),
                axiosClient.get('/amenities'),
            ]);
            if (hotelsRes.data?.success) setHotels(hotelsRes.data.data || []);
            if (typesRes.data?.success) setRoomTypes(typesRes.data.data || []);
            if (amenitiesRes.data?.success) setAmenitiesList(amenitiesRes.data.data || []);
        } catch (err) {
            console.error('Failed to load auxiliary options', err);
        }
    };

    // Fetch rooms list
    const fetchRooms = async () => {
        setLoading(true);
        try {
            const params = {};
            if (hotelFilter !== 'all') params.hotel_id = hotelFilter;
            if (roomTypeFilter !== 'all') params.room_type_id = roomTypeFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await axiosClient.get('/rooms', { params });
            if (res.data?.success) {
                setRooms(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load rooms', err);
            setToast({
                open: true,
                message: err.response?.data?.message || 'Failed to load rooms.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuxiliaryData();
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [hotelFilter, roomTypeFilter, statusFilter, searchQuery]);

    // KPI calculation
    const kpis = useMemo(() => {
        const total = rooms.length;
        const available = rooms.filter((r) => r.status === 'available').length;
        const occupied = rooms.filter((r) => r.status === 'occupied').length;
        const dirtyOrMaint = rooms.filter((r) => ['dirty', 'clean', 'under_maintenance'].includes(r.status)).length;
        return { total, available, occupied, dirtyOrMaint };
    }, [rooms]);

    // Maximum capacity helper based on selected room type in form
    const currentRoomTypeMaxCap = useMemo(() => {
        if (!formData.room_type_id) return 20;
        const found = roomTypes.find((t) => t.room_type_id === Number(formData.room_type_id));
        return found ? found.maximum_capacity : 20;
    }, [formData.room_type_id, roomTypes]);

    // Open create dialog
    const handleOpenCreate = () => {
        setDialogMode('create');
        setSelectedRoom(null);
        setFormData({
            hotel_id: hotels[0]?.hotel_id || '',
            room_number: '',
            room_type_id: roomTypes[0]?.room_type_id || '',
            price_per_night: '',
            capacity: 1,
            description: '',
            status: 'available',
            amenity_ids: [],
        });
        setNewImages([]);
        setFormErrors({});
        setEditDialogOpen(true);
    };

    // Open edit dialog
    const handleOpenEdit = (room) => {
        setDialogMode('edit');
        setSelectedRoom(room);
        setFormData({
            hotel_id: room.hotel_id || '',
            room_number: room.room_number || '',
            room_type_id: room.room_type_id || '',
            price_per_night: room.price_per_night || '',
            capacity: room.capacity || 1,
            description: room.description || '',
            status: room.status || 'available',
            amenity_ids: room.amenities?.map((a) => a.amenity_id) || [],
        });
        setNewImages([]);
        setFormErrors({});
        setEditDialogOpen(true);
    };

    // Open view dialog
    const handleOpenView = (room) => {
        setSelectedRoom(room);
        setViewDialogOpen(true);
    };

    // Form inputs change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};
        if (!formData.hotel_id) errors.hotel_id = 'Hotel branch is required.';
        if (!formData.room_number.toString().trim()) errors.room_number = 'Room number is required.';
        if (!formData.room_type_id) errors.room_type_id = 'Room type is required.';
        if (formData.price_per_night === '' || Number(formData.price_per_night) < 0) {
            errors.price_per_night = 'Price per night must be a valid positive number.';
        }
        if (!formData.capacity || Number(formData.capacity) < 1) {
            errors.capacity = 'Capacity must be at least 1 guest.';
        } else if (Number(formData.capacity) > currentRoomTypeMaxCap) {
            errors.capacity = `Capacity cannot exceed ${currentRoomTypeMaxCap} for selected room type.`;
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save room
    const handleSaveRoom = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setFormSubmitting(true);
        try {
            const data = new FormData();
            data.append('hotel_id', formData.hotel_id);
            data.append('room_number', formData.room_number);
            data.append('room_type_id', formData.room_type_id);
            data.append('price_per_night', formData.price_per_night);
            data.append('capacity', formData.capacity);
            data.append('description', formData.description || '');
            data.append('status', formData.status);

            // Amenities
            formData.amenity_ids.forEach((amenityId) => {
                data.append('amenity_ids[]', amenityId);
            });

            // Images
            newImages.forEach((file) => {
                data.append('images[]', file);
            });

            if (dialogMode === 'create') {
                const res = await axiosClient.post('/rooms', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (res.data?.success) {
                    setToast({ open: true, message: 'Room created successfully.', severity: 'success' });
                    setEditDialogOpen(false);
                    fetchRooms();
                }
            } else {
                data.append('_method', 'PUT');
                const res = await axiosClient.post(`/rooms/${selectedRoom.room_id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (res.data?.success) {
                    setToast({ open: true, message: 'Room updated successfully.', severity: 'success' });
                    setEditDialogOpen(false);
                    fetchRooms();
                }
            }
        } catch (err) {
            console.error('Save room error', err);
            const msg = err.response?.data?.message || 'Failed to save room.';
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            }
            setToast({ open: true, message: msg, severity: 'error' });
        } finally {
            setFormSubmitting(false);
        }
    };

    // Delete single existing room image
    const handleDeleteImage = async (imageId) => {
        if (!selectedRoom) return;
        try {
            await axiosClient.delete(`/rooms/${selectedRoom.room_id}/images/${imageId}`);
            setToast({ open: true, message: 'Room image deleted.', severity: 'success' });
            setSelectedRoom((prev) => ({
                ...prev,
                images: prev.images.filter((img) => img.image_id !== imageId),
            }));
            fetchRooms();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to delete image.', severity: 'error' });
        }
    };

    // Delete room
    const handleDeleteClick = (room) => {
        setRoomToDelete(room);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roomToDelete) return;
        try {
            await axiosClient.delete(`/rooms/${roomToDelete.room_id}`);
            setToast({ open: true, message: `Room ${roomToDelete.room_number} deleted successfully.`, severity: 'success' });
            fetchRooms();
        } catch (err) {
            setToast({
                open: true,
                message: err.response?.data?.message || 'Cannot delete room.',
                severity: 'error',
            });
        } finally {
            setConfirmDeleteOpen(false);
            setRoomToDelete(null);
        }
    };

    // DataGrid columns
    const columns = [
        {
            field: 'room_number',
            headerName: 'Room #',
            width: 140,
            renderCell: (params) => {
                const img = params.row.images?.[0]?.image_path;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
                        <Avatar
                            src={getImageUrl(img, 'room')}
                            imgProps={{ onError: handleImageError('room') }}
                            alt={params.row.room_number}
                            variant="rounded"
                            sx={{ width: 36, height: 36, borderRadius: '6px', bgcolor: 'primary.light' }}
                        >
                            <MeetingRoomOutlinedIcon fontSize="small" />
                        </Avatar>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 700,
                                fontFamily: 'JetBrains Mono, monospace',
                                color: 'text.primary',
                            }}
                        >
                            {params.row.room_number}
                        </Typography>
                    </Box>
                );
            },
        },
        {
            field: 'hotel',
            headerName: 'Hotel Branch',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.row.hotel?.name || '—'}
                </Typography>
            ),
        },
        {
            field: 'room_type',
            headerName: 'Room Type',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                    {params.row.room_type?.type_name || params.row.roomType?.type_name || '—'}
                </Typography>
            ),
        },
        {
            field: 'capacity',
            headerName: 'Capacity',
            width: 110,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {params.row.capacity} Guests
                </Typography>
            ),
        },
        {
            field: 'price_per_night',
            headerName: 'Price / Night',
            width: 150,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'primary.main' }}>
                    RWF {Number(params.row.price_per_night).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: 'amenities',
            headerName: 'Amenities',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => {
                const amenities = params.row.amenities || [];
                if (amenities.length === 0) return <Typography variant="caption" color="text.secondary">—</Typography>;
                return (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {amenities.slice(0, 2).map((a) => (
                            <Chip key={a.amenity_id} label={a.amenity_name} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                        ))}
                        {amenities.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                                +{amenities.length - 2}
                            </Typography>
                        )}
                    </Box>
                );
            },
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => <StatusChip status={params.row.status} />,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 140,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Room Details">
                        <IconButton size="small" color="info" onClick={() => handleOpenView(params.row)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Room">
                        <IconButton size="small" color="warning" onClick={() => handleOpenEdit(params.row)}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Room">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(params.row)}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <DataTableWrapper
                title="Rooms & Suites"
                subtitle="Configure room numbers, categories, pricing, maximum guests, and operational statuses"
                addNewLabel="Add Room"
                onAddNew={handleOpenCreate}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => {
                    setSearchQuery('');
                    setHotelFilter('all');
                    setRoomTypeFilter('all');
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

                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Room Type</InputLabel>
                            <Select
                                value={roomTypeFilter}
                                label="Room Type"
                                onChange={(e) => setRoomTypeFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                {roomTypes.map((t) => (
                                    <MenuItem key={t.room_type_id} value={t.room_type_id}>
                                        {t.type_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ minWidth: 140 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="available">Available</MenuItem>
                                <MenuItem value="reserved">Reserved</MenuItem>
                                <MenuItem value="occupied">Occupied</MenuItem>
                                <MenuItem value="dirty">Dirty</MenuItem>
                                <MenuItem value="clean">Clean</MenuItem>
                                <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                }
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Rooms"
                                value={kpis.total}
                                icon={<MeetingRoomOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Available for Booking"
                                value={kpis.available}
                                icon={<CheckCircleOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Occupied Rooms"
                                value={kpis.occupied}
                                icon={<PersonOutlinedIcon />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Dirty / In Maintenance"
                                value={kpis.dirtyOrMaint}
                                icon={<CleaningServicesOutlinedIcon />}
                                color="error"
                            />
                        </Grid>
                    </Grid>
                }
                rows={rooms}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.room_id}
            />

            {/* Create / Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => !formSubmitting && setEditDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {dialogMode === 'create' ? 'Add New Room' : `Edit Room ${selectedRoom?.room_number}`}
                    </Typography>
                    <IconButton size="small" onClick={() => setEditDialogOpen(false)} disabled={formSubmitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleSaveRoom}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small" required error={Boolean(formErrors.hotel_id)}>
                                    <InputLabel>Hotel Branch</InputLabel>
                                    <Select
                                        name="hotel_id"
                                        label="Hotel Branch"
                                        value={formData.hotel_id}
                                        onChange={handleInputChange}
                                    >
                                        {hotels.map((h) => (
                                            <MenuItem key={h.hotel_id} value={h.hotel_id}>
                                                {h.name} ({h.location})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Room Number / Identifier"
                                    name="room_number"
                                    placeholder="e.g. 101, 204B, PH-1"
                                    value={formData.room_number}
                                    onChange={handleInputChange}
                                    error={Boolean(formErrors.room_number)}
                                    helperText={formErrors.room_number}
                                    inputProps={{ style: { fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 } }}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small" required error={Boolean(formErrors.room_type_id)}>
                                    <InputLabel>Room Type</InputLabel>
                                    <Select
                                        name="room_type_id"
                                        label="Room Type"
                                        value={formData.room_type_id}
                                        onChange={handleInputChange}
                                    >
                                        {roomTypes.map((t) => (
                                            <MenuItem key={t.room_type_id} value={t.room_type_id}>
                                                {t.type_name} (Max: {t.maximum_capacity} guests)
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Guest Capacity"
                                    name="capacity"
                                    type="number"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    inputProps={{ min: 1, max: currentRoomTypeMaxCap }}
                                    error={Boolean(formErrors.capacity)}
                                    helperText={formErrors.capacity || `Maximum allowed for selected type: ${currentRoomTypeMaxCap} guests`}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Price per Night"
                                    name="price_per_night"
                                    type="number"
                                    placeholder="85000"
                                    value={formData.price_per_night}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">RWF</InputAdornment>,
                                    }}
                                    error={Boolean(formErrors.price_per_night)}
                                    helperText={formErrors.price_per_night}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        label="Status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="available">Available</MenuItem>
                                        <MenuItem value="reserved">Reserved</MenuItem>
                                        <MenuItem value="occupied">Occupied</MenuItem>
                                        <MenuItem value="dirty">Dirty</MenuItem>
                                        <MenuItem value="clean">Clean</MenuItem>
                                        <MenuItem value="under_maintenance">Under Maintenance</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="amenities-select-label">Room Amenities</InputLabel>
                                    <Select
                                        labelId="amenities-select-label"
                                        multiple
                                        value={formData.amenity_ids}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, amenity_ids: e.target.value }))}
                                        input={<OutlinedInput label="Room Amenities" />}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((val) => {
                                                    const item = amenitiesList.find((a) => a.amenity_id === val);
                                                    return <Chip key={val} label={item?.amenity_name || val} size="small" />;
                                                })}
                                            </Box>
                                        )}
                                    >
                                        {amenitiesList.map((a) => (
                                            <MenuItem key={a.amenity_id} value={a.amenity_id}>
                                                {a.amenity_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    size="small"
                                    label="Description & Highlights"
                                    name="description"
                                    placeholder="Balcony with panoramic lake view, king bed, jacuzzi..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Room Photos & Gallery
                                </Typography>
                                <ImageUploaderPreview
                                    multiple={true}
                                    onImagesSelect={setNewImages}
                                    existingImages={selectedRoom?.images || []}
                                    onDeleteExistingImage={handleDeleteImage}
                                    label="Select Room Images"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setEditDialogOpen(false)} disabled={formSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={formSubmitting}>
                            {formSubmitting ? 'Saving...' : dialogMode === 'create' ? 'Create Room' : 'Update Room'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <MeetingRoomOutlinedIcon color="primary" />
                        <Typography variant="h3" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                            Room {selectedRoom?.room_number}
                        </Typography>
                        {selectedRoom && <StatusChip status={selectedRoom.status} />}
                    </Box>
                    <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                                <Typography variant="caption" color="text.secondary">Hotel Branch</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                    {selectedRoom?.hotel?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {selectedRoom?.hotel?.location}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                                <Typography variant="caption" color="text.secondary">Room Type & Capacity</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                    {selectedRoom?.room_type?.type_name || selectedRoom?.roomType?.type_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Max {selectedRoom?.capacity} Guests
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                                <Typography variant="caption" color="text.secondary">Nightly Rate</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>
                                    RWF {Number(selectedRoom?.price_per_night || 0).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">Taxes extra (18% VAT)</Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {selectedRoom?.description && (
                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                Description
                            </Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                {selectedRoom.description}
                            </Typography>
                        </Box>
                    )}

                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Included Amenities
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedRoom?.amenities && selectedRoom.amenities.length > 0 ? (
                                selectedRoom.amenities.map((a) => (
                                    <Chip key={a.amenity_id} label={a.amenity_name} variant="outlined" />
                                ))
                            ) : (
                                <Typography variant="caption" color="text.secondary">None specified.</Typography>
                            )}
                        </Box>
                    </Box>

                    {/* Room Photos */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                            Room Photos ({selectedRoom?.images?.length || 0})
                        </Typography>
                        {selectedRoom?.images && selectedRoom.images.length > 0 ? (
                            <Grid container spacing={2}>
                                {selectedRoom.images.map((img) => (
                                    <Grid item xs={12} sm={6} md={4} key={img.image_id}>
                                        <Box
                                            sx={{
                                                height: 140,
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={getImageUrl(img.image_path, 'room')}
                                                onError={handleImageError('room')}
                                                alt="Room"
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No photos uploaded.</Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button variant="outlined" color="inherit" onClick={() => setViewDialogOpen(false)}>
                        Close
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setViewDialogOpen(false);
                            handleOpenEdit(selectedRoom);
                        }}
                    >
                        Edit Room
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmDeleteOpen}
                title="Delete Room"
                message={`Are you sure you want to permanently delete Room "${roomToDelete?.room_number}"? Active reservations will block this action.`}
                confirmText="Delete Room"
                confirmColor="error"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />

            {/* Toast */}
            <Snackbar
                open={toast.open}
                autoHideDuration={5000}
                onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    severity={toast.severity}
                    variant="filled"
                    onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default RoomsPage;
