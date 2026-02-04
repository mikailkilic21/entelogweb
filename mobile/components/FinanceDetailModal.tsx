import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Calendar, CreditCard, User, FileText, Hash } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

interface Transaction {
    id: number;
    date: string;
    type: string;
    amount: number;
    clientName?: string;
    bankAccount?: string;
    description?: string;
    trcode?: number;
    fichiano?: string;
    sign?: number; // 0 or 1
}

interface FinanceDetailModalProps {
    visible: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

export default function FinanceDetailModal({ visible, onClose, transaction }: FinanceDetailModalProps) {
    if (!transaction) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Determine color based on transaction type (similar to web)
    const isIncome = (transaction.trcode === 70 || transaction.trcode === 3) || (transaction.sign === 0 && transaction.trcode !== 72 && transaction.trcode !== 4);
    // Logic might need adjustment based on exact ERP definitions, syncing with web logic:
    // Web: 
    // const isOutflow = (trcode === 72 && sign === 0) || (trcode === 4 && sign === 1);
    const isOutflow = (transaction.trcode === 72 && transaction.sign === 0) || (transaction.trcode === 4 && transaction.sign === 1);

    // Override for display color logic if needed, but sticking to web's cell logic:
    // Web uses specific codes for coloring badges.

    const amountColor = !isOutflow ? 'text-emerald-500' : 'text-rose-500';
    const amountPrefix = isOutflow ? '-' : '+';

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {/* Backdrop */}
                <TouchableOpacity
                    className="absolute top-0 left-0 right-0 bottom-0 bg-black/60"
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 p-6 shadow-2xl">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-xl font-bold">İşlem Detayı</Text>
                        <TouchableOpacity onPress={onClose} className="bg-slate-800 p-2 rounded-full">
                            <X size={20} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="max-h-[80%]">
                        {/* Amount Header */}
                        <View className="items-center mb-8">
                            <View className={`p-4 rounded-full mb-3 ${!isOutflow ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                <CreditCard size={32} color={!isOutflow ? '#10b981' : '#f43f5e'} />
                            </View>
                            <Text className={`text-3xl font-black ${amountColor}`}>
                                {amountPrefix}{formatCurrency(transaction.amount)}
                            </Text>
                            <Text className="text-slate-400 font-medium mt-1">{transaction.type}</Text>
                        </View>

                        {/* Details Grid */}
                        <View className="bg-slate-800/50 rounded-2xl p-4 space-y-4">
                            <View className="flex-row items-center border-b border-slate-700/50 pb-3">
                                <View className="bg-blue-500/20 p-2 rounded-lg mr-3">
                                    <Calendar size={18} color="#3b82f6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-xs uppercase font-bold">Tarih</Text>
                                    <Text className="text-white font-medium">{formatDate(transaction.date)}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center border-b border-slate-700/50 pb-3">
                                <View className="bg-purple-500/20 p-2 rounded-lg mr-3">
                                    <User size={18} color="#a855f7" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-xs uppercase font-bold">Cari / Müşteri</Text>
                                    <Text className="text-white font-medium">{transaction.clientName || '-'}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center border-b border-slate-700/50 pb-3">
                                <View className="bg-orange-500/20 p-2 rounded-lg mr-3">
                                    <FileText size={18} color="#f97316" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-xs uppercase font-bold">Açıklama</Text>
                                    <Text className="text-white font-medium">{transaction.description || transaction.type}</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center">
                                <View className="bg-slate-600/20 p-2 rounded-lg mr-3">
                                    <Hash size={18} color="#94a3b8" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-xs uppercase font-bold">Fiş No</Text>
                                    <Text className="text-white font-medium">{transaction.fichiano || '-'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Bank Info */}
                        {transaction.bankAccount && (
                            <View className="bg-slate-800/50 rounded-2xl p-4 mt-4">
                                <Text className="text-slate-500 text-xs uppercase font-bold mb-2">Banka Hesabı</Text>
                                <Text className="text-white font-medium text-base">{transaction.bankAccount}</Text>
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        className="bg-blue-600 w-full py-4 rounded-xl mt-6 active:bg-blue-700"
                        onPress={onClose}
                    >
                        <Text className="text-white text-center font-bold text-base">Kapat</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
