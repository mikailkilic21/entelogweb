/**
 * Chart Theme Configuration
 * Centralized color system and styling constants for charts
 */

export const CHART_COLORS = {
    sales: {
        primary: '#3b82f6',
        light: '#60a5fa',
        gradient: '#1d4ed8',
    },
    purchase: {
        primary: '#ef4444',
        light: '#f87171',
        gradient: '#b91c1c',
    },
    products: {
        gold: '#fbbf24',
        goldDark: '#d97706',
        green: '#10b981',
        greenDark: '#059669',
    },
    customers: ['#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4'],
    background: {
        card: 'rgba(15, 23, 42, 0.5)', // slate-900/50
        border: '#1e293b', // slate-800
        innerCircle: '#1e293b',
    },
    text: {
        primary: '#ffffff',
        secondary: '#94a3b8',
        tertiary: '#64748b',
        muted: '#475569',
    },
    grid: {
        line: '#1e293b',
        axis: '#334155',
    },
} as const;

export const CHART_DIMENSIONS = {
    mobile: {
        height: 220,
        padding: 80,
        barWidth: 35,
        pieRadius: 70,
        pieInnerRadius: 45,
    },
    tablet: {
        height: 280,
        padding: 120,
        barWidth: 45,
        pieRadius: 90,
        pieInnerRadius: 60,
    },
} as const;

export const CHART_ANIMATION = {
    duration: 800,
    dataChangeDuration: 500,
} as const;

export const CHART_TYPOGRAPHY = {
    title: {
        fontSize: 18,
        fontWeight: 'bold' as const,
        color: CHART_COLORS.text.primary,
    },
    label: {
        fontSize: 10,
        color: CHART_COLORS.text.secondary,
    },
    dataPoint: {
        fontSize: 10,
        color: CHART_COLORS.text.primary,
    },
    legend: {
        fontSize: 10,
        color: CHART_COLORS.text.secondary,
    },
} as const;
