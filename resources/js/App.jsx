import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './i18n';

// Layout & Auth Pages
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProfilePage from './pages/auth/ProfilePage';
import ModulePlaceholder from './pages/placeholder/ModulePlaceholder';

// Phase 3 Admin Core Modules
import HotelsPage from './pages/admin/HotelsPage';
import RoomsPage from './pages/admin/RoomsPage';
import ServicesAmenitiesPage from './pages/admin/ServicesAmenitiesPage';
import UsersPage from './pages/admin/UsersPage';

// Phase 4 Booking, Payment, Loyalty & Review Pages
import LandingHotelSearch from './pages/public/LandingHotelSearch';
import GuestDashboard from './pages/guest/GuestDashboard';
import MyReservations from './pages/guest/MyReservations';
import GuestPayments from './pages/guest/GuestPayments';
import GuestLoyalty from './pages/guest/GuestLoyalty';
import GuestReviews from './pages/guest/GuestReviews';
import ReservationsManagementPage from './pages/admin/ReservationsManagementPage';
import PaymentsInvoicesPage from './pages/admin/PaymentsInvoicesPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';

// Phase 5 Reception, Housekeeping & Operations Pages
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import CheckInOutPage from './pages/reception/CheckInOutPage';
import ServiceOrdersPage from './pages/reception/ServiceOrdersPage';
import ReceptionRoomBoardPage from './pages/reception/ReceptionRoomBoardPage';
import HousekeepingBoard from './pages/housekeeping/HousekeepingBoard';
import MaintenanceRequestsPage from './pages/housekeeping/MaintenanceRequestsPage';
import AdminOperationsPage from './pages/admin/AdminOperationsPage';

const RootRedirect = () => {
    const { user, loading, getRoleHomeRoute } = useAuth();

    if (loading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={getRoleHomeRoute(user.role)} replace />;
};

const App = () => {
    return (
        <ThemeModeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Root Redirect */}
                        <Route path="/" element={<RootRedirect />} />

                        {/* Protected Workspace Shell */}
                        <Route element={<AppShell />}>
                            {/* Profile */}
                            <Route path="/profile" element={<ProfilePage />} />

                            {/* Admin Routes */}
                            <Route
                                path="/admin/dashboard"
                                element={<ModulePlaceholder title="Executive Dashboard" subtitle="Real-time multi-branch revenue, occupancy rates, and operational KPIs" phase="Phase 5" />}
                            />
                            <Route path="/admin/hotels" element={<HotelsPage />} />
                            <Route path="/admin/rooms" element={<RoomsPage />} />
                            <Route path="/admin/services" element={<ServicesAmenitiesPage />} />
                            <Route path="/admin/reservations" element={<ReservationsManagementPage />} />
                            <Route path="/admin/payments" element={<PaymentsInvoicesPage />} />
                            <Route path="/admin/operations" element={<AdminOperationsPage />} />
                            <Route path="/admin/users" element={<UsersPage />} />
                            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
                            <Route
                                path="/admin/security"
                                element={<ModulePlaceholder title="Fraud Alerts & Audit Logs" subtitle="Automated suspicious activity detection and complete system audit trail" phase="Phase 5" />}
                            />
                            <Route
                                path="/admin/reports"
                                element={<ModulePlaceholder title="Reports & Analytics" subtitle="Revenue trends, room type popularity, and PDF/CSV export engine" phase="Phase 6" />}
                            />

                            {/* Receptionist Routes */}
                            <Route path="/reception/dashboard" element={<ReceptionDashboard />} />
                            <Route path="/reception/check-in-out" element={<CheckInOutPage />} />
                            <Route path="/reception/reservations" element={<ReservationsManagementPage />} />
                            <Route path="/reception/services" element={<ServiceOrdersPage />} />
                            <Route path="/reception/payments" element={<PaymentsInvoicesPage />} />
                            <Route path="/reception/rooms" element={<ReceptionRoomBoardPage />} />
                            <Route path="/reception/maintenance" element={<MaintenanceRequestsPage />} />

                            {/* Housekeeping Routes */}
                            <Route path="/housekeeping/dashboard" element={<HousekeepingBoard />} />
                            <Route path="/housekeeping/tasks" element={<HousekeepingBoard />} />
                            <Route path="/housekeeping/maintenance" element={<MaintenanceRequestsPage />} />

                            {/* Guest Routes */}
                            <Route path="/guest/dashboard" element={<GuestDashboard />} />
                            <Route path="/guest/hotels" element={<LandingHotelSearch />} />
                            <Route path="/guest/reservations" element={<MyReservations />} />
                            <Route path="/guest/payments" element={<GuestPayments />} />
                            <Route path="/guest/loyalty" element={<GuestLoyalty />} />
                            <Route path="/guest/reviews" element={<GuestReviews />} />
                        </Route>

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeModeProvider>
    );
};

export default App;
