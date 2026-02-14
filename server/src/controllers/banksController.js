const { sql, getConfig, connectDB } = require('../config/db');

exports.getBanks = async (req, res) => {
    try {
        await connectDB();
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
        await connectDB();
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

        // Checks in Bank stats (Status 3: Tahsil, 6: Teminat)
        const cscardTable = `LG_${firm}_${period}_CSCARD`;
        const checkStats = await sql.query(`
            SELECT 
                ISNULL(SUM(AMOUNT), 0) as totalChecksInBank
            FROM ${cscardTable}
            WHERE CURRSTAT IN (3, 6)
        `);

        res.json({
            stats: {
                ...result.recordset[0],
                ...clStats.recordset[0],
                ...havaleStats.recordset[0],
                ...checkStats.recordset[0]
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
        await connectDB();
        const { firmNo, periodNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');
        const { type } = req.query; // 'pos', 'cc', 'havale', 'checks-in-bank'

        const clcardTable = `LG_${firm}_CLCARD`;
        const bankaccTable = `LG_${firm}_BANKACC`;
        const clfTable = `LG_${firm}_${period}_CLFLINE`;
        const bnfTable = `LG_${firm}_${period}_BNFLINE`;
        const cscardTable = `LG_${firm}_${period}_CSCARD`;

        let query = '';
        if (type === 'pos' || type === 'cc') {
            const trcode = type === 'pos' ? 70 : 72;
            query = `
                SELECT 
                    clf.LOGICALREF as id,
                    clf.DATE_ as date,
                    clf.TRCODE as trcode,
                    CASE 
                        WHEN clf.TRCODE = 70 THEN 'Müşteri KK Tahsilatı (POS)'
                        WHEN clf.TRCODE = 72 THEN 'Firma KK Harcaması'
                    END as type,
                    cl.DEFINITION_ as clientName,
                    ba.DEFINITION_ as bankAccount,
                    clf.AMOUNT as amount,
                    clf.SIGN as sign,
                    clf.LINEEXP as description,
                    clf.TRANNO as ficheNo,
                    clf.SPECODE as speCode
                FROM ${clfTable} clf
                LEFT JOIN ${clcardTable} cl ON clf.CLIENTREF = cl.LOGICALREF
                LEFT JOIN ${bankaccTable} ba ON clf.BANKACCREF = ba.LOGICALREF
                WHERE clf.TRCODE = ${trcode} AND clf.CANCELLED = 0
                ORDER BY clf.DATE_ DESC
            `;
        } else if (type === 'havale-in' || type === 'havale-out') {
            const trcode = type === 'havale-in' ? 3 : 4;
            query = `
                SELECT 
                    bnf.LOGICALREF as id,
                    bnf.DATE_ as date,
                    bnf.TRCODE as trcode,
                    CASE 
                        WHEN bnf.TRCODE = 3 THEN 'Gelen Havale'
                        WHEN bnf.TRCODE = 4 THEN 'Gönderilen Havale'
                    END as type,
                    cl.DEFINITION_ as clientName,
                    ba.DEFINITION_ as bankAccount,
                    bnf.AMOUNT as amount,
                    bnf.SIGN as sign,
                    bnf.LINEEXP as description,
                    bnf.TRANNO as ficheNo,
                    bnf.SPECODE as speCode
                FROM ${bnfTable} bnf
                LEFT JOIN ${clcardTable} cl ON bnf.CLIENTREF = cl.LOGICALREF
                LEFT JOIN ${bankaccTable} ba ON bnf.BNACCREF = ba.LOGICALREF
                WHERE bnf.TRCODE = ${trcode} AND bnf.CANCELLED = 0
                ORDER BY bnf.DATE_ DESC
            `;
        } else if (type === 'checks-in-bank') {
            // Checks currently in bank (Status 3 or 6)
            query = `
                SELECT 
                    cs.LOGICALREF as id,
                    cs.DUEDATE as date,
                    1 as trcode, -- Dummy for type mapping
                    CASE 
                        WHEN cs.CURRSTAT = 3 THEN 'Bankada (Tahsil)'
                        WHEN cs.CURRSTAT = 6 THEN 'Bankada (Teminat)'
                        ELSE 'Çek'
                    END as type,
                    cs.BANKNAME as bankAccount, -- Issuer Bank as proxy or Bank Name
                    cs.OWING as clientName,
                    cs.AMOUNT as amount,
                    0 as sign, -- Asset
                    cs.NEWSERINO as description, 
                    cs.PORTFOYNO as ficheNo,
                    '' as speCode
                FROM ${cscardTable} cs
                WHERE cs.CURRSTAT IN (3, 6)
                ORDER BY cs.DUEDATE ASC
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
