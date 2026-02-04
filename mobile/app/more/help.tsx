import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail } from 'lucide-react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function HelpScreen() {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const faqs = [
        { id: 1, q: 'Şifremi nasıl sıfırlarım?', a: 'Giriş ekranındaki "Şifremi Unuttum" bağlantısına tıklayarak e-posta adresinize sıfırlama linki gönderebilirsiniz.' },
        { id: 2, q: 'Yeni kullanıcı nasıl eklenir?', a: 'Yönetici panelinden Ayarlar > Kullanıcılar menüsüne giderek "Yeni Ekle" butonu ile kullanıcı oluşturabilirsiniz.' },
        { id: 3, q: 'Raporları PDF olarak alabilir miyim?', a: 'Evet, tüm raporlama ekranlarında sağ üst köşedeki "İndir" butonu ile PDF veya Excel formatında çıktı alabilirsiniz.' },
        { id: 4, q: 'Stok sayımı nasıl yapılır?', a: 'Ürünler menüsünden Barkod Okuyucu özelliğini kullanarak hızlı stok sayımı ve güncellemeleri yapabilirsiniz.' },
    ];

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Yardım Merkezi</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    {/* Support Channels */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">İletişim Kanalları</Text>
                    <View className="flex-row gap-3 mb-8">
                        <TouchableOpacity className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl items-center active:bg-slate-800">
                            <View className="bg-emerald-500/20 p-3 rounded-full mb-3">
                                <MessageCircle size={24} color="#10b981" />
                            </View>
                            <Text className="text-white font-bold text-sm">Canlı Destek</Text>
                            <Text className="text-slate-500 text-[10px] mt-1">7/24 Aktif</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl items-center active:bg-slate-800">
                            <View className="bg-blue-500/20 p-3 rounded-full mb-3">
                                <Phone size={24} color="#3b82f6" />
                            </View>
                            <Text className="text-white font-bold text-sm">Bizi Arayın</Text>
                            <Text className="text-slate-500 text-[10px] mt-1">0850 123 45 67</Text>
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl items-center active:bg-slate-800">
                            <View className="bg-orange-500/20 p-3 rounded-full mb-3">
                                <Mail size={24} color="#f97316" />
                            </View>
                            <Text className="text-white font-bold text-sm">E-Posta</Text>
                            <Text className="text-slate-500 text-[10px] mt-1">destek@entelog.com</Text>
                        </TouchableOpacity>
                    </View>

                    {/* FAQ */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Sıkça Sorulan Sorular</Text>
                    <View className="space-y-3">
                        {faqs.map((item) => (
                            <View key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                                <TouchableOpacity
                                    onPress={() => toggleExpand(item.id)}
                                    className="p-4 flex-row justify-between items-center active:bg-slate-800"
                                >
                                    <Text className="text-white font-bold text-sm flex-1 pr-4">{item.q}</Text>
                                    {expandedId === item.id ? (
                                        <ChevronUp size={20} color="#64748b" />
                                    ) : (
                                        <ChevronDown size={20} color="#64748b" />
                                    )}
                                </TouchableOpacity>
                                {expandedId === item.id && (
                                    <View className="px-4 pb-4 bg-slate-900/50">
                                        <Text className="text-slate-400 text-xs leading-5">{item.a}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
