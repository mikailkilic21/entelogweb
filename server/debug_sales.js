const { sql, connectDB, getConfig } = require('./src/config/db');

async function debugRecentSales() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const stficheTable = `LG_${firm}_${period}_STFICHE`;

        console.log(`🔎 Querying ${stficheTable} for LAST 10 SALES (TRCODE 7,8,9)...`);

        const query = `
            SELECT TOP 10
                DATE_, 
                FICHENO, 
                TRCODE, 
                NETTOTAL
            FROM ${stficheTable}
            WHERE TRCODE IN (7, 8, 9)
            ORDER BY DATE_ DESC, FICHENO DESC
        `;

        const result = await sql.query(query);

        if (result.recordset.length === 0) {
            console.log("❌ No sales invoices found in the database!");
        } else {
            console.log(`\nFound ${result.recordset.length} recent sales invoices:`);
            console.table(result.recordset);
        }

    } catch (err) {
        console.error("❌ SQL Error:", err);
    } finally {
        process.exit();
    }
}

debugRecentSales();
