import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Search, Loader2, AlertCircle, Settings } from 'lucide-react';

const DAYS = [
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
    { value: 0, label: 'Pazar' }
];

const DBSSettings = () => {
    const [settings, setSettings] = useState([]);
    const [globalConfig, setGlobalConfig] = useState({
        previousPeriod: { enabled: false, firmNo: '', periodNo: '', yearLabel: '' }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    // UI States
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [localRes, globalRes] = await Promise.all([
                fetch('/api/dbs/settings'),
                fetch('/api/dbs/settings/global')
            ]);

            if (localRes.ok) {
                setSettings(await localRes.json());
            }
            if (globalRes.ok) {
                setGlobalConfig(await globalRes.json());
            }
        } catch (err) {
            console.error('Failed to fetch DBS settings', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            // Reusing existing accounts search or list
            const res = await fetch(`/api/accounts?search=${query}&type=3&includeZeroBalance=true`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setSearchResults(data);
                } else {
                    setSearchResults(data.data || []);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const addClient = (client) => {
        const ref = client.logicalRef || client.id;
        if (settings.find(s => s.logicalRef === ref)) return;

        setSettings(prev => [
            ...prev,
            {
                logicalRef: ref,
                code: client.code,
                name: client.name,
                paymentDay: '',
                termDays: 0
            }
        ]);
        // Don't close modal immediately to allow multiple adds
    };

    const removeClient = (logicalRef) => {
        setSettings(settings.filter(s => s.logicalRef !== logicalRef));
    };

    const updateClient = (logicalRef, field, value) => {
        setSettings(settings.map(s =>
            s.logicalRef === logicalRef ? { ...s, [field]: value } : s
        ));
    };

    const isAdded = (logicalRef) => settings.some(s => s.logicalRef === logicalRef);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                fetch('/api/dbs/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settings)
                }),
                fetch('/api/dbs/settings/global', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(globalConfig)
                })
            ]);
            alert('Ayarlar başarıyla kaydedildi.');
        } catch (err) {
            console.error(err);
            alert('Kaydedilirken hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    // Helper for global config update
    const updateGlobalConfig = (field, value) => {
        setGlobalConfig(prev => ({
            ...prev,
            previousPeriod: {
                ...prev.previousPeriod,
                [field]: value
            }
        }));
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                    <h3 className="text-lg font-bold text-white">DBS Firma Listesi</h3>
                    <p className="text-sm text-slate-400">DBS sistemine dahil edilecek firmaları buradan yönetin.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={18} />
                        <span>Firma Ekle</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50 font-medium shadow-lg shadow-emerald-600/20"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>Kaydet</span>
                    </button>
                </div>
            </div>

            {/* Previous Period Config */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-200">Geçmiş Dönem Ayarları</h4>
                        <p className="text-xs text-slate-500">Geçmiş dönem bakiyelerini kontrol etmek için yapılandırın.</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={globalConfig.previousPeriod?.enabled || false}
                            onChange={(e) => updateGlobalConfig('enabled', e.target.checked)}
                            className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 checked:bg-indigo-600"
                        />
                        <span className="text-sm font-medium text-slate-300">Geçmiş Dönem Kontrolü</span>
                    </label>

                    {globalConfig.previousPeriod?.enabled && (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Firma No</label>
                                <input
                                    type="text"
                                    placeholder="Örn: 113"
                                    value={globalConfig.previousPeriod?.firmNo || ''}
                                    onChange={(e) => updateGlobalConfig('firmNo', e.target.value)}
                                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Dönem No</label>
                                <input
                                    type="text"
                                    placeholder="Örn: 01"
                                    value={globalConfig.previousPeriod?.periodNo || ''}
                                    onChange={(e) => updateGlobalConfig('periodNo', e.target.value)}
                                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-slate-500 uppercase">Yıl Etiketi</label>
                                <input
                                    type="text"
                                    placeholder="Örn: 2025"
                                    value={globalConfig.previousPeriod?.yearLabel || ''}
                                    onChange={(e) => updateGlobalConfig('yearLabel', e.target.value)}
                                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950/50 text-slate-400 uppercase font-bold text-xs">
                        <tr>
                            <th className="px-6 py-4">Cari Kodu</th>
                            <th className="px-6 py-4">Ünvanı</th>
                            <th className="px-6 py-4">Ödeme Günü (Zorunlu)</th>
                            <th className="px-6 py-4">Ek Vade (Gün)</th>
                            <th className="px-6 py-4 text-center">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {settings.length === 0 ? (
                            <tr><td colSpan="5" className="p-12 text-center text-slate-500">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-4 bg-slate-800 rounded-full"><Search size={24} className="opacity-50" /></div>
                                    <p>Henüz DBS firması eklenmemiş.</p>
                                    <button onClick={() => setShowAddModal(true)} className="text-blue-400 hover:underline">Listeden Ekle</button>
                                </div>
                            </td></tr>
                        ) : (
                            settings.map(client => (
                                <tr key={client.logicalRef} className="hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{client.code}</td>
                                    <td className="px-6 py-4 text-slate-200 font-medium">{client.name}</td>
                                    <td className="px-6 py-4">
                                        <div className="relative">
                                            <select
                                                value={client.paymentDay}
                                                onChange={(e) => updateClient(client.logicalRef, 'paymentDay', e.target.value)}
                                                className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none w-full appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                                            >
                                                <option value="">Fatura Vadesi</option>
                                                {DAYS.map(d => (
                                                    <option key={d.value} value={d.value}>{d.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <input
                                            type="number"
                                            value={client.termDays}
                                            onChange={(e) => updateClient(client.logicalRef, 'termDays', e.target.value)}
                                            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 focus:border-indigo-500 outline-none w-24 text-center hover:border-slate-600 transition-colors"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => removeClient(client.logicalRef)}
                                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-50 group-hover:opacity-100"
                                            title="Listeden Çıkar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Client Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <div>
                                <h3 className="text-xl font-bold text-white">Yeni DBS Firması Ekle</h3>
                                <p className="text-sm text-slate-400 mt-1">Eklemek istediğiniz firmayı arayın ve seçin.</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 flex-1 overflow-hidden flex flex-col">
                            {/* Search Input */}
                            <div className="relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Firma adı veya kodu ile arayın..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3.5 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none text-lg placeholder:text-slate-600 transition-all shadow-inner"
                                />
                            </div>

                            {/* Results List */}
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2 custom-scrollbar">
                                {searching ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-3">
                                        <Loader2 className="animate-spin text-blue-500" size={32} />
                                        <p>Firma listesi aranıyor...</p>
                                    </div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(res => {
                                        const ref = res.logicalRef || res.id;
                                        const added = isAdded(ref);
                                        return (
                                            <div
                                                key={ref}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${added
                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                    : 'bg-slate-800/30 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                                                    }`}
                                            >
                                                <div>
                                                    <div className={`font-bold ${added ? 'text-emerald-400' : 'text-slate-200'}`}>{res.name}</div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">{res.code}</span>
                                                        <span className="text-xs text-slate-500">{res.city ? `${res.city}/${res.town}` : '-'}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => !added && addClient(res)}
                                                    disabled={added}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${added
                                                        ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 active:scale-95'
                                                        }`}
                                                >
                                                    {added ? (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                            Eklendi
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={16} strokeWidth={3} />
                                                            Ekle
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : searchQuery.length > 1 ? (
                                    <div className="text-center py-12 text-slate-500 flex flex-col items-center gap-3">
                                        <AlertCircle size={32} className="opacity-50" />
                                        <p>Aradığınız kriterlere uygun firma bulunamadı.</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-slate-600 flex flex-col items-center gap-3">
                                        <Search size={32} className="opacity-20" />
                                        <p>Arama yapmak için yukarıya yazmaya başlayın.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-900/50 border-t border-slate-800 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DBSSettings;
