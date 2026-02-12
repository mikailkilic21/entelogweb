import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building, User, Phone, Mail, FileText } from 'lucide-react-native';
import * as Linking from 'expo-linking';
// import { useAuth } from '../../context/AuthContext';

import { API_URL } from '@/constants/Config';


export default function LicenseApplicationScreen() {
    const router = useRouter();
    // const { } = useAuth();

    const [companyName, setCompanyName] = useState('');
    const [officialName, setOfficialName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [taxNo, setTaxNo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!companyName || !phone || !officialName) {
            Alert.alert('Uyarı', 'Lütfen Firma Adı, Yetkili Adı ve Telefon alanlarını doldurunuz.');
            return;
        }

        setLoading(true);

        try {
            // 1. Submit to Server
            const response = await fetch(`${API_URL}/license/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    officialName,
                    phone,
                    email,
                    taxNo
                })
            });

            const data = await response.json();

            if (data.success) {
                // 2. Open WhatsApp
                const whatsappNumber = '905533912286';
                const message = `Merhaba, Entelog lisans başvurusu yapmak istiyorum.\n\nFirma: ${companyName}\nYetkili: ${officialName}\nTelefon: ${phone}\nVergi No: ${taxNo}\nEmail: ${email}`;

                const url = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;

                const supported = await Linking.canOpenURL(url);
                if (supported) {
                    await Linking.openURL(url);
                } else {
                    // Fallback for web or if whatsapp not installed (try web api)
                    const webUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
                    await Linking.openURL(webUrl);
                }

                Alert.alert('Başarılı', 'Başvurunuz alındı ve WhatsApp yönlendirmesi yapıldı.', [
                    { text: 'Tamam', onPress: () => router.back() }
                ]);

            } else {
                Alert.alert('Hata', data.message || 'Başvuru gönderilemedi.');
            }

        } catch (error) {
            console.error(error);
            Alert.alert('Hata', 'Sunucu ile iletişim kurulamadı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            {/* Header */}
            <View className="px-6 pt-2 pb-4 flex-row items-center border-b border-slate-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 -ml-2">
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text className="text-white text-xl font-bold">Lisans Başvurusu</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                <Text className="text-slate-400 mb-6 leading-6">
                    Demo süreniz bittiğinde veya tam sürüme geçmek istediğinizde aşağıdaki formu doldurarak lisans talebinde bulunabilirsiniz.
                </Text>

                <View className="space-y-4 mb-10">
                    <InputField icon={<Building size={20} color="#94a3b8" />} placeholder="Firma Ünvanı" value={companyName} onChangeText={setCompanyName} />
                    <InputField icon={<User size={20} color="#94a3b8" />} placeholder="Yetkili Adı Soyadı" value={officialName} onChangeText={setOfficialName} />
                    <InputField icon={<Phone size={20} color="#94a3b8" />} placeholder="Telefon (5XX...)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                    <InputField icon={<Mail size={20} color="#94a3b8" />} placeholder="E-Posta Adresi" value={email} onChangeText={setEmail} keyboardType="email-address" />
                    <InputField icon={<FileText size={20} color="#94a3b8" />} placeholder="Vergi No / T.C." value={taxNo} onChangeText={setTaxNo} keyboardType="numeric" />
                </View>

                <TouchableOpacity
                    className="bg-green-600 p-4 rounded-xl items-center flex-row justify-center space-x-2 active:bg-green-700"
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg mr-2">WhatsApp ile Başvur</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View className="h-20" />
            </ScrollView>
        </SafeAreaView>
    );
}

const InputField = ({ icon, placeholder, value, onChangeText, keyboardType = 'default' }: any) => (
    <View className="bg-slate-900 rounded-xl p-4 flex-row items-center border border-slate-800">
        {icon}
        <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder={placeholder}
            placeholderTextColor="#64748b"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
        />
    </View>
);
