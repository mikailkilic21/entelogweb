import React, { useState, useEffect } from 'react';
import { Save, Server, Database, User, Key, CheckCircle, AlertCircle, Loader2, Building2, Upload, Image as ImageIcon, MapPin, Phone, Mail, Globe, FileText } from 'lucide-react';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Company State
    const [company, setCompany] = useState({
        companyName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        taxOffice: '',
        taxNo: '',
        city: '',
        town: '',
        logoPath: null
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // DB State
    const [dbConfig, setDbConfig] = useState({
        server: '',
        database: '',
        user: '',
        password: '',
        firmNo: '',
        periodNo: ''
    });

    useEffect(() => {
        fetchCompanySettings();
        fetchDbSettings();
        setLoading(false);

        const handleDbUpdate = () => {
            fetchDbSettings();
        };

        window.addEventListener('dbSettingsUpdated', handleDbUpdate);

        return () => {
            window.removeEventListener('dbSettingsUpdated', handleDbUpdate);
        };
    }, []);

    const fetchCompanySettings = async () => {
        try {
            const res = await fetch('/api/settings/company');
            if (res.ok) {
                const data = await res.json();
                setCompany(data);
                if (data.logoPath) {
                    // Assuming server serves public folder
                    // If logoPath starts with /uploads, it maps to http://localhost:3001/uploads/...
                    // But we are on active vite port? We need full URL or proxy. Content is served from backend port 3001.
                    // Let's assume vite proxy handles it or use relative
                    setPreviewUrl(data.logoPath);
                }
            }
        } catch (error) {
            console.error('Error fetching company settings:', error);
        }
    };

    const fetchDbSettings = async () => {
        try {
            const res = await fetch('/api/settings/db');
            if (res.ok) {
                const data = await res.json();
                setDbConfig(data);
            }
        } catch (error) {
            console.error('Error fetching db settings:', error);
        }
    };

    const handleCompanyChange = (e) => {
        setCompany({ ...company, [e.target.name]: e.target.value });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleDbChange = (e) => {
        setDbConfig({ ...dbConfig, [e.target.name]: e.target.value });
    };

    const handleCompanySubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // 1. Upload Logo if selected
            let currentLogoPath = company.logoPath;
            if (selectedFile) {
                const formData = new FormData();
                formData.append('logo', selectedFile);

                const uploadRes = await fetch('/api/settings/company/logo', {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    currentLogoPath = uploadData.logoPath;
                    // Update state to reflect new saved path
                    setCompany(prev => ({ ...prev, logoPath: currentLogoPath }));
                }
            }

            // 2. Save Text Data
            const res = await fetch('/api/settings/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...company, logoPath: currentLogoPath })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Şirket bilgileri başarıyla güncellendi.' });
                fetchCompanySettings(); // Refresh
            } else {
                setMessage({ type: 'error', text: 'Kaydetme başarısız oldu.' });
            }

        } catch (error) {
            setMessage({ type: 'error', text: 'Bir hata oluştu: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDbSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/settings/db', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbConfig)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Veritabanı ayarları güncellendi.' });
                fetchDbSettings();

                // Notify other components (like Sidebar) to refresh
                window.dispatchEvent(new Event('dbSettingsUpdated'));
            } else {
                setMessage({ type: 'error', text: 'Veritabanı ayarları kaydedilemedi.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Hata: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                    <SettingsIcon className="text-blue-400" size={32} />
                    Ayarlar
                </h1>
                <p className="text-slate-400 mt-2">Sistem ve kurumsal kimlik yapılandırması</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-8 w-fit border border-slate-700">
                <button
                    onClick={() => setActiveTab('company')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'company' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    <Building2 size={18} />
                    Kurumsal Kimlik
                </button>
                <button
                    onClick={() => setActiveTab('database')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'database' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                >
                    <Database size={18} />
                    Veritabanı
                </button>
            </div>

            {/* Messages */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <p>{message.text}</p>
                </div>
            )}

            {/* Content */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl backdrop-blur-sm">

                {/* COMPANY SETTINGS TAB */}
                {activeTab === 'company' && (
                    <form onSubmit={handleCompanySubmit} className="space-y-8">
                        {/* Logo Section */}
                        <div className="flex items-start gap-8 border-b border-slate-800 pb-8">
                            <div className="w-32 h-32 bg-slate-800 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden relative group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="text-slate-600" size={32} />
                                )}
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="text-white" size={24} />
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    title="Logo yüklemek için tıklayın"
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-white mb-2">Şirket Logosu</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Faturalar ve raporlarda kullanılacak şirket logosunu buradan yükleyin.
                                    <br />PNG, JPG formatları desteklenir. Max 2MB.
                                </p>
                                <button type="button" className="text-sm text-blue-400 hover:text-blue-300 font-medium" onClick={() => document.querySelector('input[type=file]').click()}>
                                    Dosya Seç
                                </button>
                            </div>
                        </div>

                        {/* Text Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Şirket Ünvanı</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={company.companyName}
                                            onChange={handleCompanyChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Örn: Teknoflow Bilişim A.Ş."
                                        />
                                        <Building2 className="absolute left-3 top-3 text-slate-500" size={18} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">E-Posta</label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            name="email"
                                            value={company.email}
                                            onChange={handleCompanyChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="info@sirket.com"
                                        />
                                        <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefon</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={company.phone}
                                            onChange={handleCompanyChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="0212 123 45 67"
                                        />
                                        <Phone className="absolute left-3 top-3 text-slate-500" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Web Sitesi</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="website"
                                            value={company.website}
                                            onChange={handleCompanyChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="www.sirket.com"
                                        />
                                        <Globe className="absolute left-3 top-3 text-slate-500" size={18} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Vergi Dairesi</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="taxOffice"
                                                value={company.taxOffice}
                                                onChange={handleCompanyChange}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                                placeholder="VD Adı"
                                            />
                                            <FileText className="absolute left-3 top-3 text-slate-500" size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Vergi No</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="taxNo"
                                                value={company.taxNo}
                                                onChange={handleCompanyChange}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                                placeholder="1234567890"
                                            />
                                            <FileText className="absolute left-3 top-3 text-slate-500" size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">İl</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="city"
                                            value={company.city}
                                            onChange={handleCompanyChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="İstanbul"
                                        />
                                        <MapPin className="absolute left-3 top-3 text-slate-500" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1.5">İlçe</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="town"
                                            value={company.town}
                                            onChange={handleCompanyChange}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Kadıköy"
                                        />
                                        <MapPin className="absolute left-3 top-3 text-slate-500" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Adres</label>
                                <div className="relative">
                                    <textarea
                                        name="address"
                                        value={company.address}
                                        onChange={handleCompanyChange}
                                        rows="3"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 resize-none"
                                        placeholder="Tam şirket adresi..."
                                    />
                                    <MapPin className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Değişiklikleri Kaydet
                            </button>
                        </div>
                    </form>
                )}

                {/* DATABASE SETTINGS TAB (Legacy/Future) */}
                {activeTab === 'database' && (
                    <form onSubmit={handleDbSubmit} className="space-y-6">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-400 mb-6">
                            <AlertCircle size={20} />
                            <p>Bu ayarlar uygulamanın Logo veritabanına bağlanmasını sağlar. Yanlış yapılandırma bağlantıyı kesebilir.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">SQL Sunucu</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="server"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        value={dbConfig.server}
                                        onChange={handleDbChange}
                                    />
                                    <Server className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Veritabanı</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="database"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        value={dbConfig.database}
                                        onChange={handleDbChange}
                                    />
                                    <Database className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Kullanıcı Adı</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="user"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        value={dbConfig.user}
                                        onChange={handleDbChange}
                                    />
                                    <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Şifre</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        name="password"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        value={dbConfig.password}
                                        onChange={handleDbChange}
                                        placeholder="********"
                                    />
                                    <Key className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Firma No</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="firmNo"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        value={dbConfig.firmNo || ''}
                                        onChange={handleDbChange}
                                    />
                                    <Database className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Dönem No</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="periodNo"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pl-10 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        value={dbConfig.periodNo || ''}
                                        onChange={handleDbChange}
                                    />
                                    <Database className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                Veritabanı Ayarlarını Kaydet
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// Icon component since 'Settings' name conflicts with the component name
const SettingsIcon = ({ size, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export default Settings;
