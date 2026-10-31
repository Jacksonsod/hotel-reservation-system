import React, { createContext, useContext, useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const getRoleHomeRoute = (role) => {
    switch (role) {
        case 'admin':
            return '/admin/dashboard';
        case 'receptionist':
            return '/reception/dashboard';
        case 'housekeeping':
            return '/housekeeping/dashboard';
        case 'guest':
            return '/guest/dashboard';
        default:
            return '/login';
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const cached = localStorage.getItem('authUser');
        return cached ? JSON.parse(cached) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true);
    const [selectedBranchId, setSelectedBranchId] = useState('all');

    const refreshUser = async () => {
        try {
            const res = await axiosClient.get('/auth/me');
            if (res.data?.success && res.data?.data?.user) {
                const refreshed = res.data.data.user;
                setUser(refreshed);
                localStorage.setItem('authUser', JSON.stringify(refreshed));
            }
        } catch (err) {
            console.error('Failed to refresh user', err);
        }
    };

    useEffect(() => {
        const verifyAuth = async () => {
            if (token) {
                await refreshUser();
            }
            setLoading(false);
        };
        verifyAuth();
    }, [token]);

    const login = async (email, password) => {
        const res = await axiosClient.post('/auth/login', { email, password });
        if (res.data?.success) {
            const { token: newToken, user: newUser } = res.data.data;
            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(newUser));
            return newUser;
        }
        throw new Error(res.data?.message || 'Login failed');
    };

    const register = async (payload) => {
        const res = await axiosClient.post('/auth/register', payload);
        if (res.data?.success) {
            const { token: newToken, user: newUser } = res.data.data;
            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(newUser));
            return newUser;
        }
        throw new Error(res.data?.message || 'Registration failed');
    };

    const logout = async () => {
        try {
            await axiosClient.post('/auth/logout');
        } catch (err) {
            console.warn('Logout API error', err);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                selectedBranchId,
                setSelectedBranchId,
                login,
                register,
                logout,
                refreshUser,
                getRoleHomeRoute,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
