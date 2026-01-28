const { sql, getConfig, connectDB } = require('./src/config/db');
const fs = require('fs');

async function dumpFirstRow() {
    try {
        const pool = await connectDB();
        const { firmNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const cardTable = `LG_${firm}_BNCARD`;

        const res = await pool.query(`SELECT TOP 1 * FROM ${cardTable}`);
        if (res.recordset.length > 0) {
            fs.writeFileSync('bncard_row.json', JSON.stringify(res.recordset[0], null, 2));
            console.log('✅ bncard_row.json created');
        } else {
            console.log('❌ BNCARD is empty');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

dumpFirstRow();
