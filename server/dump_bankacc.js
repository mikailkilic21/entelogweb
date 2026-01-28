const { sql, getConfig, connectDB } = require('./src/config/db');
const fs = require('fs');

async function dumpAccount() {
    try {
        const pool = await connectDB();
        const { firmNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const table = `LG_${firm}_BANKACC`;

        const res = await pool.query(`SELECT TOP 1 * FROM ${table}`);
        if (res.recordset.length > 0) {
            fs.writeFileSync('bankacc_row.json', JSON.stringify(res.recordset[0], null, 2));
            console.log('✅ bankacc_row.json created');
        } else {
            console.log('❌ BANKACC is empty');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

dumpAccount();
