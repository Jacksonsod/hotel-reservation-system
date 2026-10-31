import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Tabs,
    Tab,
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
    Alert,
    Snackbar,
    InputAdornment,
    useTheme,
} from '@mui/material';
import RoomServiceOutlinedIcon from '@mui/icons-material/RoomServiceOutlined';
import HotelClassOutlinedIcon from '@mui/icons-material/HotelClassOutlined';
import PoolOutlinedIcon from '@mui/icons-material/PoolOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';

import DataTableWrapper from '../../components/common/DataTableWrapper';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import axiosClient from '../../api/axiosClient';

const ServicesAmenitiesPage = () => {
    const theme = useTheme();

    // Active Tab: 0 = Services, 1 = Room Types, 2 = Amenities
    const [activeTab, setActiveTab] = useState(0);

    // Common auxiliary data
    const [hotels, setHotels] = useState([]);

    // Tab 1: Services State
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [serviceSearch, setServiceSearch] = useState('');
    const [serviceHotelFilter, setServiceHotelFilter] = useState('all');
    const [serviceStatusFilter, setServiceStatusFilter] = useState('all');
    const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
    const [serviceDialogMode, setServiceDialogMode] = useState('create');
    const [selectedService, setSelectedService] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        hotel_id: '',
        service_name: '',
        description: '',
        price: '',
        status: 'active',
    });
    const [serviceFormErrors, setServiceFormErrors] = useState({});

    // Tab 2: Room Types State
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomTypesLoading, setRoomTypesLoading] = useState(false);
    const [roomTypeSearch, setRoomTypeSearch] = useState('');
    const [typeDialogOpen, setTypeDialogOpen] = useState(false);
    const [typeDialogMode, setTypeDialogMode] = useState('create');
    const [selectedRoomType, setSelectedRoomType] = useState(null);
    const [typeForm, setTypeForm] = useState({
        type_name: '',
        description: '',
        maximum_capacity: 2,
    });
    const [typeFormErrors, setTypeFormErrors] = useState({});

    // Tab 3: Amenities State
    const [amenities, setAmenities] = useState([]);
    const [amenitiesLoading, setAmenitiesLoading] = useState(false);
    const [amenitySearch, setAmenitySearch] = useState('');
    const [amenityDialogOpen, setAmenityDialogOpen] = useState(false);
    const [amenityDialogMode, setAmenityDialogMode] = useState('create');
    const [selectedAmenity, setSelectedAmenity] = useState(null);
    const [amenityForm, setAmenityForm] = useState({
        amenity_name: '',
        description: '',
    });
    const [amenityFormErrors, setAmenityFormErrors] = useState({});

    // Shared Confirm Delete State
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'service'|'roomType'|'amenity', item: obj }

    // Toast Snackbar
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Fetch hotels for dropdowns
    const fetchHotels = async () => {
        try {
            const res = await axiosClient.get('/hotels');
            if (res.data?.success) setHotels(res.data.data || []);
        } catch (err) {
            console.error('Failed to load hotels', err);
        }
    };

    // Fetch Services
    const fetchServices = async () => {
        setServicesLoading(true);
        try {
            const params = {};
            if (serviceHotelFilter !== 'all') params.hotel_id = serviceHotelFilter;
            if (serviceStatusFilter !== 'all') params.status = serviceStatusFilter;
            if (serviceSearch) params.search = serviceSearch;

            const res = await axiosClient.get('/services', { params });
            if (res.data?.success) {
                setServices(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load services', err);
        } finally {
            setServicesLoading(false);
        }
    };

    // Fetch Room Types
    const fetchRoomTypes = async () => {
        setRoomTypesLoading(true);
        try {
            const res = await axiosClient.get('/room-types');
            if (res.data?.success) {
                setRoomTypes(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load room types', err);
        } finally {
            setRoomTypesLoading(false);
        }
    };

    // Fetch Amenities
    const fetchAmenities = async () => {
        setAmenitiesLoading(true);
        try {
            const res = await axiosClient.get('/amenities');
            if (res.data?.success) {
                setAmenities(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load amenities', err);
        } finally {
            setAmenitiesLoading(false);
        }
    };

    useEffect(() => {
        fetchHotels();
        fetchServices();
        fetchRoomTypes();
        fetchAmenities();
    }, []);

    useEffect(() => {
        fetchServices();
    }, [serviceHotelFilter, serviceStatusFilter, serviceSearch]);

    // Services KPIs
    const serviceKpis = useMemo(() => {
        const total = services.length;
        const active = services.filter((s) => s.status === 'active').length;
        const inactive = services.filter((s) => s.status === 'inactive').length;
        const avgPrice = total > 0 ? Math.round(services.reduce((sum, s) => sum + Number(s.price || 0), 0) / total) : 0;
        return { total, active, inactive, avgPrice };
    }, [services]);

    // Room Types KPIs & filtered
    const filteredRoomTypes = useMemo(() => {
        return roomTypes.filter((t) =>
            roomTypeSearch === '' ||
            t.type_name?.toLowerCase().includes(roomTypeSearch.toLowerCase()) ||
            t.description?.toLowerCase().includes(roomTypeSearch.toLowerCase())
        );
    }, [roomTypes, roomTypeSearch]);

    const roomTypeKpis = useMemo(() => {
        const total = roomTypes.length;
        const avgCapacity = total > 0 ? (roomTypes.reduce((sum, t) => sum + Number(t.maximum_capacity || 0), 0) / total).toFixed(1) : 0;
        const totalRooms = roomTypes.reduce((sum, t) => sum + Number(t.rooms_count || 0), 0);
        return { total, avgCapacity, totalRooms };
    }, [roomTypes]);

    // Amenities KPIs & filtered
    const filteredAmenities = useMemo(() => {
        return amenities.filter((a) =>
            amenitySearch === '' ||
            a.amenity_name?.toLowerCase().includes(amenitySearch.toLowerCase()) ||
            a.description?.toLowerCase().includes(amenitySearch.toLowerCase())
        );
    }, [amenities, amenitySearch]);

    const amenityKpis = useMemo(() => {
        const total = amenities.length;
        const totalRoomsTagged = amenities.reduce((sum, a) => sum + Number(a.rooms_count || 0), 0);
        return { total, totalRoomsTagged };
    }, [amenities]);

    // ==========================================
    // Tab 1 Handlers: Services
    // ==========================================
    const handleOpenCreateService = () => {
        setServiceDialogMode('create');
        setSelectedService(null);
        setServiceForm({
            hotel_id: hotels[0]?.hotel_id || '',
            service_name: '',
            description: '',
            price: '',
            status: 'active',
        });
        setServiceFormErrors({});
        setServiceDialogOpen(true);
    };

    const handleOpenEditService = (service) => {
        setServiceDialogMode('edit');
        setSelectedService(service);
        setServiceForm({
            hotel_id: service.hotel_id,
            service_name: service.service_name,
            description: service.description,
            price: service.price,
            status: service.status,
        });
        setServiceFormErrors({});
        setServiceDialogOpen(true);
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!serviceForm.hotel_id) errors.hotel_id = 'Hotel is required.';
        if (!serviceForm.service_name.trim()) errors.service_name = 'Service name is required.';
        if (!serviceForm.description.trim()) errors.description = 'Description is required.';
        if (serviceForm.price === '' || Number(serviceForm.price) < 0) errors.price = 'Price must be >= 0.';
        if (Object.keys(errors).length > 0) {
            setServiceFormErrors(errors);
            return;
        }

        try {
            if (serviceDialogMode === 'create') {
                await axiosClient.post('/services', serviceForm);
                setToast({ open: true, message: 'Service created successfully.', severity: 'success' });
            } else {
                await axiosClient.put(`/services/${selectedService.service_id}`, serviceForm);
                setToast({ open: true, message: 'Service updated successfully.', severity: 'success' });
            }
            setServiceDialogOpen(false);
            fetchServices();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error saving service.', severity: 'error' });
        }
    };

    // ==========================================
    // Tab 2 Handlers: Room Types
    // ==========================================
    const handleOpenCreateRoomType = () => {
        setTypeDialogMode('create');
        setSelectedRoomType(null);
        setTypeForm({
            type_name: '',
            description: '',
            maximum_capacity: 2,
        });
        setTypeFormErrors({});
        setTypeDialogOpen(true);
    };

    const handleOpenEditRoomType = (type) => {
        setTypeDialogMode('edit');
        setSelectedRoomType(type);
        setTypeForm({
            type_name: type.type_name,
            description: type.description,
            maximum_capacity: type.maximum_capacity,
        });
        setTypeFormErrors({});
        setTypeDialogOpen(true);
    };

    const handleSaveRoomType = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!typeForm.type_name.trim()) errors.type_name = 'Type name is required.';
        if (!typeForm.description.trim()) errors.description = 'Description is required.';
        if (!typeForm.maximum_capacity || Number(typeForm.maximum_capacity) < 1 || Number(typeForm.maximum_capacity) > 20) {
            errors.maximum_capacity = 'Maximum capacity must be between 1 and 20 guests.';
        }
        if (Object.keys(errors).length > 0) {
            setTypeFormErrors(errors);
            return;
        }

        try {
            if (typeDialogMode === 'create') {
                await axiosClient.post('/room-types', typeForm);
                setToast({ open: true, message: 'Room type created successfully.', severity: 'success' });
            } else {
                await axiosClient.put(`/room-types/${selectedRoomType.room_type_id}`, typeForm);
                setToast({ open: true, message: 'Room type updated successfully.', severity: 'success' });
            }
            setTypeDialogOpen(false);
            fetchRoomTypes();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error saving room type.', severity: 'error' });
        }
    };

    // ==========================================
    // Tab 3 Handlers: Amenities
    // ==========================================
    const handleOpenCreateAmenity = () => {
        setAmenityDialogMode('create');
        setSelectedAmenity(null);
        setAmenityForm({
            amenity_name: '',
            description: '',
        });
        setAmenityFormErrors({});
        setAmenityDialogOpen(true);
    };

    const handleOpenEditAmenity = (amenity) => {
        setAmenityDialogMode('edit');
        setSelectedAmenity(amenity);
        setAmenityForm({
            amenity_name: amenity.amenity_name,
            description: amenity.description,
        });
        setAmenityFormErrors({});
        setAmenityDialogOpen(true);
    };

    const handleSaveAmenity = async (e) => {
        e.preventDefault();
        const errors = {};
        if (!amenityForm.amenity_name.trim()) errors.amenity_name = 'Amenity name is required.';
        if (!amenityForm.description.trim()) errors.description = 'Description is required.';
        if (Object.keys(errors).length > 0) {
            setAmenityFormErrors(errors);
            return;
        }

        try {
            if (amenityDialogMode === 'create') {
                await axiosClient.post('/amenities', amenityForm);
                setToast({ open: true, message: 'Amenity created successfully.', severity: 'success' });
            } else {
                await axiosClient.put(`/amenities/${selectedAmenity.amenity_id}`, amenityForm);
                setToast({ open: true, message: 'Amenity updated successfully.', severity: 'success' });
            }
            setAmenityDialogOpen(false);
            fetchAmenities();
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Error saving amenity.', severity: 'error' });
        }
    };

    // Shared Deletion Confirmation Trigger
    const handleDeleteClick = (type, item) => {
        setDeleteTarget({ type, item });
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        const { type, item } = deleteTarget;
        try {
            if (type === 'service') {
                await axiosClient.delete(`/services/${item.service_id}`);
                setToast({ open: true, message: 'Service deleted successfully.', severity: 'success' });
                fetchServices();
            } else if (type === 'roomType') {
                await axiosClient.delete(`/room-types/${item.room_type_id}`);
                setToast({ open: true, message: 'Room type deleted successfully.', severity: 'success' });
                fetchRoomTypes();
            } else if (type === 'amenity') {
                await axiosClient.delete(`/amenities/${item.amenity_id}`);
                setToast({ open: true, message: 'Amenity deleted successfully.', severity: 'success' });
                fetchAmenities();
            }
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.message || 'Delete operation failed.', severity: 'error' });
        } finally {
            setConfirmDeleteOpen(false);
            setDeleteTarget(null);
        }
    };

    // Column definitions
    const serviceColumns = [
        {
            field: 'service_name',
            headerName: 'Service Name',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.row.service_name}
                </Typography>
            ),
        },
        {
            field: 'hotel',
            headerName: 'Hotel Branch',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                    {params.row.hotel?.name || '—'}
                </Typography>
            ),
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 140,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'primary.main' }}>
                    RWF {Number(params.row.price).toLocaleString()}
                </Typography>
            ),
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1.8,
            minWidth: 220,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary" noWrap>
                    {params.row.description}
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
            width: 110,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit Service">
                        <IconButton size="small" color="warning" onClick={() => handleOpenEditService(params.row)}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Service">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick('service', params.row)}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const roomTypeColumns = [
        {
            field: 'type_name',
            headerName: 'Room Type Name',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {params.row.type_name}
                </Typography>
            ),
        },
        {
            field: 'maximum_capacity',
            headerName: 'Max Guests',
            width: 130,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                    {params.row.maximum_capacity} Guests
                </Typography>
            ),
        },
        {
            field: 'rooms_count',
            headerName: 'Rooms Assigned',
            width: 140,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {params.row.rooms_count || 0}
                </Typography>
            ),
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 2,
            minWidth: 240,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {params.row.description}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 110,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit Room Type">
                        <IconButton size="small" color="warning" onClick={() => handleOpenEditRoomType(params.row)}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Room Type">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick('roomType', params.row)}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    const amenityColumns = [
        {
            field: 'amenity_name',
            headerName: 'Amenity Name',
            flex: 1.2,
            minWidth: 180,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {params.row.amenity_name}
                </Typography>
            ),
        },
        {
            field: 'rooms_count',
            headerName: 'Rooms Tagged',
            width: 140,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {params.row.rooms_count || 0}
                </Typography>
            ),
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 2,
            minWidth: 260,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {params.row.description}
                </Typography>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 110,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit Amenity">
                        <IconButton size="small" color="warning" onClick={() => handleOpenEditAmenity(params.row)}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Amenity">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick('amenity', params.row)}>
                            <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            {/* Navigation Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab
                        icon={<RoomServiceOutlinedIcon />}
                        iconPosition="start"
                        label="Hotel Services"
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    />
                    <Tab
                        icon={<HotelClassOutlinedIcon />}
                        iconPosition="start"
                        label="Room Types & Capacities"
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    />
                    <Tab
                        icon={<PoolOutlinedIcon />}
                        iconPosition="start"
                        label="Amenities & Features"
                        sx={{ fontWeight: 600, textTransform: 'none' }}
                    />
                </Tabs>
            </Box>

            {/* TAB 0: Hotel Services */}
            {activeTab === 0 && (
                <DataTableWrapper
                    title="Hotel Services"
                    subtitle="Configure shuttle pickups, spa treatments, dining packages, and guided tours"
                    addNewLabel="Add Service"
                    onAddNew={handleOpenCreateService}
                    searchQuery={serviceSearch}
                    onSearchChange={setServiceSearch}
                    onResetFilters={() => {
                        setServiceSearch('');
                        setServiceHotelFilter('all');
                        setServiceStatusFilter('all');
                    }}
                    filterSlot={
                        <>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Hotel Branch</InputLabel>
                                <Select
                                    value={serviceHotelFilter}
                                    label="Hotel Branch"
                                    onChange={(e) => setServiceHotelFilter(e.target.value)}
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
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={serviceStatusFilter}
                                    label="Status"
                                    onChange={(e) => setServiceStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="inactive">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </>
                    }
                    kpiContent={
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} lg={3}>
                                <KpiCard
                                    title="Total Services"
                                    value={serviceKpis.total}
                                    icon={<RoomServiceOutlinedIcon />}
                                    color="primary"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <KpiCard
                                    title="Active Services"
                                    value={serviceKpis.active}
                                    icon={<CheckCircleOutlinedIcon />}
                                    color="success"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <KpiCard
                                    title="Inactive Services"
                                    value={serviceKpis.inactive}
                                    icon={<CancelOutlinedIcon />}
                                    color="error"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={3}>
                                <KpiCard
                                    title="Average Service Price"
                                    value={`RWF ${serviceKpis.avgPrice.toLocaleString()}`}
                                    icon={<PaidOutlinedIcon />}
                                    color="warning"
                                />
                            </Grid>
                        </Grid>
                    }
                    rows={services}
                    columns={serviceColumns}
                    loading={servicesLoading}
                    getRowId={(row) => row.service_id}
                />
            )}

            {/* TAB 1: Room Types */}
            {activeTab === 1 && (
                <DataTableWrapper
                    title="Room Types"
                    subtitle="Define room tiers, suites, and enforce maximum guest capacities"
                    addNewLabel="Add Room Type"
                    onAddNew={handleOpenCreateRoomType}
                    searchQuery={roomTypeSearch}
                    onSearchChange={setRoomTypeSearch}
                    onResetFilters={() => setRoomTypeSearch('')}
                    kpiContent={
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} lg={4}>
                                <KpiCard
                                    title="Total Room Types"
                                    value={roomTypeKpis.total}
                                    icon={<HotelClassOutlinedIcon />}
                                    color="primary"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={4}>
                                <KpiCard
                                    title="Average Max Capacity"
                                    value={`${roomTypeKpis.avgCapacity} Guests`}
                                    icon={<GroupOutlinedIcon />}
                                    color="info"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} lg={4}>
                                <KpiCard
                                    title="Assigned Rooms across Types"
                                    value={roomTypeKpis.totalRooms}
                                    icon={<MeetingRoomOutlinedIcon />}
                                    color="success"
                                />
                            </Grid>
                        </Grid>
                    }
                    rows={filteredRoomTypes}
                    columns={roomTypeColumns}
                    loading={roomTypesLoading}
                    getRowId={(row) => row.room_type_id}
                />
            )}

            {/* TAB 2: Amenities */}
            {activeTab === 2 && (
                <DataTableWrapper
                    title="Hotel Amenities"
                    subtitle="Manage in-room perks, entertainment options, and resort facilities"
                    addNewLabel="Add Amenity"
                    onAddNew={handleOpenCreateAmenity}
                    searchQuery={amenitySearch}
                    onSearchChange={setAmenitySearch}
                    onResetFilters={() => setAmenitySearch('')}
                    kpiContent={
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <KpiCard
                                    title="Total Registered Amenities"
                                    value={amenityKpis.total}
                                    icon={<PoolOutlinedIcon />}
                                    color="primary"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <KpiCard
                                    title="Total Rooms Tagged with Amenities"
                                    value={amenityKpis.totalRoomsTagged}
                                    icon={<MeetingRoomOutlinedIcon />}
                                    color="success"
                                />
                            </Grid>
                        </Grid>
                    }
                    rows={filteredAmenities}
                    columns={amenityColumns}
                    loading={amenitiesLoading}
                    getRowId={(row) => row.amenity_id}
                />
            )}

            {/* Service Create/Edit Dialog */}
            <Dialog
                open={serviceDialogOpen}
                onClose={() => setServiceDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {serviceDialogMode === 'create' ? 'Add New Service' : 'Edit Service'}
                    </Typography>
                    <IconButton size="small" onClick={() => setServiceDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSaveService}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small" required error={Boolean(serviceFormErrors.hotel_id)}>
                            <InputLabel>Hotel Branch</InputLabel>
                            <Select
                                value={serviceForm.hotel_id}
                                label="Hotel Branch"
                                onChange={(e) => setServiceForm({ ...serviceForm, hotel_id: e.target.value })}
                            >
                                {hotels.map((h) => (
                                    <MenuItem key={h.hotel_id} value={h.hotel_id}>
                                        {h.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="small"
                            label="Service Name"
                            value={serviceForm.service_name}
                            onChange={(e) => setServiceForm({ ...serviceForm, service_name: e.target.value })}
                            error={Boolean(serviceFormErrors.service_name)}
                            helperText={serviceFormErrors.service_name}
                            required
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Price"
                            type="number"
                            value={serviceForm.price}
                            onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">RWF</InputAdornment>,
                            }}
                            error={Boolean(serviceFormErrors.price)}
                            helperText={serviceFormErrors.price}
                            required
                        />

                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={serviceForm.status}
                                label="Status"
                                onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            label="Description"
                            value={serviceForm.description}
                            onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                            error={Boolean(serviceFormErrors.description)}
                            helperText={serviceFormErrors.description}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setServiceDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            Save Service
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Room Type Create/Edit Dialog */}
            <Dialog
                open={typeDialogOpen}
                onClose={() => setTypeDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {typeDialogMode === 'create' ? 'Add Room Type' : 'Edit Room Type'}
                    </Typography>
                    <IconButton size="small" onClick={() => setTypeDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSaveRoomType}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Room Type Name"
                            placeholder="e.g. Presidential Penthouse Suite"
                            value={typeForm.type_name}
                            onChange={(e) => setTypeForm({ ...typeForm, type_name: e.target.value })}
                            error={Boolean(typeFormErrors.type_name)}
                            helperText={typeFormErrors.type_name}
                            required
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Maximum Guest Capacity"
                            type="number"
                            inputProps={{ min: 1, max: 20 }}
                            value={typeForm.maximum_capacity}
                            onChange={(e) => setTypeForm({ ...typeForm, maximum_capacity: e.target.value })}
                            error={Boolean(typeFormErrors.maximum_capacity)}
                            helperText={typeFormErrors.maximum_capacity || 'Limits capacity for all rooms of this type (1-20 guests)'}
                            required
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            label="Description"
                            placeholder="Describe bed configuration, layout, and luxury tier..."
                            value={typeForm.description}
                            onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                            error={Boolean(typeFormErrors.description)}
                            helperText={typeFormErrors.description}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setTypeDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            Save Room Type
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Amenity Create/Edit Dialog */}
            <Dialog
                open={amenityDialogOpen}
                onClose={() => setAmenityDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {amenityDialogMode === 'create' ? 'Add New Amenity' : 'Edit Amenity'}
                    </Typography>
                    <IconButton size="small" onClick={() => setAmenityDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <form onSubmit={handleSaveAmenity}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Amenity Name"
                            placeholder="e.g. Private Heated Pool"
                            value={amenityForm.amenity_name}
                            onChange={(e) => setAmenityForm({ ...amenityForm, amenity_name: e.target.value })}
                            error={Boolean(amenityFormErrors.amenity_name)}
                            helperText={amenityFormErrors.amenity_name}
                            required
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            label="Description"
                            placeholder="Short description of this feature or perk..."
                            value={amenityForm.description}
                            onChange={(e) => setAmenityForm({ ...amenityForm, description: e.target.value })}
                            error={Boolean(amenityFormErrors.description)}
                            helperText={amenityFormErrors.description}
                            required
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setAmenityDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            Save Amenity
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Shared Delete Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDeleteOpen}
                title={`Delete ${deleteTarget?.type === 'service' ? 'Service' : deleteTarget?.type === 'roomType' ? 'Room Type' : 'Amenity'}`}
                message={`Are you sure you want to permanently delete "${deleteTarget?.item?.service_name || deleteTarget?.item?.type_name || deleteTarget?.item?.amenity_name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmColor="error"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmDeleteOpen(false)}
            />

            {/* Toast Notification */}
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

export default ServicesAmenitiesPage;
