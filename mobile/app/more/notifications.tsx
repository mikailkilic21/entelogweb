import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, MessageSquare, AlertCircle, CheckCircle2, Clock } from 'lucide-react-native';

export default function NotificationsScreen() {
    const router = useRouter();

    const [settings, setSettings] = useState({
        push: true,
        email: false,
        orders: true,
        stock: true,
        marketing: false
    });

    const toggleSwitch = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const notifications = [
        {
            id: 1,
            title: 'Sipariş Onaylandı',
            message: '#ORD-2024001 nolu siparişiniz onaylandı ve hazırlanıyor.',
            time: '2 saat önce',
            type: 'success',
            icon: CheckCircle2,
            color: '#10b981'
        },
        {
            id: 2,
            title: 'Stok Uyarısı',
            message: 'iPhone 15 Pro Max stok seviyesi kritik seviyenin altına düştü (3 adet).',
            time: '5 saat önce',
            type: 'warning',
            icon: AlertCircle,
            color: '#f59e0b'
        },
        {
            id: 3,
            title: 'Yeni Mesaj',
            message: 'Muhasebe departmanından yeni bir mesajınız var.',
            time: 'Dün',
            type: 'info',
            icon: MessageSquare,
            color: '#3b82f6'
        },
    ];

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Bildirimler</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    {/* Settings Section */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Bildirim Ayarları</Text>
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-8">
                        {[
                            { key: 'push', label: 'Anlık Bildirimler', desc: 'Uygulama içi bildirimleri al' },
                            { key: 'email', label: 'E-Posta Bildirimleri', desc: 'Önemli güncellemeleri e-posta ile al' },
                            { key: 'orders', label: 'Sipariş Durumları', desc: 'Sipariş güncellemelerinden haberdar ol' },
                            { key: 'stock', label: 'Stok Uyarıları', desc: 'Kritik stok seviyelerinde uyar' },
                        ].map((item, index) => (
                            <View
                                key={item.key}
                                className={`flex-row items-center justify-between p-4 ${index !== 3 ? 'border-b border-slate-800' : ''}`}
                            >
                                <View className="flex-1 mr-4">
                                    <Text className="text-white font-bold text-base">{item.label}</Text>
                                    <Text className="text-slate-500 text-xs mt-0.5">{item.desc}</Text>
                                </View>
                                <Switch
                                    trackColor={{ false: "#334155", true: "#3b82f6" }}
                                    thumbColor={settings[item.key as keyof typeof settings] ? "#fff" : "#cbd5e1"}
                                    onValueChange={() => toggleSwitch(item.key as keyof typeof settings)}
                                    value={settings[item.key as keyof typeof settings]}
                                />
                            </View>
                        ))}
                    </View>

                    {/* Recent Notifications */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Son Bildirimler</Text>
                    <View className="gap-3">
                        {notifications.map((notif) => (
                            <View key={notif.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex-row gap-4">
                                <View className="mt-1 p-2 rounded-full" style={{ backgroundColor: `${notif.color}20` }}>
                                    <notif.icon size={20} color={notif.color} />
                                </View>
                                <View className="flex-1">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className="text-white font-bold text-base flex-1 mr-2">{notif.title}</Text>
                                        <View className="flex-row items-center mt-1">
                                            <Clock size={10} color="#64748b" />
                                            <Text className="text-slate-500 text-[10px] ml-1">{notif.time}</Text>
                                        </View>
                                    </View>
                                    <Text className="text-slate-400 text-sm leading-5">{notif.message}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
