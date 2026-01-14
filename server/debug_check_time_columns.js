const sql = require('mssql');
const fs = require('fs');
const path = require('path');

// Load DB config
const dbConfigPath = path.join(__dirname, 'src', 'config', 'db-config.json');
const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));

// Connect and Query
async function checkTimeColumns() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Connected to Database');

        const tableName = `LG_${dbConfig.firmNo}_${dbConfig.periodNo}_INVOICE`;

        // Örnek bir kayıt çekip tüm kolonları görelim
        const result = await pool.request().query(`
            SELECT TOP 1 * FROM ${tableName} ORDER BY DATE_ DESC
        `);

        if (result.recordset.length > 0) {
            console.log('Sample Invoice Record Keys:');
            console.log(Object.keys(result.recordset[0]));

            // FTIME veya benzeri bir kolon var mı?
            const timeCols = Object.keys(result.recordset[0]).filter(k => k.includes('TIME') || k.includes('DATE'));
            console.log('\nPotential Time/Date Columns:', timeCols);

            // Time değerini görelim
            if (timeCols.includes('FTIME')) {
                console.log('FTIME Value:', result.recordset[0].FTIME);

                // FTIME formatını anlamak için birkaç örnek daha
                const timeSamples = await pool.request().query(`
                    SELECT TOP 5 DATE_, FTIME FROM ${tableName} ORDER BY DATE_ DESC
                `);
                console.log('\nTime Samples:', timeSamples.recordset);
            }

        } else {
            console.log('No records found in table.');
        }

        pool.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkTimeColumns();
