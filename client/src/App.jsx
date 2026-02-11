import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingFallback from './components/LoadingFallback';

// Lazy load pages for performance optimization
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Products = lazy(() => import('./pages/Products'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Orders = lazy(() => import('./pages/Orders'));
const Checks = lazy(() => import('./pages/Checks'));
const Banks = lazy(() => import('./pages/Banks'));
const Settings = lazy(() => import('./components/Settings'));

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/checks" element={<Checks />} />
                        <Route path="/banks" element={<Banks />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </Suspense>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
