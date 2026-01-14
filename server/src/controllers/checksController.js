const { sql, getConfig } = require('../config/db');

exports.getPayrollDetails = async (req, res) => {
    try {
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const cslinesTable = `LG_${firm}_${period}_CSLINES`;
        const cscardTable = `LG_${firm}_CSCARD`;

        const { id } = req.params; // This is the ROLLREF (Payroll ID)

        const query = `
            SELECT 
                L.LOGICALREF as id,
                C.PORTFOLIONO as portfolioNo,
                C.NEWSERI as serialNo,
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
