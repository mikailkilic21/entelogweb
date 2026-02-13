import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Package, Receipt, ShoppingCart, Banknote, Users, Landmark, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MenuItem {
    id: string;
    title: string;
    description: string;
    Icon: React.ElementType;
    route: string;
    hex: string;
    bg: string;
}

const MENU_ITEMS: MenuItem[] = [
    { id: 'products', title: 'Stok ve Ürünler', description: 'Stok durumu', Icon: Package, route: '/products', hex: '#3b82f6', bg: 'bg-blue-500/10' },
    { id: 'invoices', title: 'Faturalar', description: 'Satış/Alış', Icon: Receipt, route: '/invoices', hex: '#10b981', bg: 'bg-emerald-500/10' },
    { id: 'orders', title: 'Siparişler', description: 'Sipariş takibi', Icon: ShoppingCart, route: '/orders', hex: '#f59e0b', bg: 'bg-amber-500/10' },
    { id: 'checks', title: 'Çek ve Senetler', description: 'Portföy', Icon: Banknote, route: '/checks', hex: '#8b5cf6', bg: 'bg-violet-500/10' },
    { id: 'banks', title: 'Bankalar', description: 'Bakiyeler', Icon: Landmark, route: '/banks', hex: '#0891b2', bg: 'bg-cyan-500/10' },
    { id: 'accounts', title: 'Cari Hesaplar', description: 'Müşteri/Tedarikçi', Icon: Users, route: '/accounts', hex: '#ef4444', bg: 'bg-red-500/10' },
];

export default function TransactionsHub() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 pt-2 pb-6 flex-row items-center justify-between z-10">
                    <View className="flex-row items-center gap-3">
                        <View className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-lg shadow-black/50">
                            <Image
                                source={require('../../assets/images/siyahlogo.png')}
                                style={{ width: 40, height: 40, borderRadius: 10 }}
                                resizeMode="contain"
                            />
                        </View>
                        <View>
                            <Text className="text-2xl font-black text-white tracking-tight">İşlemler</Text>
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                Menü
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Grid */}
                <ScrollView
                    className="flex-1 px-6"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-row flex-wrap justify-between">
                        {MENU_ITEMS.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => router.push(item.route as any)}
                                activeOpacity={0.9}
                                className="w-[48%] aspect-square mb-6 rounded-3xl overflow-hidden relative border-b-[6px] border-r-2 border-slate-900 active:border-b-0 active:translate-y-[6px] transition-all bg-slate-800"
                                style={{
                                    shadowColor: item.hex,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}
                            >
                                {/* Gradient Overlay */}
                                <LinearGradient
                                    colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.95)']}
                                    className="absolute inset-0"
                                />

                                {/* Glow */}
                                <View className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10`} style={{ backgroundColor: item.hex }} />

                                {/* Giant Bg Icon */}
                                <View className="absolute -right-4 -bottom-4 opacity-10 transform rotate-[-15deg]">
                                    <item.Icon size={100} color={item.hex} />
                                </View>

                                {/* Content */}
                                <View className="flex-1 p-4 justify-between">
                                    {/* Icon Container with Glassy look */}
                                    <View
                                        className="w-12 h-12 rounded-2xl items-center justify-center border border-white/5"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                    >
                                        <item.Icon size={24} color={item.hex} />
                                    </View>

                                    {/* Text */}
                                    <View>
                                        <Text
                                            className="text-white font-bold text-base leading-5 mb-1 shadow-black shadow-sm"
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {item.title}
                                        </Text>
                                        <View className="flex-row items-center">
                                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mr-1" numberOfLines={1}>
                                                {item.description}
                                            </Text>
                                            <ChevronRight size={10} color="#64748b" />
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>

            </SafeAreaView>
        </View>
    );
}
