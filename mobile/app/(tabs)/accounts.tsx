import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Building2 } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import AccountItem from '@/components/AccountItem';

import { Account } from '@/types';

export default function AccountsScreen() {
    const { isDemo } = useAuth();
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
    const fetchData = useCallback(async () => {
        try {
            // Stats fetch
            const statsRes = await fetch(`${API_URL}/accounts/stats`, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Accounts fetch with listingType
            let url = `${API_URL}/accounts?limit=50&listingType=${activeTab}`;
            if (searchText) url += `&search=${encodeURIComponent(searchText)}`;

            const accRes = await fetch(url, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (accRes.ok) {
                const accData = await accRes.json();
                setAccounts(Array.isArray(accData) ? accData : []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            if (activeTab) {
                Alert.alert('Hata', 'Sunucuya bağlanılamadı via VPN (192.168.1.200). Lütfen bağlantınızı kontrol edin. Detay: ' + (error as Error).message);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, searchText, isDemo]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderHeader = () => (
        <View className="mb-4">
            {/* Employer Insights - Top Lists */}
            {stats && (
                <View className="mb-6 space-y-4">
                    {/* Top Debtors (Receivables) */}
                    <View>
                        <View className="flex-row items-center justify-between mb-2 px-1">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">En Çok Bize Borçlu Olanlar</Text>
                            <Text className="text-emerald-400 text-xs font-bold">Toplam Alacak: {(stats.totalReceivables || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {stats.topDebtors?.map((item: any, index: number) => (
                                <Animated.View key={index} entering={FadeInDown.delay(index * 100).springify()} className="mr-3">
                                    <View className="bg-slate-900 border border-slate-800 p-3 rounded-xl w-48">
                                        <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.name}</Text>
                                        <Text className="text-emerald-400 font-bold text-lg">
                                            {item.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                        </Text>
                                    </View>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Top Creditors (Payables) */}
                    <View>
                        <View className="flex-row items-center justify-between mb-2 px-1">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">En Çok Borcumuz Olanlar</Text>
                            <Text className="text-rose-400 text-xs font-bold">Toplam Borç: {(stats.totalPayables || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {stats.topCreditors?.map((item: any, index: number) => (
                                <Animated.View key={index} entering={FadeInDown.delay(index * 100).springify()} className="mr-3">
                                    <View className="bg-slate-900 border border-slate-800 p-3 rounded-xl w-48">
                                        <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.name}</Text>
                                        <Text className="text-rose-400 font-bold text-lg">
                                            {Math.abs(item.value).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                        </Text>
                                    </View>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
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

    const renderItem = useCallback(({ item, index }: { item: Account, index: number }) => (
        <AccountItem item={item} index={index} />
    ), []);

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
