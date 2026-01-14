const { sql, connectDB, getConfig } = require('./src/config/db');

async function debugInvoiceCount() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;

        console.log(`🔎 Checking ${invoiceTable} for today (2026-01-14)...`);

        // Check SQL Server Time
        const timeResult = await sql.query("SELECT GETDATE() as ServerTime, CAST(GETDATE() AS DATE) as ServerDate");
        console.log("🕒 SQL Server Time:", timeResult.recordset[0]);

        // Specific count for today
        const query = `
            SELECT 
                FICHENO, 
                TRCODE, 
                DATE_, 
                NETTOTAL 
            FROM ${invoiceTable}
            WHERE DATE_ >= '2026-01-14' AND DATE_ < '2026-01-15'
            ORDER BY FICHENO ASC
        `;

        const result = await sql.query(query);

        console.log(`\n📊 Record Count for 2026-01-14: ${result.recordset.length}`);
        if (result.recordset.length > 0) {
            console.table(result.recordset);
        }

    } catch (err) {
        console.error("❌ SQL Error:", err);
    } finally {
        process.exit();
    }
}

debugInvoiceCount();
