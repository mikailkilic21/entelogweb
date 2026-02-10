import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, BarChart3, TrendingUp, PieChart, ArrowUpRight, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ReportsScreen() {
    const router = useRouter();

    const reports = [
        { title: 'Günlük Satış Özeti', date: '04.02.2026', type: 'Finans', size: '1.2 MB' },
        { title: 'Haftalık Stok Raporu', date: '03.02.2026', type: 'Stok', size: '2.4 MB' },
        { title: 'Aylık Ciron Analizi', date: '01.02.2026', type: 'Yönetim', size: '5.1 MB' },
        { title: 'Personel Performans', date: '31.01.2026', type: 'İK', size: '850 KB' },
    ];

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Raporlar</Text>
                    <TouchableOpacity className="p-2 bg-slate-800 rounded-lg">
                        <BarChart3 size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    {/* Summary Cards */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
                        <LinearGradient
                            colors={['#3b82f6', '#2563eb']}
                            className="w-40 h-40 rounded-2xl p-4 justify-between mr-4"
                        >
                            <View className="bg-white/20 w-8 h-8 rounded-lg items-center justify-center">
                                <TrendingUp size={18} color="#fff" />
                            </View>
                            <View>
                                <Text className="text-white/80 text-xs font-bold uppercase">Toplam Satış</Text>
                                <Text className="text-white text-2xl font-black mt-1">₺245K</Text>
                                <View className="flex-row items-center mt-2 bg-white/20 self-start px-2 py-1 rounded">
                                    <ArrowUpRight size={12} color="#fff" />
                                    <Text className="text-white text-[10px] font-bold ml-1">+12%</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <LinearGradient
                            colors={['#8b5cf6', '#7c3aed']}
                            className="w-40 h-40 rounded-2xl p-4 justify-between mr-4"
                        >
                            <View className="bg-white/20 w-8 h-8 rounded-lg items-center justify-center">
                                <PieChart size={18} color="#fff" />
                            </View>
                            <View>
                                <Text className="text-white/80 text-xs font-bold uppercase">Net Kâr</Text>
                                <Text className="text-white text-2xl font-black mt-1">₺68K</Text>
                                <View className="flex-row items-center mt-2 bg-white/20 self-start px-2 py-1 rounded">
                                    <ArrowUpRight size={12} color="#fff" />
                                    <Text className="text-white text-[10px] font-bold ml-1">+5%</Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            className="w-40 h-40 rounded-2xl p-4 justify-between mr-4"
                        >
                            <View className="bg-white/20 w-8 h-8 rounded-lg items-center justify-center">
                                <TrendingUp size={18} color="#fff" />
                            </View>
                            <View>
                                <Text className="text-white/80 text-xs font-bold uppercase">Yeni Müşteri</Text>
                                <Text className="text-white text-2xl font-black mt-1">124</Text>
                                <View className="flex-row items-center mt-2 bg-white/20 self-start px-2 py-1 rounded">
                                    <ArrowUpRight size={12} color="#fff" />
                                    <Text className="text-white text-[10px] font-bold ml-1">+8%</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </ScrollView>

                    {/* Available Reports */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Kayıtlı Raporlar</Text>
                    <View className="gap-3">
                        {reports.map((report, index) => (
                            <TouchableOpacity key={index} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex-row items-center active:bg-slate-800">
                                <View className="bg-slate-800 p-3 rounded-xl mr-4">
                                    <BarChart3 size={24} color="#64748b" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-bold text-base mb-1">{report.title}</Text>
                                    <Text className="text-slate-500 text-xs">{report.date} • {report.type}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-600 text-[10px] font-bold mb-2">{report.size}</Text>
                                    <TouchableOpacity className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                                        <Download size={16} color="#3b82f6" />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity className="mt-6 bg-slate-800 border border-slate-700 border-dashed rounded-xl p-4 flex-row items-center justify-center gap-2">
                        <Text className="text-slate-400 font-medium">Daha fazla rapor yükle...</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
