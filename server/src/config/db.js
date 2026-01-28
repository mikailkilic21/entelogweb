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
            },
            pool: {
                max: 10,
                min: 0,
                idleTimeoutMillis: 30000
            }
        };

        if (pool) {
            if (pool.connected) {
                return pool;
            }
            await pool.close();
        }

        pool = await sql.connect(sqlConfig);
        console.log('✅ Veritabanı bağlantısı başarılı');
        return pool;
    } catch (err) {
        console.error('❌ Veritabanı bağlantı hatası:', err.message);
        throw err;
    }
};

const getPool = () => pool;

// Simple in-memory cache
const cache = new Map();

const getCachedData = (key, ttlSeconds = 60) => {
    if (cache.has(key)) {
        const { data, expiry } = cache.get(key);
        if (Date.now() < expiry) {
            console.log(`⚡ Cache hit: ${key}`);
            return data;
        }
        cache.delete(key);
    }
    return null;
};

const setCachedData = (key, data, ttlSeconds = 60) => {
    cache.set(key, {
        data,
        expiry: Date.now() + (ttlSeconds * 1000)
    });
};

module.exports = { sql, connectDB, getPool, getConfig, getCachedData, setCachedData };
