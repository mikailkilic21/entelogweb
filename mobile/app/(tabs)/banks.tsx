import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Landmark,
    Wallet,
    Search,
    CreditCard,
    HandCoins,
    Receipt,
    DownloadCloud,
    SendHorizontal,
    ScrollText
} from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useAuth } from '@/context/AuthContext';
import FinanceDetailModal from '@/components/FinanceDetailModal';
import { Bank, Transaction } from '@/types';

import { BankLogo } from '@/components/BankCard';
import TransactionItem from '@/components/TransactionItem';

// Redesigned Banks Screen with Grid Box Model
export default function BanksScreen() {
    const { isDemo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('accounts');
    const [search, setSearch] = useState('');

    // Data states
    const [banks, setBanks] = useState<Bank[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [dbsInvoices, setDbsInvoices] = useState<any[]>([]);
    const [financeTransactions, setFinanceTransactions] = useState<Transaction[]>([]);
    const [expandedBanks, setExpandedBanks] = useState<{ [key: string]: boolean }>({});

    // Modal
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [banksRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/banks?search=${encodeURIComponent(search)}`, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } }),
                fetch(`${API_URL}/banks/stats`, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } })
            ]);

            if (banksRes.ok) setBanks(await banksRes.json());
            else setBanks((getMockBanks()));

            if (statsRes.ok) setStats((await statsRes.json()).stats);
            else setStats(getMockStats());

            // Fetch specific data based on activeCategory
            if (activeCategory === 'dbs') {
                const dbsRes = await fetch(`${API_URL}/dbs/invoices`, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } });
                if (dbsRes.ok) setDbsInvoices(await dbsRes.json());
            } else if (activeCategory !== 'accounts' && activeCategory !== 'loans') {
                // Includes 'checks-in-bank'
                const txRes = await fetch(`${API_URL}/banks/finance-transactions?type=${activeCategory}`, { headers: { 'x-demo-mode': isDemo ? 'true' : 'false' } });
                if (txRes.ok) setFinanceTransactions(await txRes.json());
            }

        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, isDemo, activeCategory]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount || 0);
    };

    const toggleBank = (bankName: string) => {
        setExpandedBanks(prev => ({ ...prev, [bankName]: !prev[bankName] }));
    };

    // Calculate Groups
    const groupedBanks = banks.reduce((acc: any, bank) => {
        const name = bank.bankName || 'Diğer';
        if (!acc[name]) acc[name] = { name, accounts: [], totalBalance: 0 };
        acc[name].accounts.push(bank);
        acc[name].totalBalance += bank.balance;
        return acc;
    }, {});

    // Grid Menu Definition
    const menuItems = [
        { id: 'accounts', label: 'Banka Hesapları', icon: Landmark, color: '#3b82f6', value: stats?.totalBalance || 0 },
        { id: 'checks-in-bank', label: 'Bankadaki Çekler', icon: ScrollText, color: '#8b5cf6', value: stats?.totalChecksInBank || 0 },
        { id: 'havale-in', label: 'Gelen Havaleler', icon: DownloadCloud, color: '#10b981', value: stats?.totalHavaleIncoming || 0 },
        { id: 'havale-out', label: 'Gönderilenler', icon: SendHorizontal, color: '#ef4444', value: stats?.totalHavaleOutgoing || 0 },
        { id: 'pos', label: 'POS Tahsilat', icon: HandCoins, color: '#f59e0b', value: stats?.totalPOS || 0 },
        { id: 'cc', label: 'Kredi Kartlarımız', icon: CreditCard, color: '#ec4899', value: stats?.totalFirmCC || 0 },
        { id: 'dbs', label: 'DBS Sistemi', icon: Receipt, color: '#06b6d4', value: 0 },
        { id: 'loans', label: 'Ticari Krediler', icon: Wallet, color: '#6366f1', value: 0 },
    ];

    const renderGridMenu = () => (
        <View className="flex-row flex-wrap justify-between gap-y-2 px-2 mb-4">
            {menuItems.map((item, index) => {
                const isActive = activeCategory === item.id;
                return (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => setActiveCategory(item.id)}
                        activeOpacity={0.8}
                        className={`w-[31%] p-2 rounded-xl border`}
                        style={{
                            backgroundColor: isActive ? item.color : `${item.color}10`,
                            borderColor: isActive ? 'white' : `${item.color}60`, // 60% opacity border for "drawn" look
                            borderWidth: 1,
                            shadowColor: item.color,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isActive ? 0.4 : 0,
                            shadowRadius: 8,
                            elevation: isActive ? 5 : 0
                        }}
                    >
                        <View className="mb-2">
                            <View className={`w-8 h-8 rounded-lg items-center justify-center`} style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${item.color}20` }}>
                                <item.icon size={16} color={isActive ? '#fff' : item.color} />
                            </View>
                        </View>
                        <Text className={`${isActive ? 'text-white/90' : 'text-slate-400'} text-[10px] font-bold uppercase mb-0.5`} numberOfLines={1}>{item.label}</Text>
                        <Text className={`${isActive ? 'text-white' : 'text-slate-200'} font-bold text-xs`} numberOfLines={1} adjustsFontSizeToFit>
                            {formatCurrency(item.value)}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    const renderContent = () => {
        if (loading) return <ActivityIndicator color="#3b82f6" className="mt-10" />;

        switch (activeCategory) {
            case 'accounts':
                return (
                    <View className="space-y-3 px-2">
                        {Object.values(groupedBanks).map((group: any, index) => {
                            const isExpanded = expandedBanks[group.name];
                            return (
                                <View key={index} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                                    <TouchableOpacity onPress={() => toggleBank(group.name)} className="p-4 flex-row items-center">
                                        <BankLogo bankName={group.name} size="medium" />
                                        <View className="flex-1 ml-4">
                                            <Text className="text-white font-bold text-base">{group.name}</Text>
                                            <Text className="text-slate-500 text-xs">{group.accounts.length} Hesap</Text>
                                        </View>
                                        <Text className={`font-black text-base ${group.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatCurrency(group.totalBalance)}
                                        </Text>
                                    </TouchableOpacity>
                                    {isExpanded && (
                                        <View className="bg-slate-950/50 border-t border-slate-800 p-2">
                                            {group.accounts.map((acc: any) => (
                                                <View key={acc.id} className="flex-row justify-between p-3 border-b border-slate-800/50 last:border-0">
                                                    <View>
                                                        <Text className="text-white text-sm font-medium">{acc.name}</Text>
                                                        <Text className="text-slate-500 text-[10px]">{acc.iban}</Text>
                                                    </View>
                                                    <Text className="text-emerald-400 font-bold">{formatCurrency(acc.balance)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                );
            case 'dbs':
                return (
                    <View className="space-y-3 px-2">
                        {dbsInvoices.length === 0 ? (
                            <Text className="text-slate-500 text-center mt-10">DBS kaydı bulunamadı.</Text>
                        ) : (
                            dbsInvoices.map((inv, idx) => (
                                <View key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-white font-bold">{inv.clientName}</Text>
                                        <Text className="text-slate-500 text-xs">Vade: {new Date(inv.dbsDate).toLocaleDateString('tr-TR')}</Text>
                                    </View>
                                    <Text className="text-emerald-400 font-bold text-lg">{formatCurrency(inv.amount)}</Text>
                                </View>
                            ))
                        )}
                    </View>
                );
            case 'loans':
                return (
                    <View className="items-center justify-center py-20">
                        <Wallet size={48} color="#334155" />
                        <Text className="text-slate-500 mt-4 font-bold text-center">Aktif Ticari Kredi Bulunamadı</Text>
                    </View>
                );
            default:
                return (
                    <View className="space-y-3 px-2">
                        {financeTransactions.length === 0 ? (
                            <Text className="text-slate-500 text-center mt-10">İşlem kaydı bulunamadı.</Text>
                        ) : (
                            financeTransactions.map((tx, idx) => (
                                <TransactionItem key={idx} tx={tx} index={idx} onPress={(t) => { setSelectedTransaction(t); setIsModalOpen(true); }} />
                            ))
                        )}
                    </View>
                );
        }
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', inset: 0 }} />
            <SafeAreaView className="flex-1 pt-2">
                <View className="px-4 mb-4 flex-row justify-between items-center">
                    <View>
                        <Text className="text-3xl font-black text-white">Bankalar</Text>
                        <Text className="text-slate-400 text-xs uppercase tracking-widest">Finansal Genel Bakış</Text>
                    </View>
                    <Image source={require('../../assets/images/siyahlogo.png')} style={{ width: 40, height: 40, borderRadius: 8 }} />
                </View>

                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>

                    <View className="px-4 mb-2">
                        <View className="bg-slate-900/80 border border-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
                            <Search size={20} color="#64748b" />
                            <TextInput
                                placeholder="Hesap veya işlem ara..."
                                placeholderTextColor="#64748b"
                                value={search}
                                onChangeText={setSearch}
                                className="flex-1 ml-3 text-white font-medium"
                            />
                        </View>
                    </View>

                    {renderGridMenu()}

                    <View className="px-4 mb-4">
                        <Text className="text-white font-bold text-lg mb-2 pl-2 border-l-4 border-blue-500">
                            {menuItems.find(m => m.id === activeCategory)?.label}
                        </Text>
                        {renderContent()}
                    </View>

                </ScrollView>
            </SafeAreaView>
            <FinanceDetailModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} transaction={selectedTransaction} />
        </View>
    );
}

// MOCK DATA HELPERS (Fallback)
function getMockBanks() {
    return [
        { id: 1, bankName: 'Ziraat Bankası', name: 'Merkez Şube - EUR', branch: 'Merkez', code: '1001', iban: 'TR12 0001 0000 0012 3456 7890', balance: 500000, currency: 'EUR' },
        { id: 2, bankName: 'Ziraat Bankası', name: 'Merkez Şube - USD', branch: 'Merkez', code: '1002', iban: 'TR12 0001 0000 0012 3456 7891', balance: 250000, currency: 'USD' },
        { id: 3, bankName: 'QNB Finansbank', name: 'Ticari Hesap', branch: 'Kadıköy', code: '2001', iban: 'TR34 0011 1000 0098 7654 3210', balance: 734567, currency: 'TRY' },
        { id: 4, bankName: 'İş Bankası', name: 'Ticari Hesap', branch: 'Levent', code: '4001', iban: 'TR34 0011 1000 0098 7654 3210', balance: 140000, currency: 'TRY' },
        { id: 5, bankName: 'Halkbank', name: 'Ticari Hesap', branch: 'Maslak', code: '5001', iban: 'TR34 0011 1000 0098 7654 3210', balance: 90000, currency: 'TRY' },
    ];
}

function getMockStats() {
    return {
        totalBalance: 1714567,
        totalPOS: 1250000,
        totalFirmCC: 380000,
        totalHavaleIncoming: 2100000,
        totalHavaleOutgoing: 1650000,
        dailyIncoming: 125000,
        dailyOutgoing: 95000,
    };
}

