import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Mail, Phone, MapPin, Camera, Save, Type } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Config';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, updateUserProfile, isDemo } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;

        if (isDemo) {
            Alert.alert('Demo Modu', 'Demo modunda profil güncellenemez.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address
                    // role and password are not updated here for security simplicity
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Güncelleme başarısız oldu.');
            }

            const updatedUser = await response.json();

            // Update context
            updateUserProfile(updatedUser);

            Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');

        } catch (error: any) {
            console.error('Profile update error:', error);
            Alert.alert('Hata', 'Profil güncellenirken bir sorun oluştu.\n' + error.message);
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
                    <Text className="text-lg font-bold text-white">Profilim</Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {/* Avatar Section */}
                        <View className="items-center mb-8">
                            <View className="relative">
                                <View className="w-28 h-28 rounded-full bg-slate-800 border-4 border-slate-700 items-center justify-center overflow-hidden">
                                    {user?.avatar ? (
                                        <Image source={{ uri: user.avatar }} className="w-full h-full" />
                                    ) : (
                                        <User size={48} color="#94a3b8" />
                                    )}
                                </View>
                                <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-4 border-slate-950">
                                    <Camera size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-xl font-bold text-white mt-4">{user?.username || 'Kullanıcı Adı'}</Text>
                            <Text className="text-slate-400 capitalize">{user?.role || 'Kullanıcı Rolü'}</Text>
                        </View>

                        {/* Form Fields */}
                        <View className="space-y-4">
                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2 ml-1">Kullanıcı Adı</Text>
                                <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 opacity-50">
                                    <User size={20} color="#64748b" />
                                    <TextInput
                                        value={user?.username}
                                        editable={false}
                                        className="flex-1 ml-3 text-slate-500 font-medium"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2 ml-1">Ad Soyad</Text>
                                <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                                    <Type size={20} color="#64748b" />
                                    <TextInput
                                        className="flex-1 ml-3 text-white font-medium"
                                        placeholder="Adınız Soyadınız"
                                        placeholderTextColor="#475569"
                                        value={formData.name}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2 ml-1">E-Posta Adresi</Text>
                                <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                                    <Mail size={20} color="#64748b" />
                                    <TextInput
                                        className="flex-1 ml-3 text-white font-medium"
                                        placeholder="ornek@entelog.com"
                                        placeholderTextColor="#475569"
                                        value={formData.email}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2 ml-1">Telefon</Text>
                                <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                                    <Phone size={20} color="#64748b" />
                                    <TextInput
                                        className="flex-1 ml-3 text-white font-medium"
                                        placeholder="+90 5XX XXX XX XX"
                                        placeholderTextColor="#475569"
                                        value={formData.phone}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-400 text-xs uppercase font-bold mb-2 ml-1">Adres</Text>
                                <View className="flex-row items-start bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                                    <MapPin size={20} color="#64748b" style={{ marginTop: 2 }} />
                                    <TextInput
                                        className="flex-1 ml-3 text-white font-medium"
                                        placeholder="Adres bilgisi..."
                                        placeholderTextColor="#475569"
                                        multiline
                                        numberOfLines={3}
                                        value={formData.address}
                                        onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                                        textAlignVertical="top"
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={loading}
                            className={`mt-8 rounded-xl py-4 flex-row items-center justify-center gap-2 ${loading ? 'bg-blue-600/50' : 'bg-blue-600 active:bg-blue-700'}`}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Save size={20} color="#fff" />
                                    <Text className="text-white font-bold text-base">Değişiklikleri Kaydet</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
