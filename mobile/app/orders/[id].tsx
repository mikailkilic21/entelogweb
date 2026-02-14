import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FileText, Layers } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

// Helper to prevent Object rendering crash
const safeText = (text: any) => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'object') {
        return text.name || text.title || text.label || text.toString() || '';
    }
    return String(text);
};


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
                        <Text className="text-slate-400 text-xs">#{id} • {safeText(header.ficheNo)}</Text>
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
                                <Text className="text-white font-bold text-base">{safeText(header.customer)}</Text>
                                <Text className="text-slate-400 text-xs mt-1">{safeText(header.customerCode)}</Text>
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

                    {/* Detailed Financial Summary */}
                    <View className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6 gap-2">
                        <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-sm">Brüt Toplam</Text>
                            <Text className="text-slate-200 font-medium">{header.grossTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                        </View>
                        {header.totalDiscount > 0 && (
                            <View className="flex-row justify-between">
                                <Text className="text-red-400 text-sm">İskontolar (-)</Text>
                                <Text className="text-red-400 font-medium">{header.totalDiscount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                            </View>
                        )}
                        <View className="flex-row justify-between border-t border-slate-800 pt-2">
                            <Text className="text-slate-300 text-sm font-bold">Ara Toplam (Matrah)</Text>
                            <Text className="text-slate-200 font-bold">{header.netTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-sm">Toplam KDV</Text>
                            <Text className="text-slate-200 font-medium">{header.totalVat?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                        </View>
                        <View className="flex-row justify-between border-t border-slate-800 pt-2 mt-1">
                            <Text className="text-white text-lg font-black">Genel Toplam</Text>
                            <Text className="text-emerald-400 text-lg font-black">{header.genelToplam?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                        </View>
                    </View>

                    {/* Lines */}
                    <View className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Layers size={18} color="#94a3b8" />
                            <Text className="text-white font-bold text-base">Kalemler ({lines?.length || 0})</Text>
                        </View>

                        {(lines || []).map((line: any, index: number) => (
                            <View key={index} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg mb-2">
                                <View className="flex-row justify-between items-start mb-2">

                                    {/* Image / Icon */}
                                    <View className="w-10 h-10 bg-slate-800 rounded mr-3 overflow-hidden items-center justify-center border border-slate-700">
                                        <Image
                                            source={{ uri: `${API_URL}/products/image/${encodeURIComponent(safeText(line.code))}` }}
                                            style={{ width: '100%', height: '100%' }}
                                            resizeMode="cover"
                                        />
                                    </View>

                                    <View className="flex-1 mr-2">
                                        <Text className="text-slate-200 font-medium text-sm mb-1">{safeText(line.name)}</Text>
                                        <Text className="text-slate-500 text-xs font-mono">{safeText(line.code)}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-white font-bold text-sm">
                                            {Number(line.netTotal || line.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </Text>
                                        {/* If discount exists, show gross crossed out */}
                                        {line.discountAmount > 0 && (
                                            <Text className="text-slate-600 text-[10px] line-through">
                                                {Number(line.grossTotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-4 bg-slate-950/50 p-2 rounded ml-12">
                                    <View className="flex-row items-center gap-1">
                                        <Text className="text-slate-300 text-xs font-bold">{line.quantity} {safeText(line.unit)}</Text>
                                        <Text className="text-slate-500 text-[10px]">x</Text>
                                        <Text className="text-slate-300 text-xs">{Number(line.price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                                    </View>

                                    {line.discountAmount > 0 && (
                                        <View className="bg-red-500/10 px-1 py-0.5 rounded">
                                            <Text className="text-red-400 text-[10px]">-{Number(line.discountAmount).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺ İsk.</Text>
                                        </View>
                                    )}

                                    <View className="flex-1 items-end">
                                        <Text className="text-slate-500 text-[10px]">KDV %{line.vatRate}</Text>
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
