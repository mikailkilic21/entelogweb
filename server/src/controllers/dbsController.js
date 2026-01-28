const { sql, getConfig, connectDB } = require('../config/db');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../data/dbs-config.json');

// Helper to read config
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

    // Get Purchase Invoices for DBS Clients
    getDBSInvoices: async (req, res) => {
        try {
            await connectDB();
            const config = getConfig(); // DB Config
            const dbsConfig = getDBSConfig(); // DBS Clients Config

            if (dbsConfig.length === 0) {
                return res.json([]);
            }

            const clientRefs = dbsConfig.map(c => c.logicalRef).join(',');

            const firm = (config.firmNo || '113').toString().padStart(3, '0');
            const period = (config.periodNo || '01').toString().padStart(2, '0');

            // TRCODE = 1 (Purchase Invoice) / 2 (Purchase Return... maybe just 1?)
            // User said "MAL ALIM FATURASI" (Goods Purchase Invoice) -> TRCODE = 1.

            const invoiceTable = `LG_${firm}_${period}_INVOICE`;
            const clcardTable = `LG_${firm}_CLCARD`;

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
                AND INV.CLIENTREF IN (${clientRefs})
                AND INV.PAYDEFREF = 0 -- Assuming checking open invoices? Or all? User said "Her kesilen".
                ORDER BY INV.DATE_ DESC
            `;

            const result = await sql.query(query);

            // Map results and calculate target DBS Date based on config
            const invoices = result.recordset.map(inv => {
                const clientConfig = dbsConfig.find(c => c.logicalRef === inv.clientRef);

                // Calculate DBS Date
                // Logic: Start from Invoice Date
                let dbsDate = new Date(inv.date);

                if (clientConfig) {
                    // 1. Add Term Days (if any)
                    if (clientConfig.termDays) {
                        dbsDate.setDate(dbsDate.getDate() + Number(clientConfig.termDays));
                    }

                    // 2. Adjust to Specific Day of Week (if set)
                    // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
                    if (clientConfig.paymentDay !== undefined && clientConfig.paymentDay !== null && clientConfig.paymentDay !== '') {
                        const targetDay = Number(clientConfig.paymentDay);
                        const currentDay = dbsDate.getDay();

                        let daysToAdd = targetDay - currentDay;
                        if (daysToAdd < 0) daysToAdd += 7; // Go to next week
                        // If daysToAdd is 0, it means it falls exactly on that day. 
                        // Should we force "Next week"? Usually "Next Friday" implies current week if not passed, or always next?
                        // "DBS Vade Günü" implies the day it MUST be paid.
                        // Let's assume Next Occurrence (or Today).
                        dbsDate.setDate(dbsDate.getDate() + daysToAdd);
                    }
                }

                return {
                    ...inv,
                    dbsDate: dbsDate.toISOString().split('T')[0], // YYYY-MM-DD
                    configDay: clientConfig?.paymentDay,
                    configTerm: clientConfig?.termDays
                };
            });

            res.json(invoices);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = dbsController;
