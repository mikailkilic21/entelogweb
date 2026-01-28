const { sql, getConfig, connectDB } = require('./src/config/db');
const fs = require('fs');

async function investigateTypes() {
    try {
        const pool = await connectDB();
        const { firmNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');

        const res = await pool.query(`
            SELECT CARDTYPE, COUNT(*) as total 
            FROM LG_${firm}_BANKACC 
            GROUP BY CARDTYPE
        `);

        const data = {
            types: res.recordset
        };

        try {
            const ccRes = await pool.query(`SELECT TOP 1 * FROM LG_${firm}_BNCREDITCARD`);
            if (ccRes.recordset.length > 0) {
                data.ccCols = Object.keys(ccRes.recordset[0]);
            }
        } catch (e) { }

        fs.writeFileSync('cc_investigation.json', JSON.stringify(data, null, 2));
        console.log('✅ cc_investigation.json created');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

investigateTypes();
