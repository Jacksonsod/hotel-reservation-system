import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    InputAdornment,
    useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableViewOutlinedIcon from '@mui/icons-material/TableViewOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useTranslation } from 'react-i18next';

const DataTableWrapper = ({
    title,
    subtitle,
    kpiContent,
    onAddNew,
    addNewLabel,
    onExportPdf,
    onExportCsv,
    searchQuery,
    onSearchChange,
    filterSlot,
    onResetFilters,
    rows = [],
    columns = [],
    loading = false,
    getRowId = (row) => row.id,
    pageSizeOptions = [10, 25, 50],
    initialPageSize = 10,
    paginationModel,
    onPaginationModelChange,
    emptyState,
    sx = {},
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const isDark = theme.palette.mode === 'dark';

    const CustomNoRowsOverlay = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 4,
                textAlign: 'center',
            }}
        >
            {emptyState?.icon ? (
                <Box sx={{ color: theme.palette.secondary.main, mb: 1.5, display: 'flex' }}>
                    {React.cloneElement(emptyState.icon, { sx: { fontSize: 48, ...emptyState.icon.props?.sx } })}
                </Box>
            ) : (
                <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
            )}
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                {emptyState?.title || t('common.noRecordsFound', 'No records found')}
            </Typography>
            {emptyState?.subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mb: emptyState?.actionLabel ? 2.5 : 0 }}>
                    {emptyState.subtitle}
                </Typography>
            )}
            {emptyState?.actionLabel && emptyState?.onAction && (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={emptyState.onAction}
                    sx={{ mt: 1 }}
                >
                    {emptyState.actionLabel}
                </Button>
            )}
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, ...sx }}>
            {/* Row 1 — Page Header Bar */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    {onExportPdf && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            startIcon={<PictureAsPdfOutlinedIcon />}
                            onClick={onExportPdf}
                        >
                            {t('actions.exportPdf')}
                        </Button>
                    )}
                    {onExportCsv && (
                        <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            startIcon={<TableViewOutlinedIcon />}
                            onClick={onExportCsv}
                        >
                            {t('actions.exportCsv')}
                        </Button>
                    )}
                    {onAddNew && (
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={onAddNew}
                        >
                            {addNewLabel || t('actions.addNew')}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Row 2 — KPI Summary Strip */}
            {kpiContent && <Box>{kpiContent}</Box>}

            {/* Row 3 — Filter & Search Toolbar inside Paper */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                }}
            >
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, flex: 1 }}>
                    {onSearchChange && (
                        <TextField
                            size="small"
                            placeholder={t('actions.search')}
                            value={searchQuery || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            sx={{ width: { xs: '100%', sm: 280 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                    {filterSlot}
                </Box>
                {onResetFilters && (
                    <Button
                        size="small"
                        color="inherit"
                        startIcon={<RestartAltOutlinedIcon />}
                        onClick={onResetFilters}
                    >
                        {t('actions.reset')}
                    </Button>
                )}
            </Paper>

            {/* Row 4 — MUI DataGrid Container */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '12px',
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    height: 580,
                    width: '100%',
                }}
            >
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    getRowId={getRowId}
                    slots={{
                        noRowsOverlay: CustomNoRowsOverlay,
                    }}
                    pageSizeOptions={pageSizeOptions}
                    initialState={{
                        pagination: {
                            paginationModel: { pageSize: initialPageSize, page: 0 },
                        },
                    }}
                    paginationModel={paginationModel}
                    onPaginationModelChange={onPaginationModelChange}
                    disableRowSelectionOnClick
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: isDark ? '#0F172A' : '#F1F5F9',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: `1px solid ${theme.palette.divider}`,
                            fontSize: '0.875rem',
                        },
                        '& .MuiDataGrid-row:hover': {
                            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                        },
                    }}
                />
            </Paper>
        </Box>
    );
};

export default DataTableWrapper;
