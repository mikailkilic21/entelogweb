const { sql, getConfig, connectDB } = require('./server/src/config/db');

async function run() {
    try {
        await connectDB();
        const config = getConfig();
        // 113 / 01 based on previous defaults or current config.
        // getConfig might rely on ENV or default. 
        // Let's manually construct safely if getConfig fails or we can verify outputs.

        console.log("Connecting...");
        const table = `LG_${config.firmNo || '113'}_${config.periodNo || '01'}_CSCARD`;
        console.log("Target Table:", table);

        // Try getting one row
        const result = await sql.query(`SELECT TOP 1 * FROM ${table}`);
        if (result.recordset && result.recordset.length > 0) {
            console.log("Found row. Columns:", Object.keys(result.recordset[0]).join(', '));
        } else {
            console.log("No rows found. Checking schema...");
            const schemaRes = await sql.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${table}'`);
            console.log("Schema Columns:", schemaRes.recordset.map(r => r.COLUMN_NAME).join(', '));
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
