import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dashboard from './Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock child components
vi.mock('../components/StatCard', () => ({
    default: ({ title, value }) => <div data-testid="stat-card">{title}: {value}</div>
}));
vi.mock('../components/InvoiceList', () => ({
    default: () => <div data-testid="invoice-list">InvoiceList</div>
}));

// Recharts mocks
vi.mock('recharts', () => {
    return {
        ResponsiveContainer: ({ children }) => <div style={{ width: 800, height: 800 }}>{children}</div>,
        PieChart: () => <div>PieChart</div>,
        Pie: () => <div>Pie</div>,
        AreaChart: () => <div>AreaChart</div>,
        Area: () => <div>Area</div>,
        BarChart: () => <div>BarChart</div>,
        Bar: () => <div>Bar</div>,
        CartesianGrid: () => <div>Grid</div>,
        XAxis: () => <div>XAxis</div>,
        YAxis: () => <div>YAxis</div>,
        Tooltip: () => <div>Tooltip</div>,
        Cell: () => <div>Cell</div>,
        Sector: () => <div>Sector</div>
    };
});

// Mock fetch globally
global.fetch = vi.fn();

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        global.fetch.mockImplementation((url) => {
            const mockResponse = (data) => Promise.resolve({
                ok: true,
                json: async () => data
            });

            if (url.includes('/api/stats/top-products') ||
                url.includes('/api/stats/top-customers') ||
                url.includes('/api/stats/top-suppliers') ||
                url.includes('/api/stats/trend') ||
                url.includes('/api/invoices')) {
                return mockResponse([]);
            }

            if (url.includes('/api/settings/company')) {
                return mockResponse({ TITLE: 'Test Company' });
            }

            // Order matters: specific paths first, then general /api/stats
            if (url.includes('/api/stats')) {
                return mockResponse({
                    totalSales: 1000,
                    totalPurchases: 500,
                    salesCount: 10,
                    purchaseCount: 5
                });
            }

            return mockResponse({});
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );
        const loader = document.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
    });

    it('renders dashboard content after loading', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Test Company/i)).toBeInTheDocument();
        }, { timeout: 3000 });

        // Check for specific stat card content
        const statCards = screen.getAllByTestId('stat-card');
        const totalSalesCard = statCards.find(card => card.textContent.includes('TOPLAM SATIŞ'));
        expect(totalSalesCard).toHaveTextContent('1000');

        const totalPurchasesCard = statCards.find(card => card.textContent.includes('TOPLAM ALIŞ'));
        expect(totalPurchasesCard).toHaveTextContent('500');
    });

    it('fetches data on manual refresh click', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Test Company/i)).toBeInTheDocument();
        });

        global.fetch.mockClear();

        // Use getByTitle since we know the title attribute exists
        const refreshButton = screen.getByTitle('Yenile');
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it('does NOT have the CANLI button', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Test Company/i)).toBeInTheDocument();
        });

        expect(screen.queryByText('CANLI')).not.toBeInTheDocument();
    });
});
