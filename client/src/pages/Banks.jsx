import React, { useState, useEffect, useCallback } from 'react';
import {
    LayoutGrid,
    List,
    Landmark,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Search,
    MoreHorizontal,
    HandCoins,
    Receipt,
    SendHorizontal,
    DownloadCloud,
    History,
    ChevronDown,
    ChevronRight,
    Building
} from 'lucide-react';
import {
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { DataTable } from '../components/ui/data-table';
import BankCharts from '../components/BankCharts';
import FinanceDetailModal from '../components/FinanceDetailModal';
import DBSSettings from '../components/DBSSettings';
import DBSInvoiceList from '../components/DBSInvoiceList';

// Bank Logos
import akbankLogo from '../assets/akbank.png';
import halkbankLogo from '../assets/Halkbank.png';
import vakifLogo from '../assets/Vakıfbank.png';
import yapiKrediLogo from '../assets/Yapi_Kredi.png';
import ziraatLogo from '../assets/ziraat.png';
import qnbLogo from '../assets/qnbfinans.png';
import albarakaLogo from '../assets/albaraka.png';

const BankLogo = ({ bankName }) => {

    const getLogo = (name) => {
        if (!name) return null;
        const n = name.toLocaleLowerCase('tr-TR');
        if (n.includes('akbank')) return akbankLogo;
        if (n.includes('halk')) return halkbankLogo;
        if (n.includes('vakif') || n.includes('vakıf')) return vakifLogo;
        if (n.includes('yapı') || n.includes('yapi')) return yapiKrediLogo;
        if (n.includes('ziraat')) return ziraatLogo;
        if (n.includes('qnb') || n.includes('finans')) return qnbLogo;
        if (n.includes('albaraka')) return albarakaLogo;
        return null; // Fallback
    };

    const logoSrc = getLogo(bankName);

    if (!logoSrc) {
        return (
            <div className="w-32 h-14 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-white font-bold text-lg shadow-sm mr-6">
                {bankName?.charAt(0) || 'B'}
            </div>
        );
    }

    return (
        <div className="w-32 h-14 rounded-lg bg-white px-2 py-1 border border-slate-700 flex items-center justify-center shadow-sm overflow-hidden mr-6">
            <img
                src={logoSrc}
                alt={bankName}
                className="w-full h-full object-contain"
            />
        </div>
    );
};

const Banks = () => {
    const [viewMode, setViewMode] = useState('list'); // 'modern', 'list'
    const [activeTab, setActiveTab] = useState('accounts'); // 'accounts', 'pos', 'cc', 'havale-in', 'havale-out'
    const [activeDBSTab, setActiveDBSTab] = useState('list'); // 'list' | 'settings'
    const [search, setSearch] = useState('');
    const [expandedBanks, setExpandedBanks] = useState({}); // { 'Akbank': true }

    // Modal State
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Data States
    const [banks, setBanks] = useState([]);
    const [financeTransactions, setFinanceTransactions] = useState([]);
    const [statsData, setStatsData] = useState(null);

    // Loading/Error States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Stats and Banks are usually needed always
            const [banksRes, statsRes] = await Promise.all([
                fetch(`/api/banks?search=${search}`),
                fetch('/api/banks/stats')
            ]);

            if (!banksRes.ok) throw new Error('Bank listesi alınamadı');
            if (!statsRes.ok) throw new Error('İstatistikler alınamadı');

            const banksData = await banksRes.json();
            const statsJson = await statsRes.json();

            setBanks(banksData);
            setStatsData(statsJson);

            // Fetch transactions based on active tab
            if (activeTab !== 'accounts' && activeTab !== 'dbs') {
                const txRes = await fetch(`/api/banks/finance-transactions?type=${activeTab}`);
                if (!txRes.ok) throw new Error('İşlemler alınamadı');
                const txData = await txRes.json();
                setFinanceTransactions(txData);
            }

        } catch (err) {
            console.error('Banks fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [search, activeTab]);

    // Initial fetch and fetch on search/tab change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchData]);

    // Format Currency
    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val || 0);

    // Handle Row Click
    const handleTransactionClick = (transaction) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    // Columns for different types
    const bankColumns = [
        {
            header: 'Banka Adı',
            accessorKey: 'bankName',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {row.original.bankName?.charAt(0) || 'B'}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900">{row.original.bankName}</p>
                        <p className="text-xs text-slate-500">{row.original.branch} - {row.original.code}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Hesap Adı',
            accessorKey: 'name',
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>
        },
        {
            header: 'IBAN',
            accessorKey: 'iban',
            cell: ({ row }) => <span className="font-mono text-sm">{row.original.iban}</span>
        },
        {
            header: <div className="text-right">Bakiye</div>,
            accessorKey: 'balance',
            cell: ({ row }) => {
                const amount = row.original.balance;
                return (
                    <div className={`font-bold text-right ${amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(amount)}
                    </div>
                );
            }
        }
    ];

    const financeColumns = [
        {
            header: 'Tarih',
            accessorKey: 'date',
            cell: ({ row }) => <span>{new Date(row.original.date).toLocaleDateString('tr-TR')}</span>
        },
        {
            header: 'Tür',
            accessorKey: 'type',
            cell: ({ row }) => {
                const { trcode } = row.original;
                let colorClass = 'bg-slate-100 text-slate-700';
                if (trcode === 70 || trcode === 3) colorClass = 'bg-emerald-100 text-emerald-700';
                if (trcode === 72 || trcode === 4) colorClass = 'bg-rose-100 text-rose-700';
                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
                        {row.original.type}
                    </span>
                );
            }
        },
        {
            header: 'Müşteri / Tedarikçi',
            accessorKey: 'clientName',
            cell: ({ row }) => <span className="font-medium">{row.original.clientName || '-'}</span>
        },
        {
            header: 'Banka Hesabı',
            accessorKey: 'bankAccount',
            cell: ({ row }) => <span className="text-slate-500">{row.original.bankAccount}</span>
        },
        {
            header: <div className="text-right">Tutar</div>,
            accessorKey: 'amount',
            cell: ({ row }) => {
                const { trcode, sign, amount } = row.original;
                // Sign logic based on TRCODE
                const isOutflow = (trcode === 72 && sign === 0) || (trcode === 4 && sign === 1);
                return (
                    <div className={`font-bold text-right ${!isOutflow ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isOutflow ? '-' : ''}{formatCurrency(amount)}
                    </div>
                );
            }
        }
    ];

    if (error) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-rose-100 rounded-full text-rose-600">
                    <Wallet size={48} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Veriler Yüklenemedi</h2>
                <p className="text-gray-500 max-w-md">{error}</p>
                <button onClick={() => fetchData()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Tekrar Dene</button>
            </div>
        );
    }

    if (loading && banks.length === 0) {
        return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <div className="p-8 w-full space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Bankalar & Finans
                    </h1>
                    <p className="text-slate-400 mt-2">Banka hesapları, POS, Kredi Kartı ve Havale işlemleri</p>
                </div>

                <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setViewMode('modern')} className={`p-2 rounded-md transition-all ${viewMode === 'modern' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <LayoutGrid size={20} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            {statsData && statsData.chart && (
                <BankCharts
                    stats={statsData.stats || {}}
                    banks={banks}
                    dailyMovements={statsData.chart}
                />
            )}

            {/* Summary Grid */}
            {statsData && statsData.stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Landmark size={40} />
                        </div>
                        <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Mevduat Bakiyesi</p>
                        <h2 className="text-2xl font-black">{formatCurrency(statsData.stats.totalBalance)}</h2>
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-[10px] text-emerald-300 font-bold flex items-center">
                                <ArrowUpRight size={10} className="mr-0.5" />
                                {formatCurrency(statsData.stats.dailyIncoming)}
                            </span>
                            <span className="text-[10px] text-rose-300 font-bold flex items-center">
                                <ArrowDownRight size={10} className="mr-0.5" />
                                {formatCurrency(statsData.stats.dailyOutgoing)}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg border-l-4 border-l-emerald-500">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">POS Tahsilatları</p>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(statsData.stats.totalPOS)}</h2>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg border-l-4 border-l-rose-500">
                        <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">KK Harcamaları</p>
                        <h2 className="text-2xl font-black text-white">{formatCurrency(statsData.stats.totalFirmCC)}</h2>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-emerald-400 font-bold">GELEN HAVALE</span>
                            <span className="text-[10px] text-white font-black">{formatCurrency(statsData.stats.totalHavaleIncoming)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-rose-400 font-bold">GİDEN HAVALE</span>
                            <span className="text-[10px] text-white font-black">{formatCurrency(statsData.stats.totalHavaleOutgoing)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="space-y-6">
                <div className="flex border-b border-white/10 gap-6 overflow-x-auto pb-0.5 lg:overflow-visible no-scrollbar">
                    {[
                        { id: 'accounts', label: 'Banka Hesapları', icon: Landmark },
                        { id: 'pos', label: 'POS Tahsilatları', icon: HandCoins },
                        { id: 'cc', label: 'Kredi Kartı', icon: CreditCard },
                        { id: 'havale-in', label: 'Gelen Havale', icon: DownloadCloud },
                        { id: 'havale-out', label: 'Giden Havale', icon: SendHorizontal },
                        { id: 'dbs', label: 'DBS İşlemleri', icon: Receipt }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-4 px-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-400 rounded-t-full shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>}
                        </button>
                    ))}
                </div>

                {activeTab === 'accounts' ? (
                    viewMode === 'modern' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {banks?.map((bank) => (
                                <div key={bank.id} className="group relative bg-white/5 backdrop-blur-sm border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark size={80} /></div>
                                    <div className="flex items-start justify-between mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white font-bold text-xl shadow-lg uppercase">{bank.bankName?.charAt(0)}</div>
                                    </div>
                                    <div className="space-y-1 mb-6 relative z-10">
                                        <h3 className="font-bold text-lg text-white truncate" title={bank.name}>{bank.name}</h3>
                                        <p className="text-sm text-slate-400">{bank.bankName}</p>
                                        <p className="text-xs text-slate-500 font-mono tracking-wider truncate">{bank.iban}</p>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 relative z-10">
                                        <p className="text-xs text-slate-400 mb-1 font-bold">GÜNCEL BAKİYE</p>
                                        <p className={`text-2xl font-black tracking-tight ${bank.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(bank.balance)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Grouped List View */}
                            {(() => {
                                // 1. Group Banks
                                const grouped = banks.reduce((acc, bank) => {
                                    const name = bank.bankName || 'Diğer';
                                    if (!acc[name]) acc[name] = { name, accounts: [], totalBalance: 0 };
                                    acc[name].accounts.push(bank);
                                    acc[name].totalBalance += bank.balance;
                                    return acc;
                                }, {});

                                return Object.values(grouped).map((group, idx) => {
                                    const isExpanded = expandedBanks[group.name];
                                    return (
                                        <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
                                            {/* Header Row */}
                                            <div
                                                onClick={() => setExpandedBanks(prev => ({ ...prev, [group.name]: !prev[group.name] }))}
                                                className="flex items-center p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div className="mr-4 text-slate-500">
                                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </div>

                                                <BankLogo bankName={group.name} />

                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-white">{group.name}</h3>
                                                    <p className="text-xs text-slate-500">{group.accounts.length} Alt Hesap</p>
                                                </div>

                                                <div className="text-right px-4">
                                                    <p className="text-xs text-slate-500 font-bold uppercase">Toplam Bakiye</p>
                                                    <p className={`text-xl font-bold font-mono ${group.totalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {formatCurrency(group.totalBalance)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="border-t border-slate-800 bg-slate-950/30">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="text-xs uppercase text-slate-500 font-medium bg-slate-900/50">
                                                            <tr>
                                                                <th className="px-6 py-3 pl-20">Şube / Hesap Adı</th>
                                                                <th className="px-6 py-3">IBAN</th>
                                                                <th className="px-6 py-3 text-right">Bakiye</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-800/50">
                                                            {group.accounts.map(account => (
                                                                <tr key={account.id} className="hover:bg-slate-800/30 transition-colors">
                                                                    <td className="px-6 py-4 pl-20">
                                                                        <div className="font-medium text-slate-200">{account.name}</div>
                                                                        <div className="text-xs text-slate-500">{account.branch} - {account.code}</div>
                                                                    </td>
                                                                    <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                                                                        {account.iban}
                                                                    </td>
                                                                    <td className={`px-6 py-4 text-right font-mono font-bold ${account.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                        {formatCurrency(account.balance)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )
                ) : activeTab === 'dbs' ? (
                    <div className="space-y-6">
                        <div className="flex p-1 bg-slate-900/50 rounded-xl border border-slate-800 w-fit">
                            <button
                                onClick={() => setActiveDBSTab('list')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeDBSTab === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                DBS Ödeme Listesi
                            </button>
                            <button
                                onClick={() => setActiveDBSTab('settings')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeDBSTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Ayarlar & Müşteriler
                            </button>
                        </div>

                        {activeDBSTab === 'settings' ? <DBSSettings /> : <DBSInvoiceList />}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {viewMode === 'modern' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {financeTransactions.slice(0, 15).map((tx) => (
                                    <div
                                        key={tx.id}
                                        onClick={() => handleTransactionClick(tx)}
                                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex gap-4 items-center group hover:border-blue-500/50 hover:bg-white/10 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10"
                                    >
                                        <div className={`p-3 rounded-xl ${tx.trcode === 70 || tx.trcode === 3 ? 'bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors' : 'bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors'}`}>
                                            {tx.trcode === 70 ? <HandCoins size={20} /> : tx.trcode === 72 ? <Receipt size={20} /> : tx.trcode === 3 ? <DownloadCloud size={20} /> : <SendHorizontal size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold truncate group-hover:text-blue-400 transition-colors">{tx.clientName || 'İsimsiz'}</p>
                                            <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-tight">{tx.bankAccount} • {new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black ${(tx.trcode === 70 || tx.trcode === 3) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {(tx.trcode === 72 || tx.trcode === 4) ? '-' : ''}{formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{tx.type}</p>
                                        </div>
                                    </div>
                                ))}
                                {financeTransactions.length === 0 && (
                                    <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center gap-4">
                                        <History size={48} className="opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-xs">Henüz işlem bulunmuyor</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/50 overflow-hidden text-xs">
                                <DataTable
                                    columns={financeColumns}
                                    data={financeTransactions || []}
                                    onRowClick={handleTransactionClick}
                                    className="cursor-pointer hover:bg-white/5"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <FinanceDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transaction={selectedTransaction}
            />
        </div >
    );
};

export default Banks;
