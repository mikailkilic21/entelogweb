import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AlertCircle, Clock, PackageCheck, Package, PackageX } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface OrderItemProps {
    item: any;
    index: number;
}

const OrderItem = React.memo(({ item, index }: OrderItemProps) => {
    const router = useRouter();

    // Status Logic for UI
    let statusConfig = { color: 'text-slate-400', bg: 'bg-slate-800', label: '-', icon: AlertCircle };

    if (item.status === 1) { // Proposal
        statusConfig = { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Öneri', icon: Clock };
    } else if (item.status === 4) { // Approved
        if (item.shipmentStatus === 'closed') {
            statusConfig = { color: 'text-slate-400', bg: 'bg-slate-700/50', label: 'Kapandı', icon: PackageCheck };
        } else if (item.shipmentStatus === 'partial') {
            statusConfig = { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Kısmi', icon: Package };
        } else {
            statusConfig = { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Bekliyor', icon: PackageX };
        }
    }

    const StatusIcon = statusConfig.icon;

    return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/orders/${item.id}`)}
                className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl mb-3"
            >
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 pr-2">
                        <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{item.accountName || 'Cari Yok'}</Text>
                        <View className="flex-row items-center gap-2">
                            <View className="bg-slate-800 px-1.5 py-0.5 rounded">
                                <Text className="text-slate-400 text-[10px] font-mono">{item.ficheNo}</Text>
                            </View>
                            <Text className="text-slate-500 text-[10px]">{new Date(item.date).toLocaleDateString('tr-TR')}</Text>
                        </View>
                    </View>
                    <View className={`px-2 py-1 rounded-lg flex-row items-center gap-1 ${statusConfig.bg}`}>
                        <StatusIcon size={12} color={statusConfig.color.includes('amber') ? '#fbbf24' : statusConfig.color.includes('emerald') ? '#34d399' : statusConfig.color.includes('blue') ? '#60a5fa' : '#94a3b8'} />
                        <Text className={`text-[10px] font-bold ${statusConfig.color}`}>{statusConfig.label}</Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-end mt-2 pt-2 border-t border-slate-800/50">
                    <Text className="text-slate-500 text-[10px]">{item.documentNo || '-'}</Text>
                    <Text className="font-bold text-base text-white">
                        {item.netTotal?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

OrderItem.displayName = 'OrderItem';

export default OrderItem;
