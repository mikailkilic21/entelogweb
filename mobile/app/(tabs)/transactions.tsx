import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, Receipt, ShoppingCart, Banknote, Users, ChevronRight } from 'lucide-react-native';

interface MenuItem {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    route: string;
    gradient: string[];
}

export default function TransactionsHub() {
    const router = useRouter();

    const menuItems: MenuItem[] = [
        {
            id: 'products',
            title: 'Stok ve Ürünler',
            subtitle: 'Ürün listesi, stok durumu',
            icon: <Package size={32} color="#fff" />,
            route: '/products',
            gradient: ['#3b82f6', '#1d4ed8'],
        },
        {
            id: 'invoices',
            title: 'Faturalar',
            subtitle: 'Alış ve satış faturaları',
            icon: <Receipt size={32} color="#fff" />,
            route: '/invoices',
            gradient: ['#10b981', '#059669'],
        },
        {
            id: 'orders',
            title: 'Siparişler',
            subtitle: 'Sipariş takibi ve yönetimi',
            icon: <ShoppingCart size={32} color="#fff" />,
            route: '/orders',
            gradient: ['#f59e0b', '#d97706'],
        },
        {
            id: 'checks',
            title: 'Çek ve Senetler',
            subtitle: 'Çek/senet takibi',
            icon: <Banknote size={32} color="#fff" />,
            route: '/checks',
            gradient: ['#8b5cf6', '#7c3aed'],
        },
        {
            id: 'accounts',
            title: 'Cari Hesaplar',
            subtitle: 'Müşteri ve tedarikçiler',
            icon: <Users size={32} color="#fff" />,
            route: '/accounts',
            gradient: ['#ef4444', '#dc2626'],
        },
    ];

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />

            <SafeAreaView className="flex-1 px-4 pt-2">
                {/* Header */}
                <View className="flex-row items-center gap-3 mb-6">
                    <Image
                        source={require('../../assets/images/siyahlogo.png')}
                        style={{ width: 40, height: 40, borderRadius: 10 }}
                        resizeMode="contain"
                    />
                    <View>
                        <Text className="text-3xl font-black text-white">İşlemler</Text>
                        <Text className="text-slate-400 text-xs font-medium tracking-wide uppercase">
                            Transaction Hub
                        </Text>
                    </View>
                </View>

                {/* Menu Grid */}
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => router.push(item.route as any)}
                            className="mb-4"
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={item.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="rounded-3xl p-6 border-t border-white/10 shadow-lg"
                                style={{
                                    shadowColor: item.gradient[0],
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                }}
                            >
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-4">
                                        {/* Icon Container */}
                                        <View className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                                            {item.icon}
                                        </View>

                                        {/* Text Content */}
                                        <View className="flex-1">
                                            <Text className="text-white font-bold text-lg mb-1">
                                                {item.title}
                                            </Text>
                                            <Text className="text-white/70 text-sm">
                                                {item.subtitle}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Chevron */}
                                    <ChevronRight size={24} color="rgba(255,255,255,0.6)" />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}

                    {/* Info Card */}
                    <View className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mt-4">
                        <Text className="text-slate-400 text-sm text-center">
                            💡 İşlem kategorilerine hızlı erişim için bu menüyü kullanın
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
