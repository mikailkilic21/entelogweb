const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'config', 'db-config.json'), 'utf8'));

async function check() {
    try {
        const pool = await sql.connect(dbConfig);
        const table = `LG_${dbConfig.firmNo}_${dbConfig.periodNo}_INVOICE`;
        // Sadece FTIME kolonunu seçmeye çalışalım, hata verirse yok demektir.
        const res = await pool.request().query(`SELECT TOP 5 DATE_, FTIME, FICHENO FROM ${table} ORDER BY DATE_ DESC`);
        console.log("FTIME Exists. Values:", res.recordset);
        pool.close();
    } catch (e) {
        console.log("Error:", e.message);
    }
}
check();
