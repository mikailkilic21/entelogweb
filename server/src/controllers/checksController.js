const { sql, getConfig } = require('../config/db');

exports.getPayrollDetails = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cslinesTable = `LG_${firm}_${period}_CSLINES`;
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        const { id } = req.params; // This is the ROLLREF (Payroll ID)

        // Basic query without CSLINES if it fails, but this endpoint relies on it.
        // Keeping it as is, assuming it might work if correct table name is found later.
        // If CSLINES is invalid, this endpoint will fail.

        const query = `
            SELECT 
                L.LOGICALREF as id,
                C.PORTFOYNO as portfolioNo,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.BANKNAME as bankName,
                C.DOC as cardType, -- 1: Çek, 2: Senet
                L.TRCODE as trcode
            FROM ${cslinesTable} L
            LEFT JOIN ${cscardTable} C ON L.CSREF = C.LOGICALREF
            WHERE L.ROLLREF = ${id}
            ORDER BY C.DUEDATE ASC
        `;

        const result = await sql.query(query);
        const checks = result.recordset.map(c => ({
            ...c,
            dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
            type: c.cardType === 1 ? 'Çek' : 'Senet'
        }));

        res.json(checks);

    } catch (err) {
        console.error('❌ getPayrollDetails Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getChecks = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        const { type, search, limit } = req.query;

        let whereClause = "WHERE C.DOC = 1"; // Only Checks (1)

        if (type === 'own') {
            whereClause += " AND C.CURRSTAT IN (7, 8, 9, 10, 12, 13)";
        } else if (type === 'customer') {
            whereClause += " AND C.CURRSTAT IN (1, 2, 3, 4, 5, 6, 11)";
        }

        if (search) {
            whereClause += ` AND (C.NEWSERINO LIKE '%${search}%' OR C.PORTFOYNO LIKE '%${search}%')`;
        }

        // Removed CSLINES subqueries to prevent crash
        const query = `
            SELECT 
                C.LOGICALREF as id,
                C.PORTFOYNO as portfolioNo,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.BANKNAME as bankName,
                C.CURRSTAT as status,
                C.DOC as cardType,
                C.DEVIR as isRollover
            FROM ${cscardTable} C
            ${whereClause}
            ORDER BY C.DUEDATE ASC
        `;

        // Pagination/Limit wrapper if needed (not implemented fully in logic above but kept structure)
        let finalQuery = query;
        if (limit) {
            finalQuery = `SELECT TOP ${limit} * FROM (${query}) AS T`;
        }

        const result = await sql.query(finalQuery);

        const mapStatus = (status, type) => {
            if (type === 'own') {
                if (status === 7) return 'Bekliyor';
                if (status === 8) return 'Ödendi';
                return 'Diğer';
            }
            // Customer
            if (status === 1) return 'Portföyde';
            if (status === 2) return 'Ciro Edildi';
            if (status === 3 || status === 6) return 'Bankaya Verildi';
            if (status === 4) return 'Tahsil Edildi';
            if (status === 11) return 'Karşılıksız';
            return 'Diğer';
        };

        const checks = result.recordset.map(c => {
            const checkType = (c.status >= 7 && c.status <= 13) ? 'own' : 'customer';
            return {
                ...c,
                dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
                statusLabel: mapStatus(c.status, checkType),
                type: checkType,
                clientName: '-', // Placeholder
                endorseeName: '-' // Placeholder
            };
        });

        res.json(checks);

    } catch (err) {
        console.error('❌ getChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getUpcomingChecks = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        // Removed CSLINES subqueries to prevent crash
        const query = `
            SELECT 
                C.LOGICALREF as id,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.CURRSTAT as status,
                C.BANKNAME as bankName,
                C.DOC as cardType
            FROM ${cscardTable} C
            WHERE 
                C.CURRSTAT NOT IN (4, 8, 12, 13) 
                AND C.CURRSTAT IN (1, 2, 3, 7, 9) 
                AND C.DOC = 1 
            ORDER BY C.DUEDATE ASC
        `;

        const result = await sql.query(query);
        const checks = result.recordset.map(c => {
            const checkType = (c.status >= 7 && c.status <= 13) ? 'own' : 'customer';
            return {
                ...c,
                dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
                statusLabel: (c.status === 1) ? 'Portföyde' : (c.status === 2 ? 'Ciro Edildi' : 'Bekliyor'),
                type: checkType,
                clientName: '-', // Placeholder
                endorseeName: '-' // Placeholder
            };
        });

        res.json(checks);

    } catch (err) {
        console.error('❌ getUpcomingChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getRecentChecks = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        const query = `
            SELECT TOP 10
                C.LOGICALREF as id,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.CURRSTAT as status,
                C.BANKNAME as bankName
            FROM ${cscardTable} C
            WHERE C.DOC = 1
            ORDER BY C.LOGICALREF DESC
        `;

        const result = await sql.query(query);
        const checks = result.recordset.map(c => ({
            ...c,
            dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
            statusLabel: (c.status === 1) ? 'Portföyde' : (c.status === 8 ? 'Ödendi' : 'İşlemde')
        }));

        res.json(checks);

    } catch (err) {
        console.error('❌ getRecentChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
