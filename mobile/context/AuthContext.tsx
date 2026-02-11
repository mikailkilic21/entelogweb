import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

// Define the shape of our user
interface User {
    id: number;
    username: string;
    role: 'admin' | 'user' | 'demo';
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (user: User, token?: string) => void;
    signOut: () => void;
    isDemo: boolean;
    updateUserProfile: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: () => { },
    signOut: () => { },
    isDemo: false,
    updateUserProfile: () => { },
});

// Hook to allow access to the context
export function useAuth() {
    return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        // Check for persisted user
        const loadUser = async () => {
            try {
                const storedUser = await SecureStore.getItemAsync('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        if (isLoading) return;
        // Navigation logic handled in _layout usually
    }, [user, isLoading, segments]);

    const signIn = async (userData: User, token?: string) => {
        setUser(userData);
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        if (token) {
            await SecureStore.setItemAsync('token', token);
        }
    };

    const updateUserProfile = async (updatedFields: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updatedFields };
        setUser(updatedUser);
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    };

    const signOut = async () => {
        setUser(null);
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync('token');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                signIn,
                signOut,
                isDemo: user?.role === 'demo',
                updateUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
