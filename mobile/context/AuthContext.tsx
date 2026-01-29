import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

// Define the shape of our user
interface User {
    username: string;
    role: 'admin' | 'user' | 'demo';
    name?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (username: string, role: 'admin' | 'user' | 'demo', token?: string) => void;
    signOut: () => void;
    isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: () => { },
    signOut: () => { },
    isDemo: false,
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
                // FORCE AUTO LOGIN (TEMPORARY)
                const bypassUser = { username: 'entelog', role: 'user', name: 'Entelog User' };
                setUser(bypassUser);
                await SecureStore.setItemAsync('user', JSON.stringify(bypassUser));
                await SecureStore.setItemAsync('token', 'mock-jwt-token-user-user');

                /* 
                // Original Logic Disabled for Bypass
                const storedUser = await SecureStore.getItemAsync('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                */
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

        const inAuthGroup = segments[0] === '(auth)';
        // Assuming our login screen is NOT in (auth), but rather 'login' at root or similar
        // Actually simpler: if !user -> redirect to login. if user -> redirect to (tabs)

        // We'll handle protection in the Root Layout more explicitly, or here.
        // Let's rely on Root Layout Effect or similar, but for now just managing state here is safer.

        // Typically useRootNavigationState is needed to know if nav is ready.
        // We will let _layout.tsx handle the redirection logic based on useAuth().
    }, [user, isLoading, segments]);

    const signIn = async (username: string, role: 'admin' | 'user' | 'demo', token?: string) => {
        const newUser: User = { username, role };
        setUser(newUser);
        await SecureStore.setItemAsync('user', JSON.stringify(newUser));
        if (token) {
            await SecureStore.setItemAsync('token', token);
        }
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
