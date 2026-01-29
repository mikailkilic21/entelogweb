import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, User, Box, TrendingUp, ShoppingCart } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useAuth } from '@/context/AuthContext';

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { isDemo } = useAuth();

    const [product, setProduct] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'transactions' | 'orders'

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [prodRes, ordersRes] = await Promise.all([
                    fetch(`${API_URL}/products/${id}`, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } }),
                    fetch(`${API_URL}/products/${id}/orders`, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } })
                ]);

                if (prodRes.ok) setProduct(await prodRes.json());
                if (ordersRes.ok) setOrders(await ordersRes.json());
            } catch (error) {
                console.error('Error fetching details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id, isDemo]);

    if (loading) {
        return (
            <View className="flex-1 bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#4f46e5" />
            </View>
        );
    }

    if (!product) {
        return (
            <View className="flex-1 bg-slate-950 items-center justify-center">
                <Text className="text-white">Ürün bulunamadı</Text>
            </View>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'transactions':
                return (
                    <View className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-6">
                        {product.transactions?.map((tr: any, index: number) => (
                            <View key={index} className="p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30">
                                <View className="flex-row justify-between mb-2">
                                    <Text className="text-slate-400 text-xs">{tr.date}</Text>
                                    <View className={`px-2 py-0.5 rounded ${tr.type === 'Satış' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                        <Text className={`text-xs font-bold ${tr.type === 'Satış' ? 'text-emerald-400' : 'text-rose-400'}`}>{tr.type}</Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center gap-2 mb-2">
                                    <User size={14} color="#818cf8" />
                                    <Text className="text-indigo-200 text-sm font-medium">{tr.accountName || 'Cari Yok'}</Text>
                                </View>
                                <View className="flex-row justify-between items-end">
                                    <View>
                                        <Text className="text-slate-500 text-xs">Fiş: {tr.ficheNo}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-white font-bold">{tr.quantity} {tr.unit || product.unit}</Text>
                                        <Text className="text-slate-400 text-xs">{tr.price?.toLocaleString('tr-TR')} ₺/br</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                        {(!product.transactions || product.transactions.length === 0) && (
                            <View className="p-8 items-center">
                                <Text className="text-slate-500">Hareket bulunamadı</Text>
                            </View>
                        )}
                    </View>
                );
            case 'orders':
                return (
                    <View className="space-y-4">
                        {orders.length > 0 && (
                            <View className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex-row justify-between items-center">
                                <View className="flex-row items-center gap-3">
                                    <ShoppingCart size={20} color="#34d399" />
                                    <Text className="text-emerald-100 font-medium">Bekleyen Toplam</Text>
                                </View>
                                <Text className="text-emerald-400 text-xl font-bold">
                                    {orders.reduce((acc, o) => acc + (o.quantity || 0), 0)}
                                </Text>
                            </View>
                        )}

                        <View className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden mb-6">
                            {orders.map((order, index) => (
                                <View key={index} className="p-4 border-b border-slate-800 last:border-0">
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-slate-400 text-xs">{order.date}</Text>
                                        <Text className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">Onaylı</Text>
                                    </View>
                                    <View className="flex-row items-center gap-2 mb-2">
                                        <User size={14} color="#818cf8" />
                                        <Text className="text-indigo-200 text-sm font-medium">{order.accountName}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-slate-500 text-xs font-mono">{order.orderNo}</Text>
                                        <Text className="text-white font-bold">{order.quantity} {order.unit}</Text>
                                    </View>
                                </View>
                            ))}
                            {orders.length === 0 && (
                                <View className="p-8 items-center">
                                    <Text className="text-slate-500">Bekleyen sipariş yok</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            case 'summary':
            default:
                return (
                    <View className="space-y-4">
                        {/* Info Card */}
                        <View className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <Text className="text-slate-400 text-xs uppercase mb-3 font-bold tracking-wider">Ürün Bilgileri</Text>
                            <View className="space-y-3">
                                <View className="flex-row justify-between border-b border-slate-800 pb-2">
                                    <Text className="text-slate-400">Marka</Text>
                                    <Text className="text-white font-medium">{product.brand || '-'}</Text>
                                </View>
                                <View className="flex-row justify-between border-b border-slate-800 pb-2">
                                    <Text className="text-slate-400">Birim</Text>
                                    <Text className="text-white font-medium">{product.unit || '-'}</Text>
                                </View>
                                <View className="flex-row justify-between border-b border-slate-800 pb-2">
                                    <Text className="text-slate-400">KDV</Text>
                                    <Text className="text-white font-medium">%{product.vat}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-slate-400">Üretici Kodu</Text>
                                    <Text className="text-white font-medium">{product.producerCode || '-'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Warehouses */}
                        <View className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                            <Text className="text-slate-400 text-xs uppercase mb-3 font-bold tracking-wider">Ambar Stokları</Text>
                            {product.warehouses?.length > 0 ? (
                                <View className="space-y-2">
                                    {product.warehouses.map((wh: any, idx: number) => (
                                        <View key={idx} className="flex-row justify-between items-center bg-slate-800/30 p-3 rounded-lg">
                                            <View className="flex-row items-center gap-2">
                                                <Box size={16} color="#94a3b8" />
                                                <Text className="text-slate-300">Ambar #{wh.warehouse}</Text>
                                            </View>
                                            <Text className={`font-bold ${wh.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {wh.amount}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <Text className="text-slate-500 italic">Ambar bilgisi yok</Text>
                            )}
                        </View>
                    </View>
                );
        }
    };

    return (
        <View className="flex-1 bg-slate-950">
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-4 py-3 flex-row items-center gap-3 border-b border-slate-800/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 bg-slate-800 rounded-full">
                        <ArrowLeft size={20} color="#e2e8f0" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg" numberOfLines={1}>{product.name}</Text>
                        <Text className="text-slate-400 text-xs font-mono">{product.code}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View className="flex-row px-4 py-4 gap-2">
                    <TouchableOpacity
                        onPress={() => setActiveTab('summary')}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${activeTab === 'summary' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <Box size={18} color={activeTab === 'summary' ? '#fff' : '#94a3b8'} />
                        <Text className={`text-xs mt-1 font-bold ${activeTab === 'summary' ? 'text-white' : 'text-slate-400'}`}>Özet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('transactions')}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${activeTab === 'transactions' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <TrendingUp size={18} color={activeTab === 'transactions' ? '#fff' : '#94a3b8'} />
                        <Text className={`text-xs mt-1 font-bold ${activeTab === 'transactions' ? 'text-white' : 'text-slate-400'}`}>Hareketler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('orders')}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${activeTab === 'orders' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="relative">
                            <ShoppingCart size={18} color={activeTab === 'orders' ? '#fff' : '#94a3b8'} />
                            {orders.length > 0 && <View className="absolute -top-1.5 -right-2 w-3 h-3 bg-rose-500 rounded-full" />}
                        </View>
                        <Text className={`text-xs mt-1 font-bold ${activeTab === 'orders' ? 'text-white' : 'text-slate-400'}`}>Siparişler</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView className="flex-1 px-4">
                    {renderTabContent()}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
