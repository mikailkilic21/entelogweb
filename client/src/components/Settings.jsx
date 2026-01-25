import React, { useState, useEffect } from 'react';
import { Save, Server, Database, User, Key, CheckCircle, AlertCircle, Loader2, Building2, Upload, Image as ImageIcon, MapPin, Phone, Mail, Globe, FileText, Plus, Trash2, Edit2, X } from 'lucide-react';

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

    // Users State
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({ username: '', password: '', name: '', role: 'user' });

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchCompanySettings(), fetchDbSettings(), fetchUsers()]);
            setLoading(false);
        };
        init();

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

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    // --- Handlers ---

    const handleCompanyChange = (e) => {
        setCompany({ ...company, [e.target.name]: e.target.value });
    };

    const handleDbChange = (e) => {
        setDbConfig({ ...dbConfig, [e.target.name]: e.target.value });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
        }
    };

    const handleCompanySubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
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
                    setCompany(prev => ({ ...prev, logoPath: currentLogoPath }));
                }
            }

            const res = await fetch('/api/settings/company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...company, logoPath: currentLogoPath })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Şirket bilgileri başarıyla güncellendi.' });
                fetchCompanySettings();
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

    // --- User Management Handlers ---

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            // Basic validation
            if (!userForm.username || !userForm.name) {
                setMessage({ type: 'error', text: 'Kullanıcı adı ve Ad Soyad zorunludur.' });
                setSaving(false);
                return;
            }
            if (!editingUser && !userForm.password) {
                setMessage({ type: 'error', text: 'Şifre zorunludur.' });
                setSaving(false);
                return;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userForm)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: editingUser ? 'Kullanıcı güncellendi.' : 'Kullanıcı oluşturuldu.' });
                fetchUsers();
                setShowUserModal(false);
                setEditingUser(null);
                setUserForm({ username: '', password: '', name: '', role: 'user' });
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'İşlem başarısız.' });
            }
        } catch (err) { setMessage({ type: 'error', text: err.message }); }
        setSaving(false);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Kullanıcı silindi.' });
                fetchUsers();
            } else setMessage({ type: 'error', text: 'Silme başarısız.' });
        } catch (err) { setMessage({ type: 'error', text: err.message }); }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setUserForm({ username: user.username, password: '', name: user.name, role: user.role });
        setShowUserModal(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setUserForm({ username: '', password: '', name: '', role: 'user' });
        setShowUserModal(true);
    };


    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
                    <SettingsIcon className="text-blue-400" size={32} />
                    Ayarlar
                </h1>
                <p className="text-slate-400 mt-2">Sistem, kullanıcılar ve kurumsal yapılandırma</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-xl mb-8 w-fit border border-slate-700 overflow-x-auto">
                {[
                    { id: 'company', icon: Building2, label: 'Kurumsal Kimlik', color: 'blue' },
                    { id: 'users', icon: User, label: 'Kullanıcılar', color: 'purple' },
                    { id: 'database', icon: Database, label: 'Veritabanı', color: 'emerald' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                            ? `bg-${tab.color}-600 text-white shadow-lg`
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Messages */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center justify-between border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <div className="flex items-center gap-3">
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p>{message.text}</p>
                    </div>
                    <button onClick={() => setMessage(null)}><X size={16} /></button>
                </div>
            )}

            {/* Content Area */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl backdrop-blur-sm">

                {/* --- COMPANY TAB --- */}
                {activeTab === 'company' && (
                    <form onSubmit={handleCompanySubmit} className="space-y-8">
                        {/* Logo Section */}
                        <div className="flex items-start gap-8 border-b border-slate-800 pb-8">
                            <div className="w-32 h-32 bg-slate-800 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden relative group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Logo" className="w-full h-full object-contain" />
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

                {/* --- USERS TAB --- */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Kullanıcı Listesi</h3>
                                <p className="text-slate-400 text-sm">Sisteme erişimi olan kullanıcıları yönetin.</p>
                            </div>
                            <button onClick={openCreateModal} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg shadow-purple-500/20">
                                <Plus size={18} /> Yeni Kullanıcı
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-700">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-800 text-slate-200 uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Kullanıcı Adı</th>
                                        <th className="px-6 py-3">Ad Soyad</th>
                                        <th className="px-6 py-3">Rol</th>
                                        <th className="px-6 py-3 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                                            <td className="px-6 py-4">{user.name}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-700 text-slate-300'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEditModal(user)} className="p-1.5 hover:bg-blue-500/20 text-blue-400 rounded"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Kayıtlı kullanıcı bulunamadı.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- DATABASE TAB --- */}
                {activeTab === 'database' && (
                    <form onSubmit={handleDbSubmit} className="space-y-6">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3 text-amber-400 mb-6">
                            <AlertCircle size={20} />
                            <p>Bu ayarlar uygulamanın Logo veritabanı bağlantısı içindir. Dikkatli değiştiriniz.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="SQL Sunucu" name="server" value={dbConfig.server} onChange={handleDbChange} icon={Server} />
                            <Field label="Veritabanı" name="database" value={dbConfig.database} onChange={handleDbChange} icon={Database} />
                            <Field label="Kullanıcı Adı" name="user" value={dbConfig.user} onChange={handleDbChange} icon={User} />
                            <Field label="Şifre" name="password" value={dbConfig.password} onChange={handleDbChange} icon={Key} type="password" />
                            <Field label="Firma No" name="firmNo" value={dbConfig.firmNo} onChange={handleDbChange} icon={Database} />
                            <Field label="Dönem No" name="periodNo" value={dbConfig.periodNo} onChange={handleDbChange} icon={Database} />
                        </div>
                        <SubmitButton saving={saving} text="Veritabanı Ayarlarını Kaydet" color="emerald" />
                    </form>
                )}
            </div>

            {/* --- USER MODAL --- */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <h3 className="text-xl font-bold text-white">{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</h3>
                            <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="space-y-4">
                            <Field label="Kullanıcı Adı" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} icon={User} required />
                            <Field label="Ad Soyad" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} icon={FileText} required />
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Rol</label>
                                <select
                                    value={userForm.role}
                                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                                >
                                    <option value="user">Kullanıcı</option>
                                    <option value="admin">Yönetici</option>
                                    <option value="demo">Demo</option>
                                </select>
                            </div>
                            <Field
                                label={editingUser ? "Yeni Şifre (Boş bırakılabilir)" : "Şifre"}
                                value={userForm.password}
                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                icon={Key}
                                type="password"
                                required={!editingUser}
                            />

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl border border-slate-700">İptal</button>
                                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-purple-500/30">
                                    {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : (editingUser ? 'Güncelle' : 'Oluştur')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Helper Components ---

const Field = ({ label, name, value, onChange, icon: Icon, type = "text", required = false }) => (
    <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                required={required}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 pl-10 text-white focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-600"
            />
            {Icon && <Icon className="absolute left-3 top-3 text-slate-500" size={18} />}
        </div>
    </div>
);

const SubmitButton = ({ saving, text, color }) => (
    <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
            type="submit"
            disabled={saving}
            className={`bg-${color}-600 hover:bg-${color}-500 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-${color}-500/30 active:scale-95 disabled:opacity-50`}
        >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {text}
        </button>
    </div>
);

const SettingsIcon = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

export default Settings;
