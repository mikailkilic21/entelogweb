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

async function test() {
    try {
        await sql.connect(config);
        const firm = '113';
        const period = '01';
        const table = `LG_${firm}_${period}_CSCARD`;

        console.log('--- Total Check Counts by Year ---');
        const query = `
            SELECT 
                YEAR(DUEDATE) as year,
                COUNT(*) as count
            FROM ${table}
            WHERE DOC IN (1, 2)
            GROUP BY YEAR(DUEDATE)
            ORDER BY year
        `;
        const result = await sql.query(query);
        console.table(result.recordset);

        console.log('\n--- Status Breakdown for 2026 ---');
        const statusQuery = `
            SELECT 
                CURRSTAT as status,
                COUNT(*) as count
            FROM ${table}
            WHERE DOC IN (1, 2) AND YEAR(DUEDATE) = 2026
            GROUP BY CURRSTAT
            ORDER BY CURRSTAT
        `;
        const statusResult = await sql.query(statusQuery);
        console.table(statusResult.recordset);

    } catch (err) {
        console.error('SQL Error:', err.message);
    } finally {
        await sql.close();
    }
}

test();
