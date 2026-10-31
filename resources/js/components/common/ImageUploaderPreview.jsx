import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    IconButton,
    useTheme,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const MAX_FILE_SIZE_BYTES = 2048 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const ImageUploaderPreview = ({ onImageSelect, previewUrl: initialPreviewUrl, label = 'Upload Image' }) => {
    const theme = useTheme();
    const [preview, setPreview] = useState(initialPreviewUrl || null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }

        setError(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Only JPG, JPEG, and PNG images are allowed.');
            return;
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            setError('File size must not exceed 2MB (2,048 KB).');
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        if (onImageSelect) {
            onImageSelect(file);
        }
    };

    const handleClear = () => {
        setPreview(null);
        setError(null);
        if (onImageSelect) {
            onImageSelect(null);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {preview ? (
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: 200,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Box
                        component="img"
                        src={preview}
                        alt="Upload preview"
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    <IconButton
                        onClick={handleClear}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'rgba(15, 23, 42, 0.7)',
                            color: '#FFFFFF',
                            '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.9)' },
                        }}
                        size="small"
                    >
                        <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                </Box>
            ) : (
                <Box
                    component="label"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 160,
                        borderRadius: '12px',
                        border: `2px dashed ${theme.palette.divider}`,
                        cursor: 'pointer',
                        p: 2,
                        textAlign: 'center',
                        transition: 'border-color 0.2s',
                        '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: 'action.hover',
                        },
                    }}
                >
                    <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Accepts JPEG, JPG, PNG (Max 2MB)
                    </Typography>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileChange}
                        hidden
                    />
                </Box>
            )}
        </Box>
    );
};

export default ImageUploaderPreview;
