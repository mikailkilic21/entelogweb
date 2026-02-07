import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Bank } from '@/types';

interface BankCardProps {
    bank: Bank;
    index: number;
    onPress: (bank: Bank) => void;
}

const BankLogo = ({ bankName, size = 'medium' }: { bankName: string; size?: 'small' | 'medium' | 'large' }) => {
    const sizeClasses = {
        small: { width: 40, height: 40 },
        medium: { width: 64, height: 40 },
        large: { width: 80, height: 50 },
    };

    const getLogoSource = (name: string) => {
        if (!name) return null;
        const n = name.toLocaleLowerCase('tr-TR');
        if (n.includes('akbank')) return require('../assets/images/banks/akbank.png');
        if (n.includes('halk')) return require('../assets/images/banks/Halkbank.png');
        if (n.includes('vakif') || n.includes('vakıf')) return require('../assets/images/banks/Vakıfbank.png');
        if (n.includes('yapı') || n.includes('yapi')) return require('../assets/images/banks/Yapi_Kredi.png');
        if (n.includes('ziraat')) return require('../assets/images/banks/ziraat.png');
        if (n.includes('qnb') || n.includes('finans')) return require('../assets/images/banks/qnbfinans.png');
        if (n.includes('albaraka')) return require('../assets/images/banks/albaraka.png');
        if (n.includes('iş bank') || n.includes('is bank')) return require('../assets/images/banks/isbankasi.png');
        if (n.includes('kuveyt')) return require('../assets/images/banks/KuveytTürk.png');
        return null;
    };

    const logoSource = getLogoSource(bankName);

    if (!logoSource) {
        return (
            <View
                className="bg-white rounded-lg items-center justify-center border border-slate-300"
                style={sizeClasses[size]}
            >
                <Text className="text-slate-800 font-bold text-base">
                    {bankName ? bankName.substring(0, 2).toUpperCase() : 'B'}
                </Text>
            </View>
        );
    }

    return (
        <View
            className="bg-white rounded-lg items-center justify-center border border-slate-300 p-1 overflow-hidden"
            style={sizeClasses[size]}
        >
            <Image
                source={logoSource}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
            />
        </View>
    );
};

export const BankCard = React.memo(({ bank, index, onPress }: BankCardProps) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
        >
            <TouchableOpacity
                className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5"
                activeOpacity={0.7}
                onPress={() => onPress(bank)}
            >
                <View className="flex-row items-start justify-between mb-4">
                    <BankLogo bankName={bank.bankName} size="medium" />
                    <View className="items-end flex-1 ml-4">
                        <Text className="text-white font-bold text-base mb-0.5" numberOfLines={1}>
                            {bank.name}
                        </Text>
                        <Text className="text-slate-500 text-xs">
                            {bank.bankName}
                        </Text>
                    </View>
                </View>

                <View className="space-y-2">
                    <View className="flex-row justify-between">
                        <Text className="text-slate-500 text-xs">IBAN</Text>
                        <Text className="text-slate-400 font-mono text-xs max-w-[180px]" numberOfLines={1}>
                            {bank.iban}
                        </Text>
                    </View>
                    <View className="flex-row justify-between">
                        <Text className="text-slate-500 text-xs">Şube</Text>
                        <Text className="text-slate-400 text-xs">
                            {bank.branch} - {bank.code}
                        </Text>
                    </View>
                </View>

                <View className="pt-4 border-t border-slate-800 mt-4">
                    <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1">
                        Güncel Bakiye
                    </Text>
                    <Text className={`text-2xl font-black ${bank.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(bank.balance)}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

BankCard.displayName = 'BankCard';
export { BankLogo };
