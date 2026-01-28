const { sql, getConfig, connectDB } = require('./src/config/db');

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

        console.log('--- TYPES ---');
        console.log(JSON.stringify(res.recordset, null, 2));

        try {
            const ccRes = await pool.query(`SELECT TOP 1 * FROM LG_${firm}_BNCREDITCARD`);
            console.log('--- CC COLS ---');
            if (ccRes.recordset.length > 0) {
                console.log(Object.keys(ccRes.recordset[0]).join(', '));
            }
        } catch (e) { }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

investigateTypes();
