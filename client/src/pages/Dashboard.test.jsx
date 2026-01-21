import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock StatCard and Charts since we are testing Dashboard logic, not children
vi.mock('../components/StatCard', () => ({
    default: ({ title, value }) => <div data-testid="stat-card">{title}: {value}</div>
}));
vi.mock('../components/SalesChart', () => ({
    default: () => <div data-testid="sales-chart">SalesChart</div>
}));
vi.mock('../components/TopProductsChart', () => ({
    default: () => <div data-testid="top-products-chart">TopProductsChart</div>
}));
vi.mock('../components/TopAccountsChart', () => ({
    default: () => <div data-testid="top-accounts-chart">TopAccountsChart</div>
}));
vi.mock('../components/InvoiceList', () => ({
    default: () => <div data-testid="invoice-list">InvoiceList</div>
}));

// Mock fetch
global.fetch = vi.fn();

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default mock responses
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => []
        });
    });

    it('renders loading state initially', () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );
        // Look for the loading spinner or text based on your Loader2 usage
        // Since Loader2 is an icon, we might need to look for class or container
        // Based on code: <div className="flex h-screen items-center justify-center">
        // checking if loader exists
        const loader = document.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();
    });

    it('renders dashboard content after loading', async () => {
        // Mock specific returns for stats
        global.fetch.mockImplementation((url) => {
            if (url.includes('/api/stats')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        totalSales: 1000,
                        totalPurchases: 500,
                        totalCount: 10,
                        totalVat: 180
                    })
                });
            }
            if (url.includes('/api/settings/company')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ TITLE: 'Test Company' })
                });
            }
            return Promise.resolve({ ok: true, json: async () => [] });
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Test Company/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/Toplam Satış/i)).toBeInTheDocument();
        expect(screen.getByText(/1.000,00/i)).toBeInTheDocument(); // Currency formatting check
        expect(screen.getByText(/Toplam Alış/i)).toBeInTheDocument();
        expect(screen.getByText(/500,00/i)).toBeInTheDocument();
    });

    it('fetches data on manual refresh click', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => []
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
        });

        const refreshButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
        // Or finding by class if role is ambiguous, but button with svg is likely refresh in that context
        // Better: Identify by parent div or structure if needed. 
        // Based on code: <button onClick={fetchData} ...><RefreshCw ... /></button>

        // Let's rely on the fact it's a button and we can click it.
        // We need to clear previous calls to verify new one
        vi.clearAllMocks();

        // Mock again for the click
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => []
        });

        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    it('does NOT have the CANLI button', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => []
        });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.queryByRole('heading', { level: 1 })).toBeInTheDocument();
        });

        expect(screen.queryByText('CANLI')).not.toBeInTheDocument();
    });
});
