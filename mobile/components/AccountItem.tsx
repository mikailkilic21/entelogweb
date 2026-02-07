import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Building2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Account } from '@/types';

interface AccountItemProps {
    item: Account;
    index: number;
}

const AccountItem = React.memo(({ item, index }: AccountItemProps) => {
    const router = useRouter();

    return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <TouchableOpacity
                onPress={() => router.push(`/account/${item.id}`)}
                className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3 flex-row items-center"
            >
                <View className={`p-3 rounded-xl mr-4 ${item.cardType === 1 ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}>
                    <Building2 size={24} color={item.cardType === 1 ? '#60a5fa' : '#c084fc'} />
                </View>

                <View className="flex-1">
                    <Text className="text-white font-bold text-base" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-slate-500 text-xs font-mono mt-1">{item.code}</Text>
                    <Text className="text-slate-400 text-xs mt-1">
                        {[item.town, item.city].filter(Boolean).join(' / ')}
                    </Text>
                </View>

                <View className="items-end">
                    <Text className={`font-bold ${item.balance > 0 ? 'text-green-400' : item.balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                        {Math.abs(item.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                    <Text className="text-xs text-slate-500 mt-1">
                        {item.balance > 0 ? 'Alacak' : item.balance < 0 ? 'Borç' : '-'}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

AccountItem.displayName = 'AccountItem';

export default AccountItem;
