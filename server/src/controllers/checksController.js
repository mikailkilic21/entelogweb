const { sql, getConfig } = require('../config/db');

exports.getPayrollDetails = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cslinesTable = `LG_${firm}_${period}_CSLINES`;
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        const { id } = req.params; // This is the ROLLREF (Payroll ID)

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
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;
        const clcardTable = `LG_${firm}_CLCARD`;

        const { type, search, limit, period: timePeriod, status } = req.query;

        // DOC 1: Customer Check, 2: Customer Promissory Note, 3: Own Check, 4: Own Promissory Note
        let whereClause = "";

        if (type === 'own') {
            whereClause = "WHERE C.DOC IN (3, 4)";
            // Own Checks: Statuses 7, 8, 9, 10, 11, 12, 13
            whereClause += " AND C.CURRSTAT IN (7, 8, 9, 10, 11, 12, 13)";
        } else {
            // Default to customer
            whereClause = "WHERE C.DOC IN (1, 2)";
            // Customer Checks: Statuses 1, 2, 3, 4, 5, 6, 11
            whereClause += " AND C.CURRSTAT IN (1, 2, 3, 4, 5, 6, 11)";
        }

        // Filter by Sub-Status
        if (type === 'customer') {
            if (status === 'portfolio') {
                whereClause += " AND C.CURRSTAT = 1";
            } else if (status === 'in_bank') {
                whereClause += " AND C.CURRSTAT IN (3, 6)";
            } else if (status === 'endorsed') {
                whereClause += " AND C.CURRSTAT IN (2, 5)";
            } else if (status === 'overdue') {
                whereClause += " AND C.DUEDATE < DATEADD(day, -2, GETDATE()) AND C.CURRSTAT IN (1, 3, 6)";
            }
        }

        // Default: If not specifically asking for overdue or everything, exclude overdue (>2 days past)
        if (status !== 'overdue' && timePeriod !== 'all' && !search) {
            whereClause += " AND (C.DUEDATE >= DATEADD(day, -2, GETDATE()) OR C.CURRSTAT NOT IN (1, 3, 6))";
        }

        // Filter by Period (Due Date)
        if (timePeriod && timePeriod !== 'all') {
            if (timePeriod === 'daily') {
                whereClause += ` AND CAST(C.DUEDATE AS DATE) = CAST(GETDATE() AS DATE)`;
            } else if (timePeriod === 'weekly') {
                whereClause += ` AND C.DUEDATE >= CAST(GETDATE() AS DATE) AND C.DUEDATE <= DATEADD(day, 7, CAST(GETDATE() AS DATE))`;
            } else if (timePeriod === 'monthly') {
                whereClause += ` AND MONTH(C.DUEDATE) = MONTH(GETDATE()) AND YEAR(C.DUEDATE) = YEAR(GETDATE())`;
            } else if (timePeriod === 'yearly') {
                whereClause += ` AND YEAR(C.DUEDATE) = YEAR(GETDATE())`;
            }
        }

        if (search) {
            whereClause += ` AND (C.NEWSERINO LIKE '%${search}%' OR C.PORTFOYNO LIKE '%${search}%' OR CA.DEFINITION_ LIKE '%${search}%' OR C.OWING LIKE '%${search}%')`;
        }

        const topClause = limit ? `TOP ${parseInt(limit)}` : 'TOP 500';
        const query = `
            SELECT ${topClause}
                C.LOGICALREF as id,
                C.PORTFOYNO as portfolioNo,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.BANKNAME as bankName,
                C.CURRSTAT as status,
                C.DOC as cardType,
                C.DEVIR as isRollover,
                C.OWING as debtorName,
                CA.DEFINITION_ as clientName,
                CA.DEFINITION_ as fromCompany
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7)
                ORDER BY DATE_ ASC, LOGICALREF ASC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
            ${whereClause}
            ORDER BY C.DUEDATE ASC
        `;

        const result = await sql.query(query);

        const mapStatus = (status, type) => {
            if (type === 'own') {
                if (status === 7) return 'Portföyde (Kendi)';
                if (status === 8) return 'Ödendi';
                if (status === 9) return 'Karşılıksız';
                if (status === 10) return 'İade Edildi';
                if (status === 11) return 'Protestolu';
                return 'İşlemde';
            }
            if (status === 1) return 'Portföyde';
            if (status === 2) return 'Ciro Edildi';
            if (status === 3) return 'Bankada (Tahsil)';
            if (status === 6) return 'Bankada (Teminat)';
            if (status === 4) return 'Tahsil Edildi';
            if (status === 5) return 'Protestolu';
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
                clientName: c.clientName || c.debtorName || 'Bilinmeyen Cari',
                debtorName: c.debtorName,
                fromCompany: c.clientName,
                endorseeName: '-'
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
        const clcardTable = `LG_${firm}_CLCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;

        const query = `
            SELECT 
                C.LOGICALREF as id,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.CURRSTAT as status,
                C.BANKNAME as bankName,
                C.DOC as cardType,
                CA.DEFINITION_ as clientName
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7)
                ORDER BY DATE_ ASC, LOGICALREF ASC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
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
                clientName: c.clientName || 'Bilinmeyen Cari',
                endorseeName: '-'
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
        const clcardTable = `LG_${firm}_CLCARD`;
        const cstransTable = `LG_${firm}_${period}_CSTRANS`;

        const query = `
            SELECT TOP 10
                C.LOGICALREF as id,
                C.NEWSERINO as serialNo,
                C.DUEDATE as dueDate,
                C.AMOUNT as amount,
                C.CURRSTAT as status,
                C.BANKNAME as bankName,
                CA.DEFINITION_ as clientName
            FROM ${cscardTable} C
            OUTER APPLY (
                SELECT TOP 1 CARDREF FROM ${cstransTable} 
                WHERE CSREF = C.LOGICALREF AND STATUS IN (1, 7)
                ORDER BY DATE_ ASC, LOGICALREF ASC
            ) T
            LEFT JOIN ${clcardTable} CA ON T.CARDREF = CA.LOGICALREF
            WHERE C.DOC = 1
            ORDER BY C.LOGICALREF DESC
        `;

        const result = await sql.query(query);
        const checks = result.recordset.map(c => ({
            ...c,
            dueDate: c.dueDate ? c.dueDate.toISOString().split('T')[0] : null,
            statusLabel: (c.status === 1) ? 'Portföyde' : (c.status === 8 ? 'Ödendi' : 'İşlemde'),
            clientName: c.clientName || 'Bilinmeyen Cari'
        }));

        res.json(checks);

    } catch (err) {
        console.error('❌ getRecentChecks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getCheckStats = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        // We want totals for Customer checks (DOC IN (1,2) and CURRSTAT < 7)
        // Portfolio: 1
        // Bank: 3, 6
        // Endorsed: 2
        // Protest/Unpaid: 5, 11

        const query = `
            SELECT 
                SUM(CASE WHEN CURRSTAT = 1 THEN AMOUNT ELSE 0 END) as portfolioTotal,
                SUM(CASE WHEN CURRSTAT IN (3, 6) THEN AMOUNT ELSE 0 END) as bankTotal,
                SUM(CASE WHEN CURRSTAT = 2 THEN AMOUNT ELSE 0 END) as endorsedTotal,
                SUM(CASE WHEN CURRSTAT IN (5, 11) THEN AMOUNT ELSE 0 END) as protestTotal,
                SUM(CASE WHEN DUEDATE < DATEADD(day, -2, GETDATE()) AND CURRSTAT IN (1, 3, 6) THEN AMOUNT ELSE 0 END) as overdueTotal,
                COUNT(CASE WHEN CURRSTAT = 1 THEN 1 END) as portfolioCount,
                COUNT(CASE WHEN CURRSTAT IN (3, 6) THEN 1 END) as bankCount,
                COUNT(CASE WHEN CURRSTAT = 2 THEN 1 END) as endorsedCount,
                COUNT(CASE WHEN CURRSTAT IN (5, 11) THEN 1 END) as protestCount,
                COUNT(CASE WHEN DUEDATE < DATEADD(day, -2, GETDATE()) AND CURRSTAT IN (1, 3, 6) THEN 1 END) as overdueCount
            FROM ${cscardTable}
            WHERE DOC IN (1, 2, 3, 4)
        `;

        const result = await sql.query(query);
        const stats = result.recordset[0];

        res.json({
            portfolio: { total: stats.portfolioTotal || 0, count: stats.portfolioCount || 0 },
            bank: { total: stats.bankTotal || 0, count: stats.bankCount || 0 },
            endorsed: { total: stats.endorsedTotal || 0, count: stats.endorsedCount || 0 },
            protest: { total: stats.protestTotal || 0, count: stats.protestCount || 0 },
            overdue: { total: stats.overdueTotal || 0, count: stats.overdueCount || 0 }
        });

    } catch (err) {
        console.error('❌ getCheckStats Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
