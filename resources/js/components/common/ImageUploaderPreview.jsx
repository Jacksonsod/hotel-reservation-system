import React, { useState } from 'react';
import {
    Box,
    Typography,
    Alert,
    IconButton,
    Grid,
    useTheme,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { getImageUrl, handleImageError } from '../../utils/formatters';

const MAX_FILE_SIZE_BYTES = 2048 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const ImageUploaderPreview = ({
    multiple = false,
    onImageSelect,
    onImagesSelect,
    previewUrl: initialPreviewUrl,
    existingImages = [],
    onDeleteExistingImage,
    label = 'Upload Image',
}) => {
    const theme = useTheme();
    const [singlePreview, setSinglePreview] = useState(initialPreviewUrl || null);
    const [multiPreviews, setMultiPreviews] = useState([]);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setError(null);

        // Validate each file
        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError('Only JPG, JPEG, and PNG images are allowed.');
                return;
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setError(`File "${file.name}" exceeds the 2MB (2,048 KB) limit.`);
                return;
            }
        }

        if (multiple) {
            const newPreviews = files.map((file) => ({
                file,
                url: URL.createObjectURL(file),
            }));
            const updated = [...multiPreviews, ...newPreviews];
            setMultiPreviews(updated);
            if (onImagesSelect) {
                onImagesSelect(updated.map((item) => item.file));
            }
        } else {
            const file = files[0];
            const objectUrl = URL.createObjectURL(file);
            setSinglePreview(objectUrl);
            if (onImageSelect) {
                onImageSelect(file);
            }
        }
    };

    const handleRemoveSingle = () => {
        setSinglePreview(null);
        setError(null);
        if (onImageSelect) {
            onImageSelect(null);
        }
    };

    const handleRemoveMulti = (index) => {
        const updated = multiPreviews.filter((_, i) => i !== index);
        setMultiPreviews(updated);
        if (onImagesSelect) {
            onImagesSelect(updated.map((item) => item.file));
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            {error && (
                <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Existing Images Display */}
            {existingImages.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Existing Photos ({existingImages.length}):
                    </Typography>
                    <Grid container spacing={1.5}>
                        {existingImages.map((img) => (
                            <Grid item xs={6} sm={4} md={3} key={img.image_id || img.id || img.image_path}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        height: 100,
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: `1px solid ${theme.palette.divider}`,
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={getImageUrl(img.image_path || img.url)}
                                        onError={handleImageError('hotel')}
                                        alt="Existing photo"
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {onDeleteExistingImage && (
                                        <IconButton
                                            onClick={() => onDeleteExistingImage(img.image_id || img.id)}
                                            size="small"
                                            sx={{
                                                position: 'absolute',
                                                top: 4,
                                                right: 4,
                                                bgcolor: 'rgba(15, 23, 42, 0.75)',
                                                color: '#EF4444',
                                                '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' },
                                                p: 0.5,
                                            }}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Multiple Selected Files Previews */}
            {multiple && multiPreviews.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        New Photos to Upload ({multiPreviews.length}):
                    </Typography>
                    <Grid container spacing={1.5}>
                        {multiPreviews.map((item, idx) => (
                            <Grid item xs={6} sm={4} md={3} key={idx}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        height: 100,
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: `1px solid ${theme.palette.primary.light}`,
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={item.url}
                                        alt={`New upload ${idx + 1}`}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <IconButton
                                        onClick={() => handleRemoveMulti(idx)}
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            bgcolor: 'rgba(15, 23, 42, 0.75)',
                                            color: '#FFFFFF',
                                            '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.95)' },
                                            p: 0.5,
                                        }}
                                    >
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Single Preview */}
            {!multiple && singlePreview && (
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: 200,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`,
                        mb: 1.5,
                    }}
                >
                    <Box
                        component="img"
                        src={getImageUrl(singlePreview)}
                        onError={handleImageError('hotel')}
                        alt="Upload preview"
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                        onClick={handleRemoveSingle}
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
            )}

            {/* Upload Drop Area */}
            {(!singlePreview || multiple) && (
                <Box
                    component="label"
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: multiple && multiPreviews.length > 0 ? 110 : 150,
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
                    <CloudUploadOutlinedIcon sx={{ fontSize: 36, color: 'text.secondary', mb: 0.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        Accepts JPEG, JPG, PNG (Max 2MB per image)
                    </Typography>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        multiple={multiple}
                        onChange={handleFileChange}
                        hidden
                    />
                </Box>
            )}
        </Box>
    );
};

export default ImageUploaderPreview;
