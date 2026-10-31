import React, { useState } from 'react';
import {
    Box,
    Card,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    InputAdornment,
    IconButton,
    useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import HotelIcon from '@mui/icons-material/Hotel';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const RegisterPage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const { register, getRoleHomeRoute } = useAuth();

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        // Client-side validations matching Section 4.1
        if (!PHONE_REGEX.test(form.phone)) {
            setError('Phone number must be between 10 and 15 digits (optional leading +).');
            return;
        }

        if (!PASSWORD_REGEX.test(form.password)) {
            setError('Password must have at least 8 characters, 1 uppercase letter, 1 number, and 1 special character (@$!%*#?&).');
            return;
        }

        if (form.password !== form.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const newUser = await register(form);
            const redirectPath = getRoleHomeRoute(newUser.role);
            navigate(redirectPath, { replace: true });
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            if (validationErrors) {
                const firstErr = Object.values(validationErrors).flat()[0];
                setError(firstErr);
            } else {
                setError(err.response?.data?.message || err.message || 'Registration failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: theme.palette.background.default,
                p: { xs: 2, sm: 4 },
            }}
        >
            <Card
                sx={{
                    maxWidth: 600,
                    width: '100%',
                    p: { xs: 3, sm: 5 },
                    borderRadius: '16px',
                    boxShadow: theme.shadows[8],
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <HotelIcon sx={{ color: theme.palette.secondary.main, fontSize: 32 }} />
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 700,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: theme.palette.primary.main,
                        }}
                    >
                        RP HOTELS
                    </Typography>
                </Box>

                <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('actions.register')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create a guest account to book rooms, order services, and earn loyalty points.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                        label={t('auth.fullName')}
                        name="name"
                        fullWidth
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="e.g. Jean Pierre Habimana"
                    />

                    <TextField
                        label={t('auth.email')}
                        name="email"
                        type="email"
                        fullWidth
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="jean.habimana@gmail.com"
                    />

                    <TextField
                        label={t('auth.phone')}
                        name="phone"
                        fullWidth
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+250788123456"
                        helperText="10–15 numeric digits (e.g. +250788123456)"
                    />

                    <TextField
                        label={t('auth.password')}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        required
                        value={form.password}
                        onChange={handleChange}
                        helperText="Min 8 chars, 1 uppercase, 1 digit, 1 special char (@$!%*#?&)"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="small"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        label={t('auth.confirmPassword')}
                        name="password_confirmation"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        required
                        value={form.password_confirmation}
                        onChange={handleChange}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{ py: 1.4, mt: 1, fontSize: '0.9375rem' }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : t('actions.register')}
                    </Button>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('auth.haveAccount')}{' '}
                            <Typography
                                component={RouterLink}
                                to="/login"
                                variant="body2"
                                sx={{
                                    fontWeight: 600,
                                    color: theme.palette.secondary.main,
                                    textDecoration: 'none',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                            >
                                {t('actions.login')}
                            </Typography>
                        </Typography>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};

export default RegisterPage;
