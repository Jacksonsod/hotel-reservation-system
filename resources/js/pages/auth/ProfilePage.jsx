import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    Avatar,
    Chip,
    useTheme,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import StarsOutlinedIcon from '@mui/icons-material/StarsOutlined';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatters';

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;

const ProfilePage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { user, refreshUser } = useAuth();

    // Profile state
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(null);
    const [profileError, setProfileError] = useState(null);

    // Password state
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [passwordError, setPasswordError] = useState(null);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(null);

        if (!PHONE_REGEX.test(profileForm.phone)) {
            setProfileError('Phone number must be between 10 and 15 digits (optional leading +).');
            return;
        }

        setProfileLoading(true);
        try {
            const res = await axiosClient.put('/auth/profile', profileForm);
            if (res.data?.success) {
                setProfileSuccess(t('auth.profileUpdated'));
                await refreshUser();
            }
        } catch (err) {
            const valErrors = err.response?.data?.errors;
            if (valErrors) {
                setProfileError(Object.values(valErrors).flat()[0]);
            } else {
                setProfileError(err.response?.data?.message || 'Failed to update profile.');
            }
        } finally {
            setProfileLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (!PASSWORD_REGEX.test(passwordForm.password)) {
            setPasswordError('New password must contain at least 8 characters, 1 uppercase letter, 1 number, and 1 special character (@$!%*#?&).');
            return;
        }

        if (passwordForm.password !== passwordForm.password_confirmation) {
            setPasswordError('New passwords do not match.');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await axiosClient.put('/auth/password', passwordForm);
            if (res.data?.success) {
                setPasswordSuccess(t('auth.passwordChanged'));
                setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
            }
        } catch (err) {
            const valErrors = err.response?.data?.errors;
            if (valErrors) {
                setPasswordError(Object.values(valErrors).flat()[0]);
            } else {
                setPasswordError(err.response?.data?.message || 'Failed to change password.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Header / Hero Banner */}
            <Card sx={{ p: 3, borderRadius: '12px' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
                    <Avatar
                        sx={{
                            width: 72,
                            height: 72,
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            fontSize: '1.75rem',
                            fontWeight: 700,
                        }}
                    >
                        {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Typography variant="h2" sx={{ fontWeight: 700 }}>
                                {user?.name}
                            </Typography>
                            <StatusChip status={user?.role} />
                            <StatusChip status={user?.status} />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {user?.email} • {user?.phone || 'No phone recorded'}
                        </Typography>
                    </Box>

                    {/* Loyalty Points Badge (if guest or has loyalty) */}
                    {user?.loyalty_account && (
                        <Box
                            sx={{
                                p: 1.5,
                                px: 2.5,
                                borderRadius: '12px',
                                bgcolor: `${theme.palette.secondary.main}15`,
                                border: `1px solid ${theme.palette.secondary.main}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}
                        >
                            <StarsOutlinedIcon sx={{ color: theme.palette.secondary.main, fontSize: 32 }} />
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    {t('nav.loyalty')}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.secondary.main }}>
                                    {user.loyalty_account.available_points.toLocaleString()} pts
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    Value: {formatCurrency(user.loyalty_account.available_points * 50)}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Card>

            {/* Two-Column Forms */}
            <Grid container spacing={3}>
                {/* Left Card: Update Profile */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', borderRadius: '12px' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <PersonOutlineIcon color="primary" />
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    Personal Information
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Update your contact information and display name across hotel records.
                            </Typography>

                            {profileSuccess && (
                                <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                                    {profileSuccess}
                                </Alert>
                            )}
                            {profileError && (
                                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                                    {profileError}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    label={t('auth.fullName')}
                                    fullWidth
                                    required
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                />
                                <TextField
                                    label={t('auth.email')}
                                    type="email"
                                    fullWidth
                                    required
                                    value={profileForm.email}
                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                />
                                <TextField
                                    label={t('auth.phone')}
                                    fullWidth
                                    required
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    helperText="Format: +250788123456"
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={profileLoading}
                                    sx={{ py: 1.2, mt: 1 }}
                                >
                                    {profileLoading ? <CircularProgress size={20} color="inherit" /> : t('actions.save')}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Card: Change Password */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', borderRadius: '12px' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <LockResetOutlinedIcon color="primary" />
                                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                    Security & Password
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Ensure your account uses a strong password meeting RP Hotels security standards.
                            </Typography>

                            {passwordSuccess && (
                                <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
                                    {passwordSuccess}
                                </Alert>
                            )}
                            {passwordError && (
                                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                                    {passwordError}
                                </Alert>
                            )}

                            <Box component="form" onSubmit={handleUpdatePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                <TextField
                                    label={t('auth.currentPassword')}
                                    type="password"
                                    fullWidth
                                    required
                                    value={passwordForm.current_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                />
                                <TextField
                                    label={t('auth.newPassword')}
                                    type="password"
                                    fullWidth
                                    required
                                    value={passwordForm.password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                                    helperText="Min 8 chars, 1 uppercase, 1 number, 1 special character (@$!%*#?&)"
                                />
                                <TextField
                                    label={t('auth.confirmPassword')}
                                    type="password"
                                    fullWidth
                                    required
                                    value={passwordForm.password_confirmation}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="secondary"
                                    disabled={passwordLoading}
                                    sx={{ py: 1.2, mt: 1 }}
                                >
                                    {passwordLoading ? <CircularProgress size={20} color="inherit" /> : 'Update Password'}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProfilePage;
