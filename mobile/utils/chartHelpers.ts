/**
 * Chart Utility Functions
 * Helper functions for data validation, formatting, and transformations
 */

import { SalesData, ProductData, CustomerData, Period } from '../types/charts';

/**
 * Validate sales data array
 */
export const validateSalesData = (data: any[]): SalesData[] => {
    if (!Array.isArray(data)) {
        console.warn('validateSalesData: data is not an array');
        return [];
    }

    return data.filter((item) => {
        if (!item) return false;
        if (typeof item.sales !== 'number' || typeof item.purchase !== 'number') {
            console.warn('validateSalesData: invalid data item', item);
            return false;
        }
        if (!item.date) {
            console.warn('validateSalesData: missing date', item);
            return false;
        }
        return true;
    });
};

/**
 * Validate product data array
 */
export const validateProductData = (data: any[]): ProductData[] => {
    if (!Array.isArray(data)) {
        console.warn('validateProductData: data is not an array');
        return [];
    }

    return data.filter((item) => {
        if (!item) return false;
        if (typeof item.value !== 'number') {
            console.warn('validateProductData: invalid value', item);
            return false;
        }
        if (!item.name) {
            console.warn('validateProductData: missing name', item);
            return false;
        }
        return true;
    });
};

/**
 * Validate customer data array
 */
export const validateCustomerData = (data: any[]): CustomerData[] => {
    if (!Array.isArray(data)) {
        console.warn('validateCustomerData: data is not an array');
        return [];
    }

    return data.filter((item) => {
        if (!item) return false;
        if (typeof item.value !== 'number') {
            console.warn('validateCustomerData: invalid value', item);
            return false;
        }
        if (!item.name) {
            console.warn('validateCustomerData: missing name', item);
            return false;
        }
        return true;
    });
};

/**
 * Format date label based on period
 */
export const formatDateLabel = (dateStr: string, period: Period): string => {
    if (!dateStr) return '';

    if (period === 'yearly' && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        return parts.length > 1 ? parts[1] : dateStr;
    }

    return dateStr;
};

/**
 * Format currency value
 */
export const formatCurrency = (value: number, compact: boolean = false): string => {
    if (compact) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        }
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'k';
        }
        return value.toFixed(0);
    }

    return value.toLocaleString('tr-TR', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
    });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (!text) return 'Bilinmiyor';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Calculate chart spacing based on data length
 */
export const calculateSpacing = (dataLength: number, isTablet: boolean = false): number => {
    if (dataLength > 20) return isTablet ? 25 : 20;
    if (dataLength > 10) return isTablet ? 35 : 30;
    return isTablet ? 50 : 45;
};

/**
 * Get period description in Turkish
 */
export const getPeriodDescription = (period: Period): string => {
    const descriptions: Record<Period, string> = {
        daily: 'Bugün',
        weekly: 'Bu hafta',
        monthly: 'Bu ay',
        yearly: 'Bu yıl',
    };
    return descriptions[period] || 'Veri';
};

/**
 * Generate mock trend data based on period
 * Ensures data matches user requirements:
 * - Daily: Hourly breakdown
 * - Weekly: Today + last 6 days
 * - Monthly: Today + last 29 days
 * - Yearly: Last 12 months
 */
export const generateMockTrendData = (period: Period): SalesData[] => {
    const data: SalesData[] = [];
    const now = new Date();

    if (period === 'daily') {
        // Generate hourly data from 09:00 to 18:00
        for (let i = 9; i <= 18; i++) {
            data.push({
                date: `${i}:00`,
                sales: Math.floor(Math.random() * 50000) + 10000,
                purchase: Math.floor(Math.random() * 30000) + 5000,
            });
        }
    } else if (period === 'weekly') {
        // Last 7 days including today
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
            data.push({
                date: dayName,
                sales: Math.floor(Math.random() * 150000) + 50000,
                purchase: Math.floor(Math.random() * 80000) + 20000,
            });
        }
    } else if (period === 'monthly') {
        // Last 30 days including today
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            // Format: 15 Haz
            // Note: On Android/iOS locale date strings might need Intl Polyfill or hardcoded months if tr-TR fails.
            // Using simple logic for now.
            const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
            const dateStr = `${d.getDate()} ${months[d.getMonth()]}`;

            data.push({
                date: dateStr,
                sales: Math.floor(Math.random() * 100000) + 30000,
                purchase: Math.floor(Math.random() * 60000) + 10000,
            });
        }
    } else if (period === 'yearly') {
        // Last 12 months including current month
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now);
            d.setMonth(d.getMonth() - i);
            const monthName = months[d.getMonth()];
            data.push({
                date: monthName,
                sales: Math.floor(Math.random() * 1000000) + 500000,
                purchase: Math.floor(Math.random() * 600000) + 200000,
            });
        }
    }

    return data;
};
