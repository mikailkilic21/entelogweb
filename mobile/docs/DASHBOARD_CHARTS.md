# 📊 Dashboard Charts - Comprehensive Guide

## Overview

This document provides a complete guide to the refactored Dashboard Charts system with TypeScript, performance optimizations, accessibility, and advanced features.

## 🎯 Features

### ✅ Implemented
- **TypeScript Support**: Full type safety with proper interfaces
- **Performance Optimization**: React.memo, useMemo for expensive calculations
- **Responsive Design**: Tablet and mobile support with dynamic sizing
- **Accessibility**: Screen reader support, proper ARIA labels
- **Loading States**: Skeleton loading animations
- **Error Handling**: Data validation and graceful error states
- **Animations**: Smooth chart animations (800ms duration)
- **Export Functionality**: Share charts as PNG images
- **Centralized Theme**: Consistent colors and styling
- **Turkish Localization**: All text and formatting in Turkish

## 📁 File Structure

```
mobile/
├── components/
│   ├── DashboardCharts.tsx       # Main chart components
│   └── Skeleton.tsx               # Loading skeleton components
├── types/
│   └── charts.ts                  # TypeScript type definitions
├── constants/
│   └── chartTheme.ts              # Theme configuration
└── utils/
    └── chartHelpers.ts            # Utility functions
```

## 🎨 Components

### 1. SalesTrendChart

Displays sales vs purchases trend over time with interactive tooltips.

**Props:**
```typescript
interface SalesTrendChartProps {
    data: SalesData[];           // Array of sales data
    period: Period;              // 'daily' | 'weekly' | 'monthly' | 'yearly'
    isLoading?: boolean;         // Show skeleton loading
}

interface SalesData {
    date: string;
    sales: number;
    purchase: number;
}
```

**Usage:**
```tsx
import { SalesTrendChart } from '@/components/DashboardCharts';

<SalesTrendChart
    data={trendData}
    period="monthly"
    isLoading={loading}
/>
```

**Features:**
- Dual line chart (sales vs purchases)
- Interactive pointer with tooltips
- Responsive sizing (mobile/tablet)
- Export as PNG
- Empty state handling
- Accessibility support

---

### 2. TopProductsChart

Displays top selling products as a bar chart.

**Props:**
```typescript
interface TopProductsChartProps {
    data: ProductData[];
    isLoading?: boolean;
}

interface ProductData {
    name: string;
    value: number;
}
```

**Usage:**
```tsx
import { TopProductsChart } from '@/components/DashboardCharts';

<TopProductsChart
    data={topProducts}
    isLoading={loading}
/>
```

**Features:**
- Gradient bar chart
- Gold color for #1 product
- Auto-truncate long names
- Top labels with formatted values
- Responsive bar width

---

### 3. TopCustomersChart

Displays top customers as a pie chart with legend.

**Props:**
```typescript
interface TopCustomersChartProps {
    data: CustomerData[];
    type: CustomerType;          // 'sales' | 'purchases'
    onTypeChange: (type: CustomerType) => void;
    isLoading?: boolean;
}

interface CustomerData {
    name: string;
    value: number;
}
```

**Usage:**
```tsx
import { TopCustomersChart } from '@/components/DashboardCharts';

const [customerType, setCustomerType] = useState<'sales' | 'purchases'>('sales');

<TopCustomersChart
    data={topCustomers}
    type={customerType}
    onTypeChange={setCustomerType}
    isLoading={loading}
/>
```

**Features:**
- Donut pie chart
- Toggle between sales/purchases
- Color-coded legend
- Center total value
- Responsive sizing

---

## 🎨 Theme System

### Colors

```typescript
import { CHART_COLORS } from '@/constants/chartTheme';

// Sales colors
CHART_COLORS.sales.primary      // '#3b82f6'
CHART_COLORS.sales.light        // '#60a5fa'
CHART_COLORS.sales.gradient     // '#1d4ed8'

// Purchase colors
CHART_COLORS.purchase.primary   // '#ef4444'
CHART_COLORS.purchase.light     // '#f87171'
CHART_COLORS.purchase.gradient  // '#b91c1c'

// Product colors
CHART_COLORS.products.gold      // '#fbbf24'
CHART_COLORS.products.green     // '#10b981'

// Customer colors (array)
CHART_COLORS.customers          // ['#8b5cf6', '#6366f1', ...]
```

### Dimensions

```typescript
import { CHART_DIMENSIONS } from '@/constants/chartTheme';

// Mobile
CHART_DIMENSIONS.mobile.height          // 220
CHART_DIMENSIONS.mobile.padding         // 80
CHART_DIMENSIONS.mobile.barWidth        // 35
CHART_DIMENSIONS.mobile.pieRadius       // 70

// Tablet
CHART_DIMENSIONS.tablet.height          // 280
CHART_DIMENSIONS.tablet.padding         // 120
CHART_DIMENSIONS.tablet.barWidth        // 45
CHART_DIMENSIONS.tablet.pieRadius       // 90
```

---

## 🛠️ Utility Functions

### Data Validation

```typescript
import { validateSalesData, validateProductData, validateCustomerData } from '@/utils/chartHelpers';

// Validates and filters invalid data
const validData = validateSalesData(rawData);
```

### Formatting

```typescript
import { formatCurrency, formatDateLabel, truncateText } from '@/utils/chartHelpers';

// Format currency
formatCurrency(1500000)        // "1,500,000"
formatCurrency(1500000, true)  // "1.5M"

// Format date label
formatDateLabel('2026-01', 'yearly')  // "01"

// Truncate text
truncateText('Very Long Product Name', 15)  // "Very Long Produ..."
```

### Calculations

```typescript
import { calculateSpacing, getPeriodDescription } from '@/utils/chartHelpers';

// Calculate chart spacing
calculateSpacing(24, false)  // 20 (mobile, daily data)
calculateSpacing(7, true)    // 50 (tablet, weekly data)

// Get period description
getPeriodDescription('monthly')  // "Bu ay"
```

---

## 🎭 Loading States

### Skeleton Component

```tsx
import { ChartSkeleton } from '@/components/Skeleton';

// Line chart skeleton
<ChartSkeleton type="line" />

// Bar chart skeleton
<ChartSkeleton type="bar" />

// Pie chart skeleton
<ChartSkeleton type="pie" />
```

### Usage in Charts

Charts automatically show skeleton when `isLoading={true}`:

```tsx
<SalesTrendChart
    data={data}
    period="monthly"
    isLoading={true}  // Shows skeleton
/>
```

---

## 📤 Export Functionality

### Export Chart as Image

The `SalesTrendChart` includes built-in export functionality:

```tsx
// Export button is automatically included in the chart
// User taps "📤 Paylaş" button to share chart as PNG
```

**Implementation:**
```typescript
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const chartRef = useRef<ViewShot>(null);

const handleExport = async () => {
    if (chartRef.current) {
        const uri = await chartRef.current.capture();
        await Sharing.shareAsync(uri);
    }
};
```

---

## ♿ Accessibility

All charts include accessibility features:

```tsx
<View
    accessible={true}
    accessibilityLabel="Finansal trend grafiği. Toplam satış: 1,500,000 TL"
    accessibilityRole="image"
>
    {/* Chart content */}
</View>
```

**Features:**
- Screen reader support
- Descriptive labels
- Proper roles
- Interactive element labels

---

## 📱 Responsive Design

Charts automatically adapt to screen size:

```typescript
const { width: screenWidth } = useWindowDimensions();
const isTablet = screenWidth >= 768;

const chartWidth = screenWidth - (isTablet ? 120 : 80);
const chartHeight = isTablet ? 280 : 220;
```

**Breakpoints:**
- **Mobile**: < 768px
- **Tablet**: ≥ 768px

---

## 🎯 Performance Optimizations

### 1. React.memo

All chart components use `React.memo` with custom comparison:

```typescript
export const SalesTrendChart = React.memo(
    ({ data, period, isLoading }) => {
        // Component code
    },
    (prevProps, nextProps) => {
        return (
            prevProps.period === nextProps.period &&
            prevProps.isLoading === nextProps.isLoading &&
            JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
        );
    }
);
```

### 2. useMemo

Expensive calculations are memoized:

```typescript
const chartData = useMemo(() => {
    const validData = validateSalesData(data);
    // ... expensive transformations
    return { lineData, lineData2, validData };
}, [data, period]);
```

### 3. Animations

Optimized animation settings:

```typescript
isAnimated={true}
animationDuration={800}
animateOnDataChange={true}
onDataChangeAnimationDuration={500}
```

---

## 🚨 Error Handling

### Empty States

Charts show user-friendly empty states:

```tsx
if (validData.length === 0) {
    return (
        <View>
            <Text>📊</Text>
            <Text>Henüz veri yok</Text>
            <Text>Bu ay için veri bekleniyor</Text>
        </View>
    );
}
```

### Data Validation

All data is validated before rendering:

```typescript
const validData = validateSalesData(data);
// Filters out null, undefined, and invalid items
// Logs warnings for debugging
```

---

## 🔧 Customization

### Changing Colors

Edit `constants/chartTheme.ts`:

```typescript
export const CHART_COLORS = {
    sales: {
        primary: '#YOUR_COLOR',  // Change here
        // ...
    },
    // ...
};
```

### Changing Dimensions

Edit `constants/chartTheme.ts`:

```typescript
export const CHART_DIMENSIONS = {
    mobile: {
        height: 250,  // Change here
        // ...
    },
    // ...
};
```

### Adding New Chart Types

1. Create type in `types/charts.ts`
2. Add validation in `utils/chartHelpers.ts`
3. Create component in `components/DashboardCharts.tsx`
4. Add skeleton in `components/Skeleton.tsx`

---

## 📦 Dependencies

```json
{
    "react-native-gifted-charts": "^1.4.70",
    "react-native-svg": "15.12.1",
    "react-native-view-shot": "^3.8.0",
    "expo-sharing": "^12.0.1"
}
```

---

## 🐛 Troubleshooting

### Charts not rendering

1. Check data format matches TypeScript interfaces
2. Verify `react-native-svg` is installed
3. Check console for validation warnings

### Export not working

1. Verify `expo-sharing` is installed
2. Check device permissions
3. Test on physical device (may not work on simulator)

### Performance issues

1. Reduce data points (< 50 recommended)
2. Disable animations: `isAnimated={false}`
3. Check for unnecessary re-renders with React DevTools

---

## 📚 Best Practices

1. **Always validate data** before passing to charts
2. **Use loading states** for better UX
3. **Handle empty states** gracefully
4. **Test on multiple screen sizes**
5. **Use TypeScript types** for type safety
6. **Memoize expensive calculations**
7. **Add accessibility labels**
8. **Test export functionality** on real devices

---

## 🎉 What's New

### v2.0 (Current)

- ✅ Full TypeScript support
- ✅ Performance optimizations (React.memo, useMemo)
- ✅ Responsive design (tablet support)
- ✅ Accessibility features
- ✅ Loading skeletons
- ✅ Error handling & validation
- ✅ Export functionality
- ✅ Centralized theme system
- ✅ Utility functions
- ✅ Turkish localization

### v1.0 (Previous)

- Basic chart rendering
- No TypeScript
- No loading states
- No accessibility
- No export functionality

---

## 📞 Support

For issues or questions:
- **Developer**: Mikail KILIÇ
- **Email**: mikailkilic21@gmail.com
- **Phone**: +90 553 391 22 86

---

## 📄 License

© 2026 Tüm Hakları Saklıdır.
