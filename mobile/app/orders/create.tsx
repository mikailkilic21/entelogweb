import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ChevronLeft, Save, Plus, Trash2, Search, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Config';

export default function CreateOrderScreen() {
    const router = useRouter();
    const { isDemo } = useAuth();

    // Form State
    const [customer, setCustomer] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Data State
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Modals
    const [customerModalVisible, setCustomerModalVisible] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);

    // Search
    const [customerSearch, setCustomerSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');

    // Fetch Customers (Actually Accounts)
    const fetchCustomers = useCallback(async (search = '') => {
        setIsSearching(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const url = `${API_URL}/accounts?search=${encodeURIComponent(search)}&limit=20`;
            console.log('Fetching accounts:', url);

            const res = await fetch(url, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-demo-mode': isDemo ? 'true' : 'false'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setCustomers(Array.isArray(data) ? data : []);
            } else {
                console.error('Account fetch failed:', res.status);
            }
        } catch (error: any) {
            console.error('Account fetch error:', error);
            Alert.alert('Hata', 'Müşteriler getirilemedi: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    }, [isDemo]);

    // Fetch Products
    const fetchProducts = useCallback(async (search = '') => {
        setIsSearching(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const url = `${API_URL}/products?search=${encodeURIComponent(search)}&limit=20`;

            const res = await fetch(url, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-demo-mode': isDemo ? 'true' : 'false'
                }
            });

            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } else {
                console.error('Product fetch failed:', res.status);
            }
        } catch (error: any) {
            console.error('Product fetch error:', error);
            Alert.alert('Hata', 'Ürünler getirilemedi: ' + error.message);
        } finally {
            setIsSearching(false);
        }
    }, [isDemo]);

    // Search effects (Only fetch when searching)
    useEffect(() => {
        if (customerModalVisible) {
            if (customerSearch.trim().length === 0) {
                setCustomers([]);
                return;
            }
            const timer = setTimeout(() => fetchCustomers(customerSearch), 500);
            return () => clearTimeout(timer);
        }
    }, [customerModalVisible, customerSearch, fetchCustomers]);

    useEffect(() => {
        if (productModalVisible) {
            if (productSearch.trim().length === 0) {
                setProducts([]);
                return;
            }
            const timer = setTimeout(() => fetchProducts(productSearch), 500);
            return () => clearTimeout(timer);
        }
    }, [productModalVisible, productSearch, fetchProducts]);

    const addItem = (product: any) => {
        try {
            setItems(prev => {
                const productId = product.id || product.LOGICALREF;
                const existing = prev.find(i => (i.product.id || i.product.LOGICALREF) === productId);

                if (existing) {
                    return prev.map(i => (i.product.id || i.product.LOGICALREF) === productId ? { ...i, quantity: i.quantity + 1 } : i);
                }

                // Logic: Use fixedPrice (defined sales price) if available, otherwise avgPrice
                const price = parseFloat(product.fixedPrice) || parseFloat(product.avgPrice) || 0;
                return [...prev, { product, quantity: 1, price, discount: 0 }];
            });
            setProductModalVisible(false);
            setProductSearch('');
        } catch (error) {
            console.error('Add item error:', error);
            Alert.alert('Hata', 'Ürün eklenirken bir sorun oluştu.');
        }
    };

    const removeItem = (productId: number) => {
        setItems(prev => prev.filter(i => (i.product.id || i.product.LOGICALREF) !== productId));
    };

    const updateQuantity = (productId: number, text: string) => {
        const qty = parseFloat(text);
        if (isNaN(qty)) return;
        setItems(prev => prev.map(i => (i.product.id || i.product.LOGICALREF) === productId ? { ...i, quantity: qty } : i));
    };

    const updateDiscount = (productId: number, text: string) => {
        if (text === '') {
            setItems(prev => prev.map(i => (i.product.id || i.product.LOGICALREF) === productId ? { ...i, discount: 0 } : i));
            return;
        }
        const disc = parseFloat(text);
        if (isNaN(disc)) return;
        const validDisc = Math.min(Math.max(disc, 0), 100);
        setItems(prev => prev.map(i => (i.product.id || i.product.LOGICALREF) === productId ? { ...i, discount: validDisc } : i));
    };

    const calculateTotal = () => {
        let subtotal = 0;
        items.forEach(item => {
            const itemTotal = item.quantity * item.price;
            const discountAmount = itemTotal * (item.discount / 100);
            subtotal += (itemTotal - discountAmount);
        });
        let vat = subtotal * 0.20; // %20 KDV

        return { subtotal, vat, total: subtotal + vat };
    };

    const handleSave = async () => {
        if (!customer) {
            Alert.alert('Hata', 'Lütfen bir müşteri seçiniz.');
            return;
        }
        if (items.length === 0) {
            Alert.alert('Hata', 'Lütfen en az bir ürün ekleyiniz.');
            return;
        }

        setLoading(true);
        try {
            const token = await SecureStore.getItemAsync('token');
            const totals = calculateTotal();

            const orderData = {
                customer: {
                    id: customer.id,
                    name: customer.name || customer.title,
                    code: customer.code
                },
                lines: items.map(i => ({
                    id: i.product.id || i.product.LOGICALREF,
                    code: i.product.code,
                    name: i.product.name,
                    quantity: i.quantity,
                    unit: i.product.unit || 'ADET',
                    price: i.price,
                    discountRate: i.discount,
                    total: (i.quantity * i.price) * (1 - i.discount / 100)
                })),
                note: title || 'Mobil Sipariş',
                netTotal: totals.total,
                grossTotal: totals.subtotal,
                date: new Date().toISOString().split('T')[0]
            };

            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-demo-mode': isDemo ? 'true' : 'false'
                },
                body: JSON.stringify(orderData)
            });

            if (res.ok) {
                Alert.alert('Başarılı', 'Sipariş başarıyla kaydedildi.', [
                    { text: 'Tamam', onPress: () => router.back() }
                ]);
            } else {
                const errorData = await res.json();
                Alert.alert('Hata', errorData.error || 'Sipariş kaydedilemedi.');
            }

        } catch (error: any) {
            console.error('Order save error:', error);
            Alert.alert('Hata', 'Bir ağ sorunu oluştu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateTotal();

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Yeni Sipariş</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        className={`p-2 rounded-lg ${loading ? 'opacity-50' : ''}`}
                    >
                        <Save size={24} color="#3b82f6" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1 px-4 py-4">
                    {/* Customer Section */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Müşteri Bilgileri</Text>
                    <TouchableOpacity
                        onPress={() => setCustomerModalVisible(true)}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4 flex-row items-center justify-between"
                    >
                        <View>
                            {customer ? (
                                <>
                                    <Text className="text-white font-bold text-base">{customer.name || customer.title}</Text>
                                    <Text className="text-slate-500 text-sm">{customer.code} • Bakiye: ₺{customer.balance ? customer.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0.00'}</Text>
                                </>
                            ) : (
                                <Text className="text-slate-500 font-medium">Müşteri Seçiniz...</Text>
                            )}
                        </View>
                        <ChevronLeft size={20} color="#64748b" style={{ transform: [{ rotate: '270deg' }] }} />
                    </TouchableOpacity>

                    {/* Order Title */}
                    <View className="mb-6">
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Sipariş Notu</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Not giriniz..."
                            placeholderTextColor="#64748b"
                            className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white"
                        />
                    </View>

                    {/* Products List */}
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-slate-400 text-xs font-bold uppercase ml-1">Ürünler</Text>
                        <TouchableOpacity onPress={() => setProductModalVisible(true)} className="flex-row items-center">
                            <Plus size={16} color="#3b82f6" />
                            <Text className="text-blue-500 font-bold ml-1 text-sm">Ürün Ekle</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="space-y-3 mb-8">
                        {items.length === 0 ? (
                            <View className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 items-center justify-center">
                                <Text className="text-slate-500 text-sm">Henüz ürün eklenmedi</Text>
                            </View>
                        ) : (
                            items.map((item, index) => (
                                <View key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-1 mr-2">
                                            <Text className="text-white font-bold">{item.product.name}</Text>
                                            <Text className="text-slate-500 text-xs">{item.product.code}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeItem(item.product.id)} className="bg-red-500/10 p-2 rounded-lg -mr-1 -mt-1">
                                            <Trash2 size={18} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="flex-row items-center justify-between gap-2">
                                        {/* Quantity */}
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-[10px] uppercase font-bold mb-1">Miktar</Text>
                                            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-lg h-10 px-2">
                                                <TextInput
                                                    value={item.quantity.toString()}
                                                    onChangeText={(t) => updateQuantity(item.product.id, t)}
                                                    keyboardType="numeric"
                                                    className="flex-1 text-white text-center font-bold"
                                                />
                                                <Text className="text-slate-500 text-xs ml-1">{item.product.unit || 'ADET'}</Text>
                                            </View>
                                        </View>

                                        {/* Price (Read-only or visual) */}
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-[10px] uppercase font-bold mb-1">Birim Fiyat</Text>
                                            <View className="bg-slate-950 border border-slate-800 rounded-lg h-10 justify-center px-2">
                                                <Text className="text-white text-center font-bold">₺{item.price.toFixed(2)}</Text>
                                            </View>
                                        </View>

                                        {/* Discount */}
                                        <View className="w-20">
                                            <Text className="text-slate-500 text-[10px] uppercase font-bold mb-1">İsk. %</Text>
                                            <View className="bg-slate-950 border border-slate-800 rounded-lg h-10 justify-center px-1">
                                                <TextInput
                                                    value={item.discount > 0 ? item.discount.toString() : ''}
                                                    onChangeText={(t) => updateDiscount(item.product.id, t)}
                                                    keyboardType="numeric"
                                                    placeholder="0"
                                                    placeholderTextColor="#475569"
                                                    className="text-white text-center font-bold"
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Line Total */}
                                    <View className="items-end mt-2">
                                        <Text className="text-blue-400 font-bold text-sm">
                                            Toplam: ₺{((item.quantity * item.price) * (1 - (item.discount || 0) / 100)).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Summary */}
                    <View className="bg-slate-900 rounded-xl p-4 mb-8">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-slate-400">Ara Toplam (İskontolu)</Text>
                            <Text className="text-white font-medium">₺{totals.subtotal.toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-slate-400">KDV (%20)</Text>
                            <Text className="text-white font-medium">₺{totals.vat.toFixed(2)}</Text>
                        </View>
                        <View className="h-[1px] bg-slate-800 my-2" />
                        <View className="flex-row justify-between">
                            <Text className="text-white font-bold text-lg">Genel Toplam</Text>
                            <Text className="text-green-500 font-bold text-lg">₺{totals.total.toFixed(2)}</Text>
                        </View>
                    </View>

                </ScrollView>

                {/* Submit Bar */}
                <View className="p-4 bg-slate-900 border-t border-slate-800">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        className="bg-blue-600 h-14 rounded-xl items-center justify-center shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Siparişi Oluştur</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Customer Modal */}
                <Modal
                    visible={customerModalVisible}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => { setCustomerModalVisible(false); setCustomerSearch(''); }}
                >
                    <View className="flex-1 bg-slate-950">
                        <View className="flex-row justify-between items-center p-4 border-b border-slate-800">
                            <Text className="text-white font-bold text-lg">Müşteri Seç</Text>
                            <TouchableOpacity onPress={() => { setCustomerModalVisible(false); setCustomerSearch(''); }} className="p-2">
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-4">
                            <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-3 border border-slate-800">
                                <Search size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Müşteri ara..."
                                    placeholderTextColor="#64748b"
                                    className="flex-1 ml-3 text-white"
                                    value={customerSearch}
                                    onChangeText={setCustomerSearch}
                                    autoFocus
                                />
                            </View>
                        </View>
                        {isSearching ? (
                            <ActivityIndicator color="#3b82f6" className="mt-4" />
                        ) : (
                            <FlatList
                                data={customers}
                                keyExtractor={item => item.id.toString()}
                                ListEmptyComponent={<Text className="text-slate-500 text-center mt-4">Müşteri bulunamadı.</Text>}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => { setCustomer(item); setCustomerModalVisible(false); setCustomerSearch(''); }}
                                        className="p-4 border-b border-slate-800 active:bg-slate-900"
                                    >
                                        <Text className="text-white font-bold">{item.name || item.title}</Text>
                                        <Text className="text-slate-500 text-sm">{item.code} • ₺{item.balance ? item.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '0.00'}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </Modal>

                {/* Product Modal */}
                <Modal
                    visible={productModalVisible}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={() => { setProductModalVisible(false); setProductSearch(''); }}
                >
                    <View className="flex-1 bg-slate-950">
                        <View className="flex-row justify-between items-center p-4 border-b border-slate-800">
                            <Text className="text-white font-bold text-lg">Ürün Ekle</Text>
                            <TouchableOpacity onPress={() => { setProductModalVisible(false); setProductSearch(''); }} className="p-2">
                                <X size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View className="p-4">
                            <View className="bg-slate-900 rounded-xl flex-row items-center px-4 py-3 border border-slate-800">
                                <Search size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Ürün ara..."
                                    placeholderTextColor="#64748b"
                                    className="flex-1 ml-3 text-white"
                                    value={productSearch}
                                    onChangeText={setProductSearch}
                                    autoFocus
                                />
                            </View>
                        </View>
                        {isSearching ? (
                            <ActivityIndicator color="#3b82f6" className="mt-4" />
                        ) : (
                            <FlatList
                                data={products}
                                keyExtractor={item => item.id.toString()}
                                ListEmptyComponent={<Text className="text-slate-500 text-center mt-4">Ürün bulunamadı.</Text>}
                                renderItem={({ item }) => {
                                    // Calculate display price
                                    const rawPrice = item.fixedPrice || item.avgPrice || 0;
                                    const displayPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice as string) || 0;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => addItem(item)}
                                            className="p-4 border-b border-slate-800 active:bg-slate-900 flex-row justify-between items-center"
                                        >
                                            <View>
                                                <Text className="text-white font-bold">{item.name}</Text>
                                                <Text className="text-slate-500 text-sm">{item.code} • Stok: {item.realStock || item.stockLevel || 0} {item.unit}</Text>
                                            </View>
                                            <Text className="text-blue-400 font-bold">₺{displayPrice.toFixed(2)}</Text>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        )}
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
}
