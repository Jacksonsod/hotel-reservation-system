import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    useTheme,
} from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';

const MaintenanceRequestsPage = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [kpis, setKpis] = useState({
        total_logs: 0,
        pending_count: 0,
        in_progress_count: 0,
        resolved_count: 0,
        urgent_count: 0,
    });

    const [hotels, setHotels] = useState([]);
    const [roomsList, setRoomsList] = useState([]);

    // Filters
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [selectedPriority, setSelectedPriority] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Report Issue Dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [issueDesc, setIssueDesc] = useState('');
    const [priority, setPriority] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial dependencies
    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [hRes, rRes] = await Promise.all([
                    axios.get('/api/v1/hotels'),
                    axios.get('/api/v1/rooms'),
                ]);
                if (hRes.data.success) {
                    setHotels(hRes.data.data.data || hRes.data.data || []);
                }
                if (rRes.data.success) {
                    setRoomsList(rRes.data.data.data || rRes.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load maintenance dependencies', err);
            }
        };
        fetchDependencies();
    }, []);

    // Load logs
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = {};
            if (selectedHotel !== 'all') params.hotel_id = selectedHotel;
            if (selectedPriority !== 'all') params.priority = selectedPriority;
            if (selectedStatus !== 'all') params.maintenance_status = selectedStatus;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const res = await axios.get('/api/v1/maintenance', { params });
            if (res.data.success) {
                setLogs(res.data.data.data || []);
                if (res.data.meta?.kpis) {
                    setKpis(res.data.meta.kpis);
                }
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to load maintenance logs.');
        } finally {
            setLoading(false);
        }
    }, [selectedHotel, selectedPriority, selectedStatus, searchTerm]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleUpdateStatus = async (log, newStatus) => {
        setErrorMsg('');
        try {
            const res = await axios.patch(`/api/v1/maintenance/${log.maintenance_id}`, {
                maintenance_status: newStatus,
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message || `Maintenance status updated to ${newStatus}.`);
                fetchLogs();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update maintenance status.');
        }
    };

    const handleReportIssue = async () => {
        if (!roomId || !issueDesc.trim()) return;
        setIsSubmitting(true);
        setErrorMsg('');
        try {
            const res = await axios.post('/api/v1/maintenance', {
                room_id: roomId,
                issue_description: issueDesc.trim(),
                priority,
            });
            if (res.data.success) {
                setSuccessMsg('Maintenance issue reported successfully. Room is marked Under Maintenance.');
                setCreateDialogOpen(false);
                setRoomId('');
                setIssueDesc('');
                fetchLogs();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to submit maintenance report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLog = async (logId) => {
        if (!window.confirm('Are you sure you want to delete this maintenance record?')) return;
        try {
            const res = await axios.delete(`/api/v1/maintenance/${logId}`);
            if (res.data.success) {
                setSuccessMsg('Record deleted successfully.');
                fetchLogs();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to delete maintenance log.');
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'urgent':
                return { bg: '#450A0A', text: '#FCA5A5' };
            case 'high':
                return { bg: '#78350F', text: '#FCD34D' };
            case 'medium':
                return { bg: '#1E3A8A', text: '#93C5FD' };
            default:
                return { bg: '#064E3B', text: '#6EE7B7' };
        }
    };

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* ROW 1: Header */}
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
                        Maintenance Requests & Engineering
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Track, triage, and resolve equipment faults, HVAC, and plumbing repairs across all branches
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<AddOutlinedIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Report Maintenance Issue
                    </Button>
                    <Tooltip title="Refresh Requests">
                        <IconButton
                            onClick={fetchLogs}
                            sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}
                        >
                            <RefreshOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {errorMsg && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {successMsg && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
                    {successMsg}
                </Alert>
            )}

            {/* ROW 2: KPI Strip */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Pending Review"
                        value={kpis.pending_count}
                        icon={<WarningAmberOutlinedIcon fontSize="large" />}
                        color="warning"
                        subtitle="Awaiting technician assignment"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="In Progress Repairs"
                        value={kpis.in_progress_count}
                        icon={<BuildOutlinedIcon fontSize="large" />}
                        color="secondary"
                        subtitle="Repairs currently underway"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Urgent Repairs"
                        value={kpis.urgent_count}
                        icon={<WarningAmberOutlinedIcon fontSize="large" />}
                        color="error"
                        subtitle="High impact / room out of order"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Resolved Issues"
                        value={kpis.resolved_count}
                        icon={<CheckCircleOutlinedIcon fontSize="large" />}
                        color="success"
                        subtitle="Turned over for cleaning"
                    />
                </Grid>
            </Grid>

            {/* ROW 3: Filter Toolbar */}
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
                    <InputLabel>Priority</InputLabel>
                    <Select
                        value={selectedPriority}
                        label="Priority"
                        onChange={(e) => setSelectedPriority(e.target.value)}
                    >
                        <MenuItem value="all">All Priorities</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={selectedStatus}
                        label="Status"
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    placeholder="Search room # or issue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 220 }}
                />

                <Button
                    variant="text"
                    onClick={() => {
                        setSelectedHotel('all');
                        setSelectedPriority('all');
                        setSelectedStatus('all');
                        setSearchTerm('');
                    }}
                    sx={{ textTransform: 'none', ml: 'auto' }}
                >
                    Reset Filters
                </Button>
            </Paper>

            {/* ROW 4: Table */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#0F172A' : '#F1F5F9' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Hotel</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Issue Description</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Reported By</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Reported At</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No maintenance requests match current filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => {
                                    const prioCol = getPriorityColor(log.priority);
                                    return (
                                        <TableRow key={log.maintenance_id} hover>
                                            <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
                                                Room {log.room?.room_number}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{log.room?.hotel?.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {log.room?.room_type?.type_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={log.priority.toUpperCase()}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: theme.palette.mode === 'dark' ? prioCol.bg : undefined,
                                                        color: theme.palette.mode === 'dark' ? prioCol.text : undefined,
                                                        fontWeight: 700,
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300 }}>
                                                <Typography variant="body2">
                                                    {log.issue_description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{log.reporter?.name || 'Staff'}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {log.reporter?.role}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" display="block">
                                                    {log.reported_at ? new Date(log.reported_at).toLocaleString() : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={log.maintenance_status} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                    {log.maintenance_status === 'pending' && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={<PlayArrowOutlinedIcon />}
                                                            onClick={() => handleUpdateStatus(log, 'in_progress')}
                                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                                        >
                                                            Start Repair
                                                        </Button>
                                                    )}

                                                    {log.maintenance_status === 'in_progress' && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            startIcon={<CheckCircleOutlinedIcon />}
                                                            onClick={() => handleUpdateStatus(log, 'resolved')}
                                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                                        >
                                                            Mark Resolved
                                                        </Button>
                                                    )}

                                                    {log.maintenance_status === 'resolved' && (
                                                        <Chip
                                                            icon={<CheckCircleOutlinedIcon />}
                                                            label="Resolved"
                                                            size="small"
                                                            color="success"
                                                            variant="outlined"
                                                        />
                                                    )}

                                                    {(isAdmin || user?.user_id === log.reported_by) && (
                                                        <Tooltip title="Delete Record">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleDeleteLog(log.maintenance_id)}
                                                            >
                                                                <DeleteOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* REPORT ISSUE DIALOG */}
            <Dialog
                open={createDialogOpen}
                onClose={() => !isSubmitting && setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
                    Report Room Maintenance Issue
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Room</InputLabel>
                            <Select
                                value={roomId}
                                label="Select Room"
                                onChange={(e) => setRoomId(e.target.value)}
                            >
                                {roomsList.map((r) => (
                                    <MenuItem key={r.room_id} value={r.room_id}>
                                        Room {r.room_number} ({r.hotel?.name || 'Hotel'})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Priority Level</InputLabel>
                            <Select
                                value={priority}
                                label="Priority Level"
                                onChange={(e) => setPriority(e.target.value)}
                            >
                                <MenuItem value="low">Low (Cosmetic/minor)</MenuItem>
                                <MenuItem value="medium">Medium (Requires attention)</MenuItem>
                                <MenuItem value="high">High (Affects guest comfort)</MenuItem>
                                <MenuItem value="urgent">Urgent (Room out of order / immediate safety)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Issue Description"
                            placeholder="Describe what is broken, leaking, or faulty in detail"
                            multiline
                            rows={3}
                            size="small"
                            value={issueDesc}
                            onChange={(e) => setIssueDesc(e.target.value)}
                        />

                        <Alert severity="warning">
                            Submitting this report will change the room status to <strong>Under Maintenance</strong>, immediately blocking new reservations. When resolved, the room will be scheduled for turnover cleaning.
                        </Alert>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleReportIssue}
                        disabled={isSubmitting || !roomId || !issueDesc.trim()}
                        startIcon={isSubmitting ? <CircularProgress size={18} /> : <BuildOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {isSubmitting ? 'Reporting...' : 'Submit Report'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MaintenanceRequestsPage;
