const { sql, connectDB, getConfig } = require('./src/config/db');

async function checkTableStructure() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;

        console.log(`🔎 Checking structure of ${invoiceTable}...\n`);

        // Get column names
        const query = `
            SELECT TOP 1 * FROM ${invoiceTable}
        `;

        const result = await sql.query(query);

        if (result.recordset.length > 0) {
            console.log("Available columns:");
            console.log(Object.keys(result.recordset[0]).join(', '));
        }

    } catch (err) {
        console.error("❌ SQL Error:", err.message);
    } finally {
        process.exit();
    }
}

checkTableStructure();
