const sql = require('mssql');
const config = {
    server: "192.168.1.200\\SQLEXPRESS",
    database: "LOGO_DB",
    user: "sa",
    password: "Logo.123",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkBalances() {
    try {
        await sql.connect(config);
        const firm = '113';
        const period = '01';
        const clcardTable = `LG_${firm}_CLCARD`;
        const clflineTable = `LG_${firm}_${period}_CLFLINE`;

        console.log('--- Analyze Balances ---');

        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN Balance > 0 THEN 1 ELSE 0 END) as positiveBalanceCount,
                SUM(CASE WHEN Balance < 0 THEN 1 ELSE 0 END) as negativeBalanceCount,
                SUM(CASE WHEN Balance = 0 THEN 1 ELSE 0 END) as zeroBalanceCount
            FROM (
                SELECT 
                     ISNULL((SELECT SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END) 
                     FROM ${clflineTable} 
                     WHERE CLIENTREF = C.LOGICALREF AND CANCELLED = 0), 0) as Balance
                FROM ${clcardTable} C
                WHERE C.CARDTYPE IN (1, 2, 3)
            ) as Sub
        `;

        const result = await sql.query(query);
        console.table(result.recordset);

        console.log('\n--- Sample Positive Balances (Debtors) ---');
        const sampleQuery = `
            SELECT TOP 5 Code, Balance 
            FROM (
                SELECT 
                     C.CODE as Code,
                     ISNULL((SELECT SUM(CASE WHEN SIGN = 0 THEN AMOUNT ELSE -AMOUNT END) 
                     FROM ${clflineTable} 
                     WHERE CLIENTREF = C.LOGICALREF AND CANCELLED = 0), 0) as Balance
                FROM ${clcardTable} C
                WHERE C.CARDTYPE IN (1, 2, 3)
            ) as Sub
            WHERE Balance > 0
            ORDER BY Balance DESC
        `;
        const sampleResult = await sql.query(sampleQuery);
        console.table(sampleResult.recordset);

    } catch (err) {
        console.error('SQL Error:', err.message);
    } finally {
        await sql.close();
    }
}

checkBalances();
