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
    InputAdornment,
    useTheme,
} from '@mui/material';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import DataTableWrapper from '../../components/common/DataTableWrapper';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const UsersPage = () => {
    const theme = useTheme();
    const { user: currentAuthUser } = useAuth();

    // Data lists
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialogs
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'

    // Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'guest',
        status: 'active',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Confirm Delete
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Toast
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

    // Fetch users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (roleFilter !== 'all') params.role = roleFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await axiosClient.get('/users', { params });
            if (res.data?.success) {
                setUsers(Array.isArray(res.data.data) ? res.data.data : []);
            }
        } catch (err) {
            console.error('Failed to load users', err);
            setToast({
                open: true,
                message: err.response?.data?.message || 'Failed to load users.',
                severity: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, statusFilter, searchQuery]);

    // KPI Metrics calculation
    const kpis = useMemo(() => {
        const total = users.length;
        const guests = users.filter((u) => u.role === 'guest').length;
        const staff = users.filter((u) => ['admin', 'receptionist', 'housekeeping'].includes(u.role)).length;
        const active = users.filter((u) => u.status === 'active').length;
        return { total, guests, staff, active };
    }, [users]);

    // Open create dialog
    const handleOpenCreate = () => {
        setDialogMode('create');
        setSelectedUser(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: 'guest',
            status: 'active',
            password: '',
        });
        setShowPassword(false);
        setFormErrors({});
        setEditDialogOpen(true);
    };

    // Open edit dialog
    const handleOpenEdit = (user) => {
        setDialogMode('edit');
        setSelectedUser(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'guest',
            status: user.status || 'active',
            password: '',
        });
        setShowPassword(false);
        setFormErrors({});
        setEditDialogOpen(true);
    };

    // Open view dialog
    const handleOpenView = (user) => {
        setSelectedUser(user);
        setViewDialogOpen(true);
    };

    // Handle form change
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
        if (!formData.name.trim()) errors.name = 'Full name is required.';
        if (!formData.email.trim()) {
            errors.email = 'Email address is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required.';
        } else if (!PHONE_REGEX.test(formData.phone.trim())) {
            errors.phone = 'Phone must be 10-15 digits (e.g. +250788111222).';
        }

        if (dialogMode === 'create') {
            if (!formData.password) {
                errors.password = 'Password is required.';
            } else if (!PASSWORD_REGEX.test(formData.password)) {
                errors.password = 'Must be min 8 chars, with at least 1 uppercase, 1 digit, and 1 symbol (@$!%*#?&).';
            }
        } else if (formData.password && !PASSWORD_REGEX.test(formData.password)) {
            errors.password = 'Must be min 8 chars, with at least 1 uppercase, 1 digit, and 1 symbol (@$!%*#?&).';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Save user
    const handleSaveUser = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setFormSubmitting(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
                status: formData.status,
            };
            if (formData.password) {
                payload.password = formData.password;
            }

            if (dialogMode === 'create') {
                await axiosClient.post('/users', payload);
                setToast({ open: true, message: 'User account created successfully.', severity: 'success' });
            } else {
                await axiosClient.put(`/users/${selectedUser.user_id}`, payload);
                setToast({ open: true, message: 'User account updated successfully.', severity: 'success' });
            }
            setEditDialogOpen(false);
            fetchUsers();
        } catch (err) {
            console.error('Save user error', err);
            const msg = err.response?.data?.message || 'Failed to save user account.';
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors);
            }
            setToast({ open: true, message: msg, severity: 'error' });
        } finally {
            setFormSubmitting(false);
        }
    };

    // Delete user
    const handleDeleteClick = (user) => {
        if (Number(currentAuthUser?.user_id) === Number(user.user_id)) {
            setToast({ open: true, message: 'You cannot delete your own admin account.', severity: 'error' });
            return;
        }
        setUserToDelete(user);
        setConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await axiosClient.delete(`/users/${userToDelete.user_id}`);
            setToast({ open: true, message: `User "${userToDelete.name}" deleted successfully.`, severity: 'success' });
            fetchUsers();
        } catch (err) {
            setToast({
                open: true,
                message: err.response?.data?.message || 'Cannot delete user.',
                severity: 'error',
            });
        } finally {
            setConfirmDeleteOpen(false);
            setUserToDelete(null);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const isEditingSelf = selectedUser && Number(currentAuthUser?.user_id) === Number(selectedUser?.user_id);

    // Columns
    const columns = [
        {
            field: 'name',
            headerName: 'User Profile',
            flex: 1.4,
            minWidth: 200,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            bgcolor:
                                params.row.role === 'admin'
                                    ? 'secondary.main'
                                    : params.row.role === 'receptionist'
                                    ? 'info.main'
                                    : params.row.role === 'housekeeping'
                                    ? 'success.main'
                                    : 'primary.main',
                        }}
                    >
                        {getInitials(params.row.name)}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {params.row.name}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                            ID #{params.row.user_id}
                        </Typography>
                    </Box>
                </Box>
            ),
        },
        {
            field: 'email',
            headerName: 'Email Address',
            flex: 1.3,
            minWidth: 190,
            renderCell: (params) => (
                <Typography variant="body2" color="text.secondary">
                    {params.row.email}
                </Typography>
            ),
        },
        {
            field: 'phone',
            headerName: 'Phone Number',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {params.row.phone}
                </Typography>
            ),
        },
        {
            field: 'role',
            headerName: 'Role',
            width: 140,
            renderCell: (params) => <StatusChip status={params.row.role} />,
        },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => <StatusChip status={params.row.status} />,
        },
        {
            field: 'loyalty_points',
            headerName: 'Loyalty Points',
            width: 130,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                if (params.row.role !== 'guest') return <Typography variant="caption" color="text.secondary">—</Typography>;
                const points = params.row.loyalty_account?.available_points ?? 0;
                return (
                    <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'secondary.main' }}>
                        {points.toLocaleString()} pts
                    </Typography>
                );
            },
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 140,
            sortable: false,
            renderCell: (params) => {
                const isSelf = Number(currentAuthUser?.user_id) === Number(params.row.user_id);
                return (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Profile">
                            <IconButton size="small" color="info" onClick={() => handleOpenView(params.row)}>
                                <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                            <IconButton size="small" color="warning" onClick={() => handleOpenEdit(params.row)}>
                                <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={isSelf ? 'Cannot delete your own account' : 'Delete User'}>
                            <span>
                                <IconButton
                                    size="small"
                                    color="error"
                                    disabled={isSelf}
                                    onClick={() => handleDeleteClick(params.row)}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Box>
                );
            },
        },
    ];

    return (
        <Box>
            <DataTableWrapper
                title="Users & Roles"
                subtitle="Staff credentials, role assignments, guest accounts, and access status"
                addNewLabel="Add User"
                onAddNew={handleOpenCreate}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onResetFilters={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                }}
                filterSlot={
                    <>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Role</InputLabel>
                            <Select
                                value={roleFilter}
                                label="Role"
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <MenuItem value="all">All Roles</MenuItem>
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="receptionist">Receptionist</MenuItem>
                                <MenuItem value="housekeeping">Housekeeping</MenuItem>
                                <MenuItem value="guest">Guest</MenuItem>
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
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                                <MenuItem value="suspended">Suspended</MenuItem>
                            </Select>
                        </FormControl>
                    </>
                }
                kpiContent={
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Total Users"
                                value={kpis.total}
                                icon={<GroupOutlinedIcon />}
                                color="primary"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Guest Accounts"
                                value={kpis.guests}
                                icon={<PersonOutlinedIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Staff & Personnel"
                                value={kpis.staff}
                                icon={<BadgeOutlinedIcon />}
                                color="info"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} lg={3}>
                            <KpiCard
                                title="Active Accounts"
                                value={kpis.active}
                                icon={<CheckCircleOutlinedIcon />}
                                color="warning"
                            />
                        </Grid>
                    </Grid>
                }
                rows={users}
                columns={columns}
                loading={loading}
                getRowId={(row) => row.user_id}
            />

            {/* Create / Edit Dialog */}
            <Dialog
                open={editDialogOpen}
                onClose={() => !formSubmitting && setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700 }}>
                        {dialogMode === 'create' ? 'Create New User' : `Edit ${selectedUser?.name}`}
                    </Typography>
                    <IconButton size="small" onClick={() => setEditDialogOpen(false)} disabled={formSubmitting}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <form onSubmit={handleSaveUser}>
                    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {isEditingSelf && (
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                You are editing your currently logged-in account. You cannot change your own role or status away from active admin.
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            size="small"
                            label="Full Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            error={Boolean(formErrors.name)}
                            helperText={formErrors.name}
                            required
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={Boolean(formErrors.email)}
                            helperText={formErrors.email}
                            required
                        />

                        <TextField
                            fullWidth
                            size="small"
                            label="Phone Number"
                            name="phone"
                            placeholder="+250788111222"
                            value={formData.phone}
                            onChange={handleInputChange}
                            error={Boolean(formErrors.phone)}
                            helperText={formErrors.phone}
                            required
                        />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small" disabled={isEditingSelf}>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="role"
                                        label="Role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="guest">Guest</MenuItem>
                                        <MenuItem value="receptionist">Receptionist</MenuItem>
                                        <MenuItem value="housekeeping">Housekeeping</MenuItem>
                                        <MenuItem value="admin">Admin</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth size="small" disabled={isEditingSelf}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        label="Status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <MenuItem value="active">Active</MenuItem>
                                        <MenuItem value="inactive">Inactive</MenuItem>
                                        <MenuItem value="suspended">Suspended</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <TextField
                            fullWidth
                            size="small"
                            label={dialogMode === 'create' ? 'Password' : 'New Password (Leave blank to keep)'}
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleInputChange}
                            error={Boolean(formErrors.password)}
                            helperText={
                                formErrors.password ||
                                'Min 8 chars, 1 uppercase (A-Z), 1 number (0-9), 1 special character (@$!%*#?&)'
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            required={dialogMode === 'create'}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button variant="outlined" color="inherit" onClick={() => setEditDialogOpen(false)} disabled={formSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={formSubmitting}>
                            {formSubmitting ? 'Saving...' : dialogMode === 'create' ? 'Create User' : 'Update User'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog
                open={viewDialogOpen}
                onClose={() => setViewDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                            sx={{
                                width: 44,
                                height: 44,
                                fontWeight: 700,
                                bgcolor: selectedUser?.role === 'admin' ? 'secondary.main' : 'primary.main',
                            }}
                        >
                            {getInitials(selectedUser?.name)}
                        </Avatar>
                        <Box>
                            <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                {selectedUser?.name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                                User ID #{selectedUser?.user_id}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Role</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {selectedUser && <StatusChip status={selectedUser.role} />}
                            </Box>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Account Status</Typography>
                            <Box sx={{ mt: 0.5 }}>
                                {selectedUser && <StatusChip status={selectedUser.status} />}
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: 'action.hover' }}>
                                <Typography variant="caption" color="text.secondary">Contact Info</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                                    {selectedUser?.email}
                                </Typography>
                                <Typography variant="body2" sx={{ fontFamily: 'JetBrains Mono, monospace', color: 'text.secondary' }}>
                                    {selectedUser?.phone}
                                </Typography>
                            </Box>
                        </Grid>

                        {selectedUser?.role === 'guest' && (
                            <Grid item xs={12}>
                                <Box sx={{ p: 2, borderRadius: '8px', border: `1px solid ${theme.palette.secondary.light}`, bgcolor: 'background.paper' }}>
                                    <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 700 }}>
                                        RP Loyalty Program Rewards
                                    </Typography>
                                    <Typography variant="h2" sx={{ fontWeight: 700, color: 'secondary.main', my: 0.5 }}>
                                        {(selectedUser?.loyalty_account?.available_points ?? 0).toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 500 }}>Points</span>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Equivalent to RWF {((selectedUser?.loyalty_account?.available_points ?? 0) * 50).toLocaleString()} discount on upcoming stays
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
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
                            handleOpenEdit(selectedUser);
                        }}
                    >
                        Edit User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={confirmDeleteOpen}
                title="Delete User Account"
                message={`Are you sure you want to permanently delete user account "${userToDelete?.name}" (${userToDelete?.email})? Active reservations will block this action.`}
                confirmText="Delete Account"
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

export default UsersPage;
