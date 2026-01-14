const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'config', 'db-config.json'), 'utf8'));

async function check() {
    try {
        const pool = await sql.connect(dbConfig);
        const firm = dbConfig.firmNo || '113';
        const period = dbConfig.periodNo || '01';

        const itemsTable = `LG_${firm}_ITEMS`;
        const stlineTable = `LG_${firm}_${period}_STLINE`;

        const productCode = '57001001';
        console.log(`Checking Product: ${productCode}`);

        // 1. Ürünün LogicalRef'ini bul
        const itemRes = await pool.request().query(`SELECT LOGICALREF, CODE, NAME FROM ${itemsTable} WHERE CODE = '${productCode}'`);

        if (itemRes.recordset.length === 0) {
            console.log("Product NOT FOUND in ITEMS table.");
            pool.close();
            return;
        }

        const stockRef = itemRes.recordset[0].LOGICALREF;
        console.log(`Product Found. LOGICALREF: ${stockRef}`);

        // 2. STLINE tablosunda bu ürünle ilgili tüm hareketleri getir
        const stlineRes = await pool.request().query(`
            SELECT TOP 20 DATE_, TRCODE, LINETYPE, AMOUNT, TOTAL, CANCELLED 
            FROM ${stlineTable} 
            WHERE STOCKREF = ${stockRef}
            ORDER BY DATE_ DESC
        `);

        console.log("Transactions:");
        console.table(stlineRes.recordset);

        // 3. Controller sorgusunun aynısını sadece bu ürün için çalıştır
        const query = `
            SELECT 
                (SELECT SUM(AMOUNT) FROM ${stlineTable} WHERE STOCKREF = ${stockRef} AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0) as salesQuantity,
                (SELECT SUM(TOTAL) FROM ${stlineTable} WHERE STOCKREF = ${stockRef} AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0) as salesAmount
        `;
        const ctrlRes = await pool.request().query(query);
        console.log("Controller Logic Result:", ctrlRes.recordset[0]);

        pool.close();

    } catch (err) {
        console.error('Error:', err.message);
    }
}
check();
