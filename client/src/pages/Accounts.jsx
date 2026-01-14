import React, { useState, useEffect } from 'react';
import AccountDetailModal from '../components/AccountDetailModal';
import { Users, Building2, TrendingUp, TrendingDown, Search, Loader2, RefreshCw } from 'lucide-react';

const Accounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'customers', 'suppliers'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Include search param
            const searchParam = searchTerm ? `&search=${searchTerm}` : '';
            const typeParam = activeTab === 'customers' ? '&type=customer' : activeTab === 'suppliers' ? '&type=supplier' : '';

            const [accountsRes, statsRes] = await Promise.all([
                fetch(`/api/accounts?limit=50${searchParam}${typeParam}`),
                fetch('/api/accounts/stats')
            ]);

            if (accountsRes.ok) {
                const data = await accountsRes.json();
                setAccounts(Array.isArray(data) ? data : []);
            }
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search to prevent too many requests
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchTerm, activeTab]);

    // Direct render without client-side filter
    const filteredAccounts = accounts;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Cari Hesaplar
                    </h1>
                    <p className="text-slate-400 mt-2">Müşteri ve tedarikçi hesaplarınızı yönetin</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="text-blue-400" size={24} />
                            <span className="text-sm text-slate-300">Toplam Müşteri</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.totalCustomers || 0}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="text-purple-400" size={24} />
                            <span className="text-sm text-slate-300">Toplam Tedarikçi</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{stats.totalSuppliers || 0}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-600/20 to-green-600/5 border border-green-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="text-green-400" size={24} />
                            <span className="text-sm text-slate-300">Toplam Alacak</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                            {(stats.totalReceivables || 0).toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                            })}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-red-600/20 to-red-600/5 border border-red-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingDown className="text-red-400" size={24} />
                            <span className="text-sm text-slate-300">Toplam Borç</span>
                        </div>
                        <p className="text-2xl font-bold text-red-400">
                            {(stats.totalPayables || 0).toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                            })}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Tabs */}
                <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-md transition-all ${activeTab === 'all'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`px-4 py-2 rounded-md transition-all ${activeTab === 'customers'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Müşteriler
                    </button>
                    <button
                        onClick={() => setActiveTab('suppliers')}
                        className={`px-4 py-2 rounded-md transition-all ${activeTab === 'suppliers'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Tedarikçiler
                    </button>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari hesap ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Accounts Table List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-800/80 border-b border-slate-700">
                                <th className="text-left p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Cari Kodu</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Ünvan</th>
                                <th className="text-right p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Bakiye</th>
                                <th className="text-center p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Son İşlem</th>
                                <th className="text-left p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Konum</th>
                                <th className="text-center p-4 text-sm font-medium text-slate-400 uppercase tracking-wider">Durum</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filteredAccounts.length > 0 ? (
                                filteredAccounts.map((account) => (
                                    <tr
                                        key={account.id}
                                        onDoubleClick={() => setSelectedAccountId(account.id)}
                                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                                    >
                                        <td className="p-4 text-sm font-mono text-slate-400 group-hover:text-blue-400 transition-colors">
                                            {account.code}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${account.cardType === 1 ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                                                    }`}>
                                                    <Building2 size={16} />
                                                </div>
                                                <span className="text-sm font-medium text-white">{account.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`text-sm font-semibold ${account.balance > 0 ? 'text-green-400' : account.balance < 0 ? 'text-red-400' : 'text-slate-400'
                                                }`}>
                                                {Math.abs(account.balance).toLocaleString('tr-TR', {
                                                    style: 'currency',
                                                    currency: 'TRY'
                                                })}
                                                <span className="text-xs ml-1 opacity-70">
                                                    {account.balance > 0 ? '(A)' : account.balance < 0 ? '(B)' : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-sm text-slate-300">
                                                {account.lastOperationDate
                                                    ? new Date(account.lastOperationDate).toLocaleDateString('tr-TR')
                                                    : '-'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400">
                                            {[account.town, account.city].filter(Boolean).join(' / ')}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                Aktif
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-500">
                                        <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-lg">Kayıt bulunamadı</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedAccountId && (
                <AccountDetailModal
                    accountId={selectedAccountId}
                    onClose={() => setSelectedAccountId(null)}
                />
            )}
        </div>
    );
};

export default Accounts;
