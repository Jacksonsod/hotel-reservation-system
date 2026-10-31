import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Divider,
    Chip,
    InputAdornment,
    IconButton,
    useTheme,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import HotelIcon from '@mui/icons-material/Hotel';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const { login, getRoleHomeRoute } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        if (e) {
            e.preventDefault();
        }
        setError(null);
        setLoading(true);

        try {
            const loggedInUser = await login(email, password);
            const redirectPath = getRoleHomeRoute(loggedInUser.role);
            navigate(redirectPath, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    // Quick demo login fill
    const fillDemo = (demoEmail) => {
        setEmail(demoEmail);
        setPassword('Hotel@2026');
        setError(null);
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
                    maxWidth: 1000,
                    width: '100%',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    boxShadow: theme.shadows[8],
                }}
            >
                {/* Left Side: Hospitality Branding Hero */}
                <Box
                    sx={{
                        flex: 1,
                        bgcolor: '#0F172A',
                        color: '#F8FAFC',
                        p: { xs: 4, md: 6 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        background: 'linear-gradient(135deg, #0F172A 0%, #1B365D 100%)',
                    }}
                >
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <HotelIcon sx={{ color: '#C59B27', fontSize: 36 }} />
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 700,
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    color: '#F8FAFC',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                RP HOTELS
                            </Typography>
                        </Box>
                        <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, color: '#F8FAFC' }}>
                            World-Class Hospitality Across Rwanda
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                            Welcome to the centralized management portal for RP Karongi Lake Resort, Kigali Grand Convention Hotel, and Rubavu Waterfront Palms.
                        </Typography>
                    </Box>

                    {/* Quick Demo Login Buttons */}
                    <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <Typography variant="caption" sx={{ color: '#C59B27', fontWeight: 600, display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('auth.demoAccounts')}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                icon={<ShieldOutlinedIcon sx={{ fontSize: '1rem !important', color: '#0F172A !important' }} />}
                                label="Admin"
                                onClick={() => fillDemo('admin@rphotels.rw')}
                                sx={{ bgcolor: '#FBBF24', color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
                            />
                            <Chip
                                icon={<SupportAgentOutlinedIcon sx={{ fontSize: '1rem !important', color: '#0F172A !important' }} />}
                                label="Reception"
                                onClick={() => fillDemo('reception@rphotels.rw')}
                                sx={{ bgcolor: '#FBBF24', color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
                            />
                            <Chip
                                icon={<CleaningServicesOutlinedIcon sx={{ fontSize: '1rem !important', color: '#0F172A !important' }} />}
                                label="Housekeeping"
                                onClick={() => fillDemo('housekeeping@rphotels.rw')}
                                sx={{ bgcolor: '#FBBF24', color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
                            />
                            <Chip
                                icon={<PersonOutlineIcon sx={{ fontSize: '1rem !important', color: '#0F172A !important' }} />}
                                label="Guest"
                                onClick={() => fillDemo('guest@rphotels.rw')}
                                sx={{ bgcolor: '#FBBF24', color: '#0F172A', fontWeight: 600, cursor: 'pointer' }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Right Side: Sign In Form */}
                <Box sx={{ flex: 1.2, p: { xs: 3, sm: 5 }, bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
                    <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                        <Typography variant="h2" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('auth.welcomeBack')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {t('auth.signInSub')}
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField
                                label={t('auth.email')}
                                type="email"
                                fullWidth
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@domain.rw"
                                autoFocus
                            />

                            <TextField
                                label={t('auth.password')}
                                type={showPassword ? 'text' : 'password'}
                                fullWidth
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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

                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                disabled={loading}
                                sx={{ py: 1.4, mt: 1, fontSize: '0.9375rem' }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : t('actions.login')}
                            </Button>

                            <Divider sx={{ my: 1 }} />

                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    {t('auth.noAccount')}{' '}
                                    <Typography
                                        component={RouterLink}
                                        to="/register"
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            color: theme.palette.secondary.main,
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        {t('auth.signUp')}
                                    </Typography>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};

export default LoginPage;
