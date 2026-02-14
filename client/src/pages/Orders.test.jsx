import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Orders from './Orders';

// Mock dependencies
vi.mock('lucide-react', () => ({
    Search: () => <div data-testid="icon-search" />,
    RotateCw: () => <div data-testid="icon-rotate" />,
    Loader2: () => <div data-testid="icon-loader" />,
    Filter: () => <div data-testid="icon-filter" />,
    FileText: () => <div data-testid="icon-filetext" />,
    CheckCircle: () => <div data-testid="icon-check" />,
    Clock: () => <div data-testid="icon-clock" />,
    XCircle: () => <div data-testid="icon-xcircle" />,
    Upload: () => <div data-testid="icon-upload" />,
    Download: () => <div data-testid="icon-download" />,
    FileDown: () => <div data-testid="icon-filedown" />,
    Printer: () => <div data-testid="icon-printer" />,
    X: () => <div data-testid="icon-x" />,
}));

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    PieChart: ({ children }) => <div>{children}</div>,
    Pie: () => <div />,
    Cell: () => <div />,
    BarChart: ({ children }) => <div>{children}</div>,
    Bar: () => <div />,
    LineChart: ({ children }) => <div>{children}</div>,
    Line: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
}));

// Mock child components
vi.mock('../components/orders/OrderDetailModal', () => ({
    default: () => <div data-testid="order-detail-modal" />
}));
vi.mock('../components/orders/AddOrderModal', () => ({
    default: () => <div data-testid="add-order-modal" />
}));
vi.mock('../components/orders/DiscountUploadModal', () => ({
    default: () => <div data-testid="discount-upload-modal" />
}));
vi.mock('../components/StatCard', () => ({
    default: ({ title, value }) => <div data-testid="stat-card">{title}: {value}</div>
}));

global.fetch = vi.fn();

describe('Orders Page Integration Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        cleanup();
    });

    afterEach(() => {
        cleanup();
    });

    it('renders orders and opens add modal for local orders', async () => {
        // Mock data
        const mockOrder = {
            id: 123,
            ficheNo: 'SIP-TEST-001',
            date: '2023-01-01',
            customer: 'Test Customer',
            amount: 1000,
            status: 1, // Proposal
            isLocal: true, // Local order
            lines: []
        };

        // Mock fetch response for orders
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [mockOrder],
        });

        render(
            <BrowserRouter>
                <Orders />
            </BrowserRouter>
        );

        // 1. Check if the title is rendered (wait for loading)
        await waitFor(() => {
            expect(screen.getByText(/Sipariş Yönetimi/i)).toBeInTheDocument();
        });

        // 2. Check if the order is in the list
        const orderRow = await screen.findByText('SIP-TEST-001');
        expect(orderRow).toBeInTheDocument();

        // 3. Click the order row (simulating user action)
        orderRow.click();

        // 4. Verify AddOrderModal is opened for local orders
        await waitFor(() => {
            expect(screen.getByTestId('add-order-modal')).toBeInTheDocument();
        });
    });

    it('opens detail modal for SQL orders', async () => {
        const mockSqlOrder = {
            id: 456,
            ficheNo: 'SIP-SQL-001',
            date: '2023-01-01',
            customer: 'SQL Customer',
            amount: 2000,
            status: 4,
            isLocal: false, // SQL order
            lines: []
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [mockSqlOrder],
        });

        render(
            <BrowserRouter>
                <Orders />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Sipariş Yönetimi/i)).toBeInTheDocument();
        });

        const orderRow = await screen.findByText('SIP-SQL-001');
        orderRow.click();

        // Expect OrderDetailModal for SQL orders
        await waitFor(() => {
            expect(screen.getByTestId('order-detail-modal')).toBeInTheDocument();
        });
    });
});
