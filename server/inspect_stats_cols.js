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
        const stfiche = `LG_${firm}_${period}_STFICHE`;
        const items = `LG_${firm}_ITEMS`;

        console.log('--- STFICHE Columns (Time related) ---');
        const colResult = await sql.query(`
            SELECT TOP 1 * FROM ${stfiche}
        `);
        const columns = Object.keys(colResult.recordset[0]);
        console.log(columns.filter(c => c.includes('TIME') || c.includes('HOUR') || c.includes('MIN')));

        console.log('\n--- Sample Product Names ---');
        const nameResult = await sql.query(`
            SELECT TOP 5 CODE, NAME, NAME2, NAME3 FROM ${items}
        `);
        console.table(nameResult.recordset);

    } catch (err) {
        console.error('SQL Error:', err.message);
    } finally {
        await sql.close();
    }
}

inspect();
