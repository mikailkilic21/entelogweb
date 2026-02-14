import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, User as UserIcon, Settings, Save, X } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL, updateServerConfig } from '@/constants/Config';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Server Settings State
    const [modalVisible, setModalVisible] = useState(false);
    const [serverIp, setServerIp] = useState('192.168.1.7');
    const [serverPort, setServerPort] = useState('3001');

    const { signIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedConfig = await SecureStore.getItemAsync('server_settings');
            if (savedConfig) {
                const { ip, port } = JSON.parse(savedConfig);
                setServerIp(ip || '192.168.1.7');
                setServerPort(port || '3001');
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const saveSettings = async () => {
        try {
            if (!serverIp || !serverPort) {
                Alert.alert('Hata', 'IP ve Port boş olamaz.');
                return;
            }
            const config = { ip: serverIp, port: serverPort, protocol: 'http' };
            await SecureStore.setItemAsync('server_settings', JSON.stringify(config));
            updateServerConfig(serverIp, serverPort, 'http');
            setModalVisible(false);
            Alert.alert('Başarılı', `Sunucu adresi güncellendi:\nhttp://${serverIp}:${serverPort}`);
        } catch {
            Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
        }
    };

    const openSettingsModal = () => {
        loadSettings();
        setModalVisible(true);
    };

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Hata', 'Kullanıcı adı ve şifre giriniz.');
            return;
        }

        setLoading(true);
        try {
            // Check for Demo shortcut
            if (username === 'demo' && password === 'demo123') {
                signIn({ id: 0, username: 'demo', role: 'demo', name: 'Demo Kullanıcı' });
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


            try {
                if (!text || text.trim() === '') {
                    throw new Error(`Sunucudan BOŞ yanıt döndü (Status: ${response.status}).`);
                }
                const data = JSON.parse(text);

                if (data.success) {
                    signIn(data.user, data.token);
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
                    Alert.alert('Veri Hatası', (e as Error).message || 'Yanıt işlenemedi.');
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

            {/* Settings Button */}
            <View className="absolute top-12 right-6 z-10">
                <TouchableOpacity onPress={openSettingsModal} className="bg-slate-800 p-2 rounded-full">
                    <Settings color="#94a3b8" size={24} />
                </TouchableOpacity>
            </View>

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
                    2026 Entelog Yazılım
                </Text>
            </View>

            {/* Server Settings Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/80 p-6">
                    <View className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center gap-2">
                                <Settings size={20} color="#3b82f6" />
                                <Text className="text-white font-bold text-xl">Sunucu Ayarları</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View className="space-y-4">
                            <View>
                                <Text className="text-slate-400 text-xs mb-1 ml-1 uppercase font-bold">Sunucu IP Adresi</Text>
                                <View className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                                    <TextInput
                                        className="text-white text-base"
                                        placeholder="Örn: 192.168.1.7"
                                        placeholderTextColor="#475569"
                                        value={serverIp}
                                        onChangeText={setServerIp}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs mb-1 ml-1 uppercase font-bold">Port</Text>
                                <View className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                                    <TextInput
                                        className="text-white text-base"
                                        placeholder="Örn: 3001"
                                        placeholderTextColor="#475569"
                                        value={serverPort}
                                        onChangeText={setServerPort}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                className="bg-blue-600 p-4 rounded-xl flex-row items-center justify-center gap-2 mt-4 active:bg-blue-700"
                                onPress={saveSettings}
                            >
                                <Save size={20} color="white" />
                                <Text className="text-white font-bold">Kaydet ve Bağlan</Text>
                            </TouchableOpacity>
                        </View>

                        <Text className="text-slate-600 text-center text-xs mt-4">
                            Lütfen VPN IP adresini giriniz (Örn: 192.168.1.200) veya Yerel IP (192.168.1.7)
                        </Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
