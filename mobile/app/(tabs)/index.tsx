import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/Config';
import { SalesTrendChart, TopProductsChart, TopCustomersChart } from '@/components/DashboardCharts';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Search, TrendingUp, TrendingDown, Package, Users, AlertCircle, LayoutDashboard, Receipt, RefreshCcw } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function DashboardScreen() {
  const { isDemo, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [customerType, setCustomerType] = useState<'sales' | 'purchases'>('sales');

  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  const fetchData = async () => {
    setError(null);
    try {
      const headers = { 'x-demo-mode': isDemo ? 'true' : 'false' };
      // Parallel Fetching for Perforamnce
      const [statsRes, trendRes, productsRes, customersRes] = await Promise.all([
        fetch(`${API_URL}/stats?period=${period}`, { headers }),
        fetch(`${API_URL}/stats/trend?period=${period}`, { headers }),
        fetch(`${API_URL}/stats/top-products?period=${period}`, { headers }),
        fetch(`${API_URL}/stats/top-${customerType === 'sales' ? 'customers' : 'suppliers'}?period=${period}`, { headers })
      ]);

      if (!statsRes.ok) throw new Error('Sunucu yanıt vermedi: ' + statsRes.status);

      const statsData = await statsRes.json();
      const trendData = await trendRes.json();
      const productsData = await productsRes.json();
      const customersData = await customersRes.json();

      setStats(statsData);
      // Ensure trendData is array, if error object comes it might crash charts
      setTrendData(Array.isArray(trendData) ? trendData : []);
      setTopProducts(Array.isArray(productsData) ? productsData : []);
      setTopCustomers(Array.isArray(customersData) ? customersData : []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, customerType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount || 0);
  };

  if (loading && !stats) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text className="text-slate-500 mt-4 font-medium">Veriler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e1b4b']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Fixed Header */}
        <View className="px-6 pt-2 pb-4 bg-transparent z-10">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image
                source={require('../../assets/images/siyahlogo.png')}
                style={{ width: 45, height: 45, borderRadius: 10 }}
                resizeMode="contain"
              />
              <View>
                <Text className="text-2xl font-bold text-white tracking-tight">
                  Entelog Mobile
                </Text>
                <Text className="text-slate-400 text-[10px] font-medium tracking-wide uppercase">Premium Dashboard</Text>
              </View>
            </View>
            <View className="bg-slate-800/50 p-2.5 rounded-full border border-slate-700/50">
              <LayoutDashboard size={24} color="#60a5fa" />
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingBottom: 20, // Reduced from 100 to sit closer to bottom bar as requested
            paddingTop: 10
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >

          {/* Period Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 mb-6 max-h-12">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                className={`px-5 py-2.5 rounded-full mr-3 border ${period === p
                  ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800/60 border-slate-700/50'
                  }`}
              >
                <Text className={`${period === p ? 'text-white font-bold' : 'text-slate-400 font-medium'} capitalize text-xs`}>
                  {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Error State */}
          {error && (
            <View className="mx-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 flex-row items-center gap-3">
              <AlertCircle size={24} color="#ef4444" />
              <View className="flex-1">
                <Text className="text-red-400 font-bold mb-0.5">Bağlantı Hatası</Text>
                <Text className="text-red-400/80 text-xs">{error}</Text>
                <Text className="text-red-400/60 text-[10px] mt-1">IP: {API_URL}</Text>
              </View>
            </View>
          )}

          {/* Main Stats Cards */}
          <View className="px-6 mb-8">
            <View className="flex-row gap-4 mb-4">
              {/* Sales Card */}
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 rounded-3xl p-5 shadow-lg shadow-emerald-500/20 border-t border-white/10"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                    <TrendingUp size={20} color="white" />
                  </View>
                  <View className="bg-black/20 px-2 py-1 rounded-md">
                    <Text className="text-white/90 text-[10px] font-bold">
                      +{stats?.salesCount || 0}
                    </Text>
                  </View>
                </View>
                <Text className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Toplam Satış</Text>
                <Text className="text-xl font-black text-white tracking-tight" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(stats?.totalSales)}
                </Text>
              </LinearGradient>

              {/* Purchases Card */}
              <LinearGradient
                colors={['#be123c', '#9f1239']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 rounded-3xl p-5 shadow-lg shadow-rose-900/20 border-t border-white/10"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                    <TrendingDown size={20} color="white" />
                  </View>
                  <View className="bg-black/20 px-2 py-1 rounded-md">
                    <Text className="text-white/90 text-[10px] font-bold">
                      -{stats?.purchaseCount || 0}
                    </Text>
                  </View>
                </View>
                <Text className="text-rose-100 text-xs font-bold uppercase tracking-wider mb-1">Toplam Alış</Text>
                <Text className="text-xl font-black text-white tracking-tight" numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(stats?.totalPurchases)}
                </Text>
              </LinearGradient>
            </View>

            {/* Secondary Stats Row */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50 backdrop-blur-xl">
                <Receipt size={24} color="#94a3b8" className="mb-4" />
                <Text className="text-slate-400 text-xs font-medium uppercase mb-1">KDV Toplam</Text>
                <Text className="text-lg font-bold text-slate-200" numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(stats?.totalVat)}</Text>
              </View>

              <View className="flex-1 bg-slate-800/40 p-5 rounded-3xl border border-slate-700/50 backdrop-blur-xl">
                <RefreshCcw size={24} color={stats?.totalSales - stats?.totalPurchases >= 0 ? '#10b981' : '#ef4444'} className="mb-4" />
                <Text className="text-slate-400 text-xs font-medium uppercase mb-1">Net Durum</Text>
                <Text className={`text-lg font-bold ${stats?.totalSales - stats?.totalPurchases >= 0 ? 'text-emerald-400' : 'text-red-400'}`} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency((stats?.totalSales || 0) - (stats?.totalPurchases || 0))}
                </Text>
              </View>
            </View>
          </View>

          {/* Charts Section */}
          <View className="px-6 space-y-2">
            <SalesTrendChart
              data={trendData}
              period={period}
              onPeriodChange={setPeriod}
            />
            <TopProductsChart data={topProducts} />
            <TopCustomersChart
              data={topCustomers}
              type={customerType}
              onTypeChange={setCustomerType}
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
