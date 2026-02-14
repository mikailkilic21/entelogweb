import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

export default function InvoicesScreen() {
    const { isDemo } = useAuth();
    const router = useRouter();

    // UI State
    const [invoices, setInvoices] = useState<any[]>([]);
    const [searchText, setSearchText] = useState('');
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isListVisible, setIsListVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'sales' | 'purchases'>('all');
    const [period, setPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/invoices/stats`, {
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

    const fetchInvoices = useCallback(async (search = '', filter = 'all', timePeriod = 'daily') => {
        setLoading(true);
        try {
            let url = `${API_URL}/invoices?limit=50`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            if (filter === 'sales') url += `&type=sales`;
            if (filter === 'purchases') url += `&type=purchases`;

            if (timePeriod !== 'all') url += `&period=${timePeriod}`;

            const res = await fetch(url, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (res.ok) {
                const data = await res.json();
                setInvoices(Array.isArray(data) ? data : []);
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
            fetchInvoices(searchText, activeFilter, period);
        }
    }, [activeFilter, period, isListVisible, searchText, fetchInvoices]);

    // Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchText.length > 2) {
                if (!isListVisible) setIsListVisible(true);
                fetchInvoices(searchText, activeFilter, period);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchText, isListVisible, activeFilter, period, fetchInvoices]);

    const handleBoxPress = (filterType: 'all' | 'sales' | 'purchases') => {
        setActiveFilter(filterType);
        setSearchText('');
        setIsListVisible(true);
        // fetchInvoices triggered by effect
    };

    const handlePeriodPress = (p: 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly') => {
        setPeriod(p);
        setIsListVisible(true);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
        if (isListVisible) fetchInvoices(searchText, activeFilter, period);
        else setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1 px-4 pt-4">
                {/* Header Title */}
                <View className="mb-6">
                    <Text className="text-3xl font-black text-white tracking-tight">Faturalar</Text>
                    <Text className="text-slate-400 text-sm font-medium">Finansal Hareketler</Text>
                </View>

                {/* Search Bar */}
                <View className="mb-4 relative z-50">
                    <View className="flex-row items-center bg-slate-900 border border-slate-700/50 rounded-2xl h-14 px-4 shadow-lg shadow-black/50">
                        <Search size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Fatura No, Cari Adı..."
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
                <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
                    {/* Sales Box */}
                    <TouchableOpacity
                        onPress={() => handleBoxPress('sales')}
                        activeOpacity={0.8}
                        className={`w-[48%] h-32 rounded-3xl p-4 justify-between border ${activeFilter === 'sales' && isListVisible ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className={`p-2 rounded-xl ${activeFilter === 'sales' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                                <ArrowUpRight size={20} color={activeFilter === 'sales' && isListVisible ? '#fff' : '#60a5fa'} />
                            </View>
                            {activeFilter === 'sales' && isListVisible && <View className="w-2 h-2 bg-white rounded-full" />}
                        </View>
                        <View>
                            <Text className={`text-lg font-black ${activeFilter === 'sales' && isListVisible ? 'text-white' : 'text-white'}`} numberOfLines={1} adjustsFontSizeToFit>
                                {(stats?.totalSales || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </Text>
                            <Text className={`text-xs font-bold uppercase ${activeFilter === 'sales' && isListVisible ? 'text-blue-100' : 'text-slate-500'}`}>Toplam Satış</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Purchases Box */}
                    <TouchableOpacity
                        onPress={() => handleBoxPress('purchases')}
                        activeOpacity={0.8}
                        className={`w-[48%] h-32 rounded-3xl p-4 justify-between border ${activeFilter === 'purchases' && isListVisible ? 'bg-rose-600 border-rose-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className={`p-2 rounded-xl ${activeFilter === 'purchases' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                                <ArrowDownLeft size={20} color={activeFilter === 'purchases' && isListVisible ? '#fff' : '#fb7185'} />
                            </View>
                            {activeFilter === 'purchases' && isListVisible && <View className="w-2 h-2 bg-white rounded-full" />}
                        </View>
                        <View>
                            <Text className={`text-lg font-black ${activeFilter === 'purchases' && isListVisible ? 'text-white' : 'text-white'}`} numberOfLines={1} adjustsFontSizeToFit>
                                {(stats?.totalPurchases || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </Text>
                            <Text className={`text-xs font-bold uppercase ${activeFilter === 'purchases' && isListVisible ? 'text-rose-100' : 'text-slate-500'}`}>Toplam Alış</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Content Area */}
                {!isListVisible ? (
                    <View className="flex-1 justify-center items-center opacity-50 pb-20">
                        <FileText size={64} color="#334155" />
                        <Text className="text-slate-500 mt-4 text-center px-10">
                            Fatura detaylarını görmek için seçim yapın veya arayın.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={invoices}
                        renderItem={({ item, index }) => {
                            const isSales = item.type === 'Satış' || item.type === 8 || item.type === 9 || (item.trcode >= 6 && item.trcode <= 10);
                            if (!item) return null;
                            return (
                                <Animated.View>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => router.push(`/invoices/${item.id}`)}
                                        className="bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-3"
                                    >
                                        <View className="flex-row justify-between items-start mb-3">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.customer || 'Cari Yok'}</Text>
                                                <Text className="text-slate-500 text-[11px] font-medium">{item.ficheNo} • {new Date(item.date).toLocaleDateString('tr-TR')}</Text>
                                            </View>
                                            <View className={`w-8 h-8 rounded-full items-center justify-center ${isSales ? 'bg-blue-500/10' : 'bg-rose-500/10'}`}>
                                                {isSales ? <ArrowUpRight size={16} color="#60a5fa" /> : <ArrowDownLeft size={16} color="#fb7185" />}
                                            </View>
                                        </View>

                                        <View className="flex-row justify-between items-center border-t border-slate-800 pt-3">
                                            <View className={`px-2 py-1 rounded-lg ${item.paymentStatus === 'Kapalı' ? 'bg-emerald-500/10' : 'bg-slate-800'}`}>
                                                <Text className={`text-[10px] font-bold ${item.paymentStatus === 'Kapalı' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                    {item.paymentStatus === 'Kapalı' ? 'ÖDENDİ' : 'AÇIK'}
                                                </Text>
                                            </View>
                                            <Text className={`font-black text-base ${isSales ? 'text-blue-400' : 'text-rose-400'}`}>
                                                {Number(item.amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </Text>
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
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-slate-500">Kayıt bulunamadı</Text>}
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
