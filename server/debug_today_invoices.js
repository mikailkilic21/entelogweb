const { sql, connectDB, getConfig } = require('./src/config/db');

async function debugInvoices() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const stficheTable = `LG_${firm}_${period}_STFICHE`;

        console.log(`🔎 Querying ${stficheTable} for invoices from TODAY...`);

        const query = `SELECT GETDATE() as ServerDate`;
        const result = await sql.query(query);
        console.log("SQL Server Time:", result.recordset[0].ServerDate);

        const result = await sql.query(query);

        console.log(`\nFound ${result.recordset.length} records for TODAY:`);
        console.log(JSON.stringify(result.recordset, null, 2));

    } catch (err) {
        console.error("❌ SQL Error:", err);
    } finally {
        process.exit();
    }
}

debugInvoices();
