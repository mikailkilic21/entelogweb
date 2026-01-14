const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'config', 'db-config.json'), 'utf8'));

async function check() {
    try {
        const pool = await sql.connect(dbConfig);
        const table = `LG_${dbConfig.firmNo}_${dbConfig.periodNo}_INVOICE`;

        // Sadece kolon isimlerini alalım
        const res = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '${table}'
            AND (COLUMN_NAME LIKE '%TIME%' OR COLUMN_NAME LIKE '%DATE%' OR COLUMN_NAME LIKE '%HOUR%' OR COLUMN_NAME LIKE '%MINUTE%')
        `);

        console.log("Time related columns:");
        res.recordset.forEach(row => console.log(row.COLUMN_NAME));

        pool.close();
    } catch (e) {
        console.log("Error:", e.message);
    }
}
check();
