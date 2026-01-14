const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'config', 'db-config.json'), 'utf8'));

async function check() {
    try {
        const pool = await sql.connect(dbConfig);
        const stlineTable = `LG_${dbConfig.firmNo}_${dbConfig.periodNo}_STLINE`;

        // Önce herhangi bir satış hareketi var mı bakalım (TRCODE 7 veya 8)
        console.log(`Checking table: ${stlineTable}`);

        const res = await pool.request().query(`
            SELECT TOP 5 
                DATE_, TRCODE, LINETYPE, AMOUNT, TOTAL, STOCKREF, CANCELLED 
            FROM ${stlineTable} 
            WHERE TRCODE IN (7, 8) 
            ORDER BY DATE_ DESC
        `);

        console.log("Sales Transactions (Top 5):");
        console.log(JSON.stringify(res.recordset, null, 2));

        // Belirli bir stok için kontrol (Varsa)
        if (res.recordset.length > 0) {
            const stockRef = res.recordset[0].STOCKREF;
            console.log(`\nChecking specific stockRef: ${stockRef}`);
            const stockRes = await pool.request().query(`
                SELECT SUM(AMOUNT) as TotalQty, SUM(TOTAL) as TotalAmt 
                FROM ${stlineTable} 
                WHERE STOCKREF = ${stockRef} AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0
            `);
            console.log("Aggregates:", stockRes.recordset[0]);
        } else {
            console.log("\nNo sales transactions found with TRCODE 7 or 8.");

            // Başka TRCODE var mı?
            const anyTrans = await pool.request().query(`
                SELECT TOP 5 TRCODE, AMOUNT, TOTAL FROM ${stlineTable}
            `);
            console.log("Any Transactions:", anyTrans.recordset);
        }

        pool.close();
    } catch (e) {
        console.log("Error:", e.message);
    }
}
check();
