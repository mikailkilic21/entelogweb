const { sql, getConfig, connectDB } = require('./src/config/db');

async function investigateTypes() {
    try {
        const pool = await connectDB();
        const { firmNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');

        console.log('--- BANKACC CARDTYPE Counts ---');
        const res = await pool.query(`
            SELECT CARDTYPE, COUNT(*) as total 
            FROM LG_${firm}_BANKACC 
            GROUP BY CARDTYPE
        `);
        console.table(res.recordset);

        console.log('\n--- BNCREDITCARD Columns ---');
        try {
            const ccRes = await pool.query(`SELECT TOP 1 * FROM LG_${firm}_BNCREDITCARD`);
            if (ccRes.recordset.length > 0) {
                console.log(Object.keys(ccRes.recordset[0]).join(', '));
            } else {
                console.log('Table LG_XXX_BNCREDITCARD exists but is empty.');
            }
        } catch (e) {
            console.log('Table LG_XXX_BNCREDITCARD MISSING.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

investigateTypes();
