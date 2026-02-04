/**
 * Chart Data Types
 * Type definitions for dashboard charts
 */

export interface SalesData {
    date: string;
    sales: number;
    purchase: number;
}

export interface ProductData {
    name: string;
    value: number;
}

export interface CustomerData {
    name: string;
    value: number;
}

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type CustomerType = 'sales' | 'purchases';

// Component Props
export interface SalesTrendChartProps {
    data: SalesData[];
    period: Period;
    isLoading?: boolean;
}

export interface TopProductsChartProps {
    data: ProductData[];
    isLoading?: boolean;
}

export interface TopCustomersChartProps {
    data: CustomerData[];
    type: CustomerType;
    onTypeChange: (type: CustomerType) => void;
    isLoading?: boolean;
}

// Chart Data Points
export interface LineDataPoint {
    value: number;
    label: string;
    dataPointText: string;
}

export interface BarDataPoint {
    value: number;
    frontColor: string;
    gradientColor: string;
    label: string;
    topLabelComponent: () => JSX.Element;
}

export interface PieDataPoint {
    value: number;
    color: string;
    text: string;
}
