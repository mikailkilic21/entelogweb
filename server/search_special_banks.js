const { sql, getConfig, connectDB } = require('./src/config/db');

async function searchSpecialNames() {
    try {
        const pool = await connectDB();
        const { firmNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');

        const res = await pool.query(`
            SELECT * FROM LG_${firm}_BANKACC 
            WHERE DEFINITION_ LIKE '%POS%' 
               OR DEFINITION_ LIKE '%KREDİ KARTI%'
               OR CODE LIKE '%POS%'
               OR CODE LIKE '%KK%'
        `);
        console.log(JSON.stringify(res.recordset, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

searchSpecialNames();
