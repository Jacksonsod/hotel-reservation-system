import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const ConfirmDialog = ({
    open,
    title,
    message,
    confirmText,
    cancelText,
    confirmColor = 'error',
    onConfirm,
    onCancel,
    loading = false,
}) => {
    const { t } = useTranslation();

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onCancel}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '16px', p: 1 },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                {title || t('actions.confirm')}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ color: 'text.secondary' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onCancel} disabled={loading} color="inherit">
                    {cancelText || t('actions.cancel')}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    color={confirmColor}
                    startIcon={loading && <CircularProgress size={16} color="inherit" />}
                >
                    {confirmText || t('actions.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
