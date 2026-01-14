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
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;
        const stlineTable = `LG_${firm}_${period}_STLINE`; // Check this table name format
        const prclistTable = `LG_${firm}_PRCLIST`;

        console.log(`STLINE Table: ${stlineTable}`);

        // Controller'daki sorgunun aynısı (biraz basitleştirilmiş, sadece ilk 5 ürün)
        // WHERE I.ACTIVE = 0 

        const query = `
            WITH ProductStats AS (
                SELECT TOP 5
                    I.LOGICALREF as id,
                    I.CODE,
                    I.NAME,
                    -- Sales Quantity (Toplam Satış Miktarı)
                    (SELECT SUM(AMOUNT) FROM ${stlineTable} WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0) as rawSalesQty,
                    -- Sales Amount
                    (SELECT SUM(TOTAL) FROM ${stlineTable} WHERE STOCKREF = I.LOGICALREF AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0) as rawSalesAmt
                FROM ${itemsTable} I
                WHERE I.ACTIVE = 0
            )
            SELECT * FROM ProductStats
        `;

        const result = await pool.request().query(query);
        console.log("Controller Query Result (Top 5):");
        console.log(JSON.stringify(result.recordset, null, 2));

        // Hiç satış yoksa, veritabanındaki rastgele bir satış kaydının STOCKREF'ini bulup ona bakalım
        const randomSale = await pool.request().query(`SELECT TOP 1 STOCKREF, AMOUNT, TOTAL FROM ${stlineTable} WHERE TRCODE IN (7, 8)`);
        if (randomSale.recordset.length > 0) {
            const stockRef = randomSale.recordset[0].STOCKREF;
            console.log(`\nDirect Check for STOCKREF ${stockRef}:`);
            const specificCheck = await pool.request().query(`
                SELECT 
                    (SELECT SUM(AMOUNT) FROM ${stlineTable} WHERE STOCKREF = ${stockRef} AND TRCODE IN (7, 8) AND LINETYPE = 0 AND CANCELLED = 0) as WithFilters,
                    (SELECT SUM(AMOUNT) FROM ${stlineTable} WHERE STOCKREF = ${stockRef}) as NoFilters,
                    (SELECT SUM(AMOUNT) FROM ${stlineTable} WHERE STOCKREF = ${stockRef} AND TRCODE IN (7, 8)) as OnlyTRCODE
                
            `);
            console.log(specificCheck.recordset[0]);
        }

        pool.close();

    } catch (err) {
        console.error('Error:', err.message);
    }
}
check();
