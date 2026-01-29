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
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({ username, password })
            });

            const text = await response.text();
            console.log('Login Response Status:', response.status);
            console.log('Login Response Body:', text);

            try {
                if (!text || text.trim() === '') {
                    throw new Error(`Sunucudan BOŞ yanıt döndü (Status: ${response.status}).`);
                }
                const data = JSON.parse(text);

                if (data.success) {
                    signIn(data.user.username, data.user.role, data.token);
                    router.replace('/(tabs)');
                } else {
                    Alert.alert('Giriş Başarısız', data.message || 'Kullanıcı adı veya şifre hatalı.');
                }
            } catch (e) {
                console.error('JSON Parse Error:', e);
                const isHtml = text && (text.includes('<html') || text.includes('<!DOCTYPE'));

                if (isHtml) {
                    Alert.alert('Sunucu Hatası (HTML)', 'Sunucu bir web sayfası döndürdü. Muhtemelen Tünel/Proxy hatası.');
                } else {
                    Alert.alert('Veri Hatası', e.message || 'Yanıt işlenemedi.');
                }
            }

        } catch (error) {
            console.error('Network Error:', error);
            Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.');
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
