import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, ShoppingCart, Plus, Clock, CheckCircle } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import Animated from 'react-native-reanimated';

// Helper to prevent Object rendering crash
const safeText = (text: any) => {
    if (text === null || text === undefined) return '';
    if (typeof text === 'object') {
        return text.name || text.title || text.label || text.toString() || '';
    }
    return String(text);
};

export default function OrdersScreen() {
    const { isDemo } = useAuth();
    const router = useRouter();

    // UI State
    const [orders, setOrders] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isListVisible, setIsListVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'proposal' | 'approved'>('all');
    const [shipmentStatus, setShipmentStatus] = useState<'all' | 'waiting' | 'partial' | 'closed'>('all');
    const [period, setPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/orders/stats`, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, [isDemo]);

    const fetchOrders = useCallback(async (search = '', filter = 'all', timePeriod = 'daily', shipment = 'all') => {
        setLoading(true);
        try {
            let url = `${API_URL}/orders?limit=50`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            if (filter !== 'all') url += `&status=${filter}`;
            if (filter === 'approved' && shipment !== 'all') url += `&shipmentStatus=${shipment}`;

            if (timePeriod !== 'all') url += `&period=${timePeriod}`;

            const res = await fetch(url, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isDemo]);

    // Initial Load: Only Stats
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Period & Filter changes
    useEffect(() => {
        if (isListVisible) {
            fetchOrders(searchText, activeFilter, period, shipmentStatus);
        }
    }, [activeFilter, period, shipmentStatus, isListVisible, searchText, fetchOrders]);

    // Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchText.length > 2) {
                if (!isListVisible) setIsListVisible(true);
                fetchOrders(searchText, activeFilter, period, shipmentStatus);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchText, isListVisible, activeFilter, period, shipmentStatus, fetchOrders]);

    const handleBoxPress = (filterType: 'all' | 'proposal' | 'approved') => {
        setActiveFilter(filterType);
        // Reset shipment details when switching main filter, unless clicking approved again?
        if (filterType !== 'approved') setShipmentStatus('all');

        setSearchText('');
        setIsListVisible(true);
    };

    const handlePeriodPress = (p: 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly') => {
        setPeriod(p);
        setIsListVisible(true);
    };

    const handleShipmentFilter = (s: 'all' | 'waiting' | 'partial' | 'closed') => {
        setShipmentStatus(s);
    }

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
        if (isListVisible) fetchOrders(searchText, activeFilter, period, shipmentStatus);
        else setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1 px-4 pt-4">
                {/* Header Title */}
                <View className="mb-6 flex-row justify-between items-center">
                    <View>
                        <Text className="text-3xl font-black text-white tracking-tight">Siparişler</Text>
                        <Text className="text-slate-400 text-sm font-medium">Satış ve Sevkiyat</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/orders/create')}
                        className="bg-blue-600 p-3 rounded-full shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View className="mb-4 relative z-50">
                    <View className="flex-row items-center bg-slate-900 border border-slate-700/50 rounded-2xl h-14 px-4 shadow-lg shadow-black/50">
                        <Search size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Sipariş No, Müşteri..."
                            placeholderTextColor="#64748b"
                            value={searchText}
                            onChangeText={setSearchText}
                            className="flex-1 ml-3 text-white text-lg font-medium h-full"
                        />
                    </View>
                </View>

                {/* Period Filter (Pills) */}
                <View className="mb-4">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                        {['daily', 'weekly', 'monthly', 'yearly', 'all'].map((p) => (
                            <TouchableOpacity
                                key={p}
                                onPress={() => handlePeriodPress(p as any)}
                                className={`px-4 py-2 rounded-full mr-2 border ${period === p ? 'bg-slate-800 border-slate-600' : 'bg-transparent border-slate-800'}`}
                            >
                                <Text className={`text-xs font-bold uppercase ${period === p ? 'text-white' : 'text-slate-500'}`}>
                                    {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : p === 'yearly' ? 'Yıllık' : 'Tümü'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Dashboard Action Grid */}
                <View className="flex-row justify-between gap-3 mb-6">
                    {/* All Box */}
                    <TouchableOpacity
                        onPress={() => handleBoxPress('all')}
                        activeOpacity={0.8}
                        className={`flex-1 h-32 rounded-3xl p-3 justify-between border ${activeFilter === 'all' && isListVisible ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className={`p-2 rounded-xl ${activeFilter === 'all' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                                <ShoppingCart size={20} color={activeFilter === 'all' && isListVisible ? '#fff' : '#818cf8'} />
                            </View>
                            {activeFilter === 'all' && isListVisible && <View className="w-2 h-2 bg-white rounded-full" />}
                        </View>
                        <View>
                            <Text className={`text-2xl font-black ${activeFilter === 'all' && isListVisible ? 'text-white' : 'text-white'}`}>
                                {stats?.totalOrders || 0}
                            </Text>
                            <Text className={`text-[10px] font-bold uppercase ${activeFilter === 'all' && isListVisible ? 'text-indigo-100' : 'text-slate-500'}`} numberOfLines={1}>Toplam</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Proposal Box */}
                    <TouchableOpacity
                        onPress={() => handleBoxPress('proposal')}
                        activeOpacity={0.8}
                        className={`flex-1 h-32 rounded-3xl p-3 justify-between border ${activeFilter === 'proposal' && isListVisible ? 'bg-amber-600 border-amber-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className={`p-2 rounded-xl ${activeFilter === 'proposal' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                                <Clock size={20} color={activeFilter === 'proposal' && isListVisible ? '#fff' : '#fbbf24'} />
                            </View>
                            {activeFilter === 'proposal' && isListVisible && <View className="w-2 h-2 bg-white rounded-full" />}
                        </View>
                        <View>
                            <Text className={`text-2xl font-black ${activeFilter === 'proposal' && isListVisible ? 'text-white' : 'text-white'}`}>
                                {stats?.proposalCount || 0}
                            </Text>
                            <Text className={`text-[10px] font-bold uppercase ${activeFilter === 'proposal' && isListVisible ? 'text-amber-100' : 'text-slate-500'}`} numberOfLines={1}>Bekleyen</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Approved Box */}
                    <TouchableOpacity
                        onPress={() => handleBoxPress('approved')}
                        activeOpacity={0.8}
                        className={`flex-1 h-32 rounded-3xl p-3 justify-between border ${activeFilter === 'approved' && isListVisible ? 'bg-emerald-600 border-emerald-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className={`p-2 rounded-xl ${activeFilter === 'approved' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                                <CheckCircle size={20} color={activeFilter === 'approved' && isListVisible ? '#fff' : '#34d399'} />
                            </View>
                            {activeFilter === 'approved' && isListVisible && <View className="w-2 h-2 bg-white rounded-full" />}
                        </View>
                        <View>
                            <Text className={`text-2xl font-black ${activeFilter === 'approved' && isListVisible ? 'text-white' : 'text-white'}`}>
                                {stats?.approvedCount || 0}
                            </Text>
                            <Text className={`text-[10px] font-bold uppercase ${activeFilter === 'approved' && isListVisible ? 'text-emerald-100' : 'text-slate-500'}`} numberOfLines={1}>Onaylı</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Secondary Filter for Approved (Shipment Status) */}
                {activeFilter === 'approved' && isListVisible && (
                    <View className="mb-4 flex-row justify-between bg-slate-900 p-1 rounded-xl">
                        {[
                            { key: 'all', label: 'Tümü' },
                            { key: 'waiting', label: 'Bekleyen' },
                            { key: 'partial', label: 'Kısmi' },
                            { key: 'closed', label: 'Kapandı' } // or Tamamlanan
                        ].map((s) => (
                            <TouchableOpacity
                                key={s.key}
                                onPress={() => handleShipmentFilter(s.key as any)}
                                className={`flex-1 py-2 items-center rounded-lg ${shipmentStatus === s.key ? 'bg-slate-800' : 'bg-transparent'}`}
                            >
                                <Text className={`text-xs font-bold ${shipmentStatus === s.key ? 'text-white' : 'text-slate-500'}`}>
                                    {s.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Content Area */}
                {!isListVisible ? (
                    <View className="flex-1 justify-center items-center opacity-50 pb-20">
                        <ShoppingCart size={64} color="#334155" />
                        <Text className="text-slate-500 mt-4 text-center px-10">
                            Siparişleri listelemek için kategori seçin veya arama yapın.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={({ item, index }) => {
                            if (!item) return null;
                            return (
                                <Animated.View key={item.id}>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => router.push(`/orders/${item.id}`)}
                                        className="bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-3"
                                    >
                                        <View className="flex-row justify-between items-start mb-2">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-white font-bold text-base mb-0.5">{safeText(item.accountName || item.customer) || 'Müşteri Yok'}</Text>
                                                <Text className="text-slate-500 text-xs font-medium">{safeText(item.ficheNo) || item.id} • {new Date(item.date).toLocaleDateString('tr-TR')}</Text>
                                            </View>
                                            <View className="items-end gap-1">
                                                <View className={`px-2 py-1 rounded-lg ${item.status === 'approved' || item.status === 4 ? 'bg-emerald-500/10' :
                                                    item.status === 'proposal' || item.status === 1 ? 'bg-amber-500/10' : 'bg-slate-800'
                                                    }`}>
                                                    <Text className={`text-[10px] font-bold uppercase ${item.status === 'approved' || item.status === 4 ? 'text-emerald-400' :
                                                        item.status === 'proposal' || item.status === 1 ? 'text-amber-400' : 'text-slate-400'
                                                        }`}>
                                                        {item.status === 'approved' || item.status === 4 ? 'ONAYLI' : item.status === 'proposal' || item.status === 1 ? 'ÖNERİ' : 'TASLAK'}
                                                    </Text>
                                                </View>

                                                {/* Shipment Status Badge if Approved */}
                                                {(item.status === 'approved' || item.status === 4) && item.shipmentStatus && (
                                                    <View className={`px-2 py-0.5 rounded ${item.shipmentStatus === 'waiting' ? 'bg-red-500/10' :
                                                        item.shipmentStatus === 'partial' ? 'bg-orange-500/10' :
                                                            item.shipmentStatus === 'closed' ? 'bg-blue-500/10' : 'bg-slate-700'
                                                        }`}>
                                                        <Text className={`text-[9px] font-bold uppercase ${item.shipmentStatus === 'waiting' ? 'text-red-400' :
                                                            item.shipmentStatus === 'partial' ? 'text-orange-400' :
                                                                item.shipmentStatus === 'closed' ? 'text-blue-400' : 'text-slate-400'
                                                            }`}>
                                                            {item.shipmentStatus === 'waiting' ? 'BEKLİYOR' :
                                                                item.shipmentStatus === 'partial' ? 'KISMI' :
                                                                    item.shipmentStatus === 'closed' ? 'KAPANDI' : item.shipmentStatus}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                        {/* Financial Details Row */}
                                        <View className="border-t border-slate-800 pt-3 flex-row justify-between items-end">
                                            {/* Left: Summary or Discount Badge */}
                                            <View>
                                                <Text className="text-slate-500 text-[10px] mb-1">
                                                    {item.itemCount || 1} Kalem Ürün
                                                </Text>
                                                {item.totalDiscount > 0 && (
                                                    <View className="bg-red-500/10 px-1.5 py-0.5 rounded self-start border border-red-500/20">
                                                        <Text className="text-red-400 text-[10px] font-bold">
                                                            İskonto: {Number(item.totalDiscount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            {/* Right: Totals */}
                                            <View className="items-end">
                                                {/* If there is a discount, show Gross Total crossed out? Or just Net? */}
                                                {item.totalDiscount > 0 && (
                                                    <Text className="text-slate-500 text-xs line-through mb-0.5">
                                                        Brüt: {Number(item.grossTotal || (item.netTotal + item.totalDiscount)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                    </Text>
                                                )}

                                                {/* Main Amount (Genel Toplam) */}
                                                <Text className="font-black text-lg text-blue-400">
                                                    {Number(item.genelToplam || item.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                </Text>

                                                {/* VAT Info */}
                                                <Text className="text-slate-600 text-[9px] font-medium">
                                                    {Number(item.totalVat || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ KDV Dahil
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        }}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-slate-500">Sipariş bulunamadı</Text>}
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
