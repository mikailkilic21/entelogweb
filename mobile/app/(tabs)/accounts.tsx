import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Briefcase, CreditCard, TrendingUp, TrendingDown, Users, Building2, ChevronRight } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AccountsScreen() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'debtor' | 'creditor'>('all');
    const [searchText, setSearchText] = useState('');

    const fetchData = useCallback(async () => {
        try {
            // Stats fetch
            const statsRes = await fetch(`${API_URL}/accounts/stats`);
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Accounts fetch with listingType
            let url = `${API_URL}/accounts?limit=50&listingType=${activeTab}`;
            if (searchText) url += `&search=${encodeURIComponent(searchText)}`;

            const accRes = await fetch(url);
            if (accRes.ok) {
                const accData = await accRes.json();
                setAccounts(Array.isArray(accData) ? accData : []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, searchText]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [activeTab, searchText]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderHeader = () => (
        <View className="mb-4">
            {/* Stats Cards - Horizontal Scroll */}
            {stats && (
                <FlatList
                    horizontal
                    data={[
                        { label: 'Toplam Müşteri', value: stats.totalCustomers, icon: Users, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                        { label: 'Toplam Tedarikçi', value: stats.totalSuppliers, icon: Building2, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
                        {
                            label: 'Toplam Alacak',
                            value: (stats.totalReceivables || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
                            icon: TrendingUp,
                            color: '#22c55e',
                            bg: 'rgba(34, 197, 94, 0.1)'
                        },
                        {
                            label: 'Toplam Borç',
                            value: (stats.totalPayables || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
                            icon: TrendingDown,
                            color: '#ef4444',
                            bg: 'rgba(239, 68, 68, 0.1)'
                        },
                    ]}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.label}
                    renderItem={({ item, index }) => (
                        <Animated.View incoming={FadeInDown.delay(index * 100).springify()} className="mr-3">
                            <LinearGradient
                                colors={['#1e293b', '#0f172a']}
                                className="p-4 rounded-xl border border-slate-800 w-40"
                            >
                                <View className="flex-row items-center gap-2 mb-2">
                                    <View style={{ backgroundColor: item.bg, padding: 6, borderRadius: 8 }}>
                                        <item.icon size={16} color={item.color} />
                                    </View>
                                </View>
                                <Text className="text-slate-400 text-xs font-medium">{item.label}</Text>
                                <Text className="text-white font-bold text-lg mt-1" numberOfLines={1} adjustsFontSizeToFit>
                                    {item.value}
                                </Text>
                            </LinearGradient>
                        </Animated.View>
                    )}
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                />
            )}

            {/* Filters */}
            <View className="flex-row mt-6 gap-2">
                {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'debtor', label: 'Borçlular' },
                    { key: 'creditor', label: 'Alacaklılar' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key as any)}
                        className={`px-4 py-2 rounded-lg border ${activeTab === tab.key
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-slate-900 border-slate-800'
                            }`}
                    >
                        <Text className={`text-sm font-medium ${activeTab === tab.key ? 'text-white' : 'text-slate-400'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <TouchableOpacity
                onPress={() => router.push(`/account/${item.id}`)}
                className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3 flex-row items-center"
            >
                <View className={`p-3 rounded-xl mr-4 ${item.cardType === 1 ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                    <Building2 size={24} color={item.cardType === 1 ? '#60a5fa' : '#c084fc'} />
                </View>

                <View className="flex-1">
                    <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-slate-500 text-xs font-mono mt-1">{item.code}</Text>
                    <Text className="text-slate-400 text-xs mt-1">
                        {[item.town, item.city].filter(Boolean).join(' / ')}
                    </Text>
                </View>

                <View className="items-end">
                    <Text className={`font-bold ${item.balance > 0 ? 'text-green-400' : item.balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {Math.abs(item.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                    <Text className="text-xs text-slate-500 mt-1">
                        {item.balance > 0 ? 'Alacak' : item.balance < 0 ? 'Borç' : '-'}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <SafeAreaView className="flex-1 px-4 pt-2">
                <View className="flex-row items-center gap-3 mb-6">
                    <Image
                        source={require('../../assets/images/siyahlogo.png')}
                        style={{ width: 40, height: 40, borderRadius: 10 }}
                        resizeMode="contain"
                    />
                    <View>
                        <Text className="text-3xl font-black text-white">Cariler</Text>
                        <Text className="text-slate-400 text-[10px] font-medium tracking-wide uppercase">Entelog Mobile</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-slate-900 border border-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Cari hesap ara..."
                        placeholderTextColor="#64748b"
                        value={searchText}
                        onChangeText={setSearchText}
                        className="flex-1 ml-3 text-white font-medium"
                    />
                </View>

                {loading && !refreshing && !accounts.length ? (
                    <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                ) : (
                    <FlatList
                        data={accounts}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <Building2 size={64} color="#334155" />
                                <Text className="text-slate-500 mt-4 font-medium">Kayıt bulunamadı</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
