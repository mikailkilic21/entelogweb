import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Modal, StyleSheet, Alert, Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Package, ScanLine, X, Check } from 'lucide-react-native';
import { API_URL, BASE_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Product } from '@/types';
import Animated from 'react-native-reanimated';

interface Stats {
    totalProducts: number;
    productsInStock: number;
    criticalStock: number;
    totalStockValue?: number;
}

export default function ProductsScreen() {
    const { isDemo } = useAuth();
    const router = useRouter();

    // UI State
    const [products, setProducts] = useState<Product[]>([]);
    const [searchText, setSearchText] = useState('');
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isListVisible, setIsListVisible] = useState(false);

    // Filters & Values
    const [activeFilter, setActiveFilter] = useState<'all' | 'inStock' | 'critical' | 'value'>('all');

    // Detailed Filters
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
    const [sortBy, setSortBy] = useState<'quantity' | 'amount' | 'realStock' | 'price' | 'name'>('quantity');
    const [stockStatus, setStockStatus] = useState<'all' | 'inStock' | 'critical'>('all');

    // Camera State
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [scanned, setScanned] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/products/stats`, {
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

    const fetchWarehouses = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/products/warehouses`, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (res.ok) {
                const data = await res.json();
                setWarehouses(data);
            }
        } catch (error) {
            console.error(error);
        }
    }, [isDemo]);

    const fetchProducts = useCallback(async (search = searchText, overrideFilter?: 'all' | 'inStock' | 'critical' | 'value') => {
        setLoading(true);
        setIsListVisible(true);
        try {
            let url = `${API_URL}/products?limit=50`;
            if (search) url += `&search=${encodeURIComponent(search)}`;

            let currentStatus = stockStatus;
            let currentSort = sortBy;

            if (overrideFilter) {
                if (overrideFilter === 'inStock') currentStatus = 'inStock';
                else if (overrideFilter === 'critical') currentStatus = 'critical';
                else if (overrideFilter === 'value') currentSort = 'amount';
                else if (overrideFilter === 'all') currentStatus = 'all';
            } else if (activeFilter !== 'all') {
                if (activeFilter === 'inStock') currentStatus = 'inStock';
                else if (activeFilter === 'critical') currentStatus = 'critical';
            }

            url += `&sortBy=${currentSort}`;
            if (selectedWarehouse !== null) url += `&warehouse=${selectedWarehouse}`;
            if (currentStatus === 'critical') url += `&critical=true`;
            if (currentStatus === 'inStock') url += `&minStock=1`;

            const res = await fetch(url, {
                headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isDemo, searchText, stockStatus, sortBy, activeFilter, selectedWarehouse]);

    // Initial Load
    useEffect(() => {
        fetchStats();
        fetchWarehouses();
    }, [fetchStats, fetchWarehouses]);

    // Search Effect: Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchText.length > 0) {
                setIsListVisible(true);
                fetchProducts(searchText);
            } else if (searchText.length === 0) {
                if (isListVisible) fetchProducts('');
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchText, isListVisible, fetchProducts]);

    // Filter Trigger Effect
    useEffect(() => {
        if (isListVisible) {
            fetchProducts(searchText);
        }
    }, [selectedWarehouse, isListVisible, searchText, fetchProducts]);


    const handleBoxPress = (filterType: 'all' | 'inStock' | 'critical' | 'value') => {
        setActiveFilter(filterType);
        if (filterType === 'inStock') setStockStatus('inStock');
        else if (filterType === 'critical') setStockStatus('critical');
        else setStockStatus('all');

        if (filterType === 'value') setSortBy('amount');

        setSearchText('');
        fetchProducts('', filterType);
    };

    const applyFilters = () => {
        setIsFilterModalVisible(false);
        setActiveFilter('all');
        fetchProducts();
    };

    const clearFilters = () => {
        setSelectedWarehouse(null);
        setSortBy('quantity');
        setStockStatus('all');
        setActiveFilter('all');
        setIsFilterModalVisible(false);
        fetchProducts();
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
        fetchWarehouses();
        if (isListVisible) fetchProducts();
        else setRefreshing(false);
    };

    const handleScan = () => {
        if (!permission?.granted) {
            requestPermission();
            return;
        }
        setScanned(false);
        setIsScanning(true);
    };

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        setScanned(true);
        setIsScanning(false);
        setSearchText(data);
        Alert.alert("Barkod Okundu", `Ürün Kodu: ${data}`);
    };

    const handleProductPress = (id: number) => {
        router.push(`/products/${id}` as any);
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1 px-4 pt-4">
                {/* Header Title */}
                <View className="mb-6">
                    <Text className="text-3xl font-black text-white tracking-tight">Stok Yönetimi</Text>
                    <Text className="text-slate-400 text-sm font-medium">Hızlı Erişim ve Arama</Text>
                </View>

                {/* Search Bar */}
                <View className="mb-6 flex-row items-center">
                    <View className="flex-1 flex-row items-center bg-slate-900 border border-slate-700/50 rounded-2xl h-14 px-4 shadow-sm">
                        <Search size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Ürün adı, kod veya barkod..."
                            placeholderTextColor="#64748b"
                            value={searchText}
                            onChangeText={setSearchText}
                            returnKeyType="search"
                            onSubmitEditing={() => fetchProducts(searchText)}
                            className="flex-1 ml-3 text-white text-lg font-medium h-full"
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchText('')} className="p-2">
                                <X size={18} color="#64748b" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleScan} className="bg-slate-800 p-2 rounded-lg ml-2">
                            <ScanLine size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dashboard Action Grid - Single Horizontal Box */}
                <View className="mb-6">
                    <TouchableOpacity
                        onPress={() => handleBoxPress('all')}
                        activeOpacity={0.9}
                        className={`w-full flex-row items-center p-4 rounded-3xl border ${activeFilter === 'all' && isListVisible ? 'bg-blue-600 border-blue-400' : 'bg-slate-900 border-slate-800'}`}
                    >
                        <View className={`p-3 rounded-2xl mr-4 ${activeFilter === 'all' && isListVisible ? 'bg-white/20' : 'bg-slate-800'}`}>
                            <Package size={28} color={activeFilter === 'all' && isListVisible ? '#fff' : '#94a3b8'} />
                        </View>

                        <View className="flex-1">
                            <Text className={`text-3xl font-black ${activeFilter === 'all' && isListVisible ? 'text-white' : 'text-white'}`}>
                                {stats?.totalProducts || 0}
                            </Text>
                            <Text className={`text-xs font-bold uppercase ${activeFilter === 'all' && isListVisible ? 'text-blue-100' : 'text-slate-500'}`}>
                                Toplam Ürün
                            </Text>
                        </View>

                        {/* Optional: Add stock value summary on the right side if space permits, or strictly follow "Only Total Product Box" */}
                        {/* User said "SADECE TOPLAM ÜRÜN KUTUCU" so I will keep it focused on Total Products but maybe clearer layout. */}

                        {(activeFilter === 'all' && isListVisible) && (
                            <View className="bg-white/20 p-2 rounded-full">
                                <Check size={20} color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Warehouse Filter */}
                <View className="mb-6">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" contentContainerStyle={{ paddingHorizontal: 4 }}>
                        <TouchableOpacity
                            onPress={() => setSelectedWarehouse(null)}
                            className={`px-4 py-3 rounded-xl mr-2 border ${selectedWarehouse === null ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                        >
                            <Text className={`text-sm font-bold ${selectedWarehouse === null ? 'text-white' : 'text-slate-400'}`}>
                                Tüm Depolar
                            </Text>
                        </TouchableOpacity>
                        {warehouses.map((wh) => (
                            <TouchableOpacity
                                key={wh.id}
                                onPress={() => setSelectedWarehouse(wh.number)}
                                className={`px-4 py-3 rounded-xl mr-2 border ${selectedWarehouse === wh.number ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900 border-slate-800'}`}
                            >
                                <Text className={`text-sm font-bold ${selectedWarehouse === wh.number ? 'text-white' : 'text-slate-400'}`}>
                                    {wh.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content Area */}
                {!isListVisible ? (
                    <View className="flex-1 justify-center items-center opacity-50 pb-20">
                        <Package size={64} color="#334155" />
                        <Text className="text-slate-500 mt-4 text-center px-10">
                            İşlem yapmak için yukarıdan bir kategori seçin veya arama yapın.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={products}
                        renderItem={({ item, index }) => {
                            const p = item as any;
                            if (!p) return null;
                            return (
                                <Animated.View>
                                    <TouchableOpacity
                                        onPress={() => handleProductPress(p.id)}
                                        activeOpacity={0.7}
                                        className="mb-3 bg-slate-900 border border-slate-800 p-4 rounded-3xl flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center flex-1">
                                            {p.image && p.image !== '' ? (
                                                <Image
                                                    source={{ uri: p.image.startsWith('http') ? p.image : `${BASE_URL}/uploads/products/${p.image}` }}
                                                    className="w-14 h-14 rounded-xl mr-4 bg-slate-800"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View className="w-14 h-14 rounded-xl mr-4 bg-slate-800 justify-center items-center border border-slate-700/50">
                                                    <Package size={24} color="#64748b" />
                                                </View>
                                            )}
                                            <View className="flex-1 pr-2">
                                                <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>{p.name || 'İsimsiz'}</Text>
                                                <View className="flex-row items-center">
                                                    <View className="bg-slate-800 px-2 py-0.5 rounded mr-2">
                                                        <Text className="text-slate-400 text-[10px] font-mono">{p.code}</Text>
                                                    </View>
                                                    {p.brand && (
                                                        <View className="bg-slate-800 px-2 py-0.5 rounded mr-2">
                                                            <Text className="text-slate-400 text-[10px]">{p.brand}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                        <View className="items-end">
                                            <Text className="text-white font-black text-lg">
                                                {Number(p.salesPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </Text>
                                            <Text className={`text-xs font-bold mt-1 ${p.realStock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {p.realStock} Adet
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
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-slate-500">Ürün bulunamadı</Text>}
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* Filter Modal */}
            <Modal
                visible={isFilterModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 p-6 h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-white font-bold text-xl">Detaylı Filtreleme</Text>
                            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} className="p-2 bg-slate-800 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1">
                            {/* Sort Options */}
                            <Text className="text-slate-400 font-bold mb-3 uppercase text-xs">Sıralama</Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {['quantity', 'amount', 'realStock', 'price', 'name'].map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        onPress={() => setSortBy(option as any)}
                                        className={`px-4 py-3 rounded-xl border ${sortBy === option ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}
                                    >
                                        <Text className={`font-medium ${sortBy === option ? 'text-white' : 'text-slate-400'}`}>
                                            {option === 'quantity' ? 'Satış Adedi' :
                                                option === 'amount' ? 'Satış Cirosu' :
                                                    option === 'realStock' ? 'Stok Miktarı' :
                                                        option === 'price' ? 'Fiyat' : 'İsim'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Status Filters */}
                            <Text className="text-slate-400 font-bold mb-3 uppercase text-xs">Durum</Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                {[
                                    { key: 'all', label: 'Tümü' },
                                    { key: 'inStock', label: 'Sadece Stoktakiler' },
                                    { key: 'critical', label: 'Kritik Stok' }
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.key}
                                        onPress={() => setStockStatus(option.key as any)}
                                        className={`px-4 py-3 rounded-xl border ${stockStatus === option.key ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-800 border-slate-700'}`}
                                    >
                                        <Text className={`font-medium ${stockStatus === option.key ? 'text-white' : 'text-slate-400'}`}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Warehouse Selection */}
                            <Text className="text-slate-400 font-bold mb-3 uppercase text-xs">Depo / Ambar</Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                <TouchableOpacity
                                    onPress={() => setSelectedWarehouse(null)}
                                    className={`px-4 py-3 rounded-xl border ${selectedWarehouse === null ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
                                >
                                    <Text className={`font-medium ${selectedWarehouse === null ? 'text-white' : 'text-slate-400'}`}>
                                        Tüm Depolar
                                    </Text>
                                </TouchableOpacity>
                                {warehouses.map((wh) => (
                                    <TouchableOpacity
                                        key={wh.id}
                                        onPress={() => setSelectedWarehouse(wh.number)}
                                        className={`px-4 py-3 rounded-xl border ${selectedWarehouse === wh.number ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
                                    >
                                        <Text className={`font-medium ${selectedWarehouse === wh.number ? 'text-white' : 'text-slate-400'}`}>
                                            {wh.name} (#{wh.number})
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Clear Button */}
                            <TouchableOpacity onPress={clearFilters} className="mb-4 flex-row justify-center items-center py-3">
                                <Text className="text-slate-400 font-medium">Filtreleri Temizle</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        {/* Apply Button */}
                        <TouchableOpacity
                            onPress={applyFilters}
                            className="bg-indigo-600 p-4 rounded-2xl items-center shadow-lg shadow-indigo-500/30"
                        >
                            <Text className="text-white font-bold text-lg">Uygula</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Camera Modal */}
            <Modal visible={isScanning} animationType="slide" presentationStyle="fullScreen">
                <View style={StyleSheet.absoluteFill} className="bg-black">
                    {!permission?.granted ? (
                        <View className="flex-1 justify-center items-center"><Text className="text-white mb-4">İzin Gerekli</Text><Button onPress={requestPermission} title="İzin Ver" /><Button onPress={() => setIsScanning(false)} title="İptal" color="red" /></View>
                    ) : (
                        <CameraView style={StyleSheet.absoluteFill} facing="back" onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "upc_e", "code128", "code39"] }}>
                            <View className="flex-1 bg-black/50 justify-center items-center">
                                <View className="w-80 h-80 border-2 border-white/50 rounded-3xl overflow-hidden"><View className="w-full h-1 bg-red-500 opacity-50 absolute top-1/2" /></View>
                                <TouchableOpacity onPress={() => setIsScanning(false)} className="absolute bottom-12 bg-red-600 rounded-full p-4"><X size={32} color="white" /></TouchableOpacity>
                            </View>
                        </CameraView>
                    )}
                </View>
            </Modal>
        </View>
    );
}
