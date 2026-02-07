import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { HandCoins, Receipt } from 'lucide-react-native';

import { Transaction } from '@/types';

interface TransactionItemProps {
    tx: Transaction;
    index: number;
    onPress: (tx: Transaction) => void;
}

const TransactionItem = React.memo(({ tx, index, onPress }: TransactionItemProps) => {
    const isIncome = (tx.trcode === 70 || tx.trcode === 3) || (tx.sign === 0 && tx.trcode !== 72 && tx.trcode !== 4);
    const colorClass = isIncome ? 'text-emerald-400' : 'text-rose-400';
    const Icon = isIncome ? HandCoins : Receipt;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <TouchableOpacity
            key={index}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-row items-center gap-4 active:bg-slate-800"
            onPress={() => onPress(tx)}
        >
            <View className={`p-3 rounded-xl ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <Icon size={20} color={isIncome ? '#10b981' : '#f43f5e'} />
            </View>
            <View className="flex-1">
                <Text className="text-white font-bold text-sm mb-0.5">{tx.clientName || 'Cari İşlem'}</Text>
                <Text className="text-slate-500 text-xs">{new Date(tx.date).toLocaleDateString('tr-TR')} • {tx.type}</Text>
            </View>
            <View className="items-end">
                <Text className={`font-black text-base ${colorClass}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

TransactionItem.displayName = 'TransactionItem';
export default TransactionItem;
