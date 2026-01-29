import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Building2, Database, User, ChevronLeft, Save, Plus, Trash2, Edit2, X, Check, Server, Key, FileText, MapPin, Phone, Mail, Globe } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '@/constants/Config';

const TABS = [
    { id: 'company', label: 'Kurumsal', icon: Building2 },
    { id: 'users', label: 'Kullanıcılar', icon: User },
    { id: 'database', label: 'Veritabanı', icon: Database },
];

export default function SystemSettingsScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('company');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data States
    const [company, setCompany] = useState<any>({});
    const [dbConfig, setDbConfig] = useState<any>({});
    const [users, setUsers] = useState<any[]>([]);

    // User Modal State
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [userForm, setUserForm] = useState({ username: '', password: '', name: '', role: 'user' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'company') {
                const res = await fetch(`${API_URL}/settings/company`);
                if (res.ok) setCompany(await res.json());
            } else if (activeTab === 'database') {
                const res = await fetch(`${API_URL}/settings/db`);
                if (res.ok) setDbConfig(await res.json());
            } else if (activeTab === 'users') {
                const res = await fetch(`${API_URL}/users`);
                if (res.ok) setUsers(await res.json());
            }
        } catch (error) {
            console.error('Fetch error:', error);
            Alert.alert('Hata', 'Veri yüklenirken bir sorun oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let url = '';
            let body = {};

            if (activeTab === 'company') {
                url = `${API_URL}/settings/company`;
                body = company;
            } else if (activeTab === 'database') {
                url = `${API_URL}/settings/db`;
                body = dbConfig;
            }

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                Alert.alert('Başarılı', 'Ayarlar kaydedildi.');
                fetchData(); // Refresh
            } else {
                Alert.alert('Hata', 'Kaydetme başarısız.');
            }
        } catch (error) {
            Alert.alert('Hata', 'Sunucu hatası.');
        } finally {
            setSaving(false);
        }
    };

    // --- User Management ---
    const handleUserSubmit = async () => {
        setSaving(true);
        try {
            const url = editingUser ? `${API_URL}/users/${editingUser.id}` : `${API_URL}/users`;
            const method = editingUser ? 'PUT' : 'POST';

            if (!userForm.username || !userForm.name) {
                Alert.alert('Hata', 'Kullanıcı adı ve Ad Soyad zorunludur.');
                setSaving(false);
                return;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userForm)
            });

            if (res.ok) {
                Alert.alert('Başarılı', editingUser ? 'Kullanıcı güncellendi.' : 'Kullanıcı oluşturuldu.');
                setShowUserModal(false);
                fetchData();
            } else {
                Alert.alert('Hata', 'İşlem başarısız.');
            }
        } catch (error) {
            Alert.alert('Hata', 'Sunucu hatası.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUser = async (id: number) => {
        Alert.alert('Sil', 'Bu kullanıcıyı silmek istediğinize emin misiniz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Sil', style: 'destructive', onPress: async () => {
                    try {
                        const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
                        if (res.ok) fetchData();
                        else Alert.alert('Hata', 'Silinemedi.');
                    } catch { Alert.alert('Hata', 'Sunucu hatası.'); }
                }
            }
        ]);
    };

    const openUserModal = (user?: any) => {
        if (user) {
            setEditingUser(user);
            setUserForm({ username: user.username, password: '', name: user.name, role: user.role });
        } else {
            setEditingUser(null);
            setUserForm({ username: '', password: '', name: '', role: 'user' });
        }
        setShowUserModal(true);
    };

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient colors={['#0f172a', '#020617']} style={{ position: 'absolute', inset: 0 }} />
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 py-4 flex-row items-center border-b border-slate-800/50">
                    <TouchableOpacity onPress={() => router.back()} className="bg-slate-800 p-2 rounded-full mr-4">
                        <ChevronLeft size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-xl font-bold">Sistem Ayarları</Text>
                        <Text className="text-slate-400 text-xs">Yapılandırma Yönetimi</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View className="flex-row px-4 py-4">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id)}
                                className={`flex-1 flex-row items-center justify-center py-3 mx-1 rounded-xl border ${isActive ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-800'}`}
                            >
                                <Icon size={16} color={isActive ? 'white' : '#94a3b8'} />
                                <Text className={`ml-2 text-xs font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <ScrollView className="flex-1 px-6">
                    {loading ? (
                        <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                    ) : (
                        <View className="pb-10">
                            {/* --- COMPANY TAB --- */}
                            {activeTab === 'company' && (
                                <View className="space-y-4">
                                    <Input label="Şirket Ünvanı" value={company.companyName} onChangeText={t => setCompany({ ...company, companyName: t })} icon={Building2} />
                                    <Input label="E-Posta" value={company.email} onChangeText={t => setCompany({ ...company, email: t })} icon={Mail} keyboardType="email-address" />
                                    <Input label="Telefon" value={company.phone} onChangeText={t => setCompany({ ...company, phone: t })} icon={Phone} keyboardType="phone-pad" />
                                    <Input label="Web Sitesi" value={company.website} onChangeText={t => setCompany({ ...company, website: t })} icon={Globe} />

                                    <View className="flex-row gap-4">
                                        <View className="flex-1"><Input label="Vergi Dairesi" value={company.taxOffice} onChangeText={t => setCompany({ ...company, taxOffice: t })} icon={FileText} /></View>
                                        <View className="flex-1"><Input label="Vergi No" value={company.taxNo} onChangeText={t => setCompany({ ...company, taxNo: t })} icon={FileText} keyboardType="numeric" /></View>
                                    </View>

                                    <View className="flex-row gap-4">
                                        <View className="flex-1"><Input label="İl" value={company.city} onChangeText={t => setCompany({ ...company, city: t })} icon={MapPin} /></View>
                                        <View className="flex-1"><Input label="İlçe" value={company.town} onChangeText={t => setCompany({ ...company, town: t })} icon={MapPin} /></View>
                                    </View>

                                    <Input label="Adres" value={company.address} onChangeText={t => setCompany({ ...company, address: t })} icon={MapPin} multiline numberOfLines={3} />

                                    <SaveButton onPress={handleSave} saving={saving} />
                                </View>
                            )}

                            {/* --- DATABASE TAB --- */}
                            {activeTab === 'database' && (
                                <View className="space-y-4">
                                    <View className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 mb-4">
                                        <Text className="text-amber-400 text-xs">
                                            Dikkat: Bu ayarlar Logo veritabanı bağlantısı içindir. Hatalı yapılandırma uygulamanın çalışmasını durdurabilir.
                                        </Text>
                                    </View>
                                    <Input label="SQL Sunucu" value={dbConfig.server} onChangeText={t => setDbConfig({ ...dbConfig, server: t })} icon={Server} />
                                    <Input label="Veritabanı" value={dbConfig.database} onChangeText={t => setDbConfig({ ...dbConfig, database: t })} icon={Database} />
                                    <Input label="Kullanıcı Adı" value={dbConfig.user} onChangeText={t => setDbConfig({ ...dbConfig, user: t })} icon={User} />
                                    <Input label="Şifre" value={dbConfig.password} onChangeText={t => setDbConfig({ ...dbConfig, password: t })} icon={Key} secureTextEntry />
                                    <Input label="Firma No" value={dbConfig.firmNo} onChangeText={t => setDbConfig({ ...dbConfig, firmNo: t })} icon={Database} keyboardType="numeric" />
                                    <Input label="Dönem No" value={dbConfig.periodNo} onChangeText={t => setDbConfig({ ...dbConfig, periodNo: t })} icon={Database} keyboardType="numeric" />

                                    <SaveButton onPress={handleSave} saving={saving} />
                                </View>
                            )}

                            {/* --- USERS TAB --- */}
                            {activeTab === 'users' && (
                                <View>
                                    <TouchableOpacity
                                        onPress={() => openUserModal()}
                                        className="bg-purple-600 p-4 rounded-xl flex-row items-center justify-center gap-2 mb-6"
                                    >
                                        <Plus size={20} color="white" />
                                        <Text className="text-white font-bold">Yeni Kullanıcı Ekle</Text>
                                    </TouchableOpacity>

                                    {users.map(user => (
                                        <View key={user.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-3 flex-row items-center justify-between">
                                            <View>
                                                <Text className="text-white font-bold text-lg">{user.username}</Text>
                                                <Text className="text-slate-400 text-sm">{user.name}</Text>
                                                <View className={`self-start px-2 py-0.5 rounded mt-1 ${user.role === 'admin' ? 'bg-indigo-500/20' : 'bg-slate-700'}`}>
                                                    <Text className={`text-[10px] font-bold uppercase ${user.role === 'admin' ? 'text-indigo-300' : 'text-slate-300'}`}>{user.role}</Text>
                                                </View>
                                            </View>
                                            <View className="flex-row gap-2">
                                                <TouchableOpacity onPress={() => openUserModal(user)} className="bg-blue-500/10 p-2 rounded-lg"><Edit2 size={18} color="#60a5fa" /></TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteUser(user.id)} className="bg-red-500/10 p-2 rounded-lg"><Trash2 size={18} color="#f87171" /></TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* --- USER MODAL --- */}
                <Modal visible={showUserModal} animationType="slide" presentationStyle="pageSheet">
                    <View className="flex-1 bg-slate-950 pt-6">
                        <View className="px-6 flex-row justify-between items-center mb-6 border-b border-slate-800 pb-4">
                            <Text className="text-2xl font-bold text-white">{editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}</Text>
                            <TouchableOpacity onPress={() => setShowUserModal(false)} className="bg-slate-800 p-2 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="px-6 space-y-4">
                            <Input label="Kullanıcı Adı" value={userForm.username} onChangeText={t => setUserForm({ ...userForm, username: t })} icon={User} />
                            <Input label="Ad Soyad" value={userForm.name} onChangeText={t => setUserForm({ ...userForm, name: t })} icon={FileText} />
                            <Input
                                label={editingUser ? "Yeni Şifre (Boş bırakılabilir)" : "Şifre"}
                                value={userForm.password}
                                onChangeText={t => setUserForm({ ...userForm, password: t })}
                                icon={Key}
                                secureTextEntry
                            />
                            <View>
                                <Text className="text-slate-400 text-xs font-bold mb-2 uppercase">Rol</Text>
                                <View className="flex-row gap-4">
                                    {['user', 'admin'].map(r => (
                                        <TouchableOpacity
                                            key={r}
                                            onPress={() => setUserForm({ ...userForm, role: r })}
                                            className={`flex-1 p-3 rounded-lg border items-center ${userForm.role === r ? 'bg-blue-600 border-blue-500' : 'bg-slate-900 border-slate-800'}`}
                                        >
                                            <Text className={`font-bold uppercase ${userForm.role === r ? 'text-white' : 'text-slate-400'}`}>{r}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleUserSubmit}
                                disabled={saving}
                                className="bg-blue-600 p-4 rounded-xl items-center mt-6"
                            >
                                {saving ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Kaydet</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </Modal>

            </SafeAreaView>
        </View>
    );
}

// Components
interface InputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    icon?: any;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    multiline?: boolean;
    numberOfLines?: number;
}

const Input = ({ label, value, onChangeText, icon: Icon, secureTextEntry, keyboardType, multiline, numberOfLines }: InputProps) => (
    <View>
        <Text className="text-slate-400 text-xs font-bold mb-2 uppercase">{label}</Text>
        <View className={`bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex-row items-start ${multiline ? 'h-24' : ''}`}>
            {Icon && <Icon size={20} color="#64748b" style={{ marginTop: multiline ? 4 : 2 }} />}
            <TextInput
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={numberOfLines}
                style={{ flex: 1, color: 'white', marginLeft: 10, fontSize: 16, textAlignVertical: multiline ? 'top' : 'center' }}
                placeholderTextColor="#475569"
            />
        </View>
    </View>
);

interface SaveButtonProps {
    onPress: () => void;
    saving: boolean;
}

const SaveButton = ({ onPress, saving }: SaveButtonProps) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={saving}
        className="bg-blue-600 p-4 rounded-xl flex-row items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-900/40"
    >
        {saving ? <ActivityIndicator color="white" /> : <Save size={20} color="white" />}
        <Text className="text-white font-bold text-lg">Değişiklikleri Kaydet</Text>
    </TouchableOpacity>
);
