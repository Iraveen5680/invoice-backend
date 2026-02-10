import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const { toast } = useToast();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [companyProfile, setCompanyProfile] = useState(null);

    const fetchUserProfile = useCallback(async () => {
        try {
            // Implement /me route in backend to get user details
            // For now, we will decode token or just rely on local storage if we want fast load, 
            // but better to verify with backend.
            // Since /me is not fully implemented with middleware, we might skip this or implement basic
            const token = localStorage.getItem('token');
            if (token) {
                // Decode token or fetch user
                // Mocking user for now if token exists until /me is ready
                const savedUser = JSON.parse(localStorage.getItem('user'));
                if (savedUser) {
                    setUser(savedUser);
                    setCompanyProfile(savedUser);
                }
            }
        } catch (error) {
            console.error(error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    const signIn = useCallback(async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast({ title: "Success", description: "Signed in successfully" });
            return { data, error: null };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast({ variant: "destructive", title: "Sign in Failed", description: message });
            return { data: null, error: { message } };
        }
    }, [toast]);

    const signUp = useCallback(async (name, email, password, companyName) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, companyName });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast({ title: "Success", description: "Account created successfully" });
            return { data, error: null };
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            toast({ variant: "destructive", title: "Sign up Failed", description: message });
            return { data: null, error: { message } };
        }
    }, [toast]);

    const signOut = useCallback(async () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setCompanyProfile(null);
        toast({ title: "Signed out" });
    }, [toast]);

    const value = useMemo(() => ({
        user,
        loading,
        companyProfile,
        signIn,
        signUp,
        signOut,
    }), [user, loading, companyProfile, signIn, signUp, signOut]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
