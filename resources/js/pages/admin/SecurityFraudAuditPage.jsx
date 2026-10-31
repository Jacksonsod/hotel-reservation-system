import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Tabs,
    Tab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    FormControlLabel,
    Checkbox,
    useTheme,
} from '@mui/material';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import axios from 'axios';
import KpiCard from '../../components/common/KpiCard';
import StatusChip from '../../components/common/StatusChip';

const SecurityFraudAuditPage = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fraud Flags State
    const [fraudFlags, setFraudFlags] = useState([]);
    const [fraudKpis, setFraudKpis] = useState({
        total_flags: 0,
        pending_count: 0,
        high_risk_count: 0,
        resolved_count: 0,
    });
    const [riskFilter, setRiskFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [fraudSearch, setFraudSearch] = useState('');

    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState([]);
    const [auditKpis, setAuditKpis] = useState({
        total_logs: 0,
        today_logs: 0,
        unique_ips: 0,
        security_events: 0,
    });
    const [auditTableFilter, setAuditTableFilter] = useState('all');
    const [auditSearch, setAuditSearch] = useState('');

    // Review Flag Modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedFlag, setSelectedFlag] = useState(null);
    const [newReviewStatus, setNewReviewStatus] = useState('resolved');
    const [suspendUser, setSuspendUser] = useState(false);
    const [isUpdatingFlag, setIsUpdatingFlag] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Fetch Fraud Flags
    const fetchFraudFlags = useCallback(async () => {
        try {
            const params = {};
            if (riskFilter !== 'all') params.risk_level = riskFilter;
            if (statusFilter !== 'all') params.review_status = statusFilter;
            if (fraudSearch.trim()) params.search = fraudSearch.trim();

            const res = await axios.get('/api/v1/security/fraud-flags', { params });
            if (res.data.success) {
                setFraudFlags(res.data.data || []);
                if (res.data.meta?.kpis) {
                    setFraudKpis(res.data.meta.kpis);
                }
            }
        } catch (err) {
            console.error('Failed to load fraud flags', err);
        }
    }, [riskFilter, statusFilter, fraudSearch]);

    // Fetch Audit Logs
    const fetchAuditLogs = useCallback(async () => {
        try {
            const params = {};
            if (auditTableFilter !== 'all') params.target_table = auditTableFilter;
            if (auditSearch.trim()) params.search = auditSearch.trim();

            const res = await axios.get('/api/v1/security/audit-logs', { params });
            if (res.data.success) {
                setAuditLogs(res.data.data || []);
                if (res.data.meta?.kpis) {
                    setAuditKpis(res.data.meta.kpis);
                }
            }
        } catch (err) {
            console.error('Failed to load audit logs', err);
        }
    }, [auditTableFilter, auditSearch]);

    const loadAll = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            await Promise.all([fetchFraudFlags(), fetchAuditLogs()]);
        } catch (err) {
            setErrorMsg('Failed to load security and audit log data.');
        } finally {
            setLoading(false);
        }
    }, [fetchFraudFlags, fetchAuditLogs]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleOpenReview = (flag) => {
        setSelectedFlag(flag);
        setNewReviewStatus(flag.review_status === 'pending' ? 'resolved' : flag.review_status);
        setSuspendUser(false);
        setReviewModalOpen(true);
    };

    const handleSaveReview = async () => {
        if (!selectedFlag) return;
        setIsUpdatingFlag(true);
        setErrorMsg('');
        try {
            const res = await axios.patch(`/api/v1/security/fraud-flags/${selectedFlag.flag_id}`, {
                review_status: newReviewStatus,
                suspend_user: suspendUser,
            });
            if (res.data.success) {
                setSuccessMsg(res.data.message || 'Fraud flag updated successfully.');
                setReviewModalOpen(false);
                fetchFraudFlags();
                fetchAuditLogs();
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to update fraud flag.');
        } finally {
            setIsUpdatingFlag(false);
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
                        Security, Fraud Alerts & Audit Logs Center
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Automated velocity anomaly detection, suspicious activity triage, user suspension, and comprehensive system audit trail
                    </Typography>
                </Box>

                <Tooltip title="Refresh Security Feeds">
                    <IconButton
                        onClick={loadAll}
                        sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}
                    >
                        <RefreshOutlinedIcon />
                    </IconButton>
                </Tooltip>
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
                        title="Total Fraud Alerts"
                        value={fraudKpis.total_flags}
                        icon={<ShieldOutlinedIcon fontSize="large" />}
                        color="error"
                        subtitle="Automated anomaly detections"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="High-Risk Pending Flags"
                        value={fraudKpis.high_risk_count}
                        icon={<WarningAmberOutlinedIcon fontSize="large" />}
                        color="error"
                        subtitle="Requires immediate review"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Total Audit Log Entries"
                        value={auditKpis.total_logs}
                        icon={<HistoryOutlinedIcon fontSize="large" />}
                        color="primary"
                        subtitle={`${auditKpis.today_logs} logged today`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Unique Active IPs"
                        value={auditKpis.unique_ips}
                        icon={<PublicOutlinedIcon fontSize="large" />}
                        color="info"
                        subtitle="Geographical connection points"
                    />
                </Grid>
            </Grid>

            {/* ROW 3 & 4: 2-Tab Workspace */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    sx={{
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        px: 2,
                        backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    }}
                >
                    <Tab
                        icon={<ShieldOutlinedIcon />}
                        iconPosition="start"
                        label={`Fraud Detection Alerts (${fraudKpis.pending_count} Pending)`}
                        sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
                    />
                    <Tab
                        icon={<HistoryOutlinedIcon />}
                        iconPosition="start"
                        label={`System Audit Trail (${auditKpis.total_logs})`}
                        sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }}
                    />
                </Tabs>

                {/* TAB 0: FRAUD FLAGS */}
                {activeTab === 0 && (
                    <Box sx={{ p: 2.5 }}>
                        {/* Toolbar */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Risk Level</InputLabel>
                                <Select
                                    value={riskFilter}
                                    label="Risk Level"
                                    onChange={(e) => setRiskFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Risks</MenuItem>
                                    <MenuItem value="high">High Risk</MenuItem>
                                    <MenuItem value="medium">Medium Risk</MenuItem>
                                    <MenuItem value="low">Low Risk</MenuItem>
                                </Select>
                            </FormControl>

                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Review Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Review Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Statuses</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="reviewed">Reviewed</MenuItem>
                                    <MenuItem value="resolved">Resolved</MenuItem>
                                    <MenuItem value="dismissed">Dismissed</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                placeholder="Search IP or user..."
                                value={fraudSearch}
                                onChange={(e) => setFraudSearch(e.target.value)}
                                sx={{ width: 220 }}
                            />

                            <Button
                                variant="text"
                                onClick={() => {
                                    setRiskFilter('all');
                                    setStatusFilter('all');
                                    setFraudSearch('');
                                }}
                                sx={{ textTransform: 'none', ml: 'auto' }}
                            >
                                Reset Filters
                            </Button>
                        </Box>

                        <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                            <Table>
                                <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Flag ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>User / Account</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Activity Description</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Risk Level</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Review Status</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Logged At</TableCell>
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
                                    ) : fraudFlags.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                No fraud flags found matching current filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        fraudFlags.map((flag) => (
                                            <TableRow key={flag.flag_id} hover>
                                                <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
                                                    #{flag.flag_id}
                                                </TableCell>
                                                <TableCell>
                                                    {flag.user ? (
                                                        <Box>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {flag.user.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {flag.user.email} (Status: {flag.user.status})
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Typography variant="caption" color="text.secondary">
                                                            Guest / Anonymous
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                                                    {flag.ip_address}
                                                </TableCell>
                                                <TableCell sx={{ maxWidth: 300 }}>
                                                    <Typography variant="body2">{flag.activity_description}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusChip status={flag.risk_level} />
                                                </TableCell>
                                                <TableCell>
                                                    <StatusChip status={flag.review_status} />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" display="block">
                                                        {flag.created_at ? new Date(flag.created_at).toLocaleString() : '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color={flag.risk_level === 'high' ? 'error' : 'primary'}
                                                        startIcon={<VisibilityOutlinedIcon />}
                                                        onClick={() => handleOpenReview(flag)}
                                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                                    >
                                                        Review
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}

                {/* TAB 1: AUDIT LOGS */}
                {activeTab === 1 && (
                    <Box sx={{ p: 2.5 }}>
                        {/* Toolbar */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel>Target Table</InputLabel>
                                <Select
                                    value={auditTableFilter}
                                    label="Target Table"
                                    onChange={(e) => setAuditTableFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Tables</MenuItem>
                                    <MenuItem value="users">users</MenuItem>
                                    <MenuItem value="reservations">reservations</MenuItem>
                                    <MenuItem value="payments">payments</MenuItem>
                                    <MenuItem value="check_ins">check_ins</MenuItem>
                                    <MenuItem value="checkouts">checkouts</MenuItem>
                                    <MenuItem value="housekeeping_tasks">housekeeping_tasks</MenuItem>
                                    <MenuItem value="maintenance_logs">maintenance_logs</MenuItem>
                                    <MenuItem value="fraud_flags">fraud_flags</MenuItem>
                                    <MenuItem value="notifications">notifications</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                placeholder="Search action, IP or user..."
                                value={auditSearch}
                                onChange={(e) => setAuditSearch(e.target.value)}
                                sx={{ width: 250 }}
                            />

                            <Button
                                variant="text"
                                onClick={() => {
                                    setAuditTableFilter('all');
                                    setAuditSearch('');
                                }}
                                sx={{ textTransform: 'none', ml: 'auto' }}
                            >
                                Reset Filters
                            </Button>
                        </Box>

                        <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: '8px' }}>
                            <Table>
                                <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Log ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Actor</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Target Table</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Target ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                                <CircularProgress size={30} />
                                            </TableCell>
                                        </TableRow>
                                    ) : auditLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                                No audit log entries recorded matching current filters.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <TableRow key={log.log_id} hover>
                                                <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                                                    #{log.log_id}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {log.user?.name || 'System / Unauthenticated'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {log.user?.role}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.action}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 600,
                                                            fontSize: '0.72rem',
                                                            bgcolor: isDark ? '#1E293B' : '#E2E8F0',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                                                    {log.target_table}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                                    {log.target_id ? `#${log.target_id}` : '—'}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                                                    {log.ip_address}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="caption" display="block">
                                                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </Paper>

            {/* REVIEW FRAUD FLAG MODAL */}
            <Dialog
                open={reviewModalOpen}
                onClose={() => !isUpdatingFlag && setReviewModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    Review Fraud Anomaly & Security Action
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ pt: 2 }}>
                    {selectedFlag && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ p: 2, bgcolor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '8px' }}>
                                <Typography variant="body2">
                                    <strong>Activity:</strong> {selectedFlag.activity_description}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    <strong>Flagged IP:</strong> <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedFlag.ip_address}</span>
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    <strong>Risk Level:</strong> <StatusChip status={selectedFlag.risk_level} size="small" />
                                </Typography>
                                {selectedFlag.user && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        <strong>Associated Account:</strong> {selectedFlag.user.name} ({selectedFlag.user.email})
                                    </Typography>
                                )}
                            </Box>

                            <FormControl fullWidth size="small">
                                <InputLabel>Update Review Status</InputLabel>
                                <Select
                                    value={newReviewStatus}
                                    label="Update Review Status"
                                    onChange={(e) => setNewReviewStatus(e.target.value)}
                                >
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="reviewed">Reviewed (Acknowledged)</MenuItem>
                                    <MenuItem value="resolved">Resolved (Treated)</MenuItem>
                                    <MenuItem value="dismissed">Dismissed (False Positive)</MenuItem>
                                </Select>
                            </FormControl>

                            {selectedFlag.user && selectedFlag.user.role !== 'admin' && (
                                <Box sx={{ p: 1.5, border: `1px solid ${theme.palette.error.main}`, borderRadius: '8px', bgcolor: isDark ? '#450A0A' : '#FEF2F2' }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={suspendUser}
                                                onChange={(e) => setSuspendUser(e.target.checked)}
                                                color="error"
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                                Suspend User Account & Revoke Active Access Tokens
                                            </Typography>
                                        }
                                    />
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Immediately locks the guest account and terminates all active sessions.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setReviewModalOpen(false)} disabled={isUpdatingFlag} sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveReview}
                        disabled={isUpdatingFlag}
                        startIcon={isUpdatingFlag ? <CircularProgress size={18} /> : <CheckCircleOutlinedIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        {isUpdatingFlag ? 'Saving...' : 'Confirm Action'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SecurityFraudAuditPage;
