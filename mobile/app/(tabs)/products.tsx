import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Image, Modal, StyleSheet, Alert, Button, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Package, TrendingUp, AlertTriangle, CheckCircle, Box, ScanLine, X } from 'lucide-react-native';
import { API_URL, BASE_URL } from '@/constants/Config';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Product } from '@/types';
import ProductItem from '@/components/ProductItem';
import { io } from "socket.io-client"; // Socket.IO Import

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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState('realStock'); // 'amount' | 'quantity' | 'realStock'
    const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
    const [warehouses, setWarehouses] = useState<any[]>([]);

    // Socket Ref
    const socketRef = React.useRef<any>(null);

    // Fetch Warehouses (REST)
    useEffect(() => {
        fetch(`${API_URL}/products/warehouses`, {
            headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
        }).then(res => res.json()).then(data => {
            if (Array.isArray(data)) setWarehouses([{ id: null, name: 'Tümü' }, ...data]);
        }).catch(err => console.error(err));
    }, [isDemo]);

    // Initial Data Fetch (REST)
    const fetchData = useCallback(async () => {
        try {
            // Stats URL
            let statsUrl = `${API_URL}/products/stats?search=${encodeURIComponent(searchText)}`;
            if (selectedWarehouse !== null) statsUrl += `&warehouse=${selectedWarehouse}`;

            // Products URL (REST Endpoint)
            let prodUrl = `${API_URL}/products?limit=50&sortBy=${sortBy}`;
            if (selectedWarehouse !== null) prodUrl += `&warehouse=${selectedWarehouse}`;
            if (searchText) prodUrl += `&search=${encodeURIComponent(searchText)}`;

            // Parallel Request
            const [statsRes, prodRes] = await Promise.all([
                fetch(statsUrl, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } }),
                fetch(prodUrl, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } })
            ]);

            if (statsRes.ok) setStats(await statsRes.json());

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
    }, [searchText, sortBy, selectedWarehouse, isDemo]);

    // Socket.IO Connection & Initial Fetch
    useEffect(() => {
        // Connect Socket
        socketRef.current = io(BASE_URL);

        socketRef.current.on("connect", () => {
            console.log("⚡ Socket.IO Bağlandı:", socketRef.current.id);
        });

        // Listen for updates (Example event)
        socketRef.current.on("stock_update", (updatedProduct: any) => {
            console.log("📦 Stok Güncellemesi Geldi:", updatedProduct.code);
            // Update local state without full refresh
            setProducts(prevProducts => prevProducts.map(p =>
                p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
            ));
        });

        fetchData();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [fetchData]); // Re-connect only if BASE_URL changes (unlikely) or component remounts

    // Trigger Fetch on Filter Change
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(fetchData, 500); // Debounce
        return () => clearTimeout(timer);
    }, [searchText, sortBy, selectedWarehouse]); // fetchData is stable via useCallback

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(); // Socket will stay connected
    };

    // Camera State
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [scanned, setScanned] = useState(false);

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

    // Memoized Navigation
    const handleProductPress = useCallback((id: number) => {
        let url = `/products/${id}`;
        if (selectedWarehouse) {
            url += `?warehouse=${selectedWarehouse}`;
            const whName = warehouses.find(w => w.id === selectedWarehouse)?.name;
            if (whName) url += `&warehouseName=${encodeURIComponent(whName)}`;
        }
        router.push(url as any);
    }, [router, selectedWarehouse, warehouses]);

    // Render Helpers
    const renderItem = useCallback(({ item, index }: { item: Product; index: number }) => (
        <ProductItem item={item} index={index} onPress={handleProductPress} />
    ), [handleProductPress]);

    const keyExtractor = useCallback((item: Product) => item.id.toString(), []);

    const renderHeader = () => (
        <View className="mb-4">
            {/* Warehouse Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-12">
                {warehouses.map((w) => (
                    <TouchableOpacity
                        key={w.id ?? 'all'}
                        onPress={() => setSelectedWarehouse(w.id)}
                        className={`px-4 py-2 rounded-full mr-2 border ${selectedWarehouse === w.id
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-slate-800/60 border-slate-700/50'
                            }`}
                    >
                        <Text className={`${selectedWarehouse === w.id ? 'text-white font-bold' : 'text-slate-400 font-medium'} text-xs`}>
                            {w.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {stats && (
                <View className="mb-4 space-y-2">
                    {/* Top Row: Returns Stats Component logic from before... */}
                    <View className="flex-row gap-2">
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
                    {/* Bottom Row: Total Stock Value */}
                    <LinearGradient colors={['#1e1b4b', '#0f172a']} className="p-3 rounded-xl border border-indigo-500/30 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                            <View className="bg-indigo-500/20 p-2 rounded-lg">
                                <TrendingUp size={24} color="#818cf8" />
                            </View>
                            <View>
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Toplam Stok Değeri</Text>
                                <Text className="text-slate-500 text-[10px]">(Alış Fiyatıyla)</Text>
                            </View>
                        </View>
                        <Text className="text-white font-bold text-xl">
                            {(stats.totalStockValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                        </Text>
                    </LinearGradient>
                </View>
            )}

            {/* Sorting Tabs */}
            <View className="flex-row bg-slate-900 p-1 rounded-xl border border-slate-800 mb-2">
                <TouchableOpacity onPress={() => setSortBy('realStock')} className={`flex-1 py-2 rounded-lg items-center ${sortBy === 'realStock' ? 'bg-indigo-600' : ''}`}><Text className={`text-xs font-bold ${sortBy === 'realStock' ? 'text-white' : 'text-slate-400'}`}>Gerçek Stok</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setSortBy('amount')} className={`flex-1 py-2 rounded-lg items-center ${sortBy === 'amount' ? 'bg-indigo-600' : ''}`}><Text className={`text-xs font-bold ${sortBy === 'amount' ? 'text-white' : 'text-slate-400'}`}>Tutar</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setSortBy('quantity')} className={`flex-1 py-2 rounded-lg items-center ${sortBy === 'quantity' ? 'bg-indigo-600' : ''}`}><Text className={`text-xs font-bold ${sortBy === 'quantity' ? 'text-white' : 'text-slate-400'}`}>Miktar</Text></TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <SafeAreaView className="flex-1 px-4 pt-2">
                <View className="flex-row items-center gap-3 mb-6">
                    <Image source={require('../../assets/images/siyahlogo.png')} style={{ width: 40, height: 40, borderRadius: 10 }} resizeMode="contain" />
                    <View>
                        <Text className="text-3xl font-black text-white">Stok & Ürün</Text>
                        <Text className="text-slate-400 text-xs font-medium tracking-wide uppercase">Entelog Mobile (Canlı)</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View className="flex-row gap-3 mb-4">
                    <View className="bg-slate-900 border border-slate-800 rounded-xl flex-1 flex-row items-center px-4 py-3">
                        <Search size={20} color="#94a3b8" />
                        <TextInput
                            placeholder="Ürün ara veya barkod tara..."
                            placeholderTextColor="#64748b"
                            value={searchText}
                            onChangeText={setSearchText}
                            className="flex-1 ml-3 text-white font-medium"
                        />
                    </View>
                    <TouchableOpacity onPress={handleScan} className="bg-blue-600 rounded-xl justify-center items-center w-14 border border-blue-500">
                        <ScanLine size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {loading && !refreshing && !products.length ? (
                    <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListHeaderComponent={renderHeader}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                        ListEmptyComponent={<View className="items-center justify-center py-20"><Package size={64} color="#334155" /><Text className="text-slate-500 mt-4 font-medium">Kayıt bulunamadı</Text></View>}
                        initialNumToRender={10} maxToRenderPerBatch={10} windowSize={5} removeClippedSubviews={true} getItemLayout={(data, index) => ({ length: 100, offset: 100 * index, index })}
                    />
                )}
            </SafeAreaView>

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
