import React from 'react';
import { View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const SalesTrendChart = ({ data, period }: { data: any[], period: string }) => {
    // Determine label format based on period
    const getLabel = (dateStr: string) => {
        if (!dateStr) return '';
        // Backend now returns pre-formatted labels for daily (00:00), weekly (Mon), monthly (Hafta 1)
        // Only Yearly might need parsing if it returns yyyy-MM
        if (period === 'yearly' && dateStr.includes('-')) {
            const parts = dateStr.split('-');
            return parts.length > 1 ? parts[1] : dateStr;
        }
        return dateStr;
    };

    // Transform data for chart
    const lineData = (data || []).map(item => ({
        value: item.sales || 0,
        label: getLabel(item.date),
        dataPointText: (item.sales / 1000).toFixed(1) + 'k',
    }));

    const lineData2 = (data || []).map(item => ({
        value: item.purchase || 0,
        dataPointText: (item.purchase / 1000).toFixed(1) + 'k',
    }));

    if (!data || data.length === 0) {
        return (
            <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
                <Text className="text-slate-500 text-center py-10">Veri yok</Text>
            </View>
        );
    }

    return (
        <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
            <View className="flex-row justify-between items-center mb-4 ml-2">
                <Text className="text-white font-bold text-lg">Finansal Trend (Satış vs Alış)</Text>
            </View>

            <LineChart
                data={lineData}
                data2={lineData2}
                height={220}
                width={width - 80}
                spacing={(data || []).length > 20 ? 20 : 45} // Adjust spacing for daily (24 items) vs weekly (7)
                initialSpacing={20}
                color1="#3b82f6"
                color2="#ef4444"
                textColor1="white"
                textColor2="white"
                dataPointsHeight={6}
                dataPointsWidth={6}
                dataPointsColor1="#60a5fa"
                dataPointsColor2="#f87171"
                textShiftY={-2}
                textShiftX={-5}
                textFontSize={10}
                yAxisTextStyle={{ color: 'gray', fontSize: 10 }}
                xAxisLabelTextStyle={{ color: 'gray', fontSize: 10 }}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#334155"
                rulesColor="#1e293b"
                rulesType="solid"
                curved
                isAnimated={false}
                pointerConfig={{
                    pointerStripHeight: 160,
                    pointerStripColor: 'lightgray',
                    pointerStripWidth: 2,
                    pointerColor: 'lightgray',
                    radius: 6,
                    pointerLabelWidth: 100,
                    pointerLabelHeight: 90,
                    activatePointersOnLongPress: true,
                    autoAdjustPointerLabelPosition: false,
                    pointerLabelComponent: (items: any) => {
                        return (
                            <View
                                style={{
                                    height: 90,
                                    width: 100,
                                    justifyContent: 'center',
                                    marginTop: -30,
                                    marginLeft: -40,
                                }}>
                                <Text style={{ color: 'white', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                                    {items[0].label}
                                </Text>
                                <View style={{ padding: 6, borderRadius: 4, backgroundColor: '#333' }}>
                                    <Text style={{ fontSize: 12, color: 'lightgray' }}>Satış: {items[0].value?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</Text>
                                    <Text style={{ fontSize: 12, color: 'lightgray' }}>Alış: {items[1]?.value?.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</Text>
                                </View>
                            </View>
                        );
                    },
                }}
            />
            <View className="flex-row justify-center gap-6 mt-4">
                <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                    <Text className="text-slate-400 text-xs">Satışlar</Text>
                </View>
                <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <Text className="text-slate-400 text-xs">Alışlar</Text>
                </View>
            </View>
        </View>
    );
};

export const TopProductsChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;

    const barData = data.map((item, index) => ({
        value: item.value,
        frontColor: index === 0 ? '#fbbf24' : '#10b981',
        gradientColor: index === 0 ? '#d97706' : '#059669',
        label: (item.name || '').length > 15 ? (item.name || '').substring(0, 15) + '...' : (item.name || 'Bilinmiyor'),
        topLabelComponent: () => (
            <Text style={{ color: '#94a3b8', fontSize: 10, marginBottom: 4 }}>
                {(item.value / 1000).toFixed(0)}k
            </Text>
        ),
    }));

    return (
        <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
            <Text className="text-white font-bold text-lg mb-4 ml-2">En Çok Satılan Ürünler</Text>
            <BarChart
                data={barData}
                barWidth={35}
                spacing={20}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: 'gray' }}
                xAxisLabelTextStyle={{ color: 'gray', fontSize: 9, width: 60, textAlign: 'center' }}
                noOfSections={3}
                maxValue={Math.max(...data.map(d => d.value)) * 1.2}
                isAnimated={false}
                showGradient
                height={180}
            />
        </View>
    );
};

export const TopCustomersChart = ({ data, type, onTypeChange }: { data: any[], type: 'sales' | 'purchases', onTypeChange: (t: 'sales' | 'purchases') => void }) => {
    if (!data || data.length === 0) return null;
    // Pie Chart Data
    const pieData = (data || []).map((item, index) => ({
        value: item.value,
        color: ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4'][index % 5],
        text: '', // No text on slice to keep clean
    }));

    return (
        <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-white font-bold text-lg ml-2">En İyiler</Text>

                <View className="flex-row bg-slate-800/50 rounded-lg p-0.5">
                    <TouchableOpacity
                        onPress={() => onTypeChange('sales')}
                        className={`px-3 py-1.5 rounded-md ${type === 'sales' ? 'bg-purple-600' : 'bg-transparent'}`}
                    >
                        <Text className={`text-[10px] font-bold ${type === 'sales' ? 'text-white' : 'text-slate-400'}`}>Satış</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => onTypeChange('purchases')}
                        className={`px-3 py-1.5 rounded-md ${type === 'purchases' ? 'bg-blue-600' : 'bg-transparent'}`}
                    >
                        <Text className={`text-[10px] font-bold ${type === 'purchases' ? 'text-white' : 'text-slate-400'}`}>Alış</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="flex-row items-center justify-center">
                {/* Pie Chart */}
                <View>
                    <PieChart
                        data={pieData}
                        donut
                        showGradient
                        sectionAutoFocus
                        radius={70}
                        innerRadius={45}
                        innerCircleColor={'#1e293b'}
                        centerLabelComponent={() => {
                            const total = data.reduce((acc, curr) => acc + curr.value, 0);
                            return (
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 18, color: 'white', fontWeight: 'bold' }}>
                                        {(total / 1000).toFixed(1)}k
                                    </Text>
                                    <Text style={{ fontSize: 10, color: 'lightgray' }}>Toplam</Text>
                                </View>
                            );
                        }}
                    />
                </View>

                {/* Legend */}
                <View className="ml-6 flex-1">
                    {data.map((item, index) => (
                        <View key={index} className="flex-row items-center mb-2">
                            <View
                                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pieData[index]?.color, marginRight: 8 }}
                            />
                            <View className="flex-1">
                                <Text className="text-slate-300 text-[10px]" numberOfLines={1}>{item.name}</Text>
                            </View>
                            <Text className="text-white text-[10px] font-bold">
                                {(item.value / 1000).toFixed(0)}k
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};
