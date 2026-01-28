const { sql, getConfig, connectDB } = require('../config/db');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../data/dbs-config.json');
const GLOBAL_CONFIG_PATH = path.join(__dirname, '../../data/dbs-global-config.json');

// Helper to read local client config
const getDBSConfig = () => {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return [];
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading DBS config:', err);
        return [];
    }
};

// Helper to read global config
const getGlobalDBSConfig = () => {
    try {
        if (!fs.existsSync(GLOBAL_CONFIG_PATH)) {
            return { previousPeriod: { enabled: false, firmNo: '', periodNo: '', yearLabel: '' } };
        }
        const data = fs.readFileSync(GLOBAL_CONFIG_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading DBS global config:', err);
        return { previousPeriod: { enabled: false, firmNo: '', periodNo: '', yearLabel: '' } };
    }
};

// Helper to save config
const saveDBSConfig = (config) => {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving DBS config:', err);
        return false;
    }
};

// Helper to save global config
const saveGlobalDBSConfig = (config) => {
    try {
        fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving DBS global config:', err);
        return false;
    }
};

const dbsController = {
    // Get Settings
    getSettings: async (req, res) => {
        try {
            const config = getDBSConfig();
            res.json(config);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Save Settings
    saveSettings: async (req, res) => {
        try {
            const newConfig = req.body;
            if (!Array.isArray(newConfig)) {
                return res.status(400).json({ error: 'Invalid configuration format' });
            }
            saveDBSConfig(newConfig);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Get Global Settings
    getGlobalSettings: async (req, res) => {
        try {
            const config = getGlobalDBSConfig();
            res.json(config);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Save Global Settings
    saveGlobalSettings: async (req, res) => {
        try {
            const newConfig = req.body;
            saveGlobalDBSConfig(newConfig);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Get Purchase Invoices for DBS Clients
    getDBSInvoices: async (req, res) => {
        try {
            await connectDB();
            const config = getConfig(); // DB Config
            const dbsConfig = getDBSConfig(); // DBS Clients Config
            const globalConfig = getGlobalDBSConfig(); // Global Config (Previous Period)

            const validConfig = dbsConfig.filter(c => c.logicalRef && c.code);

            if (validConfig.length === 0) {
                return res.json([]);
            }

            // Extract Codes for cross-period querying
            const clientCodes = validConfig.map(c => `'${c.code}'`).join(',');

            // Query Builder Helper
            const fetchInvoicesForPeriod = async (firmNo, periodNo, sourceLabel) => {
                const firm = (firmNo || '113').toString().padStart(3, '0');
                const period = (periodNo || '01').toString().padStart(2, '0');
                const invoiceTable = `LG_${firm}_${period}_INVOICE`;
                const clcardTable = `LG_${firm}_CLCARD`;

                // Check if tables exist might be good, but expensive. Rely on try/catch.
                const query = `
                    SELECT 
                        INV.LOGICALREF as id,
                        INV.FICHENO as ficheno,
                        INV.DATE_ as date,
                        INV.NETTOTAL as amount,
                        INV.CLIENTREF as clientRef,
                        CL.DEFINITION_ as clientName,
                        CL.CODE as clientCode
                    FROM ${invoiceTable} INV
                    LEFT JOIN ${clcardTable} CL ON INV.CLIENTREF = CL.LOGICALREF
                    WHERE INV.TRCODE = 1 
                    AND INV.CANCELLED = 0
                    AND CL.CODE IN (${clientCodes})
                    ORDER BY INV.DATE_ DESC
                `;

                try {
                    const result = await sql.query(query);
                    return result.recordset.map(inv => ({ ...inv, sourceYear: sourceLabel, dbFirm: firm, dbPeriod: period }));
                } catch (err) {
                    console.error(`Error querying period ${firm}-${period}:`, err.message);
                    return [];
                }
            };

            // 1. Current Period
            const currentYearLabel = new Date().getFullYear().toString();
            const currentInvoices = await fetchInvoicesForPeriod(config.firmNo, config.periodNo, currentYearLabel);

            // 2. Previous Period (if enabled)
            let previousInvoices = [];
            if (globalConfig.previousPeriod && globalConfig.previousPeriod.enabled) {
                const { firmNo, periodNo, yearLabel } = globalConfig.previousPeriod;
                if (firmNo && periodNo) {
                    previousInvoices = await fetchInvoicesForPeriod(firmNo, periodNo, yearLabel || 'Geçmiş');
                }
            }

            // Merge
            const allInvoices = [...currentInvoices, ...previousInvoices];

            // Map and Calculate
            const finalInvoices = allInvoices.map(inv => {
                // Match config by Code, not LogicalRef (since LogicalRef changes per DB)
                const clientConfig = dbsConfig.find(c => c.code === inv.clientCode);

                let dbsDate = new Date(inv.date);

                if (clientConfig) {
                    // 1. Add Term Days
                    if (clientConfig.termDays) {
                        dbsDate.setDate(dbsDate.getDate() + Number(clientConfig.termDays));
                    }

                    // 2. Adjust to Specific Day
                    if (clientConfig.paymentDay !== undefined && clientConfig.paymentDay !== null && clientConfig.paymentDay !== '') {
                        const targetDay = Number(clientConfig.paymentDay);
                        const currentDay = dbsDate.getDay();

                        let daysToAdd = targetDay - currentDay;
                        if (daysToAdd < 0) daysToAdd += 7;
                        dbsDate.setDate(dbsDate.getDate() + daysToAdd);
                    }
                }

                return {
                    ...inv,
                    dbsDate: dbsDate.toISOString().split('T')[0],
                    configDay: clientConfig?.paymentDay,
                    configTerm: clientConfig?.termDays
                };
            });

            // Filter: Hide Overdue (dbsDate < Today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const activeInvoices = finalInvoices.filter(inv => {
                const dbsDate = new Date(inv.dbsDate);
                dbsDate.setHours(0, 0, 0, 0);
                return dbsDate >= today;
            });

            // Re-sort by DBS Date ASC (Nearest first)
            activeInvoices.sort((a, b) => new Date(a.dbsDate) - new Date(b.dbsDate));

            res.json(activeInvoices);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // Get Invoice Details
    getInvoiceDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const { firmNo, periodNo } = req.query;

            await connectDB();
            const config = getConfig();

            const targetFirm = (firmNo || config.firmNo || '113').toString().padStart(3, '0');
            const targetPeriod = (periodNo || config.periodNo || '01').toString().padStart(2, '0');

            const stlineTable = `LG_${targetFirm}_${targetPeriod}_STLINE`;
            const itemsTable = `LG_${targetFirm}_ITEMS`;

            // Query invoice lines
            const query = `
                SELECT 
                    ST.LOGICALREF as id,
                    IT.NAME as name,
                    IT.CODE as code,
                    ST.AMOUNT as quantity,
                    ST.PRICE as price,
                    ST.TOTAL as total,
                    ST.LINENET as netTotal
                FROM ${stlineTable} ST
                LEFT JOIN ${itemsTable} IT ON ST.STOCKREF = IT.LOGICALREF
                WHERE ST.INVOICEREF = @id
                AND ST.LINETYPE IN (0, 1, 4)
            `;

            const request = new sql.Request();
            request.input('id', sql.Int, id);
            const result = await request.query(query);

            res.json(result.recordset);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = dbsController;
