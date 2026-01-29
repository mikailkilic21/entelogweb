import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Calendar, Check, LogOut, ChevronRight, X, Briefcase, FileText, MessageCircle } from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';

// 3D Card Component
const MenuCard = ({ children, onPress, colors = ['#1e293b', '#0f172a'] }: any) => {
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);
    const rotateX = useSharedValue(15); // Start tilted

    useEffect(() => {
        scale.value = withSpring(1, { damping: 12 });
        opacity.value = withTiming(1, { duration: 500 });
        rotateX.value = withSpring(0, { damping: 15, mass: 1.2 }); // Settle to 0
    }, []);

    const pressed = useSharedValue(false);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [
                { perspective: 500 },
                { scale: withSpring(pressed.value ? 0.95 : 1) },
                { rotateX: `${rotateX.value + (pressed.value ? 5 : 0)}deg` }
            ]
        };
    });

    return (
        <Pressable
            onPressIn={() => (pressed.value = true)}
            onPressOut={() => (pressed.value = false)}
            onPress={onPress}
        >
            <Animated.View style={[animatedStyle, { marginBottom: 16 }]}>
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                >
                    {children}
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
};

export default function MenuScreen() {
    const { isDemo, signOut } = useAuth();
    const [dbConfig, setDbConfig] = useState<any>(null);
    const [firms, setFirms] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [showFirmModal, setShowFirmModal] = useState(false);
    const [showPeriodModal, setShowPeriodModal] = useState(false);

    useEffect(() => {
        if (!isDemo) {
            fetchDbConfig();
            fetchFirms();
        } else {
            // For Demo, mock config or keep empty
            setDbConfig({ firmName: 'DEMO LTD. ŞTİ.', firmNo: '999', periodNo: '01' });
        }
    }, [isDemo]);

    const fetchDbConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/db`);
            const data = await res.json();
            setDbConfig(data);
        } catch (err) {
            console.error('Config fetch error:', err);
        }
    };

    const fetchFirms = async () => {
        try {
            const res = await fetch(`${API_URL}/firms`);
            const data = await res.json();
            setFirms(data);
        } catch (err) {
            console.error('Firms error:', err);
        }
    };

    const fetchPeriods = async (firmNo: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/firms/${firmNo}/periods`);
            const data = await res.json();
            setPeriods(data);
        } catch (err) {
            console.error('Periods error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFirmSelect = async (firm: any) => {
        setShowFirmModal(false);
        if (dbConfig) {
            setDbConfig({ ...dbConfig, firmNo: firm.nr.toString(), firmName: firm.name });
        }
        await fetchPeriods(firm.nr);
        setTimeout(() => setShowPeriodModal(true), 300); // Slight delay for smooth UI
    };

    const handlePeriodSelect = async (period: any) => {
        setShowPeriodModal(false);
        const newPeriodNo = period.nr.toString().padStart(2, '0');
        if (dbConfig) {
            await switchFirmPeriod(dbConfig.firmNo, newPeriodNo);
        }
    };

    const switchFirmPeriod = async (firmNo: string, periodNo: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/settings/db/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firmNo, periodNo })
            });

            if (res.ok) {
                Alert.alert('Başarılı', 'Firma ve dönem değiştirildi.');
                fetchDbConfig();
                router.replace('/(tabs)');
            } else {
                Alert.alert('Hata', 'Değişiklik yapılamadı.');
            }
        } catch (err) {
            Alert.alert('Hata', 'Sunucu hatası.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />

            <SafeAreaView className="flex-1 px-6 pt-6">
                <View className="flex-row items-center gap-3 mb-6">
                    <Image
                        source={require('../../assets/images/siyahlogo.png')}
                        style={{ width: 40, height: 40, borderRadius: 10 }}
                        resizeMode="contain"
                    />
                    <View>
                        <Text className="text-3xl font-black text-white">Ayarlar</Text>
                        <Text className="text-slate-400 text-[10px] font-medium tracking-wide uppercase">Entelog Mobile</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Active Info Card */}
                    <MenuCard colors={isDemo ? ['#ea580c', '#c2410c'] : ['#1e293b', '#0f172a']}>
                        <View className="flex-row items-center justify-between mb-4">
                            <View className={isDemo ? "bg-orange-500/20 p-2 rounded-lg" : "bg-blue-500/20 p-2 rounded-lg"}>
                                <Briefcase size={20} color={isDemo ? "#fdba74" : "#60a5fa"} />
                            </View>
                            <View className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                <Text className={isDemo ? "text-orange-200 text-xs font-bold" : "text-slate-400 text-xs font-bold"}>
                                    {isDemo ? 'DEMO MOD' : 'AKTİF ÇALIŞMA ALANI'}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-white font-bold text-xl mb-1 shadow-black shadow-md">{dbConfig?.firmName || 'Yükleniyor...'}</Text>

                        {!isDemo && (
                            <View className="flex-row gap-2 mt-3">
                                <View className="bg-indigo-500/20 px-3 py-1.5 rounded-md border border-indigo-500/30">
                                    <Text className="text-indigo-300 text-xs font-bold">Firma: {dbConfig?.firmNo}</Text>
                                </View>
                                <View className="bg-emerald-500/20 px-3 py-1.5 rounded-md border border-emerald-500/30">
                                    <Text className="text-emerald-300 text-xs font-bold">Dönem: {dbConfig?.periodNo}</Text>
                                </View>
                            </View>
                        )}
                        {isDemo && (
                            <Text className="text-orange-100 text-sm mt-2 opacity-80">
                                Kısıtlı özellikler ile inceliyorsunuz.
                            </Text>
                        )}
                    </MenuCard>

                    <Text className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4 mt-2 ml-1">Uygulama Ayarları</Text>

                    {/* License Application - ONLY FOR DEMO */}
                    {isDemo && (
                        <MenuCard onPress={() => router.push('/license')} colors={['#16a34a', '#15803d']}>
                            <View className="flex-row items-center">
                                <View className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                    <FileText size={24} color="white" />
                                </View>
                                <View className="flex-1 ml-4">
                                    <Text className="text-white text-lg font-bold">Lisans Başvurusu</Text>
                                    <Text className="text-green-100 text-xs opacity-80">Tam sürüme geçmek için başvurun</Text>
                                </View>
                                <ChevronRight size={24} color="white" opacity={0.5} />
                            </View>
                        </MenuCard>
                    )}

                    {/* DB Settings - ONLY FOR REAL USERS */}
                    {!isDemo && (
                        <>
                            {/* Change Firm */}
                            <MenuCard onPress={() => setShowFirmModal(true)} colors={['#2563eb', '#1d4ed8']}>
                                <View className="flex-row items-center">
                                    <View className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <Building2 size={24} color="white" />
                                    </View>
                                    <View className="flex-1 ml-4">
                                        <Text className="text-white text-lg font-bold">Firma Değiştir</Text>
                                        <Text className="text-blue-100 text-xs opacity-80">Aktif çalışma firmanızı seçin</Text>
                                    </View>
                                    <ChevronRight size={24} color="white" opacity={0.5} />
                                </View>
                            </MenuCard>

                            {/* Change Period */}
                            <MenuCard
                                onPress={async () => {
                                    if (dbConfig?.firmNo) {
                                        await fetchPeriods(dbConfig.firmNo);
                                        setShowPeriodModal(true);
                                    }
                                }}
                                colors={['#059669', '#047857']}
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                        <Calendar size={24} color="white" />
                                    </View>
                                    <View className="flex-1 ml-4">
                                        <Text className="text-white text-lg font-bold">Dönem Değiştir</Text>
                                        <Text className="text-emerald-100 text-xs opacity-80">Mali dönem yılını güncelleyin</Text>
                                    </View>
                                    <ChevronRight size={24} color="white" opacity={0.5} />
                                </View>
                            </MenuCard>
                        </>
                    )}

                    {/* Contact Support */}
                    <MenuCard onPress={() => router.push('/support')} colors={['#0f766e', '#0d9488']}>
                        <View className="flex-row items-center">
                            <View className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <MessageCircle size={24} color="white" />
                            </View>
                            <View className="flex-1 ml-4">
                                <Text className="text-white text-lg font-bold">Bize Ulaşın</Text>
                                <Text className="text-teal-100 text-xs opacity-80">WhatsApp üzerinden destek alın</Text>
                            </View>
                            <ChevronRight size={24} color="white" opacity={0.5} />
                        </View>
                    </MenuCard>

                    {/* Logout */}
                    <MenuCard onPress={signOut} colors={['#7f1d1d', '#991b1b']}>
                        <View className="flex-row items-center">
                            <View className="bg-white/10 p-3 rounded-xl">
                                <LogOut size={24} color="#fca5a5" />
                            </View>
                            <View className="flex-1 ml-4">
                                <Text className="text-red-100 text-lg font-bold">Çıkış Yap</Text>
                            </View>
                        </View>
                    </MenuCard>

                </ScrollView>


                {/* Modals with Blur Background check? Modal covers everything so safe. */}
                {/* Firm Selection Modal */}
                <Modal visible={showFirmModal} animationType="slide" presentationStyle="pageSheet">
                    <View className="flex-1 bg-slate-950 pt-6">
                        <View className="px-6 flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-white">Firma Seçiniz</Text>
                            <TouchableOpacity onPress={() => setShowFirmModal(false)} className="bg-slate-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="px-6">
                            {firms.map((firm, index) => (
                                <Animated.View key={firm.nr} style={{ marginBottom: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => handleFirmSelect(firm)}
                                        className={`p-5 rounded-2xl border flex-row items-center justify-between ${dbConfig?.firmNo == firm.nr
                                            ? 'bg-blue-600 border-blue-500'
                                            : 'bg-slate-900 border-slate-800'
                                            }`}
                                    >
                                        <View>
                                            <Text className="text-white font-bold text-lg">{firm.nr}</Text>
                                            <Text className="text-slate-300 text-sm">{firm.name}</Text>
                                        </View>
                                        {dbConfig?.firmNo == firm.nr && <View className="bg-white/20 p-1 rounded-full"><Check size={16} color="white" /></View>}
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </Modal>

                {/* Period Selection Modal */}
                <Modal visible={showPeriodModal} animationType="slide" presentationStyle="pageSheet">
                    <View className="flex-1 bg-slate-950 pt-6">
                        <View className="px-6 flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-white">Dönem Seçiniz</Text>
                            <TouchableOpacity onPress={() => setShowPeriodModal(false)} className="bg-slate-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView className="px-6">
                            {loading ? <ActivityIndicator size="large" color="#3b82f6" /> : periods.map((period, index) => (
                                <Animated.View key={period.nr} style={{ marginBottom: 12 }}>
                                    <TouchableOpacity
                                        onPress={() => handlePeriodSelect(period)}
                                        className={`p-5 rounded-2xl border flex-row items-center justify-between ${dbConfig?.periodNo == period.nr.toString().padStart(2, '0')
                                            ? 'bg-emerald-600 border-emerald-600'
                                            : 'bg-slate-900 border-slate-800'
                                            }`}
                                    >
                                        <View>
                                            <Text className="text-white font-bold text-lg">
                                                Dönem {period.nr.toString().padStart(2, '0')}
                                            </Text>
                                            <Text className="text-slate-200/70 text-xs mt-1 font-medium bg-black/20 self-start px-2 py-1 rounded">
                                                {period.beginDate.split('T')[0]}  ➔  {period.endDate.split('T')[0]}
                                            </Text>
                                        </View>
                                        {dbConfig?.periodNo == period.nr.toString().padStart(2, '0') && <View className="bg-white/20 p-1 rounded-full"><Check size={16} color="white" /></View>}
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                            <View className="h-20" />
                        </ScrollView>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}
