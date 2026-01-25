import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Banknote, Calendar, ChevronLeft } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ChecksScreen() {
    const [selectedCheck, setSelectedCheck] = useState<any>(null);

    const router = useRouter();
    const [checks, setChecks] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Filters
    const [period, setPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
    const [checkType, setCheckType] = useState<'customer' | 'own'>('customer');
    const [customerStatus, setCustomerStatus] = useState<'all' | 'portfolio' | 'in_bank' | 'endorsed' | 'overdue'>('all');

    const fetchData = useCallback(async () => {
        try {
            // Stats might be global, leaving as is for now
            const statsRes = await fetch(`${API_URL}/checks/stats`);
            if (statsRes.ok) setStats(await statsRes.json());

            let url = `${API_URL}/checks?limit=50&search=${encodeURIComponent(searchText)}`;
            url += `&period=${period}`;
            url += `&type=${checkType}`;
            if (checkType === 'customer' && customerStatus !== 'all') {
                url += `&status=${customerStatus}`;
            }

            const res = await fetch(url);
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
    }, [searchText, period, checkType, customerStatus]);

    useEffect(() => {
        setChecks([]); // Clear old data to prevent flash of wrong content
        setLoading(true);
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);
    }, [searchText, period, checkType, customerStatus]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderHeader = () => (
        <View className="mb-4">
            {/* Stats Cards */}
            {stats && (
                <View className="mb-6">
                    <View className="flex-row gap-2 mb-2">
                        <LinearGradient colors={['#4338ca', '#3730a3']} className="flex-1 p-3 rounded-xl border border-indigo-500/30">
                            <Text className="text-indigo-200 text-[10px] mb-1">Portföydeki</Text>
                            <Text className="text-white font-bold text-base" numberOfLines={1} adjustsFontSizeToFit>
                                {(stats.portfolio?.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                            </Text>
                        </LinearGradient>
                        <LinearGradient colors={['#15803d', '#14532d']} className="flex-1 p-3 rounded-xl border border-green-500/30">
                            <Text className="text-green-200 text-[10px] mb-1">Cirolanan</Text>
                            <Text className="text-white font-bold text-base" numberOfLines={1} adjustsFontSizeToFit>
                                {(stats.endorsed?.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                            </Text>
                        </LinearGradient>
                    </View>
                    {stats.overdue?.count > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setCheckType('customer');
                                setCustomerStatus('overdue');
                                setPeriod('all');
                            }}
                        >
                            <LinearGradient colors={['#991b1b', '#7f1d1d']} className="p-2.5 rounded-xl border border-red-500/30 flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                                    <Text className="text-red-200 text-xs font-bold">Vadesi Geçmiş Çekler</Text>
                                </View>
                                <Text className="text-white font-black text-sm">
                                    {stats.overdue.count} Adet / {(stats.overdue.total || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Period Tabs */}
            <View className="flex-row bg-slate-900/50 p-1 rounded-xl mb-4 border border-slate-800">
                {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'daily', label: 'Günlük' },
                    { key: 'weekly', label: 'Haftalık' },
                    { key: 'monthly', label: 'Aylık' },
                    { key: 'yearly', label: 'Yıllık' }
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => setPeriod(tab.key as any)}
                        className={`flex-1 py-2 rounded-lg items-center ${period === tab.key ? 'bg-blue-600' : 'bg-transparent'}`}
                    >
                        <Text className={`text-xs font-bold ${period === tab.key ? 'text-white' : 'text-slate-400'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Type Toggle */}
            <View className="flex-row mb-4 gap-3">
                <TouchableOpacity
                    onPress={() => setCheckType('customer')}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${checkType === 'customer' ? 'bg-slate-800 border-blue-500' : 'bg-slate-900 border-slate-800'}`}
                >
                    <View className={`w-3 h-3 rounded-full mr-2 ${checkType === 'customer' ? 'bg-blue-500' : 'bg-slate-700'}`} />
                    <Text className={`font-bold ${checkType === 'customer' ? 'text-white' : 'text-slate-400'}`}>Müşteri Çeki</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setCheckType('own')}
                    className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${checkType === 'own' ? 'bg-slate-800 border-purple-500' : 'bg-slate-900 border-slate-800'}`}
                >
                    <View className={`w-3 h-3 rounded-full mr-2 ${checkType === 'own' ? 'bg-purple-500' : 'bg-slate-700'}`} />
                    <Text className={`font-bold ${checkType === 'own' ? 'text-white' : 'text-slate-400'}`}>Kendi Çekimiz</Text>
                </TouchableOpacity>
            </View>

            {/* Status Chips (Only for Customer) */}
            {checkType === 'customer' && (
                <View className="flex-row gap-2 mb-2">
                    <TouchableOpacity onPress={() => setCustomerStatus('all')} className={`px-4 py-1.5 rounded-full border ${customerStatus === 'all' ? 'bg-slate-700 border-slate-600' : 'bg-transparent border-slate-800'}`}>
                        <Text className={`text-xs ${customerStatus === 'all' ? 'text-white font-bold' : 'text-slate-500'}`}>Tümü</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setCustomerStatus('portfolio')} className={`px-4 py-1.5 rounded-full border ${customerStatus === 'portfolio' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-transparent border-slate-800'}`}>
                        <Text className={`text-xs ${customerStatus === 'portfolio' ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>Portföyde</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setCustomerStatus('in_bank')} className={`px-4 py-1.5 rounded-full border ${customerStatus === 'in_bank' ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-transparent border-slate-800'}`}>
                        <Text className={`text-xs ${customerStatus === 'in_bank' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>Bankada</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setCustomerStatus('endorsed')} className={`px-4 py-1.5 rounded-full border ${customerStatus === 'endorsed' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-transparent border-slate-800'}`}>
                        <Text className={`text-xs ${customerStatus === 'endorsed' ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Cirolanmış</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setCustomerStatus('overdue')} className={`px-4 py-1.5 rounded-full border ${customerStatus === 'overdue' ? 'bg-red-500/20 border-red-500/50' : 'bg-transparent border-slate-800'}`}>
                        <Text className={`text-xs ${customerStatus === 'overdue' ? 'text-red-400 font-bold' : 'text-slate-500'}`}>Gecikmiş</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderItem = ({ item, index }) => {
        const isCheck = item.cardType === 1;
        return (
            <Animated.View incoming={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity
                    onPress={() => setSelectedCheck(item)}
                    activeOpacity={0.7}
                    className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3"
                >
                    {/* ... existing content ... */}
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                            <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>{item.accountName || item.clientName || 'Cari Yok'}</Text>
                            <View className="flex-row items-center gap-2">
                                <View className="bg-slate-800 px-1.5 py-0.5 rounded">
                                    <Text className="text-slate-400 text-xs font-mono">{item.portfolioNo}</Text>
                                </View>
                                {item.isRollover === 1 && (
                                    <View className="bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/50">
                                        <Text className="text-amber-500 text-[10px] font-bold">DEVİR</Text>
                                    </View>
                                )}
                                <View className={`px-1.5 py-0.5 rounded ${isCheck ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                                    <Text className={`text-xs ${isCheck ? 'text-purple-400' : 'text-blue-400'}`}>
                                        {isCheck ? 'ÇEK' : 'SENET'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View className="items-end bg-slate-800/40 p-2 rounded-lg">
                            <Calendar size={14} color="#94a3b8" />
                            <Text className="text-white font-bold text-sm mt-1">{new Date(item.dueDate).toLocaleDateString('tr-TR')}</Text>
                            <Text className="text-slate-500 text-[10px]">Vade</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-end mt-2 pt-2 border-t border-slate-800/50">
                        <Text className="text-slate-500 text-xs">{item.statusLabel || 'Durum Yok'}</Text>
                        <Text className="font-bold text-lg text-emerald-400">
                            {item.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View className="flex-1 bg-slate-950">
            {/* ... existing layout ... */}
            {/* Place existing layout here, keeping renderItem updated above */}
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1 px-4 pt-2">
                <View className="flex-row items-center gap-3 mb-6">
                    <Image
                        source={require('../../assets/images/siyahlogo.png')}
                        style={{ width: 40, height: 40, borderRadius: 10 }}
                        resizeMode="contain"
                    />
                    <View>
                        <Text className="text-3xl font-black text-white">Çek/Senet</Text>
                        <Text className="text-slate-400 text-[10px] font-medium tracking-wide uppercase">Entelog Mobile</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-slate-900 border border-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Portföy No veya Cari ara..."
                        placeholderTextColor="#64748b"
                        value={searchText}
                        onChangeText={setSearchText}
                        className="flex-1 ml-3 text-white font-medium"
                    />
                </View>

                {loading && !refreshing && !checks.length ? (
                    <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                ) : (
                    <FlatList
                        data={checks}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <Banknote size={64} color="#334155" />
                                <Text className="text-slate-500 mt-4 font-medium">Kayıt bulunamadı</Text>
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
                            <View className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 overflow-hidden">
                                <View className="p-4 border-b border-slate-800 flex-row justify-between items-center bg-slate-800/50">
                                    <View>
                                        <Text className="text-white font-bold text-lg">Çek Detayı</Text>
                                        <Text className="text-slate-400 text-xs">{selectedCheck.portfolioNo}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedCheck(null)} className="p-2 bg-slate-800 rounded-full">
                                        <ChevronLeft size={20} color="white" style={{ transform: [{ rotate: '-90deg' }] }} />
                                        {/* Using ChevronLeft rotated to mimic Close 'X' or just let user dismiss. Or import X? Keeping it simple. */}
                                    </TouchableOpacity>
                                </View>

                                <View className="p-6 space-y-4">
                                    <View>
                                        <Text className="text-slate-500 text-xs mb-1">Cari Hesap (Çeki Bize Veren)</Text>
                                        <Text className="text-white font-bold text-base mb-2">{selectedCheck.fromCompany || selectedCheck.clientName || 'İsimsiz'}</Text>

                                        {selectedCheck.debtorName && selectedCheck.debtorName !== selectedCheck.fromCompany && (
                                            <View className="mb-2">
                                                <Text className="text-slate-500 text-xs mb-1">Gerçek Borçlu (Keşideci)</Text>
                                                <Text className="text-slate-300 font-bold text-sm">{selectedCheck.debtorName}</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-xs mb-1">Seri No</Text>
                                            <Text className="text-slate-300 font-mono">{selectedCheck.serialNo || '-'}</Text>
                                        </View>
                                        <View className="flex-1 items-end">
                                            <Text className="text-slate-500 text-xs mb-1">Vade Tarihi</Text>
                                            <Text className="text-slate-300 font-bold">{new Date(selectedCheck.dueDate).toLocaleDateString('tr-TR')}</Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between">
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-xs mb-1">Banka</Text>
                                            <Text className="text-slate-300">{selectedCheck.bankName || '-'}</Text>
                                        </View>
                                        <View className="flex-1 items-end">
                                            <Text className="text-slate-500 text-xs mb-1">Devir Durumu</Text>
                                            <Text className={`font-bold ${selectedCheck.isRollover === 1 ? 'text-amber-400' : 'text-slate-300'}`}>
                                                {selectedCheck.isRollover === 1 ? 'DEVİR' : 'Yeni Dönem'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="pt-4 border-t border-slate-800 mt-2">
                                        <Text className="text-slate-500 text-xs mb-1 text-center">Tutar</Text>
                                        <Text className="text-emerald-400 font-black text-3xl text-center">
                                            {selectedCheck.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                        </Text>
                                        <View className="items-center mt-2">
                                            <View className={`px-3 py-1 rounded-full ${selectedCheck.cardType === 1 ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
                                                <Text className={`text-xs font-bold ${selectedCheck.cardType === 1 ? 'text-purple-400' : 'text-blue-400'}`}>
                                                    {selectedCheck.statusLabel}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setSelectedCheck(null)}
                                    className="bg-slate-800 p-4 items-center border-t border-slate-700"
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
