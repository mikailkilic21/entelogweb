import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, FileText, CreditCard, Layers, Tag } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { LinearGradient } from 'expo-linear-gradient';

export default function InvoiceDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/invoices/${id}`);
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
                <Text className="text-slate-500">Fatura bulunamadı</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-600 px-4 py-2 rounded-lg">
                    <Text className="text-white">Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { lines, summary, payments } = details;

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
                        <Text className="text-white font-bold text-lg">Fatura Detayı</Text>
                        <Text className="text-slate-400 text-xs text-sm">#{id}</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Summary Card */}
                    <View className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-6">
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-slate-400 text-xs uppercase tracking-wider">Genel Toplam</Text>
                            <View className="bg-blue-500/20 px-2 py-0.5 rounded">
                                <Text className="text-blue-400 text-[10px] font-bold">ONAYLI</Text>
                            </View>
                        </View>
                        <Text className="text-3xl font-black text-white mb-4">
                            {summary.grandTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>

                        <View className="flex-row gap-4 border-t border-slate-800 pt-4">
                            <View className="flex-1">
                                <Text className="text-slate-500 text-[10px] mb-1">Ara Toplam</Text>
                                <Text className="text-slate-300 font-bold">{summary.subTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-500 text-[10px] mb-1">KDV Toplam</Text>
                                <Text className="text-slate-300 font-bold">{summary.totalVat?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                            </View>
                            {summary.totalDiscount > 0 && (
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-[10px] mb-1">İndirim</Text>
                                    <Text className="text-rose-400 font-bold">-{summary.totalDiscount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Lines */}
                    <View className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Layers size={18} color="#94a3b8" />
                            <Text className="text-white font-bold text-base">Kalemler</Text>
                        </View>

                        {(lines || []).map((line: any, index: number) => (
                            <View key={index} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg mb-2 flex-row justify-between items-center">
                                <View className="flex-1 mr-2">
                                    <Text className="text-slate-200 font-medium text-sm mb-1">{line.name}</Text>
                                    <View className="flex-row gap-2">
                                        <Text className="text-slate-500 text-xs">{line.quantity} {line.unit}</Text>
                                        <Text className="text-slate-600 text-xs">•</Text>
                                        <Text className="text-slate-500 text-xs">{line.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</Text>
                                    </View>
                                </View>
                                <Text className="text-white font-bold text-sm">
                                    {line.total?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Payments */}
                    {(payments && payments.length > 0) && (
                        <View className="mb-6">
                            <View className="flex-row items-center gap-2 mb-3">
                                <CreditCard size={18} color="#94a3b8" />
                                <Text className="text-white font-bold text-base">Ödemeler / İşlemler</Text>
                            </View>

                            {payments.map((pay: any, index: number) => (
                                <View key={index} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg mb-2 flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-slate-300 font-medium text-sm mb-1">{pay.type}</Text>
                                        <Text className="text-slate-500 text-xs">{pay.date}</Text>
                                    </View>
                                    <Text className="text-emerald-400 font-bold text-sm">
                                        {pay.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
