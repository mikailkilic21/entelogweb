import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';

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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/dbs/settings');
            if (res.ok) {
                setSettings(await res.json());
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
            const res = await fetch(`/api/accounts?search=${query}&type=3`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.data || []); // Assuming standard pagination structure or array
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const addClient = (client) => {
        if (settings.find(s => s.logicalRef === client.logicalRef)) return;

        setSettings([
            ...settings,
            {
                logicalRef: client.logicalRef,
                code: client.code,
                name: client.name,
                paymentDay: '', // Default empty (No forced day)
                termDays: 0
            }
        ]);
        setShowSearch(false);
        setSearchQuery('');
    };

    const removeClient = (logicalRef) => {
        setSettings(settings.filter(s => s.logicalRef !== logicalRef));
    };

    const updateClient = (logicalRef, field, value) => {
        setSettings(settings.map(s =>
            s.logicalRef === logicalRef ? { ...s, [field]: value } : s
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/dbs/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                // Success feedback?
                alert('Ayarlar kaydedildi.');
            }
        } catch (err) {
            console.error(err);
            alert('Kaydedilirken hata oluştu.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">DBS Müşteri Yapılandırması</h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Kaydet</span>
                </button>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950/50 text-slate-400 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-4 py-3">Cari Kodu</th>
                            <th className="px-4 py-3">Ünvanı</th>
                            <th className="px-4 py-3">Ödeme Günü (Zorunlu)</th>
                            <th className="px-4 py-3">Ek Vade (Gün)</th>
                            <th className="px-4 py-3 text-center">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {settings.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">Henüz DBS müşterisi eklenmemiş.</td></tr>
                        ) : (
                            settings.map(client => (
                                <tr key={client.logicalRef} className="hover:bg-slate-800/30">
                                    <td className="px-4 py-2 text-slate-400 font-mono">{client.code}</td>
                                    <td className="px-4 py-2 text-slate-200">{client.name}</td>
                                    <td className="px-4 py-2">
                                        <select
                                            value={client.paymentDay}
                                            onChange={(e) => updateClient(client.logicalRef, 'paymentDay', e.target.value)}
                                            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none w-full"
                                        >
                                            <option value="">Fatura Vadesi</option>
                                            {DAYS.map(d => (
                                                <option key={d.value} value={d.value}>{d.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            value={client.termDays}
                                            onChange={(e) => updateClient(client.logicalRef, 'termDays', e.target.value)}
                                            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:border-indigo-500 outline-none w-24"
                                            placeholder="0"
                                        />
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => removeClient(client.logicalRef)}
                                            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Client Section */}
            {!showSearch ? (
                <button
                    onClick={() => setShowSearch(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors w-full justify-center border-dashed"
                >
                    <Plus size={16} />
                    <span>Yeni DBS Müşterisi Ekle</span>
                </button>
            ) : (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Cari adı veya kodu ara..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setShowSearch(false)}
                            className="px-4 py-2 text-slate-400 hover:text-slate-200"
                        >
                            İptal
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {searching ? (
                            <div className="text-center p-4 text-slate-500">Aranıyor...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(res => (
                                <button
                                    key={res.logicalRef}
                                    onClick={() => addClient(res)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-slate-800 rounded-lg text-left group transition-colors"
                                >
                                    <div>
                                        <div className="text-slate-200 font-medium group-hover:text-white">{res.name}</div>
                                        <div className="text-xs text-slate-500 font-mono">{res.code}</div>
                                    </div>
                                    <Plus size={16} className="text-slate-600 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))
                        ) : searchQuery.length > 1 ? (
                            <div className="text-center p-4 text-slate-500">Sonuç bulunamadı.</div>
                        ) : (
                            <div className="text-center p-4 text-slate-500 text-sm">Aramak için en az 2 karakter girin.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DBSSettings;
