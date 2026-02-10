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
    TrendingUp,
    TrendingDown,
    Wallet,
    ChevronDown,
    ChevronRight,
    Search,
    LayoutGrid,
    List,
    CreditCard,
    HandCoins,
    Receipt,
    DownloadCloud,
    SendHorizontal,
    History
} from 'lucide-react-native';
import { API_URL } from '@/constants/Config';
import { useAuth } from '@/context/AuthContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import FinanceDetailModal from '@/components/FinanceDetailModal';
import { Bank, Transaction } from '@/types';

import { BankCard, BankLogo } from '@/components/BankCard';
import TransactionItem from '@/components/TransactionItem';

export default function BanksScreen() {
    const { isDemo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [expandedBanks, setExpandedBanks] = useState<{ [key: string]: boolean }>({});
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('accounts'); // 'accounts', 'pos', 'cc', 'havale-in', 'havale-out', 'dbs'


    // Data states
    const [banks, setBanks] = useState<Bank[]>([]);
    const [stats, setStats] = useState<any>(null); // Stats interface is complex, keeping any for now or define separately if needed
    const [dbsInvoices, setDbsInvoices] = useState<any[]>([]); // DBS interface needed later
    const [financeTransactions, setFinanceTransactions] = useState<Transaction[]>([]);

    // Modal
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            // Parallel fetch for stats and banks (always needed)
            const [banksRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/banks?search=${encodeURIComponent(search)}`, {
                    headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
                }),
                fetch(`${API_URL}/banks/stats`, {
                    headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
                })
            ]);

            // Handle Banks Data
            if (banksRes.ok) {
                const banksData = await banksRes.json();
                setBanks(Array.isArray(banksData) ? banksData : []);
            } else {
                console.warn("Banks API failed, using fallback data");
                setBanks(getMockBanks());
            }

            // Handle Stats Data
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats || statsData);
            } else {
                setStats(getMockStats());
            }

            // Fetch transactions based on active tab
            if (activeTab === 'dbs') {
                const dbsRes = await fetch(`${API_URL}/dbs/invoices`, {
                    headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
                });
                if (dbsRes.ok) {
                    const dbsData = await dbsRes.json();
                    setDbsInvoices(Array.isArray(dbsData) ? dbsData : []);
                }
            } else if (activeTab !== 'accounts') {
                const txRes = await fetch(`${API_URL}/banks/finance-transactions?type=${activeTab}`, {
                    headers: { 'x-demo-mode': isDemo ? 'true' : 'false' }
                });

                if (txRes.ok) {
                    const txData = await txRes.json();
                    setFinanceTransactions(Array.isArray(txData) ? txData : []);
                } else {
                    setFinanceTransactions(getMockTransactions(activeTab));
                }
            }

        } catch (error) {
            console.error('Banks fetch error:', error);
            setBanks(getMockBanks());
            setStats(getMockStats());
            if (activeTab !== 'accounts' && activeTab !== 'dbs') setFinanceTransactions(getMockTransactions(activeTab));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, isDemo, activeTab]);

    useEffect(() => {
        // Initial Loading
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const toggleBank = (bankName: string) => {
        setExpandedBanks(prev => ({
            ...prev,
            [bankName]: !prev[bankName]
        }));
    };

    const handleTransactionClick = (transaction: any) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    // Group banks by bankName
    const groupedBanks = banks.reduce((acc: any, bank) => {
        const name = bank.bankName || 'Diğer';
        if (!acc[name]) {
            acc[name] = {
                name,
                accounts: [],
                totalBalance: 0
            };
        }
        acc[name].accounts.push(bank);
        acc[name].totalBalance += bank.balance;
        return acc;
    }, {});

    // Render Logic Components
    const renderStats = () => (
        <View className="mb-6">
            {/* Total Balance - Main Card */}
            <LinearGradient
                colors={['#3b82f6', '#1d4ed8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-3xl p-6 mb-4 border-t border-white/10 shadow-lg"
            >
                <View className="flex-row items-center mb-3">
                    <View className="bg-white/20 p-2.5 rounded-xl mr-3">
                        <Wallet size={24} color="white" />
                    </View>
                    <Text className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
                        Mevduat Bakiyesi
                    </Text>
                </View>
                <Text className="text-white text-3xl font-black">
                    {formatCurrency(stats?.totalBalance || 0)}
                </Text>
                {/* Daily Movement */}
                <View className="mt-3 flex-row items-center gap-3">
                    <View className="flex-row items-center">
                        <TrendingUp size={12} color="#10b981" />
                        <Text className="text-emerald-300 text-[10px] ml-1 font-bold">
                            {formatCurrency(stats?.dailyIncoming || 0)}
                        </Text>
                    </View>
                    <View className="flex-row items-center">
                        <TrendingDown size={12} color="#ef4444" />
                        <Text className="text-rose-300 text-[10px] ml-1 font-bold">
                            {formatCurrency(stats?.dailyOutgoing || 0)}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Other Stats - Grid */}
            <View className="flex-row gap-3 mb-3">
                {/* POS */}
                <View className="flex-1 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl p-4">
                    <View className="flex-row items-center mb-2">
                        <HandCoins size={16} color="#10b981" />
                        <Text className="text-emerald-400 text-[9px] ml-1.5 font-bold uppercase">POS</Text>
                    </View>
                    <Text className="text-white font-black text-base">
                        {formatCurrency(stats?.totalPOS || 0)}
                    </Text>
                </View>

                {/* Credit Card */}
                <View className="flex-1 bg-rose-600/20 border border-rose-500/30 rounded-2xl p-4">
                    <View className="flex-row items-center mb-2">
                        <CreditCard size={16} color="#ef4444" />
                        <Text className="text-rose-400 text-[9px] ml-1.5 font-bold uppercase">KK</Text>
                    </View>
                    <Text className="text-white font-black text-base">
                        {formatCurrency(stats?.totalFirmCC || 0)}
                    </Text>
                </View>
            </View>

            {/* Havale In/Out */}
            <View className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-emerald-400 text-[10px] font-bold uppercase">Gelen Havale</Text>
                    <Text className="text-white font-black text-sm">
                        {formatCurrency(stats?.totalHavaleIncoming || 0)}
                    </Text>
                </View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-rose-400 text-[10px] font-bold uppercase">Giden Havale</Text>
                    <Text className="text-white font-black text-sm">
                        {formatCurrency(stats?.totalHavaleOutgoing || 0)}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderTabs = () => (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 flex-grow-0" contentContainerStyle={{ paddingRight: 20 }}>
            {[
                { id: 'accounts', label: 'Hesaplar', icon: Landmark },
                { id: 'pos', label: 'POS', icon: HandCoins },
                { id: 'cc', label: 'Kredi Kartı', icon: CreditCard },
                { id: 'havale-in', label: 'Gelen', icon: DownloadCloud },
                { id: 'havale-out', label: 'Giden', icon: SendHorizontal },
                { id: 'dbs', label: 'DBS', icon: Receipt }
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    className={`mr-4 px-4 py-2 rounded-xl flex-row items-center gap-2 border ${activeTab === tab.id
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-slate-900 border-slate-800'
                        }`}
                >
                    <tab.icon size={16} color={activeTab === tab.id ? '#fff' : '#64748b'} />
                    <Text className={activeTab === tab.id ? 'text-white font-bold' : 'text-slate-400 font-medium'}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderAccounts = () => (
        <>
            {viewMode === 'grid' ? (
                /* Grid View - Cards */
                <View className="gap-4">
                    {Object.values(groupedBanks).map((group: any, index) => (
                        group.accounts.map((bank: any, bankIndex: number) => (
                            <BankCard
                                key={bank.id}
                                bank={bank}
                                index={bankIndex}
                                onPress={() => { }}
                            />
                        ))
                    ))}
                </View>
            ) : (
                /* List View - Grouped by Bank */
                <View className="space-y-4">
                    {Object.values(groupedBanks).map((group: any, index) => {
                        const isExpanded = expandedBanks[group.name];
                        return (
                            <View key={index} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                                {/* Bank Header */}
                                <TouchableOpacity
                                    onPress={() => toggleBank(group.name)}
                                    className="p-4 flex-row items-center"
                                    activeOpacity={0.7}
                                >
                                    <View className="mr-3">
                                        {isExpanded ? (
                                            <ChevronDown size={20} color="#64748b" />
                                        ) : (
                                            <ChevronRight size={20} color="#64748b" />
                                        )}
                                    </View>
                                    <BankLogo bankName={group.name} size="medium" />
                                    <View className="flex-1 ml-4">
                                        <Text className="text-white font-bold text-base mb-0.5">
                                            {group.name}
                                        </Text>
                                        <Text className="text-slate-500 text-xs">
                                            {group.accounts.length} Alt Hesap
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-slate-500 text-[9px] font-bold uppercase mb-0.5">
                                            Toplam
                                        </Text>
                                        <Text className={`font-black text-base ${group.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {formatCurrency(group.totalBalance)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {/* Expanded Accounts */}
                                {isExpanded && (
                                    <View className="border-t border-slate-800 bg-slate-950/30 p-4">
                                        {group.accounts.map((account: any, accountIndex: number) => (
                                            <View
                                                key={account.id}
                                                className={`py-3 ${accountIndex < group.accounts.length - 1 ? 'border-b border-slate-800/50' : ''}`}
                                            >
                                                <View className="flex-row justify-between items-start mb-2">
                                                    <View className="flex-1">
                                                        <Text className="text-white font-bold text-sm mb-0.5">
                                                            {account.name}
                                                        </Text>
                                                        <Text className="text-slate-500 text-[10px]">
                                                            {account.branch} - {account.code}
                                                        </Text>
                                                    </View>
                                                    <Text className={`font-black text-base ${account.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {formatCurrency(account.balance)}
                                                    </Text>
                                                </View>
                                                <Text className="text-slate-600 font-mono text-[10px]">
                                                    {account.iban}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            )}
        </>
    );

    const renderTransactions = () => (
        <View className="gap-4">
            {financeTransactions.length === 0 ? (
                <View className="py-20 items-center">
                    <History size={48} color="#334155" />
                    <Text className="text-slate-500 mt-4 font-bold">İşlem bulunamadı</Text>
                </View>
            ) : (
                financeTransactions.map((tx, index) => (
                    <TransactionItem
                        key={index}
                        tx={tx}
                        index={index}
                        onPress={handleTransactionClick}
                    />
                ))
            )}
        </View>
    );

    const renderDBS = () => (
        <View className="gap-4">
            {dbsInvoices.length === 0 ? (
                <View className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 items-center">
                    <Receipt size={48} color="#334155" />
                    <Text className="text-white font-bold text-lg mt-4">Kayıt Yok</Text>
                    <Text className="text-slate-400 text-center mt-2">DBS sisteminde bekleyen fatura bulunamadı.</Text>
                </View>
            ) : (
                dbsInvoices.map((inv, index) => (
                    <Animated.View key={index} entering={FadeInDown.delay(index * 50).springify()}>
                        <View className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex-row items-center justify-between">
                            <View>
                                <Text className="text-white font-bold text-base mb-1">{inv.clientName}</Text>
                                <Text className="text-slate-500 text-xs">{inv.ficheno}</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-emerald-400 font-bold text-lg">
                                    {formatCurrency(inv.amount)}
                                </Text>
                                <Text className="text-slate-400 text-xs mt-1">
                                    Vade: {new Date(inv.dbsDate).toLocaleDateString('tr-TR')}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                ))
            )}
        </View>
    );


    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-950">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-slate-500 mt-4 font-medium">Bankalar yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />

            <SafeAreaView className="flex-1 px-4 pt-2">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-3">
                        <Image
                            source={require('../../assets/images/siyahlogo.png')}
                            style={{ width: 40, height: 40, borderRadius: 10 }}
                            resizeMode="contain"
                        />
                        <View>
                            <Text className="text-3xl font-black text-white">Bankalar</Text>
                            <Text className="text-slate-400 text-xs font-medium tracking-wide uppercase">
                                Finans Yönetimi
                            </Text>
                        </View>
                    </View>

                    {/* View Mode Toggle (Only show on accounts tab) */}
                    {activeTab === 'accounts' && (
                        <View className="flex-row bg-slate-900 border border-slate-800 rounded-xl p-1">
                            <TouchableOpacity
                                onPress={() => setViewMode('grid')}
                                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600' : ''}`}
                            >
                                <LayoutGrid size={18} color={viewMode === 'grid' ? '#fff' : '#64748b'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setViewMode('list')}
                                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600' : ''}`}
                            >
                                <List size={18} color={viewMode === 'list' ? '#fff' : '#64748b'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <ScrollView
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Stats */}
                    {renderStats()}

                    {/* Tabs */}
                    {renderTabs()}

                    {/* Search Bar */}
                    <View className="bg-slate-900 border border-slate-800 rounded-xl flex-row items-center px-4 py-3 mb-4">
                        <Search size={20} color="#64748b" />
                        <TextInput
                            placeholder="Ara..."
                            placeholderTextColor="#64748b"
                            value={search}
                            onChangeText={setSearch}
                            className="flex-1 ml-3 text-white font-medium"
                        />
                    </View>

                    {/* Content Based on Tab */}
                    {activeTab === 'accounts' ? renderAccounts() :
                        activeTab === 'dbs' ? renderDBS() : renderTransactions()}

                </ScrollView>
            </SafeAreaView>

            {/* Transaction Detail Modal */}
            <FinanceDetailModal
                visible={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transaction={selectedTransaction}
            />
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

function getMockTransactions(type: string) {
    const list = [];
    for (let i = 0; i < 10; i++) {
        list.push({
            id: i,
            date: new Date(Date.now() - i * 86400000).toISOString(),
            type: type === 'pos' ? 'POS Tahsilat' : type === 'cc' ? 'Kredi Kartı Fişi' : type.includes('in') ? 'Gelen Havale' : 'Giden Havale',
            amount: Math.floor(Math.random() * 50000) + 1000,
            clientName: `Müşteri Firma ${i + 1}`,
            bankAccount: 'Ziraat Bankası - Merkez',
            trcode: type.includes('out') || type === 'cc' ? 72 : 70, // Expense or Income logic
            sign: 0,
            description: `Mock işlem açıklaması ${i + 1}`
        });
    }
    return list;
}
