const { sql, connectDB, getConfig } = require('./src/config/db');

async function debugOrders() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';

        const orficheTable = `LG_${firm}_${period}_ORFICHE`;
        const orflineTable = `LG_${firm}_${period}_ORFLINE`;

        console.log(`Checking First 10 Orders in ${orficheTable}...`);

        // 1. Check raw content of ORFICHE to understand APPROVE values
        console.log('--- Sample ORFICHE Data ---');
        const checkQuery = `
            SELECT TOP 10 
                LOGICALREF, FICHENO, DATE_, TRCODE, STATUS, APPROVE, DOCODE
            FROM ${orficheTable}
            ORDER BY DATE_ DESC
        `;
        const checkResult = await sql.query(checkQuery);
        console.table(checkResult.recordset);

        // 2. Check APPROVE and STATUS column distribution
        console.log('--- APPROVE Column Distribution ---');
        const approveDist = await sql.query(`SELECT APPROVE, COUNT(*) as count FROM ${orficheTable} GROUP BY APPROVE`);
        console.table(approveDist.recordset);

        console.log('--- STATUS Column Distribution ---');
        const statusDist = await sql.query(`SELECT STATUS, COUNT(*) as count FROM ${orficheTable} GROUP BY STATUS`);
        console.table(statusDist.recordset);

        // 3. Check CLOSED column distribution in ORFLINE
        console.log('--- ORFLINE CLOSED Distribution ---');
        const closedDist = await sql.query(`SELECT CLOSED, COUNT(*) as count FROM ${orflineTable} GROUP BY CLOSED`);
        console.table(closedDist.recordset);

        // 5. Find a sample CLIENTREF and STOCKREF with Pending Approved Orders
        console.log('--- Sample IDs for Testing ---');
        const sampleQuery = `
            SELECT TOP 1 
                O.CLIENTREF as clientRef, 
                L.STOCKREF as stockRef,
                O.FICHENO as orderNo
            FROM ${orflineTable} L 
            JOIN ${orficheTable} O ON L.ORDFICHEREF = O.LOGICALREF 
            WHERE L.CLOSED = 0 AND O.STATUS = 4
        `;
        const sampleResult = await sql.query(sampleQuery);
        if (sampleResult.recordset.length > 0) {
            console.table(sampleResult.recordset);
        } else {
            console.log('No Pending Approved Orders found in the system!');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

debugOrders();
