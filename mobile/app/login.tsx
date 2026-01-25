import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, User as UserIcon } from 'lucide-react-native';
// API Client (We will need to point this to the correct server IP later)
// For now, hardcoded fetch or use existing client logic if adaptable.

import { API_URL } from '@/constants/Config';


export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Hata', 'Kullanıcı adı ve şifre giriniz.');
            return;
        }

        setLoading(true);
        try {
            // Check for Demo shortcut
            if (username === 'demo' && password === 'demo123') {
                signIn('demo', 'demo');
                router.replace('/(tabs)');
                return;
            }

            // Real Login
            // Note: Since we are in development, ensure your phone can reach this IP.
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                signIn(data.user.username, data.user.role, data.token);
                router.replace('/(tabs)');
            } else {
                Alert.alert('Hata', data.message || 'Giriş başarısız.');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Sunucuya bağlanılamadı.');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = () => {
        setUsername('demo');
        setPassword('demo123');
        // Auto submit optional, or let user click
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950 px-6 justify-center">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="items-center mb-10">
                <Image
                    source={require('../assets/images/siyahlogo.png')}
                    style={{ width: 150, height: 150, resizeMode: 'contain' }}
                />
                <Text className="text-white text-3xl font-bold mt-4">Entelog</Text>
                <Text className="text-slate-400 text-base">Mobil İşlem Merkezi</Text>
            </View>

            <View className="space-y-4">
                <View className="bg-slate-900 rounded-xl p-4 flex-row items-center border border-slate-800">
                    <UserIcon size={20} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Kullanıcı Adı"
                        placeholderTextColor="#64748b"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>

                <View className="bg-slate-900 rounded-xl p-4 flex-row items-center border border-slate-800">
                    <Lock size={20} color="#94a3b8" />
                    <TextInput
                        className="flex-1 ml-3 text-white text-base"
                        placeholder="Şifre"
                        placeholderTextColor="#64748b"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    className="bg-blue-600 p-4 rounded-xl items-center mt-4 active:bg-blue-700"
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Giriş Yap</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-slate-800 p-4 rounded-xl items-center mt-2 active:bg-slate-700"
                    onPress={handleDemoLogin}
                >
                    <Text className="text-slate-300 font-semibold">Demo Modu</Text>
                </TouchableOpacity>

                <Text className="text-slate-600 text-center text-sm mt-8">
                    v1.0.0 © 2024 5nsoft Yazılım
                </Text>
            </View>
        </SafeAreaView>
    );
}
