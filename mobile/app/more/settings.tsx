import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Moon, Sun, Globe, Trash2, Smartphone } from 'lucide-react-native';

export default function AppSettingsScreen() {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [language, setLanguage] = useState('tr'); // 'tr' | 'en'

    const handleClearCache = () => {
        Alert.alert(
            'Önbelleği Temizle',
            'Uygulama önbelleği temizlenecek. Devam etmek istiyor musunuz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Temizle',
                    style: 'destructive',
                    onPress: () => Alert.alert('Başarılı', 'Önbellek temizlendi.')
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Uygulama Ayarları</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    {/* Appearance */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Görünüm</Text>
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-8">
                        <View className="flex-row items-center justify-between p-4 border-b border-slate-800">
                            <View className="flex-row items-center gap-3">
                                <View className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-500/20' : 'bg-amber-500/20'}`}>
                                    {isDarkMode ? <Moon size={20} color="#818cf8" /> : <Sun size={20} color="#f59e0b" />}
                                </View>
                                <Text className="text-white font-bold text-base">Karanlık Mod</Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#334155", true: "#6366f1" }}
                                thumbColor={isDarkMode ? "#fff" : "#cbd5e1"}
                                onValueChange={() => setIsDarkMode(!isDarkMode)}
                                value={isDarkMode}
                            />
                        </View>
                    </View>

                    {/* Language */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Dil & Bölge</Text>
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-8">
                        <TouchableOpacity
                            className="flex-row items-center justify-between p-4"
                            onPress={() => Alert.alert('Bilgi', 'Dil seçenekleri yakında eklenecek.')}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="bg-blue-500/20 p-2 rounded-lg">
                                    <Globe size={20} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">Uygulama Dili</Text>
                                    <Text className="text-slate-500 text-xs">Türkçe (Varsayılan)</Text>
                                </View>
                            </View>
                            <View className="bg-slate-800 px-3 py-1 rounded-md">
                                <Text className="text-slate-300 text-xs font-bold">TR</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Data */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Veri Yönetimi</Text>
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-8">
                        <TouchableOpacity
                            className="flex-row items-center justify-between p-4"
                            onPress={handleClearCache}
                        >
                            <View className="flex-row items-center gap-3">
                                <View className="bg-red-500/20 p-2 rounded-lg">
                                    <Trash2 size={20} color="#ef4444" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">Önbelleği Temizle</Text>
                                    <Text className="text-slate-500 text-xs">Geçici verileri siler</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* About App */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Uygulama Hakkında</Text>
                    <View className="items-center py-6">
                        <View className="bg-slate-800 p-4 rounded-2xl mb-4">
                            <Smartphone size={32} color="#94a3b8" />
                        </View>
                        <Text className="text-white font-bold text-lg">Entelog Mobile</Text>
                        <Text className="text-slate-500 text-sm">Versiyon 1.0.0 (Build 100)</Text>
                        <Text className="text-slate-600 text-xs mt-1">© 2024 5nsoft Yazılım</Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
