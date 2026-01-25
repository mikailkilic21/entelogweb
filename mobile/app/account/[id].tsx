import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Phone, Mail, MapPin, TrendingUp, TrendingDown, FileText, ChevronLeft, Calendar, FileBox } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AccountDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [account, setAccount] = useState<any>(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'summary' | 'transactions'>('summary');

    useEffect(() => {
        if (id) {
            fetchAccountDetails();
        }
    }, [id]);

    const fetchAccountDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/accounts/${id}`);
            if (res.ok) {
                const data = await res.json();
                setAccount(data);
                if (data.transactions) {
                    setTransactions(data.transactions);
                }
            }
        } catch (error) {
            console.error('Account detail error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone: string) => {
        if (phone) Linking.openURL(`tel:${phone}`);
    };

    const handleEmail = (email: string) => {
        if (email) Linking.openURL(`mailto:${email}`);
    };

    const handleMap = (address: string) => {
        if (address) {
            const url = Platform.select({
                ios: `maps:0,0?q=${address}`,
                android: `geo:0,0?q=${address}`,
            });
            if (url) Linking.openURL(url);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-950 items-center justify-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!account) {
        return (
            <View className="flex-1 bg-slate-950 items-center justify-center">
                <Text className="text-white">Hesap bulunamadı</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <Stack.Screen options={{ headerShown: false }} />
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-4 py-3 flex-row items-center border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-slate-800 rounded-full">
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg" numberOfLines={1}>{account.name}</Text>
                        <Text className="text-slate-400 text-xs font-mono">{account.code}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View className="flex-row border-b border-slate-800 bg-slate-900/30">
                    <TouchableOpacity
                        onPress={() => setActiveTab('summary')}
                        className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'summary' ? 'border-blue-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'summary' ? 'text-blue-400' : 'text-slate-500'}`}>Özet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('transactions')}
                        className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'transactions' ? 'border-blue-500' : 'border-transparent'}`}
                    >
                        <Text className={`font-bold ${activeTab === 'transactions' ? 'text-blue-400' : 'text-slate-500'}`}>Hareketler</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {activeTab === 'summary' ? (
                        <Animated.View incoming={FadeInDown.springify()}>
                            {/* Balance Card */}
                            <LinearGradient
                                colors={account.balance >= 0 ? ['#059669', '#047857'] : ['#dc2626', '#b91c1c']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="p-6 rounded-2xl mb-6 shadow-lg"
                            >
                                <Text className="text-white/80 font-medium mb-1">Güncel Bakiye</Text>
                                <View className="flex-row items-center gap-3">
                                    {account.balance >= 0 ? <TrendingUp color="white" size={32} /> : <TrendingDown color="white" size={32} />}
                                    <Text className="text-white font-bold text-4xl">
                                        {Math.abs(account.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                    </Text>
                                </View>
                                <Text className="text-white/80 mt-2 font-bold bg-black/20 self-start px-3 py-1 rounded-lg">
                                    {account.balance >= 0 ? 'ALACAK' : 'BORÇ'}
                                </Text>
                            </LinearGradient>

                            {/* Contact Info */}
                            <View className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 gap-5">
                                <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">İletişim</Text>

                                {account.phone1 && (
                                    <TouchableOpacity onPress={() => handleCall(account.phone1)} className="flex-row items-center gap-4">
                                        <View className="bg-blue-500/10 p-3 rounded-full">
                                            <Phone size={20} color="#60a5fa" />
                                        </View>
                                        <View>
                                            <Text className="text-slate-400 text-xs">Telefon</Text>
                                            <Text className="text-white font-medium text-base">{account.phone1}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {account.email && (
                                    <TouchableOpacity onPress={() => handleEmail(account.email)} className="flex-row items-center gap-4">
                                        <View className="bg-purple-500/10 p-3 rounded-full">
                                            <Mail size={20} color="#c084fc" />
                                        </View>
                                        <View>
                                            <Text className="text-slate-400 text-xs">E-posta</Text>
                                            <Text className="text-white font-medium text-base">{account.email}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}

                                {(account.address1 || account.town || account.city) && (
                                    <TouchableOpacity
                                        onPress={() => handleMap(`${account.address1} ${account.town} ${account.city}`)}
                                        className="flex-row items-center gap-4"
                                    >
                                        <View className="bg-emerald-500/10 p-3 rounded-full">
                                            <MapPin size={20} color="#34d399" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-slate-400 text-xs">Adres</Text>
                                            <Text className="text-white font-medium text-base leading-5">
                                                {[account.address1, account.town, account.city].filter(Boolean).join('\n')}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Tax Info */}
                            <View className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 mt-4">
                                <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Vergi Bilgileri</Text>
                                <View className="flex-row justify-between mb-3 border-b border-slate-800 pb-3">
                                    <Text className="text-slate-400">Vergi Dairesi</Text>
                                    <Text className="text-white font-medium">{account.taxOffice || '-'}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-slate-400">Vergi No</Text>
                                    <Text className="text-white font-medium font-mono">{account.taxNumber || '-'}</Text>
                                </View>
                            </View>
                        </Animated.View>
                    ) : (
                        <Animated.View incoming={FadeInDown.springify()} className="gap-3">
                            {transactions && transactions.length > 0 ? (
                                transactions.map((tr: any, i) => (
                                    <View key={tr.id} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex-row justify-between items-center">
                                        <View className="flex-1">
                                            <View className="flex-row items-center gap-2 mb-1">
                                                <Calendar size={12} color="#94a3b8" />
                                                <Text className="text-slate-400 text-xs">
                                                    {new Date(tr.date).toLocaleDateString('tr-TR')}
                                                </Text>
                                                <View className="bg-slate-800 px-1.5 py-0.5 rounded">
                                                    <Text className="text-slate-500 text-[10px] font-mono">{tr.invoiceNo}</Text>
                                                </View>
                                            </View>
                                            <Text className="text-white font-medium mb-1" numberOfLines={1}>{tr.description || 'İşlem'}</Text>
                                            <View className={`self-start px-2 py-0.5 rounded ${tr.type.includes('Satış') ? 'bg-green-500/10' : 'bg-blue-500/10'}`}>
                                                <Text className={`text-[10px] ${tr.type.includes('Satış') ? 'text-green-400' : 'text-blue-400'}`}>{tr.type}</Text>
                                            </View>
                                        </View>
                                        <View>
                                            <Text className="text-white font-bold text-lg text-right">
                                                {tr.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View className="items-center py-20">
                                    <FileBox size={48} color="#475569" />
                                    <Text className="text-slate-500 mt-4">İşlem bulunamadı</Text>
                                </View>
                            )}
                        </Animated.View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
