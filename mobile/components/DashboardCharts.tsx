import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const SalesTrendChart = ({ data, period }: { data: any[], period: string }) => {
    if (!data || data.length === 0) return null;

    // Transform data for chart
    const lineData = data.map(item => ({
        value: item.sales || 0,
        label: period === 'monthly' ? item.date.split('-')[1] : item.date.split('-')[2], // Show month or day
        dataPointText: (item.sales / 1000).toFixed(1) + 'k',
    }));

    // Purchases data for second line
    const lineData2 = data.map(item => ({
        value: item.purchase || 0,
        dataPointText: (item.purchase / 1000).toFixed(1) + 'k',
    }));

    return (
        <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
            <Text className="text-white font-bold text-lg mb-4 ml-2">Satış & Alış Trendi</Text>
            <LineChart
                data={lineData}
                data2={lineData2}
                height={220}
                width={width - 80}
                spacing={45}
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
                isAnimated={false} // Disabled to prevent crash on data change
                // animateOnDataChange={false} 
                // animationDuration={1000}
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
                                    {items[0].date}
                                </Text>
                                <View style={{ padding: 6, borderRadius: 4, backgroundColor: '#333' }}>
                                    <Text style={{ fontSize: 12, color: 'lightgray' }}>Satış: {items[0].value}</Text>
                                    <Text style={{ fontSize: 12, color: 'lightgray' }}>Alış: {items[1]?.value}</Text>
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

    // Transform for Bar Chart
    const barData = data.map((item, index) => ({
        value: item.value,
        frontColor: index === 0 ? '#fbbf24' : '#10b981', // Gold for #1
        gradientColor: index === 0 ? '#d97706' : '#059669',
        label: item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name,
        topLabelComponent: () => (
            <Text style={{ color: '#94a3b8', fontSize: 10, marginBottom: 4 }}>
                {(item.value / 1000).toFixed(0)}k
            </Text>
        ),
    }));

    return (
        <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
            <Text className="text-white font-bold text-lg mb-4 ml-2">Top 5 Ürün</Text>
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
                xAxisLabelTextStyle={{ color: 'gray', fontSize: 10 }}
                noOfSections={3}
                maxValue={Math.max(...data.map(d => d.value)) * 1.2}
                isAnimated={false}
                showGradient
                height={180}
            />
        </View>
    );
};

export const TopCustomersChart = ({ data }: { data: any[] }) => {
    if (!data || data.length === 0) return null;

    const barData = data.map((item, index) => ({
        value: item.value,
        frontColor: '#8b5cf6',
        gradientColor: '#6d28d9',
        label: item.name.length > 8 ? item.name.substring(0, 6) + '..' : item.name,
    }));

    return (
        <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
            <Text className="text-white font-bold text-lg mb-4 ml-2">En İyi Müşteriler</Text>
            <BarChart
                data={barData}
                barWidth={30}
                spacing={30}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: 'gray' }}
                xAxisLabelTextStyle={{ color: 'gray', fontSize: 10 }}
                noOfSections={3}
                isAnimated={false}
                showGradient
                height={180}
                horizontal
                rtl
            />
        </View>
    );
};
