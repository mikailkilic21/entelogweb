const { connectDB, sql } = require('../src/config/db');

async function listFirms() {
    console.log('Fetching Firms from L_CAPIFIRM...');
    try {
        await connectDB();
        // L_CAPIFIRM is usually in the main DB, but sometimes it depends on installation key.
        // We assume LOGO_DB is the correct DB.
        const result = await sql.query('SELECT NR, NAME FROM L_CAPIFIRM ORDER BY NR');

        if (result.recordset.length === 0) {
            console.log('No firms found in L_CAPIFIRM.');
        } else {
            console.log('--- AVAILABLE FIRMS ---');
            result.recordset.forEach(f => {
                console.log(`FIRM NO: ${f.NR} - NAME: ${f.NAME}`);
            });
        }
        process.exit(0);
    } catch (err) {
        console.error('FAILED to fetch firms:', err.message);
        // Fallback: Check if table exists
        process.exit(1);
    }
}

listFirms();
