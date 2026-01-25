const sql = require('mssql');
const config = {
    server: "192.168.1.200\\SQLEXPRESS",
    database: "LOGO_DB",
    user: "sa",
    password: "Logo.123",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function inspect() {
    try {
        await sql.connect(config);
        const firm = '113';
        const period = '01';
        const stlineTable = `LG_${firm}_${period}_STLINE`;
        const srvcardTable = `LG_${firm}_SRVCARD`;

        console.log('--- Checking LINETYPE Distribution ---');
        const countQuery = `
            SELECT LINETYPE, COUNT(*) as count 
            FROM ${stlineTable} 
            GROUP BY LINETYPE
            ORDER BY LINETYPE
        `;
        const countResult = await sql.query(countQuery);
        console.table(countResult.recordset);

        console.log('\n--- Checking SRVCARD Table ---');
        try {
            const srvResult = await sql.query(`SELECT TOP 5 LOGICALREF, DEFINITION_ FROM ${srvcardTable}`);
            console.table(srvResult.recordset);
        } catch (e) {
            console.log('SRVCARD table error:', e.message);
        }

        console.log('\n--- Sample Service Line ---');
        const sampleService = await sql.query(`
            SELECT TOP 1 L.LOGICALREF, L.STOCKREF, L.LINETYPE 
            FROM ${stlineTable} L 
            WHERE L.LINETYPE = 4
        `);
        console.table(sampleService.recordset);

    } catch (err) {
        console.error('SQL Error:', err.message);
    } finally {
        await sql.close();
    }
}

inspect();
