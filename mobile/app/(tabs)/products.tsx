import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Package, TrendingUp, AlertTriangle, CheckCircle, Box } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';

export default function ProductsScreen() {
    const { isDemo } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortBy, setSortBy] = useState('amount'); // 'amount' | 'quantity'

    const fetchData = useCallback(async () => {
        try {
            const statsRes = await fetch(`${API_URL}/products/stats`, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (statsRes.ok) {
                setStats(await statsRes.json());
            }

            let url = `${API_URL}/products?limit=50&sortBy=${sortBy}`;
            if (searchText) url += `&search=${encodeURIComponent(searchText)}`;

            const prodRes = await fetch(url, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (prodRes.ok) {
                const data = await prodRes.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchText, sortBy]);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(fetchData, 500);
        return () => clearTimeout(timer);
    }, [searchText, sortBy]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderHeader = () => (
        <View className="mb-4">
            {stats && (
                <View className="flex-row gap-2 mb-4">
                    <LinearGradient colors={['#3730a3', '#312e81']} className="flex-1 p-3 rounded-xl border border-indigo-500/30">
                        <Package size={20} color="#818cf8" />
                        <Text className="text-white font-bold text-lg mt-1">{stats.totalProducts || 0}</Text>
                        <Text className="text-indigo-200 text-xs">Toplam</Text>
                    </LinearGradient>
                    <LinearGradient colors={['#065f46', '#064e3b']} className="flex-1 p-3 rounded-xl border border-emerald-500/30">
                        <CheckCircle size={20} color="#34d399" />
                        <Text className="text-white font-bold text-lg mt-1">{stats.productsInStock || 0}</Text>
                        <Text className="text-emerald-200 text-xs">Stokta</Text>
                    </LinearGradient>
                    <LinearGradient colors={['#92400e', '#78350f']} className="flex-1 p-3 rounded-xl border border-amber-500/30">
                        <AlertTriangle size={20} color="#fbbf24" />
                        <Text className="text-white font-bold text-lg mt-1">{stats.criticalStock || 0}</Text>
                        <Text className="text-amber-200 text-xs">Kritik</Text>
                    </LinearGradient>
                </View>
            )}

            {/* Sorting Tabs */}
            <View className="flex-row bg-slate-900 p-1 rounded-xl border border-slate-800 mb-2">
                <TouchableOpacity
                    onPress={() => setSortBy('amount')}
                    className={`flex-1 py-2 rounded-lg items-center ${sortBy === 'amount' ? 'bg-indigo-600' : ''}`}
                >
                    <Text className={`text-sm font-bold ${sortBy === 'amount' ? 'text-white' : 'text-slate-400'}`}>
                        Toplam Tutar
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setSortBy('quantity')}
                    className={`flex-1 py-2 rounded-lg items-center ${sortBy === 'quantity' ? 'bg-indigo-600' : ''}`}
                >
                    <Text className={`text-sm font-bold ${sortBy === 'quantity' ? 'text-white' : 'text-slate-400'}`}>
                        Toplam Miktar
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderItem = ({ item, index }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()} className="mb-3">
            <TouchableOpacity onPress={() => router.push(`/products/${item.id}`)}>
                <View className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3 flex-row items-center">
                    <View className="p-3 rounded-xl mr-4 bg-slate-800/50">
                        <Box size={24} color="#94a3b8" />
                    </View>

                    <View className="flex-1">
                        <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                        <Text className="text-slate-500 text-xs font-mono mt-1">{item.code}</Text>
                        <Text className="text-slate-400 text-xs mt-1">{item.brand || '-'}</Text>
                    </View>

                    <View className="items-end">
                        <View className={`px-2 py-1 rounded text-xs font-bold mb-1 ${item.stockLevel > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                            <Text className={item.stockLevel > 0 ? 'text-blue-400' : 'text-red-400'}>
                                {item.stockLevel}
                            </Text>
                        </View>
                        <Text className="text-emerald-400 font-bold text-sm">
                            {item.salesAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );

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
                        <Text className="text-3xl font-black text-white">Stok & Ürün</Text>
                        <Text className="text-slate-400 text-[10px] font-medium tracking-wide uppercase">Entelog Mobile</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="bg-slate-900 border border-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Ürün ara..."
                        placeholderTextColor="#64748b"
                        value={searchText}
                        onChangeText={setSearchText}
                        className="flex-1 ml-3 text-white font-medium"
                    />
                </View>

                {loading && !refreshing && !products.length ? (
                    <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-20">
                                <Package size={64} color="#334155" />
                                <Text className="text-slate-500 mt-4 font-medium">Kayıt bulunamadı</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
