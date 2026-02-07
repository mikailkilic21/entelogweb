import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, TrendingUp, TrendingDown, Calendar, Filter, FileText, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

export default function InvoicesScreen() {
    const { isDemo } = useAuth();
    const router = useRouter();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');

    // New Filters
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [type, setType] = useState<'all' | 'sales' | 'purchases'>('all');

    const fetchData = useCallback(async () => {
        try {
            // Fetch Stats with filters
            let statsUrl = `${API_URL}/invoices/stats?period=${period}`;
            if (searchText) statsUrl += `&search=${encodeURIComponent(searchText)}`;
            const statsRes = await fetch(statsUrl, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (statsRes.ok) setStats(await statsRes.json());

            // Fetch Invoices with filters
            let url = `${API_URL}/invoices?limit=50&period=${period}`;
            if (type !== 'all') url += `&type=${type}`;
            if (searchText) url += `&search=${encodeURIComponent(searchText)}`;

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
    }, [searchText, period, type]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);
    }, [searchText, period, type]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderHeader = () => (
        <View className="mb-4">
            {/* Period Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-10">
                {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                    <TouchableOpacity
                        key={p}
                        onPress={() => setPeriod(p as any)}
                        className={`px-4 py-2 rounded-lg mr-2 border ${period === p
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-slate-800/60 border-slate-700/50'
                            }`}
                    >
                        <Text className={`${period === p ? 'text-white font-bold' : 'text-slate-400 font-medium'} capitalize text-xs`}>
                            {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Type Filter Tabs */}
            <View className="flex-row bg-slate-900/50 p-1 rounded-xl mb-4 border border-slate-800">
                {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'sales', label: 'Satışlar' },
                    { key: 'purchase', label: 'Alışlar' }
                ].map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        onPress={() => setType(t.key as any)}
                        className={`flex-1 py-2 rounded-lg items-center ${type === t.key ?
                            (t.key === 'sales' ? 'bg-blue-600' : t.key === 'purchase' ? 'bg-rose-600' : 'bg-slate-700')
                            : 'bg-transparent'}`}
                    >
                        <Text className={`text-xs font-bold ${type === t.key ? 'text-white' : 'text-slate-400'}`}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Stats Cards */}
            {stats && (
                <View className="flex-row gap-3">
                    {(type === 'all' || type === 'sales') && (
                        <LinearGradient colors={['#1e40af', '#1e3a8a']} className="flex-1 p-3 rounded-xl border border-blue-500/30">
                            <View className="flex-row items-center gap-2 mb-2">
                                <ArrowUpRight size={16} color="#93c5fd" />
                                <Text className="text-blue-200 text-xs">Toplam Satış</Text>
                            </View>
                            <Text className="text-white font-bold text-base" numberOfLines={1} adjustsFontSizeToFit>
                                {(stats.totalSales || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                            </Text>
                        </LinearGradient>
                    )}

                    {(type === 'all' || type === 'purchase') && (
                        <LinearGradient colors={['#9f1239', '#881337']} className="flex-1 p-3 rounded-xl border border-rose-500/30">
                            <View className="flex-row items-center gap-2 mb-2">
                                <ArrowDownLeft size={16} color="#fca5a5" />
                                <Text className="text-rose-200 text-xs">Toplam Alış</Text>
                            </View>
                            <Text className="text-white font-bold text-base" numberOfLines={1} adjustsFontSizeToFit>
                                {(stats.totalPurchases || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                            </Text>
                        </LinearGradient>
                    )}
                </View>
            )}
        </View>
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isSales = item.type === 'Satış' || item.type === 8 || item.type === 9 || (item.trcode >= 6 && item.trcode <= 10);

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/invoices/${item.id}`)}
                    className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3"
                >
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 mr-2">
                            <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.customer || 'Cari Yok'}</Text>
                            <View className="flex-row items-center gap-2 flex-wrap">
                                <View className="bg-slate-800 px-1.5 py-0.5 rounded">
                                    <Text className="text-slate-400 text-[10px] font-mono">{item.ficheNo}</Text>
                                </View>
                                <Text className="text-slate-500 text-[10px]">{new Date(item.date).toLocaleDateString('tr-TR')}</Text>
                            </View>
                        </View>
                        <View className={`p-1.5 rounded-lg ${isSales ? 'bg-blue-500/10' : 'bg-rose-500/10'}`}>
                            {isSales ? <ArrowUpRight size={16} color="#60a5fa" /> : <ArrowDownLeft size={16} color="#fb7185" />}
                        </View>
                    </View>

                    <View className="flex-row justify-between items-end mt-2 pt-2 border-t border-slate-800/50">
                        <View>
                            <Text className="text-slate-500 text-[10px] mb-0.5">{item.gibStatus || 'Kağıt'}</Text>
                            <Text className={`text-[10px] ${item.paymentStatus === 'Kapalı' ? 'text-emerald-400' : 'text-amber-400'}`}>{item.paymentStatus || 'Açık'}</Text>
                        </View>
                        <Text className={`font-bold text-base ${isSales ? 'text-blue-400' : 'text-rose-400'}`}>
                            {item.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1 px-4 pt-2">
                <View className="flex-row items-center gap-3 mb-6">
                    <Image
                        source={require('../../assets/images/siyahlogo.png')}
                        style={{ width: 40, height: 40, borderRadius: 10 }}
                        resizeMode="contain"
                    />
                    <View>
                        <Text className="text-3xl font-black text-white">Faturalar</Text>
                        <Text className="text-slate-400 text-[10px] font-medium tracking-wide uppercase">Entelog Mobile</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-slate-900 border border-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Fatura No veya Cari ara..."
                        placeholderTextColor="#64748b"
                        value={searchText}
                        onChangeText={setSearchText}
                        className="flex-1 ml-3 text-white font-medium"
                    />
                </View>

                {loading && !refreshing && !invoices.length ? (
                    <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                ) : (
                    <FlatList
                        data={invoices}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <FileText size={64} color="#334155" />
                                <Text className="text-slate-500 mt-4 font-medium">Kayıt bulunamadı</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
