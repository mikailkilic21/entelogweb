import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Globe, Twitter, Linkedin, Facebook } from 'lucide-react-native';

export default function AboutScreen() {
    const router = useRouter();

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Hakkında</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>

                    {/* Logo & Version */}
                    <View className="items-center my-8">
                        <Image
                            source={require('../../assets/images/siyahlogo.png')}
                            style={{ width: 100, height: 100, borderRadius: 20 }}
                            resizeMode="contain"
                        />
                        <Text className="text-3xl font-black text-white mt-4">Entelog Mobile</Text>
                        <Text className="text-slate-500 font-medium">Versiyon 1.0.0 (Build 2402)</Text>
                    </View>

                    <Text className="text-slate-400 text-center text-sm leading-6 mb-8 px-4">
                        Entelog, işletmenizin tüm finansal süreçlerini, stok yönetimini ve müşteri ilişkilerini tek bir yerden yönetmenizi sağlayan kapsamlı bir ERP çözümüdür.
                    </Text>

                    {/* Social Links */}
                    <View className="flex-row gap-4 mb-10">
                        <TouchableOpacity onPress={() => openLink('https://entelog.com')} className="bg-slate-900 p-3 rounded-full border border-slate-800">
                            <Globe size={24} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openLink('https://twitter.com')} className="bg-slate-900 p-3 rounded-full border border-slate-800">
                            <Twitter size={24} color="#1da1f2" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openLink('https://linkedin.com')} className="bg-slate-900 p-3 rounded-full border border-slate-800">
                            <Linkedin size={24} color="#0a66c2" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openLink('https://facebook.com')} className="bg-slate-900 p-3 rounded-full border border-slate-800">
                            <Facebook size={24} color="#1877f2" />
                        </TouchableOpacity>
                    </View>

                    {/* Legal Links */}
                    <View className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-8">
                        <TouchableOpacity className="p-4 border-b border-slate-800 active:bg-slate-800" onPress={() => openLink('https://entelog.com/terms')}>
                            <Text className="text-white font-bold">Kullanım Koşulları</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="p-4 border-b border-slate-800 active:bg-slate-800" onPress={() => openLink('https://entelog.com/privacy')}>
                            <Text className="text-white font-bold">Gizlilik Politikası</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="p-4 active:bg-slate-800" onPress={() => openLink('https://entelog.com/licenses')}>
                            <Text className="text-white font-bold">Açık Kaynak Lisansları</Text>
                        </TouchableOpacity>
                    </View>

                    <Text className="text-slate-600 text-xs text-center">
                        © 2026 Entelog Yazılım A.Ş. Tüm hakları saklıdır.
                    </Text>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
