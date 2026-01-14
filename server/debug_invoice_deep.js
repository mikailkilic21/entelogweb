const { sql, connectDB, getConfig } = require('./src/config/db');

async function debugInvoiceDeepDive() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;
        const clcardTable = `LG_${firm}_CLCARD`;

        console.log(`🔎 Deep Dive on ${invoiceTable} for 2026-01-14...`);

        // Get details including TRCODE and implicit status columns if any
        const query = `
            SELECT 
                S.FICHENO, 
                S.TRCODE, 
                S.DATE_, 
                S.NETTOTAL,
                S.CANCELLED, -- Check if this column exists
                S.CLIENTREF,
                C.DEFINITION_ as CustomerName
            FROM ${invoiceTable} S
            LEFT JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
            WHERE S.DATE_ >= '2026-01-14' AND S.DATE_ < '2026-01-15'
        `;

        const result = await sql.query(query);

        console.log(`\nFound ${result.recordset.length} records:`);
        console.table(result.recordset);

    } catch (err) {
        console.error("❌ SQL Error:", err.message);
    } finally {
        process.exit();
    }
}

debugInvoiceDeepDive();
