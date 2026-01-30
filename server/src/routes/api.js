const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const accountsController = require('../controllers/accountsController');
const productsController = require('../controllers/productsController');
const statsController = require('../controllers/statsController');
const settingsController = require('../controllers/settingsController');
const authController = require('../controllers/authController');
const licenseController = require('../controllers/licenseController');
const banksController = require('../controllers/banksController');

// Auth Routes
// Auth Routes
router.post('/auth/login', authController.login);
router.get('/users', authController.getUsers);
router.post('/users', authController.createUser);
router.put('/users/:id', authController.updateUser);
router.delete('/users/:id', authController.deleteUser);

// License Routes
router.post('/license/apply', licenseController.apply);
router.get('/license/status/:taxNumber', licenseController.checkStatus);


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
router.get('/accounts/:id/turnover', accountsController.getClientPurchaseTurnover);



// Check Routes
const checksController = require('../controllers/checksController');
router.get('/checks/stats', checksController.getCheckStats);
router.get('/checks/stats/trend', checksController.getCheckTrend);
router.get('/checks/stats/top-issuers', checksController.getTopCheckIssuers);
router.get('/checks/payroll/:id', checksController.getPayrollDetails);
router.get('/checks', checksController.getChecks);
router.get('/checks/recent', checksController.getRecentChecks);
router.get('/checks/upcoming', checksController.getUpcomingChecks);
router.get('/checks/overdue', checksController.getOverdueChecks);
router.get('/checks/plans', checksController.getPlans);
router.post('/checks/plans', checksController.savePlan);
router.delete('/checks/plans/:id', checksController.deletePlan);

// Order Routes
const ordersController = require('../controllers/ordersController');
router.get('/orders', ordersController.getOrders);
router.get('/orders/top-products', ordersController.getTopProducts);
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



// Bank Routes
router.get('/banks', banksController.getBanks);
router.get('/banks/stats', banksController.getBankStats);
router.get('/banks/finance-transactions', banksController.getBankFinanceTransactions);

// DBS Routes
const dbsController = require('../controllers/dbsController');
router.get('/dbs/settings', dbsController.getSettings);
router.post('/dbs/settings', dbsController.saveSettings);
router.get('/dbs/settings/global', dbsController.getGlobalSettings);
router.post('/dbs/settings/global', dbsController.saveGlobalSettings);
router.get('/dbs/invoices', dbsController.getDBSInvoices);
router.get('/dbs/invoice/:id', dbsController.getInvoiceDetails);

module.exports = router;
