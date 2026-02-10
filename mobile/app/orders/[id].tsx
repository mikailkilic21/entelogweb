import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, Layers } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${API_URL}/orders/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setDetails(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-950">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!details) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-950">
                <Text className="text-slate-500">Sipariş bulunamadı</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-600 px-4 py-2 rounded-lg">
                    <Text className="text-white">Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { header, lines } = details;

    return (
        <View className="flex-1 bg-slate-950">
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-slate-800 rounded-full">
                        <ArrowLeft size={20} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white font-bold text-lg">Sipariş Detayı</Text>
                        <Text className="text-slate-400 text-xs">#{id} • {header.ficheNo}</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Info Card */}
                    <View className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6">
                        <View className="flex-row items-start mb-4">
                            <View className="bg-blue-500/10 p-2 rounded-lg mr-3">
                                <FileText size={20} color="#60a5fa" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base">{header.customer}</Text>
                                <Text className="text-slate-400 text-xs mt-1">{header.customerCode}</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-4 border-t border-slate-800 pt-4">
                            <View className="flex-1">
                                <Text className="text-slate-500 text-[10px] uppercase mb-1">Tarih</Text>
                                <Text className="text-slate-300 font-medium">{new Date(header.date).toLocaleDateString('tr-TR')}</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-500 text-[10px] uppercase mb-1">Belge No</Text>
                                <Text className="text-slate-300 font-medium">{header.documentNo || '-'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Financial Summary */}
                    <View className="flex-row gap-3 mb-6">
                        <View className="flex-1 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                            <Text className="text-slate-500 text-[10px] uppercase">Net Toplam</Text>
                            <Text className="text-white font-bold text-lg mt-1">{header.netTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                        </View>
                        <View className="flex-1 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                            <Text className="text-slate-500 text-[10px] uppercase">KDV Dahil</Text>
                            <Text className="text-emerald-400 font-bold text-lg mt-1">{header.grossTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                        </View>
                    </View>

                    {/* Lines */}
                    <View className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Layers size={18} color="#94a3b8" />
                            <Text className="text-white font-bold text-base">Kalemler</Text>
                        </View>

                        {(lines || []).map((line: any, index: number) => (
                            <View key={index} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg mb-2">
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-slate-200 font-medium text-sm mb-1">{line.name}</Text>
                                        <Text className="text-slate-500 text-xs font-mono">{line.code}</Text>
                                    </View>
                                    <Text className="text-white font-bold text-sm">
                                        {line.total?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </Text>
                                </View>

                                <View className="flex-row items-center gap-4 bg-slate-950/50 p-2 rounded">
                                    <View className="flex-row items-center gap-1">
                                        <Text className="text-slate-500 text-xs">Miktar:</Text>
                                        <Text className="text-slate-300 text-xs font-bold">{line.quantity} {line.unit}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <Text className="text-slate-500 text-xs">Sevk:</Text>
                                        <Text className={`text-xs font-bold ${line.shippedAmount > 0 ? 'text-green-400' : 'text-slate-300'}`}>
                                            {line.shippedAmount || 0}
                                        </Text>
                                    </View>
                                    <View className="flex-1 items-end">
                                        <Text className="text-slate-400 text-xs">{line.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
