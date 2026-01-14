const { sql, connectDB, getConfig } = require('./src/config/db');

async function debugInvoiceTable() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;

        console.log(`🔎 Querying ${invoiceTable} for data...`);

        // Check columns to ensure it exists
        const query = `
            SELECT TOP 20 
                DATE_, 
                FICHENO, 
                TRCODE, 
                NETTOTAL 
            FROM ${invoiceTable}
            -- WHERE DATE_ >= CAST(GETDATE() AS DATE)
            ORDER BY DATE_ DESC
        `;

        const result = await sql.query(query);

        console.log(`\nFound ${result.recordset.length} records in INVOICE table for TODAY:`);
        console.table(result.recordset);

    } catch (err) {
        console.error("❌ SQL Error (Likely table doesn't exist or wrong name):", err.message);
    } finally {
        process.exit();
    }
}

debugInvoiceTable();
