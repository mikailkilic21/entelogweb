const { sql, connectDB, getConfig } = require('./src/config/db');

async function debugSpecificInvoice() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;

        const targetFicheNo = 'YKS2026000000222';
        console.log(`🔎 Looking for invoice ${targetFicheNo} in ${invoiceTable}...`);

        const query = `
            SELECT 
                LOGICALREF,
                DATE_, 
                FICHENO, 
                TRCODE, 
                NETTOTAL,
                CANCELLED,
                CLIENTREF
            FROM ${invoiceTable}
            WHERE FICHENO = '${targetFicheNo}'
        `;

        const result = await sql.query(query);

        if (result.recordset.length === 0) {
            console.log("❌ Invoice NOT FOUND in database!");
        } else {
            console.log("✅ Invoice FOUND:");
            console.log(JSON.stringify(result.recordset[0], null, 2));
        }

    } catch (err) {
        console.error("❌ SQL Error:", err.message);
    } finally {
        process.exit();
    }
}

debugSpecificInvoice();
