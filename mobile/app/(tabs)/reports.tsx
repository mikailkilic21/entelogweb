import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart3, TrendingUp, PieChart, ArrowUpRight, ChevronLeft, Wallet, Users, FileText, Layers, Activity, Share2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SalesTrendChart } from '../../components/DashboardCharts';
import { SalesData } from '../../types/charts';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/constants/Config';


// Categories
const CATEGORIES = [
    { id: 'sales', title: 'Satış', icon: TrendingUp, color: '#3b82f6', bg: 'bg-blue-500/10' },
    { id: 'finance', title: 'Finans', icon: Wallet, color: '#10b981', bg: 'bg-emerald-500/10' },
    { id: 'stock', title: 'Stok', icon: Layers, color: '#f59e0b', bg: 'bg-amber-500/10' },
    { id: 'hr', title: 'Personel', icon: Users, color: '#8b5cf6', bg: 'bg-violet-500/10' },
    { id: 'analysis', title: 'Analiz', icon: PieChart, color: '#ec4899', bg: 'bg-pink-500/10' },
    { id: 'logs', title: 'Loglar', icon: FileText, color: '#64748b', bg: 'bg-slate-500/10' },
];

// Reports Definition
const REPORTS_BY_CATEGORY = {
    sales: [
        { id: 'daily_sales', title: 'Günlük Satış Özeti', date: 'Bugün', size: 'PDF', priority: 'high', endpoint: 'daily_sales', chart: 'daily' },
        { id: 'top_customers', title: 'En Çok Alan Müşteriler', date: 'Genel', size: 'PDF', priority: 'medium', endpoint: 'top_customers', chart: null },
    ],
    finance: [
        { id: 'monthly_revenue', title: 'Aylık Ciro Analizi', date: 'Bu Ay', size: 'PDF', priority: 'high', endpoint: 'monthly_revenue', chart: 'monthly' },
        { id: 'account_balances', title: 'Cari Bakiye Listesi', date: 'Anlık', size: 'PDF', priority: 'high', endpoint: 'account_balances', chart: null },
        { id: 'received_checks', title: 'Müşteri Çekleri (Portföy)', date: 'Anlık', size: 'PDF', priority: 'medium', endpoint: 'received_checks', chart: null },
        { id: 'issued_checks', title: 'Kendi Çeklerimiz', date: 'Anlık', size: 'PDF', priority: 'medium', endpoint: 'issued_checks', chart: null },
        { id: 'dbs_schedule', title: 'DBS Ödeme Takvimi', date: 'Gelecek', size: 'PDF', priority: 'high', endpoint: 'dbs_schedule', chart: null },
    ],
    stock: [
        { id: 'low_stock', title: 'Kritik Stok Listesi', date: 'Anlık', size: 'PDF', priority: 'high', endpoint: 'low_stock', chart: null },
        { id: 'stock_value', title: 'Stok Değer Raporu', date: 'Anlık', size: 'PDF', priority: 'medium', endpoint: 'stock_value', chart: null },
    ],
    hr: [],
    analysis: [],
    logs: []
};

export default function ReportsScreen() {
    const { isDemo } = useAuth();
    const [selectedCategory, setSelectedCategory] = useState('sales');
    const [viewingReport, setViewingReport] = useState<any | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [chartData, setChartData] = useState<SalesData[]>([]);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Fetch Company Settings for PDF Header
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = await SecureStore.getItemAsync('token');
                const res = await fetch(`${API_URL}/settings/company`, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCompanyInfo(data);
                }
            } catch (err) {
                console.error('Settings fetch error:', err);
            }
        };
        fetchSettings();
    }, []);

    // Fetch Report Data
    const fetchReport = useCallback(async (report: any) => {
        setLoading(true);
        setViewingReport(report); // Set view immediately to show loading state inside
        setReportData(null);
        setChartData([]);

        try {
            const token = await SecureStore.getItemAsync('token');
            const headers = {
                'Authorization': token ? `Bearer ${token}` : '',
                'x-demo-mode': isDemo ? 'true' : 'false'
            };

            // 1. Fetch List Data
            const listUrl = `${API_URL}/reports/${report.endpoint}`;
            const listRes = await fetch(listUrl, { headers });
            if (listRes.ok) {
                const data = await listRes.json();
                setReportData(data);
            }

            // 2. Fetch Chart Data (if applicable)
            if (report.chart) {
                const chartUrl = `${API_URL}/stats/trend?period=${report.chart}`;
                const chartRes = await fetch(chartUrl, { headers });
                if (chartRes.ok) {
                    const data = await chartRes.json();
                    setChartData(data);
                }
            }

        } catch (error) {
            console.error('Report fetch error:', error);
            Alert.alert('Hata', 'Rapor verileri alınamadı.');
        } finally {
            setLoading(false);
        }
    }, [isDemo]);

    // Handle PDF Generation & Sharing
    const generatePDF = async () => {
        if (!reportData) return;

        try {
            const companyName = companyInfo?.companyName || 'ENTELOG BİLİŞİM A.Ş.';
            const companyAddress = companyInfo?.address || 'İstanbul, Türkiye';
            const companyPhone = companyInfo?.phone || '+90 (212) 000 00 00';
            const companyTax = companyInfo?.taxNumber || '';
            const logoUri = companyInfo?.logo ? `${API_URL}${companyInfo.logo}` : null;

            const html = `
                <html>
                <head>
                    <style>
                        body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                        .header-bant { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
                        .company-box { flex: 1; }
                        .company-name { font-size: 20px; font-weight: 800; color: #1e3a8a; margin: 0; }
                        .company-detail { font-size: 10px; color: #666; margin: 2px 0; }
                        .report-box { text-align: right; }
                        .report-title { font-size: 18px; font-weight: 700; color: #3b82f6; margin: 0; }
                        .report-date { font-size: 10px; color: #999; margin-top: 5px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                        th, td { border: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; font-size: 11px; }
                        th { background-color: #f8fafc; color: #475569; font-weight: 700; text-transform: uppercase; }
                        tr:nth-child(even) { background-color: #f1f5f9; }
                        .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; font-size: 9px; color: #aaa; text-align: center; font-style: italic; }
                        .logo { width: 120px; height: auto; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header-bant">
                        <div class="company-box">
                            ${logoUri ? `<img src="${logoUri}" class="logo" />` : ''}
                            <h1 class="company-name">${companyName}</h1>
                            <p class="company-detail">${companyAddress}</p>
                            <p class="company-detail">${companyPhone}</p>
                            ${companyTax ? `<p class="company-detail">Vergi No: ${companyTax}</p>` : ''}
                        </div>
                        <div class="report-box">
                            <h2 class="report-title">${viewingReport.title}</h2>
                            <p class="report-date">Oluşturulma: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>
                    
                    <table>
                        <thead>
                            <tr>${reportData.headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${reportData.data.map((row: any) => `
                                <tr>${reportData.columns.map((col: string) => `<td>${row[col] || '-'}</td>`).join('')}</tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        Bu rapor Entelog Mobile İş Zekası modülü tarafından oluşturulmuştur.
                    </div>
                </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri);

        } catch (error) {
            console.error('PDF Error:', error);
            Alert.alert('Hata', 'PDF oluşturulurken bir problem oluştu.');
        }
    };


    const renderDetailView = () => {
        if (!viewingReport) return null;

        return (
            <View className="flex-1 bg-slate-950">
                <SafeAreaView className="flex-1">
                    {/* Header */}
                    <View className="flex-row items-center px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                        <TouchableOpacity onPress={() => setViewingReport(null)} className="p-2 -ml-2 mr-2 bg-slate-800 rounded-lg">
                            <ChevronLeft size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text className="text-lg font-bold text-white flex-1" numberOfLines={1}>{viewingReport.title}</Text>

                        <TouchableOpacity
                            onPress={generatePDF}
                            disabled={!reportData || loading}
                            className={`p-2 bg-slate-800 rounded-lg border border-slate-700 ml-2 ${(!reportData || loading) ? 'opacity-50' : ''}`}
                        >
                            <Share2 size={20} color="#3b82f6" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {loading && chartData.length === 0 && !reportData ? (
                            <ActivityIndicator size="large" color="#3b82f6" className="mt-10" />
                        ) : (
                            <>
                                {/* Optional Chart */}
                                {viewingReport.chart && chartData.length > 0 && (
                                    <SalesTrendChart
                                        data={chartData}
                                        period={viewingReport.chart}
                                        isLoading={false}
                                    />
                                )}

                                {/* AI Summary Placeholder */}
                                <View className="bg-slate-900/50 p-5 rounded-2xl border border-slate-800 mt-6 shadow-lg shadow-black/20">
                                    <View className="flex-row items-center mb-3">
                                        <Activity size={20} color="#10b981" className="mr-2" />
                                        <Text className="text-white font-bold text-lg">Rapor Özeti</Text>
                                    </View>
                                    <Text className="text-slate-400 text-sm leading-6 font-medium">
                                        Rapor verileri başarıyla yüklendi. Tablodan detayları inceleyebilir veya PDF olarak paylaşabilirsiniz.
                                    </Text>
                                </View>

                                {/* Data Table */}
                                {reportData && reportData.data && (
                                    <View className="mt-6">
                                        <Text className="text-white font-bold text-lg mb-4">Detaylı Liste</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                                            <View>
                                                {/* Table Header */}
                                                <View className="flex-row bg-slate-800 py-3 px-2 rounded-t-xl">
                                                    {reportData.headers.map((h: string, i: number) => (
                                                        <Text key={i} className="text-slate-300 font-bold w-32 px-2 text-xs uppercase">{h}</Text>
                                                    ))}
                                                </View>
                                                {/* Table Body */}
                                                {reportData.data.map((row: any, i: number) => (
                                                    <View key={i} className={`flex-row py-3 px-2 border-b border-slate-800 ${i % 2 === 0 ? 'bg-slate-900/50' : 'bg-transparent'}`}>
                                                        {reportData.columns.map((col: string, j: number) => (
                                                            <Text key={j} className="text-white w-32 px-2 text-xs" numberOfLines={1}>
                                                                {row[col]}
                                                            </Text>
                                                        ))}
                                                    </View>
                                                ))}
                                            </View>
                                        </ScrollView>
                                        <Text className="text-slate-500 text-[10px] mt-2 text-right">Toplam {reportData.data.length} kayıt listelendi.</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </View>
        );
    };

    if (viewingReport) {
        return renderDetailView();
    }

    const currentReports = REPORTS_BY_CATEGORY[selectedCategory as keyof typeof REPORTS_BY_CATEGORY] || [];

    return (
        <View className="flex-1 bg-slate-950">
            <LinearGradient
                colors={['#0f172a', '#020617']}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 pt-2 pb-6 flex-row items-center justify-between z-10">
                    <View className="flex-row items-center gap-3">
                        <View className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-lg shadow-black/50">
                            <BarChart3 size={32} color="#60a5fa" />
                        </View>
                        <View>
                            <Text className="text-2xl font-black text-white tracking-tight">Raporlar</Text>
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                İş Zekası (Canlı)
                            </Text>
                        </View>
                    </View>
                </View>

                <ScrollView className="flex-1">
                    {/* Category Grid */}
                    <View className="px-6 mb-8">
                        <Text className="text-slate-400 text-xs font-bold uppercase mb-4 ml-1">Kategoriler</Text>
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {CATEGORIES.map((cat) => {
                                const isActive = selectedCategory === cat.id;
                                return (
                                    <TouchableOpacity
                                        key={cat.id}
                                        onPress={() => setSelectedCategory(cat.id)}
                                        activeOpacity={0.8}
                                        className={`w-[31%] aspect-[0.9] rounded-2xl p-3 justify-between items-center border transition-all ${isActive
                                            ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/30'
                                            : 'bg-slate-900 border-slate-800'
                                            }`}
                                    >
                                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isActive ? 'bg-white/20' : cat.bg} mb-1`}>
                                            <cat.icon size={20} color={isActive ? '#fff' : cat.color} />
                                        </View>
                                        <Text className={`font-bold text-xs text-center ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                            {cat.title}
                                        </Text>
                                        {isActive && (
                                            <View className="w-1.5 h-1.5 rounded-full bg-white mt-1" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Report List */}
                    <View className="px-6 pb-20">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-slate-400 text-xs font-bold uppercase ml-1">
                                {CATEGORIES.find(c => c.id === selectedCategory)?.title} Raporları
                            </Text>
                            <View className="bg-slate-800 px-2 py-1 rounded text-slate-400 text-[10px] border border-slate-700">
                                <Text className="text-slate-400 text-[10px] font-bold">
                                    {currentReports.length} Rapor
                                </Text>
                            </View>
                        </View>

                        {currentReports.length === 0 ? (
                            <View className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 items-center justify-center">
                                <Text className="text-slate-500 font-medium">Bu kategoride rapor bulunamadı.</Text>
                            </View>
                        ) : (
                            <View className="gap-3">
                                {currentReports.map((report) => (
                                    <TouchableOpacity
                                        key={report.id}
                                        onPress={() => fetchReport(report)}
                                        className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex-row items-center active:bg-slate-800 shadow-sm"
                                    >
                                        {/* Status Line */}
                                        <View className={`w-1 h-10 rounded-full mr-4 ${report.priority === 'high' ? 'bg-pink-500' : report.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-600'}`} />

                                        <View className="flex-1">
                                            <Text className="font-bold text-white text-base mb-1">{report.title}</Text>
                                            <View className="flex-row items-center gap-2">
                                                <View className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
                                                    <Text className="text-slate-400 text-[10px]">{report.date}</Text>
                                                </View>
                                                <Text className="text-slate-600 text-[10px] font-medium">•</Text>
                                                <Text className="text-slate-500 text-[10px] font-medium">{report.size}</Text>
                                            </View>
                                        </View>

                                        <View className="pl-2">
                                            <View className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/50">
                                                <ArrowUpRight size={18} color="#64748b" />
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
