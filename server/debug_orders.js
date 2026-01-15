const { sql, connectDB, getConfig } = require('./src/config/db');

async function testOrders() {
    try {
        await connectDB();
        const config = getConfig();
        console.log('Config:', config);

        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';
        const orficheTable = `LG_${firm}_${period}_ORFICHE`;
        const clcardTable = `LG_${firm}_CLCARD`;

        console.log(`Querying ${orficheTable}...`);

        // Query 1: Check total count without filters
        const countResult = await sql.query(`SELECT COUNT(*) as count FROM ${orficheTable}`);
        console.log('Total Orders in Table:', countResult.recordset[0].count);

        // Query 2: Check TRCODEs (Transaction Codes)
        const trcodeResult = await sql.query(`SELECT TRCODE, COUNT(*) as count FROM ${orficheTable} GROUP BY TRCODE`);
        console.log('Orders by TRCODE:', trcodeResult.recordset);
        // TRCODE 1: Giving Order (Alım Siparişi) - Wait, usually 1 is Sales Order in some contexts or Purchase? 
        // Let's verify standard Logo codes:
        // 1: Alınan Sipariş (Sales Order)
        // 2: Verilen Sipariş (Purchase Order)

        // Query 3: Check STATUS
        const statusResult = await sql.query(`SELECT STATUS, COUNT(*) as count FROM ${orficheTable} WHERE TRCODE = 1 GROUP BY STATUS`);
        console.log('Sales Orders (TRCODE=1) by STATUS:', statusResult.recordset);

        // Query 4: Sample Data
        const sampleResult = await sql.query(`
            SELECT TOP 5 
                LOGICALREF, FICHENO, DATE_, TRCODE, STATUS, NETTOTAL 
            FROM ${orficheTable} 
            ORDER BY DATE_ DESC
        `);
        console.log('Sample Orders:', sampleResult.recordset);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

testOrders();
