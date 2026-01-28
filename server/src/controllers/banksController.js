const { sql, getConfig } = require('../config/db');

exports.getBanks = async (req, res) => {
    try {
        const { firmNo, periodNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');

        const cardTable = `LG_${firm}_BNCARD`;
        const accountTable = `LG_${firm}_BANKACC`;
        const lineTable = `LG_${firm}_${period}_BNFLINE`;

        // Parameters
        const { search } = req.query;

        let whereClause = '';
        if (search) {
            whereClause = ` AND (A.DEFINITION_ LIKE '%${search}%' OR A.CODE LIKE '%${search}%' OR C.DEFINITION_ LIKE '%${search}%')`;
        }

        const query = `
            SELECT 
                A.LOGICALREF as id,
                A.CODE as code,
                A.DEFINITION_ as name,
                C.DEFINITION_ as bankName,
                C.BRANCH as branch,
                A.IBAN as iban,
                A.CURRENCY as currency,
                (SELECT ISNULL(SUM(CASE WHEN L.SIGN = 0 THEN L.AMOUNT ELSE -L.AMOUNT END), 0) FROM ${lineTable} L WHERE L.BNACCREF = A.LOGICALREF AND L.CANCELLED = 0) as balance,
                (SELECT ISNULL(SUM(CASE WHEN L.SIGN = 0 THEN L.AMOUNT ELSE 0 END), 0) FROM ${lineTable} L WHERE L.BNACCREF = A.LOGICALREF AND L.CANCELLED = 0) as totalIncoming,
                (SELECT ISNULL(SUM(CASE WHEN L.SIGN = 1 THEN L.AMOUNT ELSE 0 END), 0) FROM ${lineTable} L WHERE L.BNACCREF = A.LOGICALREF AND L.CANCELLED = 0) as totalOutgoing
            FROM ${accountTable} A
            LEFT JOIN ${cardTable} C ON A.BANKREF = C.LOGICALREF
            WHERE A.ACTIVE = 0 ${whereClause}
            ORDER BY A.DEFINITION_
        `;

        const result = await sql.query(query);
        res.json(result.recordset);

    } catch (err) {
        console.error('❌ Banks Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getBankStats = async (req, res) => {
    try {
        const { firmNo, periodNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');
        const lineTable = `LG_${firm}_${period}_BNFLINE`;
        const clfTable = `LG_${firm}_${period}_CLFLINE`;

        const result = await sql.query(`
            SELECT 
                ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END), 0) as totalBalance,
                ISNULL(SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END), 0) as totalIncoming,
                ISNULL(SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END), 0) as totalOutgoing,
                ISNULL(SUM(CASE WHEN SIGN = 0 AND DATE_ >= CAST(GETDATE() AS DATE) THEN AMOUNT ELSE 0 END), 0) as dailyIncoming,
                ISNULL(SUM(CASE WHEN SIGN = 1 AND DATE_ >= CAST(GETDATE() AS DATE) THEN AMOUNT ELSE 0 END), 0) as dailyOutgoing
            FROM ${lineTable}
            WHERE CANCELLED = 0
        `);

        // New queries for CC and POS from CLFLINE
        const clStats = await sql.query(`
            SELECT 
                ISNULL(SUM(CASE WHEN TRCODE = 70 THEN AMOUNT ELSE 0 END), 0) as totalPOS,
                ISNULL(SUM(CASE WHEN TRCODE = 72 THEN AMOUNT ELSE 0 END), 0) as totalFirmCC
            FROM ${clfTable}
            WHERE CANCELLED = 0
        `);

        // Havale stats from BNFLINE
        const havaleStats = await sql.query(`
            SELECT 
                ISNULL(SUM(CASE WHEN TRCODE = 3 THEN AMOUNT ELSE 0 END), 0) as totalHavaleIncoming,
                ISNULL(SUM(CASE WHEN TRCODE = 4 THEN AMOUNT ELSE 0 END), 0) as totalHavaleOutgoing
            FROM ${lineTable}
            WHERE CANCELLED = 0 AND TRCODE IN (3, 4)
        `);

        // Daily movement for last 7 days chart
        const chartResult = await sql.query(`
            SELECT 
                CAST(DATE_ AS DATE) as date,
                SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE 0 END) as incoming,
                SUM(CASE WHEN SIGN = 1 THEN AMOUNT ELSE 0 END) as outgoing
            FROM ${lineTable}
            WHERE DATE_ >= DATEADD(day, -7, GETDATE()) AND CANCELLED = 0
            GROUP BY CAST(DATE_ AS DATE)
            ORDER BY date ASC
        `);

        res.json({
            stats: {
                ...result.recordset[0],
                ...clStats.recordset[0],
                ...havaleStats.recordset[0]
            },
            chart: chartResult.recordset
        });

    } catch (err) {
        console.error('❌ Bank Stats Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.getBankFinanceTransactions = async (req, res) => {
    try {
        const { firmNo, periodNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');
        const { type } = req.query; // 'pos', 'cc', 'havale'

        const clcardTable = `LG_${firm}_CLCARD`;
        const bankaccTable = `LG_${firm}_BANKACC`;
        const clfTable = `LG_${firm}_${period}_CLFLINE`;
        const bnfTable = `LG_${firm}_${period}_BNFLINE`;

        let query = '';
        if (type === 'pos' || type === 'cc') {
            const trcode = type === 'pos' ? 70 : 72;
            query = `
                SELECT 
                    L.LOGICALREF as id,
                    L.DATE_ as date,
                    L.TRCODE as trcode,
                    CASE 
                        WHEN L.TRCODE = 70 THEN 'Müşteri KK Tahsilatı (POS)'
                        WHEN L.TRCODE = 72 THEN 'Firma KK Harcaması'
                    END as type,
                    C.DEFINITION_ as clientName,
                    B.DEFINITION_ as bankAccount,
                    L.AMOUNT as amount,
                    L.SIGN as sign
                FROM ${clfTable} L
                LEFT JOIN ${clcardTable} C ON L.CLIENTREF = C.LOGICALREF
                LEFT JOIN ${bankaccTable} B ON L.BANKACCREF = B.LOGICALREF
                WHERE L.TRCODE = ${trcode} AND L.CANCELLED = 0
                ORDER BY L.DATE_ DESC
            `;
        } else if (type === 'havale-in' || type === 'havale-out') {
            const trcode = type === 'havale-in' ? 3 : 4;
            query = `
                SELECT 
                    L.LOGICALREF as id,
                    L.DATE_ as date,
                    L.TRCODE as trcode,
                    CASE 
                        WHEN L.TRCODE = 3 THEN 'Gelen Havale'
                        WHEN L.TRCODE = 4 THEN 'Gönderilen Havale'
                    END as type,
                    C.DEFINITION_ as clientName,
                    B.DEFINITION_ as bankAccount,
                    L.AMOUNT as amount,
                    L.SIGN as sign
                FROM ${bnfTable} L
                LEFT JOIN ${clcardTable} C ON L.CLIENTREF = C.LOGICALREF
                LEFT JOIN ${bankaccTable} B ON L.BNACCREF = B.LOGICALREF
                WHERE L.TRCODE = ${trcode} AND L.CANCELLED = 0
                ORDER BY L.DATE_ DESC
            `;
        } else {
            return res.status(400).json({ error: 'Geçersiz işlem tipi' });
        }

        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Bank Finance Transactions Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};
