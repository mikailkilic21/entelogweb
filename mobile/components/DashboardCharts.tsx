import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// Types
import type {
    SalesTrendChartProps,
    TopProductsChartProps,
    TopCustomersChartProps,
    LineDataPoint,
    BarDataPoint,
    PieDataPoint,
} from '../types/charts';

// Constants
import { CHART_COLORS, CHART_DIMENSIONS, CHART_ANIMATION, CHART_TYPOGRAPHY } from '../constants/chartTheme';

// Utils
import {
    validateSalesData,
    validateProductData,
    validateCustomerData,
    formatDateLabel,
    formatCurrency,
    truncateText,
    calculateSpacing,
    getPeriodDescription,
} from '../utils/chartHelpers';

// Components
import { ChartSkeleton } from './Skeleton';

/**
 * Sales Trend Chart Component
 * Displays sales vs purchases trend over time with interactive tooltips
 */
export const SalesTrendChart = React.memo<SalesTrendChartProps>(
    ({ data, period, isLoading = false }) => {
        const { width: screenWidth } = useWindowDimensions();
        const chartRef = useRef<ViewShot>(null);

        // Responsive dimensions
        const isTablet = screenWidth >= 768;
        const chartWidth = screenWidth - (isTablet ? CHART_DIMENSIONS.tablet.padding : CHART_DIMENSIONS.mobile.padding);
        const chartHeight = isTablet ? CHART_DIMENSIONS.tablet.height : CHART_DIMENSIONS.mobile.height;

        // Validate and transform data
        const chartData = useMemo(() => {
            const validData = validateSalesData(data);

            // CRITICAL: Both lineData and lineData2 MUST have identical structure
            // including all fields (value, label, dataPointText) to prevent
            // "All elements of output range should have the same number of components" error
            const lineData: LineDataPoint[] = validData.map((item) => ({
                value: item.sales || 0,
                label: formatDateLabel(item.date, period),
                dataPointText: formatCurrency(item.sales, true),
            }));

            const lineData2: LineDataPoint[] = validData.map((item) => ({
                value: item.purchase || 0,
                label: formatDateLabel(item.date, period), // MUST include label
                dataPointText: formatCurrency(item.purchase, true),
            }));

            return { lineData, lineData2, validData };
        }, [data, period]);

        // Export chart as image
        const handleExport = async () => {
            try {
                if (chartRef.current?.capture) {
                    const uri = await chartRef.current.capture();
                    if (await Sharing.isAvailableAsync()) {
                        await Sharing.shareAsync(uri, {
                            mimeType: 'image/png',
                            dialogTitle: 'Finansal Trend Grafiği',
                        });
                    }
                }
            } catch (error) {
                console.error('Chart export failed:', error);
            }
        };

        // Loading state
        if (isLoading) {
            return <ChartSkeleton type="line" />;
        }

        // Empty state
        if (chartData.validData.length === 0) {
            return (
                <View className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6">
                    <Text className="text-white font-bold text-lg mb-4 ml-2">Finansal Trend (Satış vs Alış)</Text>
                    <View className="items-center justify-center py-16">
                        <Text className="text-4xl mb-3">📊</Text>
                        <Text className="text-slate-400 text-base mb-1">Henüz veri yok</Text>
                        <Text className="text-slate-600 text-xs">
                            {getPeriodDescription(period)} için veri bekleniyor
                        </Text>
                    </View>
                </View>
            );
        }

        const total = chartData.validData.reduce((acc, curr) => acc + (curr.sales || 0), 0);

        return (
            <ViewShot ref={chartRef} options={{ format: 'png', quality: 1.0 }}>
                <View
                    className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6"
                    accessible={true}
                    accessibilityLabel={`Finansal trend grafiği. Toplam satış: ${formatCurrency(total)} TL`}
                    accessibilityRole="image"
                >
                    <View className="flex-row justify-between items-center mb-4 ml-2">
                        <Text className="text-white font-bold text-lg">Finansal Trend (Satış vs Alış)</Text>
                        <TouchableOpacity
                            onPress={handleExport}
                            className="bg-slate-800/50 px-3 py-1.5 rounded-lg"
                            accessibilityLabel="Grafiği paylaş"
                            accessibilityRole="button"
                        >
                            <Text className="text-blue-400 text-xs">📤 Paylaş</Text>
                        </TouchableOpacity>
                    </View>

                    <LineChart
                        data={chartData.lineData}
                        data2={chartData.lineData2}
                        height={chartHeight}
                        width={chartWidth}
                        spacing={calculateSpacing(chartData.validData.length, isTablet)}
                        initialSpacing={20}
                        color1={CHART_COLORS.sales.primary}
                        color2={CHART_COLORS.purchase.primary}
                        textColor1="white"
                        textColor2="white"
                        dataPointsHeight={6}
                        dataPointsWidth={6}
                        dataPointsColor1={CHART_COLORS.sales.light}
                        dataPointsColor2={CHART_COLORS.purchase.light}
                        textShiftY={-2}
                        textShiftX={-5}
                        textFontSize={CHART_TYPOGRAPHY.dataPoint.fontSize}
                        yAxisTextStyle={{ color: CHART_COLORS.text.secondary, fontSize: CHART_TYPOGRAPHY.label.fontSize }}
                        xAxisLabelTextStyle={{ color: CHART_COLORS.text.secondary, fontSize: CHART_TYPOGRAPHY.label.fontSize }}
                        noOfSections={4}
                        yAxisThickness={0}
                        xAxisThickness={1}
                        xAxisColor={CHART_COLORS.grid.axis}
                        rulesColor={CHART_COLORS.grid.line}
                        rulesType="solid"
                        curved
                        isAnimated={false}
                        animationDuration={0}
                        animateOnDataChange={false}
                        onDataChangeAnimationDuration={0}
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
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                                            {items[0].label}
                                        </Text>
                                        <View style={{ padding: 6, borderRadius: 4, backgroundColor: '#333' }}>
                                            <Text style={{ fontSize: 12, color: 'lightgray' }}>
                                                Satış: {formatCurrency(items[0].value || 0)}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: 'lightgray' }}>
                                                Alış: {formatCurrency(items[1]?.value || 0)}
                                            </Text>
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
            </ViewShot>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.period === nextProps.period &&
            prevProps.isLoading === nextProps.isLoading &&
            JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
        );
    }
);

SalesTrendChart.displayName = 'SalesTrendChart';

/**
 * Top Products Chart Component
 * Displays top selling products as a bar chart
 */
export const TopProductsChart = React.memo<TopProductsChartProps>(
    ({ data, isLoading = false }) => {
        const { width: screenWidth } = useWindowDimensions();
        const isTablet = screenWidth >= 768;

        const barData = useMemo(() => {
            const validData = validateProductData(data);

            return validData.map((item, index): BarDataPoint => ({
                value: item.value || 0,
                frontColor: index === 0 ? CHART_COLORS.products.gold : CHART_COLORS.products.green,
                gradientColor: index === 0 ? CHART_COLORS.products.goldDark : CHART_COLORS.products.greenDark,
                label: truncateText(item.name, 15),
                topLabelComponent: () => (
                    <Text style={{ color: CHART_COLORS.text.secondary, fontSize: CHART_TYPOGRAPHY.label.fontSize, marginBottom: 4 }}>
                        {formatCurrency(item.value, true)}
                    </Text>
                ),
            }));
        }, [data]);

        if (isLoading) {
            return <ChartSkeleton type="bar" />;
        }

        if (!data || data.length === 0) return null;

        const maxValue = Math.max(...data.map((d) => d.value || 0));

        return (
            <View
                className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6"
                accessible={true}
                accessibilityLabel="En çok satılan ürünler grafiği"
                accessibilityRole="image"
            >
                <Text className="text-white font-bold text-lg mb-4 ml-2">En Çok Satılan Ürünler</Text>
                <BarChart
                    data={barData}
                    barWidth={isTablet ? CHART_DIMENSIONS.tablet.barWidth : CHART_DIMENSIONS.mobile.barWidth}
                    spacing={20}
                    roundedTop
                    roundedBottom
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: CHART_COLORS.text.secondary }}
                    xAxisLabelTextStyle={{
                        color: CHART_COLORS.text.secondary,
                        fontSize: 9,
                        width: 60,
                        textAlign: 'center',
                    }}
                    noOfSections={3}
                    maxValue={maxValue * 1.2}
                    isAnimated={false}
                    showGradient
                    height={isTablet ? 200 : 180}
                />
            </View>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.isLoading === nextProps.isLoading &&
            JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
        );
    }
);

TopProductsChart.displayName = 'TopProductsChart';

/**
 * Top Customers Chart Component
 * Displays top customers as a pie chart with legend
 */
export const TopCustomersChart = React.memo<TopCustomersChartProps>(
    ({ data, type, onTypeChange, isLoading = false }) => {
        const { width: screenWidth } = useWindowDimensions();
        const isTablet = screenWidth >= 768;

        const pieData = useMemo(() => {
            const validData = validateCustomerData(data);

            return validData.map((item, index): PieDataPoint => ({
                value: item.value || 0,
                color: CHART_COLORS.customers[index % CHART_COLORS.customers.length],
                text: '',
            }));
        }, [data]);

        if (isLoading) {
            return <ChartSkeleton type="pie" />;
        }

        if (!data || !Array.isArray(data) || data.length === 0) return null;

        const validData = validateCustomerData(data);
        const total = validData.reduce((acc, curr) => acc + (curr.value || 0), 0);

        const radius = isTablet ? CHART_DIMENSIONS.tablet.pieRadius : CHART_DIMENSIONS.mobile.pieRadius;
        const innerRadius = isTablet ? CHART_DIMENSIONS.tablet.pieInnerRadius : CHART_DIMENSIONS.mobile.pieInnerRadius;

        return (
            <View
                className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 mb-6"
                accessible={true}
                accessibilityLabel={`En iyi müşteriler grafiği. ${type === 'sales' ? 'Satış' : 'Alış'} bazlı. Toplam: ${formatCurrency(total)} TL`}
                accessibilityRole="image"
            >
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white font-bold text-lg ml-2">En İyiler</Text>

                    <View className="flex-row bg-slate-800/50 rounded-lg p-0.5">
                        <TouchableOpacity
                            onPress={() => onTypeChange('sales')}
                            className={`px-3 py-1.5 rounded-md ${type === 'sales' ? 'bg-purple-600' : 'bg-transparent'}`}
                            accessibilityLabel="Satış bazlı göster"
                            accessibilityRole="button"
                        >
                            <Text className={`text-[10px] font-bold ${type === 'sales' ? 'text-white' : 'text-slate-400'}`}>
                                Satış
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onTypeChange('purchases')}
                            className={`px-3 py-1.5 rounded-md ${type === 'purchases' ? 'bg-blue-600' : 'bg-transparent'}`}
                            accessibilityLabel="Alış bazlı göster"
                            accessibilityRole="button"
                        >
                            <Text className={`text-[10px] font-bold ${type === 'purchases' ? 'text-white' : 'text-slate-400'}`}>
                                Alış
                            </Text>
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
                            radius={radius}
                            innerRadius={innerRadius}
                            innerCircleColor={CHART_COLORS.background.innerCircle}
                            centerLabelComponent={() => {
                                return (
                                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 18, color: 'white', fontWeight: 'bold' }}>
                                            {formatCurrency(total, true)}
                                        </Text>
                                        <Text style={{ fontSize: 10, color: 'lightgray' }}>Toplam</Text>
                                    </View>
                                );
                            }}
                        />
                    </View>

                    {/* Legend */}
                    <View className="ml-6 flex-1">
                        {validData.map((item, index) => (
                            <View key={index} className="flex-row items-center mb-2">
                                <View
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: pieData[index]?.color,
                                        marginRight: 8,
                                    }}
                                />
                                <View className="flex-1">
                                    <Text className="text-slate-300 text-[10px]" numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </View>
                                <Text className="text-white text-[10px] font-bold">{formatCurrency(item.value, true)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    },
    (prevProps, nextProps) => {
        return (
            prevProps.type === nextProps.type &&
            prevProps.isLoading === nextProps.isLoading &&
            JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
        );
    }
);

TopCustomersChart.displayName = 'TopCustomersChart';
