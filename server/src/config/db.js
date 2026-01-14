const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'db-config.json');

const getConfig = () => {
    try {
        if (fs.existsSync(configPath)) {
            const raw = fs.readFileSync(configPath, 'utf8');
            // Remove BOM if present
            const cleanRaw = raw.replace(/^\uFEFF/, '');
            return JSON.parse(cleanRaw);
        }
    } catch (e) {
        console.error('Config okuma hatası:', e);
    }
    // Fallback default
    return {
        server: 'YSERVER\\SQLEXPRESS',
        database: 'LOGO_DB',
        user: 'sa',
        password: 'Logo.123',
        encrypt: false,
        trustServerCertificate: true
    };
};

let pool = null;

const connectDB = async () => {
    try {
        const savedConfig = getConfig();
        const sqlConfig = {
            server: savedConfig.server,
            database: savedConfig.database,
            user: savedConfig.user,
            password: savedConfig.password,
            options: {
                encrypt: savedConfig.encrypt,
                trustServerCertificate: savedConfig.trustServerCertificate
            }
        };

        // Close existing pool if any
        if (pool) {
            await pool.close();
        }

        pool = await sql.connect(sqlConfig);
        console.log('✅ Veritabanı bağlantısı başarılı');
        return pool;
    } catch (err) {
        console.error('❌ Veritabanı bağlantı hatası:', err.message);
        // Don't exit process, just throw so controller can catch
        throw err;
    }
};

const getPool = () => pool;

module.exports = { sql, connectDB, getPool, getConfig };
