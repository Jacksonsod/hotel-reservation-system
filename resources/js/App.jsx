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
                            <Route
                                path="/admin/reservations"
                                element={<ModulePlaceholder title="All Reservations" subtitle="Comprehensive view of all customer bookings, check-in schedules, and statuses" phase="Phase 4" />}
                            />
                            <Route
                                path="/admin/payments"
                                element={<ModulePlaceholder title="Payments & Invoices" subtitle="Review transactions, outstanding balances, refunds, and issued tax invoices" phase="Phase 4" />}
                            />
                            <Route
                                path="/admin/operations"
                                element={<ModulePlaceholder title="Housekeeping & Maintenance" subtitle="Operational coordination between front desk, housekeeping, and engineering" phase="Phase 5" />}
                            />
                            <Route path="/admin/users" element={<UsersPage />} />
                            <Route
                                path="/admin/reviews"
                                element={<ModulePlaceholder title="Reviews & Loyalty" subtitle="Customer feedback, ratings, and loyalty points reward management" phase="Phase 5" />}
                            />
                            <Route
                                path="/admin/security"
                                element={<ModulePlaceholder title="Fraud Alerts & Audit Logs" subtitle="Automated suspicious activity detection and complete system audit trail" phase="Phase 5" />}
                            />
                            <Route
                                path="/admin/reports"
                                element={<ModulePlaceholder title="Reports & Analytics" subtitle="Revenue trends, room type popularity, and PDF/CSV export engine" phase="Phase 6" />}
                            />

                            {/* Receptionist Routes */}
                            <Route
                                path="/reception/dashboard"
                                element={<ModulePlaceholder title="Front Desk Dashboard" subtitle="Today arrivals, departures, room occupancy board, and urgent tasks" phase="Phase 4" />}
                            />
                            <Route
                                path="/reception/check-in-out"
                                element={<ModulePlaceholder title="Check-In & Check-Out" subtitle="Guest arrival registration, room key assignment, billing calculation, and checkout" phase="Phase 4" />}
                            />
                            <Route
                                path="/reception/reservations"
                                element={<ModulePlaceholder title="Front Desk Reservations" subtitle="Create walk-in bookings, manage modifications, and handle cancellations" phase="Phase 4" />}
                            />
                            <Route
                                path="/reception/services"
                                element={<ModulePlaceholder title="Guest Service Orders" subtitle="Post room service, shuttle, and tour charges directly to guest folios" phase="Phase 4" />}
                            />
                            <Route
                                path="/reception/payments"
                                element={<ModulePlaceholder title="Payments & Invoices" subtitle="Collect Cash, Card, and Mobile Money payments with receipt printing" phase="Phase 4" />}
                            />
                            <Route
                                path="/reception/rooms"
                                element={<ModulePlaceholder title="Room Availability Board" subtitle="Real-time visual room matrix across all floors and types" phase="Phase 4" />}
                            />
                            <Route
                                path="/reception/maintenance"
                                element={<ModulePlaceholder title="Report Maintenance" subtitle="Log urgent plumbing, HVAC, or electrical issues directly to technicians" phase="Phase 5" />}
                            />

                            {/* Housekeeping Routes */}
                            <Route
                                path="/housekeeping/dashboard"
                                element={<ModulePlaceholder title="Housekeeping Board" subtitle="Room cleanliness status board, turnover priorities, and task assignments" phase="Phase 5" />}
                            />
                            <Route
                                path="/housekeeping/tasks"
                                element={<ModulePlaceholder title="My Cleaning Tasks" subtitle="Assigned rooms for cleaning, inspection, and status updates" phase="Phase 5" />}
                            />
                            <Route
                                path="/housekeeping/maintenance"
                                element={<ModulePlaceholder title="Maintenance Requests" subtitle="Report broken fixtures or equipment discovered during turnover" phase="Phase 5" />}
                            />

                            {/* Guest Routes */}
                            <Route
                                path="/guest/dashboard"
                                element={<ModulePlaceholder title="Guest Dashboard" subtitle="Welcome to RP Hotels. View upcoming stays and loyalty balance" phase="Phase 4" />}
                            />
                            <Route
                                path="/guest/hotels"
                                element={<ModulePlaceholder title="Browse Hotels & Rooms" subtitle="Search availability across Karongi, Kigali, and Rubavu properties" phase="Phase 3" />}
                            />
                            <Route
                                path="/guest/reservations"
                                element={<ModulePlaceholder title="My Reservations" subtitle="View active, upcoming, and past booking confirmations" phase="Phase 4" />}
                            />
                            <Route
                                path="/guest/payments"
                                element={<ModulePlaceholder title="Payments & Invoices" subtitle="Download official VAT receipts and review payment history" phase="Phase 4" />}
                            />
                            <Route
                                path="/guest/loyalty"
                                element={<ModulePlaceholder title="Loyalty Points" subtitle="Earn 1 point per 1,000 RWF spent and redeem points for booking discounts" phase="Phase 5" />}
                            />
                            <Route
                                path="/guest/reviews"
                                element={<ModulePlaceholder title="My Reviews" subtitle="Share your experience and rate your stays at RP Hotels" phase="Phase 5" />}
                            />
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
