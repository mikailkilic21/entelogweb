const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'config', 'db-config.json'), 'utf8'));

async function check() {
    try {
        const pool = await sql.connect(dbConfig);
        const table = `LG_${dbConfig.firmNo}_${dbConfig.periodNo}_INVOICE`;

        const res = await pool.request().query(`
            SELECT TOP 5 DATE_, TIME_, CAPIBLOCK_CREATEDHOUR, CAPIBLOCK_CREADEDDATE, FICHENO 
            FROM ${table} 
            ORDER BY DATE_ DESC
        `);

        console.log("Values:");
        console.table(res.recordset);

        pool.close();
    } catch (e) {
        console.log("Error:", e.message);
    }
}
check();
