const { sql, getConfig, connectDB } = require('./src/config/db');
const fs = require('fs');

async function investigateHavale() {
    try {
        const pool = await connectDB();
        const { firmNo, periodNo } = await getConfig();
        const firm = firmNo.toString().padStart(3, '0');
        const period = periodNo.toString().padStart(2, '0');
        const table = `LG_${firm}_${period}_BNFLINE`;
        const clcardTable = `LG_${firm}_CLCARD`;

        console.log(`Checking Havale in ${table}...`);
        const res = await pool.query(`
            SELECT TOP 5 
                L.LOGICALREF, L.DATE_, L.TRCODE, L.AMOUNT, L.SIGN, 
                C.DEFINITION_ as clientName,
                L.LINEEXP
            FROM ${table} L
            LEFT JOIN ${clcardTable} C ON L.CLIENTREF = C.LOGICALREF
            WHERE L.TRCODE IN (3, 4)
            ORDER BY L.DATE_ DESC
        `);
        fs.writeFileSync('havale_investigation.json', JSON.stringify(res.recordset, null, 2));
        console.log('✅ havale_investigation.json created');

    } catch (err) {
        console.error(err.message);
    } finally {
        process.exit();
    }
}

investigateHavale();
