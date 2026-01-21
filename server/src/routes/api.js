const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const accountsController = require('../controllers/accountsController');
const productsController = require('../controllers/productsController');
const statsController = require('../controllers/statsController');
const settingsController = require('../controllers/settingsController');

// Settings Routes (Company Info)
router.get('/settings/company', settingsController.getSettings);
router.post('/settings/company', settingsController.updateSettings);
router.post('/settings/company/logo', settingsController.uploadMiddleware, settingsController.uploadLogo);

// Settings Routes (DB Config)
router.get('/settings/db', settingsController.getDbSettings);
router.post('/settings/db', settingsController.updateDbSettings);

// Firms Routes
router.get('/firms', settingsController.getFirms);
router.get('/firms/:firmNo/periods', settingsController.getFirmPeriods);
router.post('/settings/db/switch', settingsController.switchDbConfig);



// Invoice Routes
router.get('/invoices', invoiceController.getInvoices);
router.get('/invoices/stats', invoiceController.getInvoiceStats);
router.get('/invoices/:id', invoiceController.getInvoiceDetails);

// Account Routes
router.get('/accounts', accountsController.getAccounts);
router.get('/accounts/stats', accountsController.getAccountStats);
router.get('/accounts/:id', accountsController.getAccountDetails);
router.get('/accounts/:id/orders', accountsController.getAccountOrders);

// Check Routes
const checksController = require('../controllers/checksController');
router.get('/checks/payroll/:id', checksController.getPayrollDetails);
router.get('/checks', checksController.getChecks);
router.get('/checks/recent', checksController.getRecentChecks);
router.get('/checks/upcoming', checksController.getUpcomingChecks);

// Order Routes
const ordersController = require('../controllers/ordersController');
router.get('/orders', ordersController.getOrders);
router.get('/orders/:id', ordersController.getOrderDetails);

// Product Routes
router.get('/products', productsController.getProducts);
router.get('/products/stats', productsController.getProductStats);
router.get('/products/:id', productsController.getProductDetails);
router.get('/products/:id/orders', productsController.getProductOrders);

// Stats Routes
router.get('/stats', statsController.getStats);
router.get('/stats/trend', statsController.getFinancialTrend);
router.get('/stats/top-products', statsController.getTopProducts);
router.get('/stats/top-customers', statsController.getTopCustomers);
router.get('/stats/top-suppliers', statsController.getTopSuppliers);



module.exports = router;
