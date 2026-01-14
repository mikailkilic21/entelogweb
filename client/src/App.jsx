import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Products from './pages/Products';
import Invoices from './pages/Invoices';
import Orders from './pages/Orders';
import Checks from './pages/Checks';
import Settings from './components/Settings';

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/accounts" element={<Accounts />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/checks" element={<Checks />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
