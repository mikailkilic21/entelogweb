import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Truck, CheckCircle, Clock, ChevronRight, X, AlertCircle, PackageCheck, Package, PackageX, ShoppingCart } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

type OrderStatus = 'all' | 'proposal' | 'approved';
type ShipmentStatus = 'all' | 'pending' | 'partial' | 'closed';

export default function OrdersScreen() {
    const { isDemo } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus>('all');
    const [shipmentFilter, setShipmentFilter] = useState<ShipmentStatus>('all');

    const fetchData = useCallback(async () => {
        try {
            let url = `${API_URL}/orders?limit=50`;
            // ... params ...

            console.log('Fetching:', url);
            const res = await fetch(url, {
                headers: {
                    'x-demo-mode': isDemo ? 'true' : 'false'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [statusFilter, shipmentFilter, searchText]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);
    }, [statusFilter, shipmentFilter, searchText]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderHeader = () => (
        <View className="mb-4">
            {/* Primary Tabs (Status) */}
            <View className="flex-row bg-slate-900 p-1 rounded-xl mb-4 border border-slate-800">
                {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'proposal', label: 'Öneri' },
                    { key: 'approved', label: 'Onaylı' },
                ].map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        onPress={() => {
                            setStatusFilter(tab.key as OrderStatus);
                            if (tab.key !== 'approved') setShipmentFilter('all'); // Reset sub-filter
                        }}
                        className={`flex-1 py-2 rounded-lg items-center justify-center ${statusFilter === tab.key ? 'bg-blue-600' : 'bg-transparent'
                            }`}
                    >
                        <Text className={`font-bold text-xs ${statusFilter === tab.key ? 'text-white' : 'text-slate-400'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Secondary Tabs (Shipment - Only if Approved) */}
            {statusFilter === 'approved' && (
                <View className="flex-row gap-2 mb-2">
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={[
                            { key: 'all', label: 'Hepsi' },
                            { key: 'waiting', label: 'Sevk Bekliyor' },
                            { key: 'partial', label: 'Kısmi Sevk' },
                            { key: 'closed', label: 'Kapanan' },
                        ]}
                        keyExtractor={item => item.key}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => setShipmentFilter(item.key as ShipmentStatus)}
                                className={`px-3 py-1.5 rounded-full border mr-2 ${shipmentFilter === item.key
                                    ? 'bg-emerald-500/20 border-emerald-500/50'
                                    : 'bg-slate-900 border-slate-700'
                                    }`}
                            >
                                <Text className={`text-xs ${shipmentFilter === item.key ? 'text-emerald-400 font-bold' : 'text-slate-400'
                                    }`}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        // Status Logic for UI
        let statusConfig = { color: 'text-slate-400', bg: 'bg-slate-800', label: '-', icon: AlertCircle };

        if (item.status === 1) { // Proposal
            statusConfig = { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Öneri', icon: Clock };
        } else if (item.status === 4) { // Approved
            if (item.shipmentStatus === 'closed') {
                statusConfig = { color: 'text-slate-400', bg: 'bg-slate-700/50', label: 'Kapandı', icon: PackageCheck };
            } else if (item.shipmentStatus === 'partial') {
                statusConfig = { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Kısmi', icon: Package };
            } else {
                statusConfig = { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Bekliyor', icon: PackageX };
            }
        }

        const StatusIcon = statusConfig.icon;

        return (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push(`/orders/${item.id}`)}
                    className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3"
                >
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 pr-2">
                            <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.accountName || 'Cari Yok'}</Text>
                            <View className="flex-row items-center gap-2">
                                <View className="bg-slate-800 px-1.5 py-0.5 rounded">
                                    <Text className="text-slate-400 text-[10px] font-mono">{item.ficheNo}</Text>
                                </View>
                                <Text className="text-slate-500 text-[10px]">{new Date(item.date).toLocaleDateString('tr-TR')}</Text>
                            </View>
                        </View>
                        <View className={`px-2 py-1 rounded-lg flex-row items-center gap-1 ${statusConfig.bg}`}>
                            <StatusIcon size={12} color={statusConfig.color.includes('amber') ? '#fbbf24' : statusConfig.color.includes('emerald') ? '#34d399' : statusConfig.color.includes('blue') ? '#60a5fa' : '#94a3b8'} />
                            <Text className={`text-[10px] font-bold ${statusConfig.color}`}>{statusConfig.label}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-end mt-2 pt-2 border-t border-slate-800/50">
                        <Text className="text-slate-500 text-[10px]">{item.documentNo || '-'}</Text>
                        <Text className="font-bold text-base text-white">
                            {item.netTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
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
                        <Text className="text-3xl font-black text-white">Siparişler</Text>
                        <Text className="text-slate-400 text-[10px] font-medium tracking-wide uppercase">Entelog Mobile</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-slate-900 border border-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Sipariş No veya Cari ara..."
                        placeholderTextColor="#64748b"
                        value={searchText}
                        onChangeText={setSearchText}
                        className="flex-1 ml-3 text-white font-medium"
                    />
                </View>

                {loading && !refreshing && !orders.length ? (
                    <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <ShoppingCart size={64} color="#334155" />
                                <Text className="text-slate-500 mt-4 font-medium">Kayıt bulunamadı</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
