import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Banknote, ChevronLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';

import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

export default function ChecksScreen() {
    const { isDemo } = useAuth();
    const [selectedCheck, setSelectedCheck] = useState<any>(null);

    const [checks, setChecks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isListVisible, setIsListVisible] = useState(false);

    // Filters
    const [activeFilter, setActiveFilter] = useState<'customer' | 'own'>('customer');
    const [subFilter, setSubFilter] = useState<'all' | 'portfolio' | 'in_bank' | 'endorsed'>('all');

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/checks/stats`, {
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

    const fetchChecks = useCallback(async (search = '', type = 'customer', status = 'all') => {
        setLoading(true);
        try {
            let url = `${API_URL}/checks?limit=50`;
            if (search) url += `&search=${encodeURIComponent(search)}`;
            url += `&type=${type}`;

            if (status !== 'all') {
                url += `&status=${status}`;
            }

            const res = await fetch(url, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (res.ok) {
                const data = await res.json();
                setChecks(Array.isArray(data) ? data : []);
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

    // SubFilter Change Effect
    useEffect(() => {
        if (isListVisible) {
            fetchChecks(searchText, activeFilter, subFilter);
        }
    }, [subFilter, isListVisible, searchText, activeFilter, fetchChecks]);

    // Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchText.length > 2) {
                if (!isListVisible) setIsListVisible(true);
                fetchChecks(searchText, activeFilter, subFilter);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchText, isListVisible, activeFilter, subFilter, fetchChecks]);

    const handleBoxPress = (type: 'customer' | 'own') => {
        setActiveFilter(type);
        setSubFilter('all'); // Reset sub filter
        setSearchText('');
        setIsListVisible(true);
        fetchChecks('', type, 'all');
    };

    const handleSubFilterPress = (filter: 'all' | 'portfolio' | 'in_bank' | 'endorsed') => {
        setSubFilter(filter);
        setIsListVisible(true);
        // Effect triggers fetch
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
        if (isListVisible) fetchChecks(searchText, activeFilter, subFilter);
        else setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1 px-4 pt-4">
                {/* Header Title */}
                <View className="mb-6">
                    <Text className="text-3xl font-black text-white tracking-tight">Çek & Senet</Text>
                    <Text className="text-slate-400 text-sm font-medium">Finansal Enstrümanlar</Text>
                </View>

                {/* Search Bar */}
                <View className="mb-4 relative z-50">
                    <View className="flex-row items-center bg-slate-900 border border-slate-700/50 rounded-2xl h-14 px-4 shadow-lg shadow-black/50">
                        <Search size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Çek No, Cari Adı..."
                            placeholderTextColor="#64748b"
                            value={searchText}
                            onChangeText={setSearchText}
                            className="flex-1 ml-3 text-white text-lg font-medium h-full"
                        />
                    </View>
                </View>

                {/* Sub Filters (Customer Checks Only) */}
                {activeFilter === 'customer' && (
                    <View className="mb-4">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {[
                                { key: 'all', label: 'Tümü' },
                                { key: 'portfolio', label: 'Portföyde' },
                                { key: 'in_bank', label: 'Bankada' },
                                { key: 'endorsed', label: 'Cirolanmış' }
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.key}
                                    onPress={() => handleSubFilterPress(tab.key as any)}
                                    className={`px-4 py-2 rounded-full mr-2 border ${subFilter === tab.key ? 'bg-indigo-600 border-indigo-400' : 'bg-transparent border-slate-800'}`}
                                >
                                    <Text className={`text-xs font-bold uppercase ${subFilter === tab.key ? 'text-white' : 'text-slate-500'}`}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Dashboard Action Grid */}
                <View className="flex-row flex-wrap justify-between gap-y-3 mb-6">
                    {/* Customer Checks (Portfolio) */}
                    <TouchableOpacity
                        onPress={() => handleBoxPress('customer')}
                        activeOpacity={0.8}
                        className={`w-[48%] h-32 rounded-3xl p-4 justify-between border ${activeFilter === 'customer' && isListVisible ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className={`p-2 rounded-xl ${activeFilter === 'customer' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                                <ArrowDownLeft size={20} color={activeFilter === 'customer' && isListVisible ? '#fff' : '#818cf8'} />
                            </View>
                            {activeFilter === 'customer' && isListVisible && <View className="w-2 h-2 bg-white rounded-full" />}
                        </View>
                        <View>
                            <Text className={`text-lg font-black ${activeFilter === 'customer' && isListVisible ? 'text-white' : 'text-white'}`} numberOfLines={1} adjustsFontSizeToFit>
                                {(stats?.portfolio?.total || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </Text>
                            <Text className={`text-xs font-bold uppercase ${activeFilter === 'customer' && isListVisible ? 'text-indigo-100' : 'text-slate-500'}`}>Müşteri Çeki</Text>
                        </View>
                    </TouchableOpacity>

                    {/* ENDORSED Checks */}
                    <TouchableOpacity
                        onPress={() => handleBoxPress('own')}
                        activeOpacity={0.8}
                        className={`w-[48%] h-32 rounded-3xl p-4 justify-between border ${activeFilter === 'own' && isListVisible ? 'bg-rose-600 border-rose-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className="flex-row justify-between items-start">
                            <View className={`p-2 rounded-xl ${activeFilter === 'own' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                                <ArrowUpRight size={20} color={activeFilter === 'own' && isListVisible ? '#fff' : '#fb7185'} />
                            </View>
                            {activeFilter === 'own' && isListVisible && <View className="w-2 h-2 bg-white rounded-full" />}
                        </View>
                        <View>
                            {/* Note: Stats might need to separate Endorsed vs Own Issued. 
                                 Typically 'Endorsed' means we gave a customer check to someone else.
                                 'Own' means we wrote a check.
                                 If API separates them, use that. For now using 'endorsed' stat for the second box or just a generic 'Paid/Given' box.
                                 Let's label it 'Cirolanan' as per stats.
                             */}
                            <Text className={`text-lg font-black ${activeFilter === 'own' && isListVisible ? 'text-white' : 'text-white'}`} numberOfLines={1} adjustsFontSizeToFit>
                                {(stats?.endorsed?.total || 0).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                            </Text>
                            <Text className={`text-xs font-bold uppercase ${activeFilter === 'own' && isListVisible ? 'text-rose-100' : 'text-slate-500'}`}>Cirolanan / Çıkan</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Content Area */}
                {!isListVisible ? (
                    <View className="flex-1 justify-center items-center opacity-50 pb-20">
                        <Banknote size={64} color="#334155" />
                        <Text className="text-slate-500 mt-4 text-center px-10">
                            Çek/Senet listesini görmek için seçim yapın.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={checks}
                        renderItem={({ item, index }) => {
                            const isCheck = item.cardType === 1;
                            if (!item) return null;
                            return (
                                <Animated.View>
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => setSelectedCheck(item)}
                                        className="bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-3"
                                    >
                                        <View className="flex-row justify-between items-start mb-3">
                                            <View className="flex-1 mr-2">
                                                <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.accountName || item.clientName || 'Cari Yok'}</Text>
                                                <Text className="text-slate-500 text-[11px] font-medium">{item.portfolioNo} • {new Date(item.dueDate).toLocaleDateString('tr-TR')}</Text>
                                            </View>
                                            <View className={`px-2 py-1 rounded-lg ${isCheck ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                                                <Text className={`text-[10px] font-bold ${isCheck ? 'text-purple-400' : 'text-blue-400'}`}>
                                                    {isCheck ? 'ÇEK' : 'SENET'}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row justify-between items-center border-t border-slate-800 pt-3">
                                            <View>
                                                <Text className="text-slate-500 text-[10px] mb-0.5">{item.bankName || 'Banka Yok'}</Text>
                                                <Text className="text-slate-400 text-[10px] font-bold">{item.statusLabel || 'Durum Yok'}</Text>
                                            </View>
                                            <Text className={`font-black text-base ${isCheck ? 'text-purple-400' : 'text-blue-400'}`}>
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
                {/* Detail Modal */}
                <Modal
                    visible={!!selectedCheck}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedCheck(null)}
                >
                    <View className="flex-1 bg-black/80 justify-center items-center p-4">
                        {selectedCheck && (
                            <View className="bg-slate-900 w-full max-w-sm rounded-3xl border border-slate-800 overflow-hidden">
                                <View className="p-5 border-b border-slate-800 flex-row justify-between items-center bg-slate-800/50">
                                    <View>
                                        <Text className="text-white font-bold text-lg">Çek Detayı</Text>
                                        <Text className="text-slate-400 text-xs font-mono">{selectedCheck.portfolioNo}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedCheck(null)} className="p-2 bg-slate-800 rounded-full">
                                        <ChevronLeft size={20} color="white" style={{ transform: [{ rotate: '-90deg' }] }} />
                                    </TouchableOpacity>
                                </View>

                                <View className="p-6 space-y-4">
                                    <View>
                                        <Text className="text-slate-500 text-xs mb-1">Cari Hesap</Text>
                                        <Text className="text-white font-bold text-base mb-2">{selectedCheck.fromCompany || selectedCheck.clientName || 'İsimsiz'}</Text>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-xs mb-1">Seri No</Text>
                                            <Text className="text-slate-300 font-mono">{selectedCheck.serialNo || '-'}</Text>
                                        </View>
                                        <View className="flex-1 items-end">
                                            <Text className="text-slate-500 text-xs mb-1">Vade Tarihi</Text>
                                            <Text className="text-white font-bold">{new Date(selectedCheck.dueDate).toLocaleDateString('tr-TR')}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-xs mb-1">Banka</Text>
                                            <Text className="text-slate-300">{selectedCheck.bankName || '-'}</Text>
                                        </View>
                                        <View className="flex-1 items-end">
                                            <Text className="text-slate-500 text-xs mb-1">Durum</Text>
                                            <View className={`px-2 py-0.5 rounded ${selectedCheck.isRollover === 1 ? 'bg-amber-500/20' : 'bg-slate-800'}`}>
                                                <Text className={`text-xs font-bold ${selectedCheck.isRollover === 1 ? 'text-amber-400' : 'text-slate-300'}`}>
                                                    {selectedCheck.isRollover === 1 ? 'DEVİR' : 'Yeni Dönem'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="pt-4 border-t border-slate-800 mt-2">
                                        <Text className="text-slate-500 text-xs mb-1 text-center uppercase">Tutar</Text>
                                        <Text className="text-white font-black text-3xl text-center">
                                            {selectedCheck.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setSelectedCheck(null)}
                                    className="bg-slate-800 p-4 items-center border-t border-slate-700 m-4 rounded-xl"
                                >
                                    <Text className="text-white font-bold">Kapat</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
