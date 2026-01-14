const { sql, connectDB, getConfig } = require('./src/config/db');

async function testTodayInvoices() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '115';
        const period = config.periodNo || '01';
        const invoiceTable = `LG_${firm}_${period}_INVOICE`;
        const clcardTable = `LG_${firm}_CLCARD`;

        console.log(`🔎 Testing query that controller uses for TODAY...`);
        console.log(`Table: ${invoiceTable}`);
        console.log(`Date filter: >= CAST(GETDATE() AS DATE)`);
        console.log(`TRCODE filter: IN (1, 2, 3, 7, 8, 9)\n`);

        // Exact query from controller
        const query = `
            SELECT TOP 50
                S.LOGICALREF as id,
                S.FICHENO as ficheNo,
                S.DATE_ as date,
                S.TRCODE as trcode,
                CASE 
                    WHEN S.TRCODE IN (1, 2, 3) THEN 'Alış'
                    WHEN S.TRCODE IN (7, 8, 9) THEN 'Satış'
                    ELSE 'Diğer'
                END as type,
                C.DEFINITION_ as customer,
                C.CODE as customerCode,
                S.NETTOTAL as amount
            FROM ${invoiceTable} S
            LEFT JOIN ${clcardTable} C ON S.CLIENTREF = C.LOGICALREF
            WHERE S.DATE_ >= CAST(GETDATE() AS DATE)
              AND S.TRCODE IN (1, 2, 3, 7, 8, 9)
            ORDER BY S.DATE_ DESC, S.FICHENO DESC
        `;

        const result = await sql.query(query);

        console.log(`✅ Query returned ${result.recordset.length} records:\n`);
        console.table(result.recordset);

    } catch (err) {
        console.error("❌ SQL Error:", err.message);
    } finally {
        process.exit();
    }
}

testTodayInvoices();
