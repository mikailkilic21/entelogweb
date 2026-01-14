const { sql, connectDB, getConfig } = require('./src/config/db');

async function testQuery() {
    try {
        await connectDB();
        const config = getConfig();
        const firm = config.firmNo || '113';
        const period = config.periodNo || '01';

        console.log(`Testing query for Firm: ${firm}, Period: ${period}`);

        const itemsTable = `LG_${firm}_ITEMS`;
        const gntotstTable = `LG_${firm}_${period}_GNTOTST`;

        const query = `
            SELECT 
                (SELECT COUNT(*) FROM ${itemsTable} WHERE ACTIVE = 0) as totalProducts,
                (SELECT COUNT(*) FROM ${gntotstTable} WHERE ONHAND > 0 AND INVENNO = -1) as productsInStock,
                (SELECT COUNT(*) FROM ${gntotstTable} WHERE ONHAND < 0 AND INVENNO = -1) as criticalStock
        `;

        console.log('Executing query...');
        await sql.query(query);
        console.log('Query successful!');

    } catch (err) {
        console.error('❌ SQL Error:', err.message);
    }
}

testQuery();
