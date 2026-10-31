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
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';

const HousekeepingBoard = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const isHousekeeper = user?.role === 'housekeeping';

    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [kpis, setKpis] = useState({
        total_tasks: 0,
        dirty_count: 0,
        cleaning_count: 0,
        clean_count: 0,
        avg_cleaning_time_minutes: 0,
    });

    const [hotels, setHotels] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [roomsList, setRoomsList] = useState([]);

    // Filters
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedAssignee, setSelectedAssignee] = useState(isHousekeeper ? 'me' : 'all');
    const [searchTerm, setSearchTerm] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Assign Task Dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [assignRoomId, setAssignRoomId] = useState('');
    const [assignStaffId, setAssignStaffId] = useState(user?.user_id || '');
    const [taskDesc, setTaskDesc] = useState('');
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);

    // Quick Report Maintenance Dialog
    const [maintDialogOpen, setMaintDialogOpen] = useState(false);
    const [maintRoomId, setMaintRoomId] = useState('');
    const [maintDesc, setMaintDesc] = useState('');
    const [maintPriority, setMaintPriority] = useState('medium');
    const [isSubmittingMaint, setIsSubmittingMaint] = useState(false);

    // Load filter dropdowns
    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [hRes, sRes, rRes] = await Promise.all([
                    axiosClient.get('/hotels'),
                    axiosClient.get('/housekeeping/staff'),
                    axiosClient.get('/rooms'),
                ]);
                if (hRes.data.success) {
                    setHotels(hRes.data.data.data || hRes.data.data || []);
                }
                if (sRes.data.success) {
                    setStaffList(sRes.data.data || []);
                }
                if (rRes.data.success) {
                    setRoomsList(rRes.data.data.data || rRes.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load housekeeping dependencies', err);
            }
        };
        fetchDependencies();
    }, []);

    // Load tasks
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = {};
            if (selectedHotel !== 'all') params.hotel_id = selectedHotel;
            if (selectedStatus !== 'all') params.task_status = selectedStatus;
            if (selectedAssignee !== 'all') params.assigned_to = selectedAssignee;
            if (searchTerm.trim()) params.search = searchTerm.trim();

            const res = await axiosClient.get('/housekeeping/tasks', { params });
            if (res.data.success) {
                setTasks(res.data.data.data || []);
                if (res.data.meta?.kpis) {
                    setKpis(res.data.meta.kpis);
                }
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to load housekeeping tasks.');
        } finally {
            setLoading(false);
        }
    }, [selectedHotel, selectedStatus, selectedAssignee, searchTerm]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Fast status transition: dirty -> cleaning -> clean
    const handleTransitionStatus = async (task, newStatus) => {
        setErrorMsg('');
        try {
            const res = await axiosClient.patch(`/housekeeping/tasks/${task.task_id}/status`, {
                task_status: newStatus,
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message || `Room marked as ${newStatus}!`);
                fetchTasks();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update task status.');
        }
    };

    const handleCreateTask = async () => {
        if (!assignRoomId || !assignStaffId || !taskDesc.trim()) return;
        setIsSubmittingTask(true);
        setErrorMsg('');
        try {
            const res = await axiosClient.post('/housekeeping/tasks', {
                room_id: assignRoomId,
                assigned_to: assignStaffId,
                task_description: taskDesc.trim(),
            });
            if (res.data.success) {
                setSuccessMsg('Housekeeping task created and assigned successfully.');
                setCreateDialogOpen(false);
                setAssignRoomId('');
                setTaskDesc('');
                fetchTasks();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to create housekeeping task.');
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const handleReportMaintenance = async () => {
        if (!maintRoomId || !maintDesc.trim()) return;
        setIsSubmittingMaint(true);
        setErrorMsg('');
        try {
            const res = await axiosClient.post('/maintenance', {
                room_id: maintRoomId,
                issue_description: maintDesc.trim(),
                priority: maintPriority,
            });
            if (res.data.success) {
                setSuccessMsg('Maintenance issue reported. Room set to under maintenance.');
                setMaintDialogOpen(false);
                setMaintRoomId('');
                setMaintDesc('');
                fetchTasks();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to report maintenance issue.');
        } finally {
            setIsSubmittingMaint(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this cleaning task?')) return;
        try {
            const res = await axiosClient.delete(`/housekeeping/tasks/${taskId}`);
            if (res.data.success) {
                setSuccessMsg('Task deleted successfully.');
                fetchTasks();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to delete task.');
        }
    };

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* ROW 1: Header Bar */}
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
                        Housekeeping & Turnover Board
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage post-checkout room turnover, cleaning tasks, inspection sign-offs, and maintenance alerts
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<BuildOutlinedIcon />}
                        onClick={() => setMaintDialogOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Report Maintenance
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddOutlinedIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Assign Cleaning Task
                    </Button>
                    <Tooltip title="Refresh Tasks">
                        <IconButton
                            onClick={fetchTasks}
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
                        title="Dirty (Turnover Needed)"
                        value={kpis.dirty_count}
                        icon={<CleaningServicesOutlinedIcon fontSize="large" />}
                        color="error"
                        subtitle="Awaiting staff assignment/cleaning"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Cleaning in Progress"
                        value={kpis.cleaning_count}
                        icon={<AccessTimeOutlinedIcon fontSize="large" />}
                        color="warning"
                        subtitle="Housekeeper currently working"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Cleaned & Ready"
                        value={kpis.clean_count}
                        icon={<CheckCircleOutlinedIcon fontSize="large" />}
                        color="success"
                        subtitle="Inspected and available for guests"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Avg Turnover Duration"
                        value={`${kpis.avg_cleaning_time_minutes} min`}
                        icon={<AccessTimeOutlinedIcon fontSize="large" />}
                        color="info"
                        subtitle="Average completed cleaning time"
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
                    <InputLabel>Task Status</InputLabel>
                    <Select
                        value={selectedStatus}
                        label="Task Status"
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="dirty">Dirty (Pending)</MenuItem>
                        <MenuItem value="cleaning">Cleaning</MenuItem>
                        <MenuItem value="clean">Clean</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Assigned Staff</InputLabel>
                    <Select
                        value={selectedAssignee}
                        label="Assigned Staff"
                        onChange={(e) => setSelectedAssignee(e.target.value)}
                    >
                        <MenuItem value="all">All Staff</MenuItem>
                        <MenuItem value="me">Assigned to Me</MenuItem>
                        {staffList.map((s) => (
                            <MenuItem key={s.user_id} value={s.user_id}>{s.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    size="small"
                    placeholder="Search room # or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 220 }}
                />

                <Button
                    variant="text"
                    onClick={() => {
                        setSelectedHotel('all');
                        setSelectedStatus('all');
                        setSelectedAssignee('all');
                        setSearchTerm('');
                    }}
                    sx={{ textTransform: 'none', ml: 'auto' }}
                >
                    Reset Filters
                </Button>
            </Paper>

            {/* ROW 4: Tasks Data Table */}
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
                                <TableCell sx={{ fontWeight: 700 }}>Assigned To</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Task Details</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Assigned At</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={30} />
                                    </TableCell>
                                </TableRow>
                            ) : tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                        No cleaning tasks found matching current filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task) => (
                                    <TableRow key={task.task_id} hover>
                                        <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800 }}>
                                            Room {task.room?.room_number}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{task.room?.hotel?.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {task.room?.room_type?.type_name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {task.assignee?.name || 'Unassigned'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {task.assignee?.phone}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ maxWidth: 280 }}>
                                            <Typography variant="body2" noWrap>
                                                {task.task_description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block">
                                                {task.assigned_at ? new Date(task.assigned_at).toLocaleString() : '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <StatusChip status={task.task_status} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                                {task.task_status === 'dirty' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="warning"
                                                        startIcon={<PlayArrowOutlinedIcon />}
                                                        onClick={() => handleTransitionStatus(task, 'cleaning')}
                                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                                    >
                                                        Start Cleaning
                                                    </Button>
                                                )}

                                                {task.task_status === 'cleaning' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={<CheckCircleOutlinedIcon />}
                                                        onClick={() => handleTransitionStatus(task, 'clean')}
                                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                                    >
                                                        Mark Clean
                                                    </Button>
                                                )}

                                                {task.task_status === 'clean' && (
                                                    <Chip
                                                        icon={<CheckCircleOutlinedIcon />}
                                                        label="Turnover Completed"
                                                        size="small"
                                                        color="success"
                                                        variant="outlined"
                                                    />
                                                )}

                                                {(!isHousekeeper || user?.user_id === task.assigned_to) && (
                                                    <Tooltip title="Delete Task">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteTask(task.task_id)}
                                                        >
                                                            <DeleteOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* CREATE / ASSIGN CLEANING TASK DIALOG */}
            <Dialog
                open={createDialogOpen}
                onClose={() => !isSubmittingTask && setCreateDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Assign New Cleaning / Turnover Task
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Select Room</InputLabel>
                            <Select
                                value={assignRoomId}
                                label="Select Room"
                                onChange={(e) => setAssignRoomId(e.target.value)}
                            >
                                {roomsList.map((r) => (
                                    <MenuItem key={r.room_id} value={r.room_id}>
                                        Room {r.room_number} ({r.hotel?.name || 'Hotel'}) — Status: {r.status}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth size="small">
                            <InputLabel>Assign Housekeeping Staff</InputLabel>
                            <Select
                                value={assignStaffId}
                                label="Assign Housekeeping Staff"
                                onChange={(e) => setAssignStaffId(e.target.value)}
                            >
                                {staffList.map((s) => (
                                    <MenuItem key={s.user_id} value={s.user_id}>
                                        {s.name} ({s.role})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            label="Cleaning Task Instructions"
                            placeholder="e.g. Full linen change, bathroom sanitization, restock coffee and toiletries"
                            multiline
                            rows={3}
                            size="small"
                            value={taskDesc}
                            onChange={(e) => setTaskDesc(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={isSubmittingTask} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateTask}
                        disabled={isSubmittingTask || !assignRoomId || !assignStaffId || !taskDesc.trim()}
                        startIcon={isSubmittingTask ? <CircularProgress size={18} /> : <CleaningServicesOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {isSubmittingTask ? 'Assigning...' : 'Assign Task'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* QUICK REPORT MAINTENANCE DIALOG */}
            <Dialog
                open={maintDialogOpen}
                onClose={() => !isSubmittingMaint && setMaintDialogOpen(false)}
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
                                value={maintRoomId}
                                label="Select Room"
                                onChange={(e) => setMaintRoomId(e.target.value)}
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
                                value={maintPriority}
                                label="Priority Level"
                                onChange={(e) => setMaintPriority(e.target.value)}
                            >
                                <MenuItem value="low">Low (Cosmetic/minor)</MenuItem>
                                <MenuItem value="medium">Medium (Requires attention)</MenuItem>
                                <MenuItem value="high">High (Affects guest comfort)</MenuItem>
                                <MenuItem value="urgent">Urgent (Room out of order / immediate safety)</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Issue Description"
                            placeholder="Describe the damaged fixture, leak, electrical problem or AC fault in detail"
                            multiline
                            rows={3}
                            size="small"
                            value={maintDesc}
                            onChange={(e) => setMaintDesc(e.target.value)}
                        />

                        <Alert severity="warning">
                            Reporting this issue will automatically set the room status to <strong>Under Maintenance</strong>, removing it from available inventory.
                        </Alert>
                    </Box>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setMaintDialogOpen(false)} disabled={isSubmittingMaint} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleReportMaintenance}
                        disabled={isSubmittingMaint || !maintRoomId || !maintDesc.trim()}
                        startIcon={isSubmittingMaint ? <CircularProgress size={18} /> : <BuildOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {isSubmittingMaint ? 'Reporting...' : 'Submit Report'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HousekeepingBoard;
