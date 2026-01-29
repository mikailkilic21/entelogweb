const { sql, connectDB } = require('./server/src/config/db');

async function checkTables() {
    try {
        await connectDB();

        // Query to find all STFICHE tables (Invoices/Slips) to identify active Firms/Periods
        const query = `
            SELECT '113' as Firm, TRCODE, COUNT(*) as Count FROM LG_113_01_INVOICE GROUP BY TRCODE
            UNION ALL
            SELECT '115' as Firm, TRCODE, COUNT(*) as Count FROM LG_115_01_INVOICE GROUP BY TRCODE
        `;

        console.log('--- Checking Invoice TRCODES (1,2,3=Purchase, 7,8,9=Sales) ---');
        const result = await sql.query(query);
        console.table(result.recordset);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

checkTables();
