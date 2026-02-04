import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, Shield, Smartphone, KeyRound } from 'lucide-react-native';

export default function SecurityScreen() {
    const router = useRouter();
    const [biometric, setBiometric] = React.useState(true);
    const [twoFactor, setTwoFactor] = React.useState(false);

    return (
        <View className="flex-1 bg-slate-950">
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <ChevronLeft size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-white">Güvenlik</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={{ padding: 20 }}>

                    {/* Security Status */}
                    <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-8 flex-row items-center">
                        <View className="bg-emerald-500/20 p-3 rounded-full mr-4">
                            <Shield size={32} color="#10b981" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-emerald-400 font-bold text-lg mb-1">Hesabınız Güvende</Text>
                            <Text className="text-emerald-500/70 text-xs">Son güvenlik taraması: Bugün 10:42</Text>
                        </View>
                    </View>

                    {/* Password Change */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Şifre Değiştir</Text>
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 mb-8">
                        <View>
                            <Text className="text-slate-500 text-xs mb-2 font-medium">Mevcut Şifre</Text>
                            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                                <Lock size={18} color="#64748b" />
                                <TextInput
                                    className="flex-1 ml-3 text-white"
                                    secureTextEntry
                                    placeholder="••••••••"
                                    placeholderTextColor="#475569"
                                />
                            </View>
                        </View>
                        <View>
                            <Text className="text-slate-500 text-xs mb-2 font-medium">Yeni Şifre</Text>
                            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                                <KeyRound size={18} color="#64748b" />
                                <TextInput
                                    className="flex-1 ml-3 text-white"
                                    secureTextEntry
                                    placeholder="••••••••"
                                    placeholderTextColor="#475569"
                                />
                            </View>
                        </View>
                        <View>
                            <Text className="text-slate-500 text-xs mb-2 font-medium">Yeni Şifre (Tekrar)</Text>
                            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
                                <KeyRound size={18} color="#64748b" />
                                <TextInput
                                    className="flex-1 ml-3 text-white"
                                    secureTextEntry
                                    placeholder="••••••••"
                                    placeholderTextColor="#475569"
                                />
                            </View>
                        </View>
                        <TouchableOpacity className="bg-blue-600 rounded-xl py-3 mt-2 active:bg-blue-700">
                            <Text className="text-white text-center font-bold">Şifreyi Güncelle</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Advanced Settings */}
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Gelişmiş Güvenlik</Text>
                    <View className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <View className="flex-row items-center justify-between p-4 border-b border-slate-800">
                            <View className="flex-row items-center gap-3 flex-1">
                                <View className="bg-purple-500/20 p-2 rounded-lg">
                                    <Smartphone size={20} color="#a855f7" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">Biyometrik Giriş</Text>
                                    <Text className="text-slate-500 text-xs">FaceID / TouchID kullan</Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: "#334155", true: "#a855f7" }}
                                thumbColor={biometric ? "#fff" : "#cbd5e1"}
                                onValueChange={() => setBiometric(!biometric)}
                                value={biometric}
                            />
                        </View>

                        <View className="flex-row items-center justify-between p-4">
                            <View className="flex-row items-center gap-3 flex-1">
                                <View className="bg-blue-500/20 p-2 rounded-lg">
                                    <Shield size={20} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text className="text-white font-bold text-base">2 Faktörlü Doğrulama</Text>
                                    <Text className="text-slate-500 text-xs">SMS veya Authenticator</Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: "#334155", true: "#3b82f6" }}
                                thumbColor={twoFactor ? "#fff" : "#cbd5e1"}
                                onValueChange={() => setTwoFactor(!twoFactor)}
                                value={twoFactor}
                            />
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
