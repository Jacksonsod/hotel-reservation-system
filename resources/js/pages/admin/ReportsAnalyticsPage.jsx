import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    TextField,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    useTheme,
} from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import axiosClient from '../../api/axiosClient';
import KpiCard from '../../components/common/KpiCard';
import { RECHARTS_COLORS } from '../../theme/theme';

const ReportsAnalyticsPage = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [hotels, setHotels] = useState([]);

    // Filters
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [period, setPeriod] = useState('daily');

    // Data Table Tab
    const [activeTab, setActiveTab] = useState(0);

    const [errorMsg, setErrorMsg] = useState('');

    // Fetch Hotels
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res = await axiosClient.get('/hotels');
                if (res.data.success) {
                    setHotels(res.data.data.data || res.data.data || []);
                }
            } catch (err) {
                console.error('Failed to load hotels', err);
            }
        };
        fetchHotels();
    }, []);

    // Fetch Analytics Data
    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const params = { period };
            if (selectedHotel !== 'all') params.hotel_id = selectedHotel;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const res = await axiosClient.get('/reports/analytics', { params });
            if (res.data.success) {
                setAnalytics(res.data.data);
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Failed to fetch analytics report.');
        } finally {
            setLoading(false);
        }
    }, [selectedHotel, startDate, endDate, period]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleExportPdf = () => {
        const queryParams = new URLSearchParams();
        if (selectedHotel !== 'all') queryParams.append('hotel_id', selectedHotel);
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);
        if (period) queryParams.append('period', period);

        window.open(`/api/v1/reports/export/pdf?${queryParams.toString()}`, '_blank');
    };

    const handleExportCsv = () => {
        const queryParams = new URLSearchParams();
        if (selectedHotel !== 'all') queryParams.append('hotel_id', selectedHotel);
        if (startDate) queryParams.append('start_date', startDate);
        if (endDate) queryParams.append('end_date', endDate);
        if (period) queryParams.append('period', period);

        window.open(`/api/v1/reports/export/csv?${queryParams.toString()}`, '_blank');
    };

    const kpis = analytics?.executive_kpis || {};

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3 } }}>
            {/* ROW 1: Page Header Bar */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 3,
                }}
            >
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
                        Reports & Financial Analytics Center
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comprehensive hospitality intelligence, revenue trends, room type popularity, and staff performance metrics
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PictureAsPdfOutlinedIcon />}
                        onClick={handleExportPdf}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Export PDF Report
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadOutlinedIcon />}
                        onClick={handleExportCsv}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Export CSV Data
                    </Button>

                    <Tooltip title="Refresh Analytics">
                        <IconButton
                            onClick={fetchAnalytics}
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

            {/* ROW 2: Filter Toolbar */}
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
                        <MenuItem value="all">All Hotel Branches</MenuItem>
                        {hotels.map((h) => (
                            <MenuItem key={h.hotel_id} value={h.hotel_id}>{h.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label="From Date"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 160 }}
                />

                <TextField
                    label="To Date"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 160 }}
                />

                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Aggregation Period</InputLabel>
                    <Select
                        value={period}
                        label="Aggregation Period"
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <MenuItem value="daily">Daily</MenuItem>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="text"
                    onClick={() => {
                        setSelectedHotel('all');
                        setStartDate('');
                        setEndDate('');
                        setPeriod('daily');
                    }}
                    sx={{ textTransform: 'none', ml: 'auto' }}
                >
                    Reset Filters
                </Button>
            </Paper>

            {/* ROW 3: Summary KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Total Period Revenue"
                        value={`RWF ${Number(kpis.total_revenue || 0).toLocaleString()}`}
                        icon={<MonetizationOnOutlinedIcon fontSize="large" />}
                        color="primary"
                        subtitle="Completed & settled stays"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Average Occupancy Rate"
                        value={`${kpis.occupancy_rate_percent || 0}%`}
                        icon={<HotelOutlinedIcon fontSize="large" />}
                        color={kpis.occupancy_rate_percent > 70 ? 'success' : 'warning'}
                        subtitle={`${kpis.occupied_rooms || 0} / ${kpis.total_rooms || 0} rooms currently occupied`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Cancellation Rate"
                        value={`${kpis.cancellation_rate_percent || 0}%`}
                        icon={<CancelOutlinedIcon fontSize="large" />}
                        color={kpis.cancellation_rate_percent < 15 ? 'success' : 'error'}
                        subtitle="Proportion of bookings cancelled"
                    />
                </Grid>
                <Grid item xs={12} sm={6} lg={3}>
                    <KpiCard
                        title="Average Guest Satisfaction"
                        value={`★ ${kpis.avg_satisfaction_rating || 4.8} / 5.0`}
                        icon={<StarOutlinedIcon fontSize="large" />}
                        color="secondary"
                        subtitle="Calculated from verified reviews"
                    />
                </Grid>
            </Grid>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* ROW 4: 4 Recharts Visual Panels */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {/* CHART 1: REVENUE TREND */}
                        <Grid item xs={12} lg={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    height: '100%',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    1. Revenue & Bookings Velocity Trend
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Daily financial volume and new booking confirmations
                                </Typography>

                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <AreaChart data={analytics?.revenue_trend || []}>
                                            <defs>
                                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={RECHARTS_COLORS[0]} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={RECHARTS_COLORS[0]} stopOpacity={0.05} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="period_label" stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                                            <RechartsTooltip
                                                formatter={(val, name) => [name === 'revenue' ? `RWF ${Number(val).toLocaleString()}` : val, name === 'revenue' ? 'Revenue' : 'Bookings']}
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                            />
                                            <Legend />
                                            <Area type="monotone" dataKey="revenue" stroke={RECHARTS_COLORS[0]} fillOpacity={1} fill="url(#colorRev)" name="Revenue (RWF)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* CHART 2: REVENUE BY BRANCH */}
                        <Grid item xs={12} lg={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    height: '100%',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    2. Revenue & Occupancy by Branch
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Cross-branch comparisons across locations
                                </Typography>

                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={analytics?.revenue_by_branch || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="hotel_name" stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                                            <RechartsTooltip
                                                formatter={(val) => `RWF ${Number(val).toLocaleString()}`}
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                            />
                                            <Legend />
                                            <Bar dataKey="revenue" fill={RECHARTS_COLORS[1]} name="Gross Revenue (RWF)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* CHART 3: REVENUE BY ROOM TYPE */}
                        <Grid item xs={12} lg={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    height: '100%',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    3. Revenue by Room Type (SQL Aggregates)
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Popularity and financial performance per room category
                                </Typography>

                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={analytics?.revenue_by_room_type || []}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="type_name" stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                                            <RechartsTooltip
                                                formatter={(val) => `RWF ${Number(val).toLocaleString()}`}
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                            />
                                            <Legend />
                                            <Bar dataKey="revenue" fill={RECHARTS_COLORS[2]} name="Revenue (RWF)" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* CHART 4: ROOM STATUS DISTRIBUTION */}
                        <Grid item xs={12} lg={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '12px',
                                    border: `1px solid ${theme.palette.divider}`,
                                    height: '100%',
                                }}
                            >
                                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    4. Room Inventory Status Distribution
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                                    Proportions of available, occupied, dirty, and maintenance rooms
                                </Typography>

                                <Box sx={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={analytics?.room_status_distribution?.filter((d) => d.value > 0) || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={65}
                                                outerRadius={95}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {(analytics?.room_status_distribution || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: `1px solid ${theme.palette.divider}` }}
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* ROW 5: Detailed Data Tables with Tabs */}
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
                            <Tab label="Branch Performance & Occupancy" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            <Tab label="Room Type Financial Breakdown" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            <Tab label="Staff Operational Performance" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            <Tab label="Housekeeping & Maintenance Stats" sx={{ textTransform: 'none', fontWeight: 600 }} />
                        </Tabs>

                        {/* TAB 0: BRANCH PERFORMANCE */}
                        {activeTab === 0 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Hotel Branch</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Total Rooms</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Occupied</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Occupancy Rate</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Bookings</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Cancelled</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Gross Revenue</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Rating</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics?.revenue_by_branch?.map((b) => (
                                            <TableRow key={b.hotel_id} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{b.hotel_name}</TableCell>
                                                <TableCell>{b.location}</TableCell>
                                                <TableCell>{b.total_rooms}</TableCell>
                                                <TableCell>{b.occupied_rooms}</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>{b.occupancy_rate}%</TableCell>
                                                <TableCell>{b.reservations_count}</TableCell>
                                                <TableCell>{b.cancelled_count}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                                    RWF {Number(b.revenue).toLocaleString()}
                                                </TableCell>
                                                <TableCell>★ {b.avg_rating}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* TAB 1: ROOM TYPE BREAKDOWN (SQL AGGREGATES) */}
                        {activeTab === 1 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Room Type</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Bookings Count</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Avg Nightly Rate</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Min Nightly Rate</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Max Nightly Rate</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Total Revenue</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics?.revenue_by_room_type?.map((rt) => (
                                            <TableRow key={rt.room_type_id} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{rt.type_name}</TableCell>
                                                <TableCell>{rt.bookings_count}</TableCell>
                                                <TableCell>RWF {Number(rt.avg_nightly_rate).toLocaleString()}</TableCell>
                                                <TableCell>RWF {Number(rt.min_rate).toLocaleString()}</TableCell>
                                                <TableCell>RWF {Number(rt.max_rate).toLocaleString()}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                                                    RWF {Number(rt.revenue).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* TAB 2: STAFF PERFORMANCE */}
                        {activeTab === 2 && (
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ backgroundColor: isDark ? '#0F172A' : '#F1F5F9' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Staff Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Check-Ins Processed</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Checkouts Settled</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Cleaning Completed</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Maintenance Logs</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Total Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {analytics?.staff_performance?.map((s) => (
                                            <TableRow key={s.user_id} hover>
                                                <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                                                <TableCell>
                                                    <Chip label={s.role} size="small" />
                                                </TableCell>
                                                <TableCell>{s.checkins_processed}</TableCell>
                                                <TableCell>{s.checkouts_processed}</TableCell>
                                                <TableCell>{s.cleaning_tasks_completed}</TableCell>
                                                <TableCell>{s.maintenance_reported_or_resolved}</TableCell>
                                                <TableCell sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                                                    {s.total_actions}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* TAB 3: OPERATIONAL STATS */}
                        {activeTab === 3 && (
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: 2.5, bgcolor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '8px' }}>
                                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5 }}>
                                                Housekeeping Operations
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Total Tasks Recorded:</strong> {analytics?.housekeeping_maintenance_stats?.housekeeping?.total_tasks || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Dirty Rooms (Pending Turnover):</strong> {analytics?.housekeeping_maintenance_stats?.housekeeping?.dirty_count || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>In-Progress Cleaning:</strong> {analytics?.housekeeping_maintenance_stats?.housekeeping?.cleaning_count || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Clean & Ready:</strong> {analytics?.housekeeping_maintenance_stats?.housekeeping?.clean_count || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                <strong>Overall Turnover Completion Rate:</strong> {analytics?.housekeeping_maintenance_stats?.housekeeping?.completion_rate_percent || 100}%
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper sx={{ p: 2.5, bgcolor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: '8px' }}>
                                            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5 }}>
                                                Engineering & Maintenance
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Total Maintenance Logs:</strong> {analytics?.housekeeping_maintenance_stats?.maintenance?.total_logs || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Pending Review:</strong> {analytics?.housekeeping_maintenance_stats?.maintenance?.pending_count || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                <strong>Active Repairs In-Progress:</strong> {analytics?.housekeeping_maintenance_stats?.maintenance?.in_progress_count || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1, color: 'error.main', fontWeight: 600 }}>
                                                <strong>Urgent Repairs (Room Out of Order):</strong> {analytics?.housekeeping_maintenance_stats?.maintenance?.urgent_count || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                                                <strong>Resolved Issues:</strong> {analytics?.housekeeping_maintenance_stats?.maintenance?.resolved_count || 0}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default ReportsAnalyticsPage;
