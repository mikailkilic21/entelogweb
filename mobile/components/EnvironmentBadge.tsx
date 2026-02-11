/**
 * Environment Switcher Component
 * SADECE DEVELOPMENT MODUNDA GÖRÜNÜR
 * Settings sayfasına eklenebilir
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ENVIRONMENT, CONFIG } from '@/constants/Config';

export const EnvironmentBadge = () => {
    const [showModal, setShowModal] = useState(false);

    // Only show in dev mode
    if (!__DEV__) return null;

    return (
        <>
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                className="bg-blue-600/80 px-3 py-1 rounded-full z-50"
                style={{ elevation: 10 }}
            >
                <Text className="text-white text-xs font-bold">
                    {ENVIRONMENT === 'vpn' ? '🌍 VPN' : ENVIRONMENT === 'production' ? '🏢 PROD' : '💻 DEV'}
                </Text>
            </TouchableOpacity>

            <Modal visible={showModal} transparent animationType="fade">
                <View className="flex-1 bg-black/80 justify-center items-center p-6">
                    <View className="bg-slate-900 w-full rounded-3xl border border-slate-800 p-6">
                        <Text className="text-2xl font-bold text-white mb-4">Environment Info</Text>

                        <View className="space-y-3">
                            <View className="bg-slate-800 p-4 rounded-xl">
                                <Text className="text-slate-400 text-xs mb-1">Current Environment</Text>
                                <Text className="text-white font-bold text-lg">{CONFIG.name}</Text>
                            </View>

                            <View className="bg-slate-800 p-4 rounded-xl">
                                <Text className="text-slate-400 text-xs mb-1">API URL</Text>
                                <Text className="text-blue-400 font-mono text-sm">{CONFIG.API_URL}</Text>
                            </View>

                            <View className="bg-slate-800 p-4 rounded-xl">
                                <Text className="text-slate-400 text-xs mb-1">Base URL</Text>
                                <Text className="text-blue-400 font-mono text-sm">{CONFIG.BASE_URL}</Text>
                            </View>

                            {ENVIRONMENT === 'vpn' && (
                                <View className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl">
                                    <Text className="text-green-400 text-xs mb-1">✅ VPN Mode Active</Text>
                                    <Text className="text-green-300 text-xs">
                                        Connected to company server at 192.168.1.200
                                    </Text>
                                    <Text className="text-green-300/70 text-[10px] mt-1">
                                        Dünyanın herhangi bir yerinden güvenli erişim
                                    </Text>
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            className="bg-blue-600 p-4 rounded-xl items-center mt-6"
                        >
                            <Text className="text-white font-bold">Kapat</Text>
                        </TouchableOpacity>

                        <Text className="text-slate-600 text-center text-xs mt-4">
                            {`Environment değiştirmek için Config.ts'i düzenleyin`}
                        </Text>
                    </View>
                </View>
            </Modal>
        </>
    );
};
