import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Mail, Phone, MapPin, Camera, Save } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();

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
                            <View className="flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                                <User size={20} color="#64748b" />
                                <TextInput
                                    value={user?.username}
                                    editable={false}
                                    className="flex-1 ml-3 text-slate-500 font-medium"
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
                                    defaultValue={user?.email || "demo@entelog.com"}
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
                                    defaultValue="+90 555 123 45 67"
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
                                    defaultValue="Teknopark İstanbul, Pendik/İstanbul"
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity className="mt-8 bg-blue-600 rounded-xl py-4 flex-row items-center justify-center gap-2 active:bg-blue-700">
                        <Save size={20} color="#fff" />
                        <Text className="text-white font-bold text-base">Değişiklikleri Kaydet</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
