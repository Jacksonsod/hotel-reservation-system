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
    Stack,
    Divider,
    useTheme,
} from '@mui/material';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';

import DataTableWrapper from '../../components/common/DataTableWrapper';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImageUploaderPreview from '../../components/common/ImageUploaderPreview';
import axiosClient from '../../api/axiosClient';

const HotelsPage = () => {
    const theme = useTheme();

    // Data state
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialog states
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        address: '',
        contact_phone: '',
        contact_email: '',
        status: 'active',
    });
    const [newImages, setNewImages] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Delete confirm dialog
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [hotelToDelete, setHotelToDelete] = useState(null);

    // Notification toast
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Fetch hotels
    const fetchHotels = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/hotels');
            if (res.data?.success) {
                setHotels(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load hotels', err);
            setToast({
                open: true,
                message: err.response?.data?.message || 'Failed to load hotels.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
    }, []);

    // Filtered data
    const filteredHotels = useMemo(() => {
        return hotels.filter((hotel) => {
            const matchesSearch =
                searchQuery === '' ||
                hotel.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hotel.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                hotel.address?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' || hotel.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [hotels, searchQuery, statusFilter]);

    // KPI Metrics calculation
    const kpis = useMemo(() => {
        const total = hotels.length;
        const active = hotels.filter((h) => h.status === 'active').length;
        const inactive = hotels.filter((h) => h.status === 'inactive').length;
        const totalRooms = hotels.reduce((sum, h) => sum + (h.rooms_count || 0), 0);
        return { total, active, inactive, totalRooms };
    }, [hotels]);

    // Open create dialog
    const handleOpenCreate = () => {
        setDialogMode('create');
        setSelectedHotel(null);
        setFormData({
            name: '',
            description: '',
            location: '',
            address: '',
            contact_phone: '',
            contact_email: '',
            status: 'active',
        });
        setNewImages([]);
        setFormErrors({});
        setEditDialogOpen(true);
    };

    // Open edit dialog
    const handleOpenEdit = (hotel) => {
        setDialogMode('edit');
        setSelectedHotel(hotel);
        setFormData({
            name: hotel.name || '',
            description: hotel.description || '',
            location: hotel.location || '',
            address: hotel.address || '',
            contact_phone: hotel.contact_phone || '',
            contact_email: hotel.contact_email || '',
            status: hotel.status || 'active',
        });
        setNewImages([]);
        setFormErrors({});
        setEditDialogOpen(true);
    };

    // Open view dialog
    const handleOpenView = (hotel) => {
        setSelectedHotel(hotel);
        setViewDialogOpen(true);
    };

    // Handle form input change
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
        if (!formData.name.trim()) errors.name = 'Hotel name is required.';
        if (!formData.location.trim()) errors.location = 'Location is required.';
        if (!formData.address.trim()) errors.address = 'Address is required.';
        if (!formData.description.trim()) errors.description = 'Description is required.';
        if (!formData.contact_phone.trim()) {
            errors.contact_phone = 'Phone number is required.';
        } else if (!/^\+?[0-9]{10,15}$/.test(formData.contact_phone.trim())) {
            errors.contact_phone = 'Phone must be 10-15 digits (e.g. +250788111222).';
        }
        if (!formData.contact_email.trim()) {
            errors.contact_email = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email.trim())) {
            errors.contact_email = 'Enter a valid email address.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Submit form (create or edit)
    const handleSaveHotel = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setFormSubmitting(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('location', formData.location);
            data.append('address', formData.address);
            data.append('contact_phone', formData.contact_phone);
            data.append('contact_email', formData.contact_email);
            data.append('status', formData.status);

            // Append new images
            newImages.forEach((file) => {
                data.append('images[]', file);
            });

            if (dialogMode === 'create') {
                const res = await axiosClient.post('/hotels', data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (res.data?.success) {
                    setToast({ open: true, message: 'Hotel created successfully.', severity: 'success' });
                    setEditDialogOpen(false);
                    fetchHotels();
                }
            } else {
                // Use POST with method spoofing for multipart updates in Laravel
                data.append('_method', 'PUT');
                const res = await axiosClient.post(`/hotels/${selectedHotel.hotel_id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (res.data?.success) {
                    setToast({ open: true, message: 'Hotel updated successfully.', severity: 'success' });
                    setEditDialogOpen(false);
                    fetchHotels();
                }
            }
        } catch (err) {
            console.error('Save hotel error', err);
            const msg = err.response?.data?.message || 'Failed to save hotel.';
            const fieldErrors = err.response?.data?.errors;
            if (fieldErrors) {
                setFormErrors(fieldErrors);
            }
            setToast({ open: true, message: msg, severity: 'error' });
        } finally {
            setFormSubmitting(false);
        }
    };

    // Delete single existing image
    const handleDeleteImage = async (imageId) => {
        if (!selectedHotel) return;
        try {
            await axiosClient.delete(`/hotels/${selectedHotel.hotel_id}/images/${imageId}`);
            setToast({ open: true, message: 'Image deleted.', severity: 'success' });
            // Update selectedHotel images
            setSelectedHotel((prev) => ({
                ...prev,
                images: prev.images.filter((img) => img.image_id !== imageId),
            }));
            fetchHotels();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Failed to delete image.', severity: 'error' });
        }
    };

    // Trigger delete confirmation
    const handleDeleteClick = (hotel) => {
        setHotelToDelete(hotel);
        setConfirmDeleteOpen(true);
    };

    // Confirm deletion
    const handleConfirmDelete = async () => {
        if (!hotelToDelete) return;
        try {
            await axiosClient.delete(`/hotels/${hotelToDelete.hotel_id}`);
            setToast({ open: true, message: 'Hotel branch deleted successfully.', severity: 'success' });
            fetchHotels();
        } catch (err) {
            setToast({
                open: true,
                message: err.response?.data?.message || 'Cannot delete hotel.',
                severity: 'error',
            });
        } finally {
            setConfirmDeleteOpen(false);
            setHotelToDelete(null);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('/storage/')) return path;
        return `/storage/${path}`;
    };

    // DataGrid columns definition
    const columns = [
        {
            field: 'name',
            headerName: 'Hotel Branch',
            flex: 1.5,
            minWidth: 240,
            renderCell: (params) => {
                const img = params.row.images?.[0]?.image_path;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
                        <Avatar
                            src={getImageUrl(img)}
                            alt={params.row.name}
                            variant="rounded"
                            sx={{ width: 44, height: 44, borderRadius: '8px', bgcolor: 'primary.light' }}
                        >
                            <HotelOutlinedIcon />
                        </Avatar>
                        <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                {params.row.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {params.row.location}
                            </Typography>
                        </Box>
                    </Box>
                );
            },
        },
        {
            field: 'address',
            headerName: 'Address',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary" noWrap>
                    {params.row.address}
                </Typography>
            ),
        },
        {
            field: 'contact',
            headerName: 'Contact Details',
            flex: 1.3,
            minWidth: 200,
            renderCell: (params) => (
                <Box>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                        {params.row.contact_phone}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.contact_email}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'rooms_count',
            headerName: 'Rooms',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                    {params.row.rooms_count || 0}
                </Typography>
            ),
        },
        {
            field: 'active_reservations_count',
            headerName: 'Active Bookings',
            width: 140,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 600,
                        color: (params.row.active_reservations_count || 0) > 0 ? 'primary.main' : 'text.secondary',
                        fontFamily: 'JetBrains Mono, monospace',
                    }}
                >
                    {params.row.active_reservations_count || 0}
                </Typography>
            ),
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 120,
            renderCell: (params) => <StatusChip status={params.row.status} />,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 140,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="View Details">
                        <IconButton size="small" color="info" onClick={() => handleOpenView(params.row)}>
                            <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Hotel">
                        <IconButton size="small" color="warning" onClick={() => handleOpenEdit(params.row)}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Hotel">
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
                title="Hotel Branches"
                subtitle="Manage Karongi, Kigali, and Rubavu properties, contacts, rooms, and images"
                addNewLabel="Add Hotel Branch"
                onAddNew={handleOpenCreate}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                }}
                filterSlot={
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={statusFilter}
                            label="Status"
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                    </FormControl>
                }
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Hotel Branches"
                                value={kpis.total}
                                icon={<HotelOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Active Properties"
                                value={kpis.active}
                                icon={<CheckCircleOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Inactive Branches"
                                value={kpis.inactive}
                                icon={<CancelOutlinedIcon />}
                                color="error"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Rooms across Branches"
                                value={kpis.totalRooms}
                                icon={<MeetingRoomOutlinedIcon />}
                                color="warning"
                            />
                        </Grid>
                    </Grid>
                }
                rows={filteredHotels}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.hotel_id}
            />

            {/* Create / Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => !formSubmitting && setEditDialogOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: '16px', p: 1 },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {dialogMode === 'create' ? 'Add New Hotel Branch' : `Edit ${selectedHotel?.name}`}
                    </Typography>
                    <IconButton size="small" onClick={() => setEditDialogOpen(false)} disabled={formSubmitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleSaveHotel}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Hotel Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    error={Boolean(formErrors.name)}
                                    helperText={formErrors.name}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        label="Status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Location / City"
                                    name="location"
                                    placeholder="e.g. Karongi, Kigali, Rubavu"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    error={Boolean(formErrors.location)}
                                    helperText={formErrors.location}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Physical Address"
                                    name="address"
                                    placeholder="e.g. Lake Kivu Shore, Western Province"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    error={Boolean(formErrors.address)}
                                    helperText={formErrors.address}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Contact Phone"
                                    name="contact_phone"
                                    placeholder="+250788111222"
                                    value={formData.contact_phone}
                                    onChange={handleInputChange}
                                    error={Boolean(formErrors.contact_phone)}
                                    helperText={formErrors.contact_phone}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Contact Email"
                                    name="contact_email"
                                    type="email"
                                    placeholder="info@hotel.rw"
                                    value={formData.contact_email}
                                    onChange={handleInputChange}
                                    error={Boolean(formErrors.contact_email)}
                                    helperText={formErrors.contact_email}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    size="small"
                                    label="Description"
                                    name="description"
                                    placeholder="Overview of the property, features, and guest experience..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    error={Boolean(formErrors.description)}
                                    helperText={formErrors.description}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                    Hotel Gallery & Promo Photos
                                </Typography>
                                <ImageUploaderPreview
                                    multiple={true}
                                    onImagesSelect={setNewImages}
                                    existingImages={selectedHotel?.images || []}
                                    onDeleteExistingImage={handleDeleteImage}
                                    label="Select Hotel Images"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={() => setEditDialogOpen(false)}
                            disabled={formSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={formSubmitting}
                        >
                            {formSubmitting ? 'Saving...' : dialogMode === 'create' ? 'Create Hotel' : 'Update Hotel'}
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
                PaperProps={{
                    sx: { borderRadius: '16px', p: 1 },
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HotelOutlinedIcon color="primary" />
                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                            {selectedHotel?.name}
                        </Typography>
                        {selectedHotel && <StatusChip status={selectedHotel.status} />}
                    </Box>
                    <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                            {selectedHotel?.description}
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Location & Address
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                                    {selectedHotel?.location}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedHotel?.address}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Contact Information
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, fontFamily: 'JetBrains Mono, monospace' }}>
                                    {selectedHotel?.contact_phone}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selectedHotel?.contact_email}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Image Gallery */}
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                            Photo Gallery ({selectedHotel?.images?.length || 0})
                        </Typography>
                        {selectedHotel?.images && selectedHotel.images.length > 0 ? (
                            <Grid container spacing={2}>
                                {selectedHotel.images.map((img) => (
                                    <Grid item xs={12} sm={6} md={4} key={img.image_id}>
                                        <Box
                                            sx={{
                                                height: 160,
                                                borderRadius: '10px',
                                                overflow: 'hidden',
                                                border: `1px solid ${theme.palette.divider}`,
                                            }}
                                        >
                                            <Box
                                                component="img"
                                                src={getImageUrl(img.image_path)}
                                                alt="Hotel"
                                                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No promotional photos uploaded yet.
                            </Typography>
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
                            handleOpenEdit(selectedHotel);
                        }}
                    >
                        Edit Branch
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmDeleteOpen}
                title="Delete Hotel Branch"
                message={`Are you sure you want to permanently delete "${hotelToDelete?.name}"? All associated rooms and images will be removed. This action cannot be undone.`}
                confirmText="Delete Hotel"
                confirmColor="error"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />

            {/* Toast Snackbar */}
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

export default HotelsPage;
