import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Settings,
    User,
    Bell,
    BarChart3,
    Info,
    LogOut,
    ChevronRight,
    Shield,
    HelpCircle
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onPress: () => void;
    color: string;
    isDanger?: boolean;
}

export default function MoreMenu() {
    const router = useRouter();
    const { signOut, user } = useAuth();

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Uygulamadan çıkmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: () => {
                        signOut();
                        router.replace('/login');
                    }
                },
            ]
        );
    };

    const menuItems: MenuItem[] = [

        {
            id: 'profile',
            title: 'Profil',
            subtitle: 'Kullanıcı bilgileri',
            icon: <User size={24} color="#10b981" />,
            onPress: () => router.push('/more/profile' as any),
            color: '#10b981',
        },
        {
            id: 'notifications',
            title: 'Bildirimler',
            subtitle: 'Bildirim ayarları',
            icon: <Bell size={24} color="#f59e0b" />,
            onPress: () => router.push('/more/notifications' as any),
            color: '#f59e0b',
        },
        {
            id: 'security',
            title: 'Güvenlik',
            subtitle: 'Şifre ve güvenlik ayarları',
            icon: <Shield size={24} color="#06b6d4" />,
            onPress: () => router.push('/more/security' as any),
            color: '#06b6d4',
        },
        {
            id: 'help',
            title: 'Yardım',
            subtitle: 'Sık sorulan sorular ve destek',
            icon: <HelpCircle size={24} color="#64748b" />,
            onPress: () => router.push('/more/help' as any),
            color: '#64748b',
        },
        {
            id: 'about',
            title: 'Hakkında',
            subtitle: 'Uygulama bilgileri ve versiyon',
            icon: <Info size={24} color="#64748b" />,
            onPress: () => router.push('/more/about' as any),
            color: '#64748b',
        },
        {
            id: 'logout',
            title: 'Çıkış Yap',
            subtitle: 'Hesaptan çık',
            icon: <LogOut size={24} color="#ef4444" />,
            onPress: handleLogout,
            color: '#ef4444',
            isDanger: true,
        },
    ];

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />

            <SafeAreaView className="flex-1 px-4 pt-2">
                {/* Header with User Info */}
                <View className="mb-6">
                    <View className="flex-row items-center gap-3 mb-4">
                        <Image
                            source={require('../../assets/images/siyahlogo.png')}
                            style={{ width: 40, height: 40, borderRadius: 10 }}
                            resizeMode="contain"
                        />
                        <View>
                            <Text className="text-3xl font-black text-white">Daha Fazla</Text>
                            <Text className="text-slate-400 text-xs font-medium tracking-wide uppercase">
                                More Options
                            </Text>
                        </View>
                    </View>

                    {/* User Card */}
                    <View className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 border-t border-white/10">
                        <View className="flex-row items-center gap-4">
                            <View className="bg-white/20 p-4 rounded-full">
                                <User size={32} color="#fff" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-white font-bold text-lg">
                                    {user?.username || 'Kullanıcı'}
                                </Text>
                                <Text className="text-white/70 text-sm capitalize">
                                    {user?.role || 'user'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={item.onPress}
                            className="mb-3"
                            activeOpacity={0.7}
                        >
                            <View className={`bg-slate-900/50 border rounded-2xl p-4 ${item.isDanger ? 'border-red-500/30' : 'border-slate-800'
                                }`}>
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-4 flex-1">
                                        {/* Icon Container */}
                                        <View
                                            className="p-3 rounded-xl"
                                            style={{ backgroundColor: `${item.color}20` }}
                                        >
                                            {item.icon}
                                        </View>

                                        {/* Text Content */}
                                        <View className="flex-1">
                                            <Text className={`font-bold text-base mb-0.5 ${item.isDanger ? 'text-red-400' : 'text-white'
                                                }`}>
                                                {item.title}
                                            </Text>
                                            <Text className="text-slate-500 text-xs">
                                                {item.subtitle}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Chevron */}
                                    {!item.isDanger && (
                                        <ChevronRight size={20} color="#64748b" />
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* App Info Footer */}
                    <View className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 mt-6">
                        <Text className="text-slate-600 text-center text-xs">
                            Entelog Mobile v1.0.0
                        </Text>
                        <Text className="text-slate-700 text-center text-[10px] mt-1">
                            © 2026 Mikail KILIÇ - Tüm Hakları Saklıdır
                        </Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
