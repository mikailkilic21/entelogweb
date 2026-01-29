import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { MessageCircle, ChevronLeft, HelpCircle, AlertTriangle, Settings, FileQuestion } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '@/constants/Config';

const SUPPORT_PHONE = '905533912286';

const TOPICS = [
    { id: 'tech', label: 'Teknik Sorun', icon: Settings, desc: 'Uygulama hatası veya çökme' },
    { id: 'login', label: 'Giriş / Hesap', icon: AlertTriangle, desc: 'Şifre veya erişim sorunları' },
    { id: 'data', label: 'Veri Hatası', icon: FileQuestion, desc: 'Yanlış rapor veya eksik veri' },
    { id: 'other', label: 'Diğer / Öneri', icon: HelpCircle, desc: 'Genel sorular ve öneriler' },
];

export default function SupportScreen() {
    const router = useRouter();
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [dbConfig, setDbConfig] = useState<any>(null);

    useEffect(() => {
        fetchDbConfig();
    }, []);

    const fetchDbConfig = async () => {
        try {
            const res = await fetch(`${API_URL}/settings/db`);
            if (res.ok) {
                const data = await res.json();
                setDbConfig(data);
            }
        } catch (err) {
            console.error('Config fetch error:', err);
        }
    };

    const handleSend = async () => {
        if (!selectedTopic) {
            Alert.alert('Eksik Bilgi', 'Lütfen bir konu başlığı seçiniz.');
            return;
        }

        const topicLabel = TOPICS.find(t => t.id === selectedTopic)?.label;

        let corporateInfo = '';
        if (dbConfig) {
            corporateInfo = `\n\n*Kurumsal Bilgiler:*\nFirma: ${dbConfig.firmName || '-'} (${dbConfig.firmNo || '-'})\nDönem: ${dbConfig.periodNo || '-'}`;
        }

        const fullMessage = `*Destek Talebi*\n\n*Konu:* ${topicLabel}\n*Açıklama:* ${message || 'Belirtilmedi'}${corporateInfo}\n\n_Entelog Mobile üzerinden gönderildi._`;

        // Use Universal Link (wa.me) instead of custom scheme (whatsapp://) for better reliability without whitelist
        const url = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(fullMessage)}`;

        try {
            // Universal links are handled by the OS and don't strictly require canOpenURL check for the app scheme
            await Linking.openURL(url);
        } catch {
            Alert.alert('Hata', 'WhatsApp veya tarayıcı açılamadı.');
        }
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center border-b border-slate-800/50">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-slate-800 p-2 rounded-full mr-4"
                    >
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-xl font-bold">Bize Ulaşın</Text>
                        <Text className="text-slate-400 text-xs">WhatsApp Destek Hattı</Text>
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 pt-6">
                    {/* Intro */}
                    <View className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 mb-8 flex-row items-center gap-4">
                        <View className="bg-emerald-500/20 p-3 rounded-full">
                            <MessageCircle size={28} color="#10b981" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-emerald-100 font-bold text-lg">Canlı Yardım</Text>
                            <Text className="text-emerald-200/70 text-xs mt-1 leading-4">
                                Sorunlarınızı çözmek için 7/24 WhatsApp hattımız üzerinden bizimle iletişime geçebilirsiniz.
                            </Text>
                        </View>
                    </View>

                    {/* Step 1: Select Topic */}
                    <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">1. Konu Seçiniz</Text>
                    <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
                        {TOPICS.map((topic) => {
                            const Icon = topic.icon;
                            const isSelected = selectedTopic === topic.id;

                            return (
                                <TouchableOpacity
                                    key={topic.id}
                                    onPress={() => setSelectedTopic(topic.id)}
                                    className={`w-[48%] p-4 rounded-2xl border transition-all ${isSelected
                                        ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/30'
                                        : 'bg-slate-900 border-slate-800'
                                        }`}
                                >
                                    <Icon size={24} color={isSelected ? 'white' : '#94a3b8'} className="mb-3" />
                                    <Text className={`font-bold mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                        {topic.label}
                                    </Text>
                                    <Text className={`text-[10px] leading-3 ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                                        {topic.desc}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Step 2: Message */}
                    <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">2. Açıklama (İsteğe Bağlı)</Text>
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-8">
                        <TextInput
                            multiline
                            numberOfLines={4}
                            placeholder="Sorununuzu kısaca anlatın..."
                            placeholderTextColor="#64748b"
                            className="text-white text-base h-32"
                            textAlignVertical="top"
                            value={message}
                            onChangeText={setMessage}
                        />
                    </View>
                </ScrollView>

                {/* Footer Button */}
                <View className="p-6 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
                    <TouchableOpacity
                        onPress={handleSend}
                        className={`p-4 rounded-xl flex-row items-center justify-center gap-3 shadow-lg ${selectedTopic
                            ? 'bg-[#25D366] shadow-green-900/40'
                            : 'bg-slate-800'
                            }`}
                        disabled={!selectedTopic}
                    >
                        <MessageCircle size={24} color={selectedTopic ? "white" : "#94a3b8"} fill={selectedTopic ? "white" : "transparent"} />
                        <Text className={`text-lg font-bold ${selectedTopic ? 'text-white' : 'text-slate-500'}`}>
                            WhatsApp ile Gönder
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}
