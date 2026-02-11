import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, Shield, Smartphone, KeyRound } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Config';

export default function SecurityScreen() {
    const router = useRouter();
    const { user, isDemo } = useAuth();

    // States
    const [biometric, setBiometric] = useState(true);
    const [twoFactor, setTwoFactor] = useState(false);
    const [loading, setLoading] = useState(false);

    // Password Form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordUpdate = async () => {
        if (isDemo) {
            Alert.alert('Demo Modu', 'Demo modunda şifre değiştirilemez.');
            return;
        }

        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurunuz.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Hata', 'Yeni şifreler uyuşmuyor.');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }

        // Note: Backend currently doesn't support verifying currentPassword directly in the update endpoint
        // In a real app, we should use a dedicated /change-password endpoint

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/${user?.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    password: newPassword
                })
            });

            if (!response.ok) {
                throw new Error('Şifre güncellenemedi.');
            }

            Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi.', [
                {
                    text: 'Tamam',
                    onPress: () => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                    }
                }
            ]);

        } catch (error: any) {
            console.error('Password update error:', error);
            Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Güvenlik</Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView contentContainerStyle={{ padding: 20 }}>

                        {/* Security Status */}
                        <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-8 flex-row items-center">
                            <View className="bg-emerald-500/20 p-3 rounded-full mr-4">
                                <Shield size={32} color="#10b981" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-emerald-400 font-bold text-lg mb-1">Hesabınız Güvende</Text>
                                <Text className="text-emerald-500/70 text-xs">Son güvenlik taraması: Bugün 10:42</Text>
                            </View>
                        </View>

                        {/* Password Change */}
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Şifre Değiştir</Text>
                        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 mb-8">
                            <View>
                                <Text className="text-slate-500 text-xs mb-2 font-medium">Mevcut Şifre</Text>
                                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                                    <Lock size={18} color="#64748b" />
                                    <TextInput
                                        className="flex-1 ml-3 text-white font-medium"
                                        secureTextEntry
                                        placeholder="••••••••"
                                        placeholderTextColor="#475569"
                                        value={currentPassword}
                                        onChangeText={setCurrentPassword}
                                    />
                                </View>
                            </View>
                            <View>
                                <Text className="text-slate-500 text-xs mb-2 font-medium">Yeni Şifre</Text>
                                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                                    <KeyRound size={18} color="#64748b" />
                                    <TextInput
                                        className="flex-1 ml-3 text-white font-medium"
                                        secureTextEntry
                                        placeholder="••••••••"
                                        placeholderTextColor="#475569"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                </View>
                            </View>
                            <View>
                                <Text className="text-slate-500 text-xs mb-2 font-medium">Yeni Şifre (Tekrar)</Text>
                                <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                                    <KeyRound size={18} color="#64748b" />
                                    <TextInput
                                        className="flex-1 ml-3 text-white font-medium"
                                        secureTextEntry
                                        placeholder="••••••••"
                                        placeholderTextColor="#475569"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handlePasswordUpdate}
                                disabled={loading}
                                className={`rounded-xl py-3 mt-2 ${loading ? 'bg-blue-600/50' : 'bg-blue-600 active:bg-blue-700'}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text className="text-white text-center font-bold">Şifreyi Güncelle</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Advanced Settings */}
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Gelişmiş Güvenlik</Text>
                        <View className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                            <View className="flex-row items-center justify-between p-4 border-b border-slate-800">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="bg-purple-500/20 p-2 rounded-lg">
                                        <Smartphone size={20} color="#a855f7" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-base">Biyometrik Giriş</Text>
                                        <Text className="text-slate-500 text-xs">FaceID / TouchID kullan</Text>
                                    </View>
                                </View>
                                <Switch
                                    trackColor={{ false: "#334155", true: "#a855f7" }}
                                    thumbColor={biometric ? "#fff" : "#cbd5e1"}
                                    onValueChange={() => setBiometric(!biometric)}
                                    value={biometric}
                                />
                            </View>

                            <View className="flex-row items-center justify-between p-4">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="bg-blue-500/20 p-2 rounded-lg">
                                        <Shield size={20} color="#3b82f6" />
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-base">2 Faktörlü Doğrulama</Text>
                                        <Text className="text-slate-500 text-xs">SMS veya Authenticator</Text>
                                    </View>
                                </View>
                                <Switch
                                    trackColor={{ false: "#334155", true: "#3b82f6" }}
                                    thumbColor={twoFactor ? "#fff" : "#cbd5e1"}
                                    onValueChange={() => setTwoFactor(!twoFactor)}
                                    value={twoFactor}
                                />
                            </View>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
