const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { sql, getPool, connectDB } = require('../config/db');

// Detect if running in a packaged environment (pkg)
const isPkg = typeof process.pkg !== 'undefined';

// Paths relative to executable in production, or source in dev
const DB_PATH = isPkg
    ? path.join(path.dirname(process.execPath), 'data/company-db.json')
    : path.join(__dirname, '../../data/company-db.json');

// Ensure data directory calls
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Uploads also need to be external in prod
        const uploadDir = isPkg
            ? path.join(path.dirname(process.execPath), 'public/uploads')
            : path.join(__dirname, '../../public/uploads');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Use a fixed name or unique name. Fixed name 'company-logo' + ext allows easy replacement
        const ext = path.extname(file.originalname);
        cb(null, 'company-logo' + ext);
    }
});

const upload = multer({ storage: storage });

// Helper to read DB
const readDB = () => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return {};
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading settings DB:', error);
        return {};
    }
};

// Helper to write DB
const writeDB = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4));
        return true;
    } catch (error) {
        console.error('Error writing settings DB:', error);
        return false;
    }
};

const getSettings = (req, res) => {
    const data = readDB();
    res.json(data);
};

const updateSettings = (req, res) => {
    const currentData = readDB();
    const newData = { ...currentData, ...req.body };

    // Protect logoPath from being overwritten by text update if not provided
    if (req.body.logoPath === undefined) {
        newData.logoPath = currentData.logoPath;
    }

    if (writeDB(newData)) {
        res.json({ success: true, data: newData });
    } else {
        res.status(500).json({ error: 'Failed to save settings' });
    }
};

const uploadLogo = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const currentData = readDB();
    // Path relative to server public folder for frontend access
    const logoPath = `/uploads/${req.file.filename}`;

    const newData = { ...currentData, logoPath };

    if (writeDB(newData)) {
        res.json({ success: true, logoPath });
    } else {
        res.status(500).json({ error: 'Failed to update logo path' });
    }
};

// DB Config Handling
const DB_CONFIG_PATH = isPkg
    ? path.join(path.dirname(process.execPath), 'db-config.json')
    : path.join(__dirname, '../config/db-config.json');

const getDbSettings = async (req, res) => {
    try {
        if (!fs.existsSync(DB_CONFIG_PATH)) {
            // Return default structure if file missing
            return res.json({
                server: '',
                database: '',
                user: '',
                password: '',
                firmNo: '',
                periodNo: ''
            });
        }
        const data = fs.readFileSync(DB_CONFIG_PATH, 'utf8');
        // Handle BOM if present
        const cleanData = data.replace(/^\uFEFF/, '');
        const config = JSON.parse(cleanData);

        // Fetch Firm Name from SQL if configured
        if (config.firmNo && getPool()) {
            try {
                // Ensure firmNo is padded to 3 digits (e.g. 1 -> 001, 115 -> 115) just in case, though usually stored as is
                // Actually NR is int in L_CAPIFIRM mostly, but let's query safely
                const result = await getPool().request()
                    .input('firmNo', sql.Int, parseInt(config.firmNo))
                    .query('SELECT NAME FROM L_CAPIFIRM WHERE NR = @firmNo');

                if (result.recordset && result.recordset.length > 0) {
                    config.firmName = result.recordset[0].NAME;
                }
            } catch (sqlErr) {
                console.error("Firm name fetch error:", sqlErr.message);
                // Don't fail the whole request, just proceed without name
            }
        }

        res.json(config);
    } catch (error) {
        console.error('Error reading DB config:', error);
        res.status(500).json({ error: 'Failed to read DB config' });
    }
};

const updateDbSettings = (req, res) => {
    try {
        const newData = req.body;
        fs.writeFileSync(DB_CONFIG_PATH, JSON.stringify(newData, null, 4));
        res.json({ success: true, message: 'Veritabanı ayarları güncellendi' });
    } catch (error) {
        console.error('Error writing DB config:', error);
        res.status(500).json({ error: 'Failed to save DB config' });
    }
};

const getFirms = async (req, res) => {
    try {
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const result = await pool.request()
            .query('SELECT NR as nr, NAME as name FROM L_CAPIFIRM ORDER BY NR');

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching firms:', error);
        res.status(500).json({ error: 'Failed to fetch firms' });
    }
};



const switchDbConfig = async (req, res) => {
    try {
        const { firmNo, periodNo } = req.body;

        if (!firmNo || !periodNo) {
            return res.status(400).json({ error: 'firmNo and periodNo are required' });
        }

        // Read current config
        const currentConfig = JSON.parse(fs.readFileSync(DB_CONFIG_PATH, 'utf8').replace(/^\uFEFF/, ''));

        // Update firm and period
        currentConfig.firmNo = firmNo;
        currentConfig.periodNo = periodNo;

        // Save updated config
        fs.writeFileSync(DB_CONFIG_PATH, JSON.stringify(currentConfig, null, 4));

        // FORCE RECONNECT: Close existing pool and reconnect with new config
        const pool = getPool();
        if (pool) {
            await pool.close();
        }
        await connectDB();

        res.json({ success: true, message: 'Firma ve dönem güncellendi', config: currentConfig });
    } catch (error) {
        console.error('Error switching DB config:', error);
        res.status(500).json({ error: 'Failed to switch firm/period' });
    }
};

const getFirmPeriods = async (req, res) => {
    try {
        const { firmNo } = req.params;
        const pool = getPool();
        if (!pool) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const result = await pool.request()
            .input('firmNo', sql.Int, parseInt(firmNo))
            .query(`
                SELECT 
                    NR as nr, 
                    BEGDATE as beginDate,
                    ENDDATE as endDate
                FROM L_CAPIPERIOD 
                WHERE FIRMNR = @firmNo 
                ORDER BY NR
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching firm periods:', error);
        res.status(500).json({ error: 'Failed to fetch periods' });
    }
};

/**
 * GET /api/settings/browse-folders?path=C:\
 * Lists subdirectories at the given path for the folder picker
 * Supports both local paths (C:\folder) and UNC paths (\\server\share)
 */
const browseFolders = (req, res) => {
    try {
        let targetPath = req.query.path || '';

        // If no path provided, list available drives
        if (!targetPath) {
            const drives = [];
            // Check common Windows drive letters
            for (const letter of 'CDEFGHIJ') {
                const drive = `${letter}:\\`;
                try {
                    if (fs.existsSync(drive)) {
                        drives.push({ name: `${letter}:`, path: drive, type: 'drive' });
                    }
                } catch { /* skip inaccessible drives */ }
            }
            return res.json({ currentPath: '', items: drives, parent: null });
        }

        // Check if it's a UNC path
        const isUNC = targetPath.startsWith('\\\\');

        // Normalize path - preserve UNC format
        if (isUNC) {
            // Clean up extra slashes but keep UNC prefix
            targetPath = '\\\\' + targetPath.slice(2).replace(/\//g, '\\');
            // Remove trailing backslash unless it's the share root
            if (targetPath.endsWith('\\') && targetPath.split('\\').filter(Boolean).length > 2) {
                targetPath = targetPath.slice(0, -1);
            }
        } else {
            targetPath = path.resolve(targetPath);
        }

        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ error: 'Yol bulunamadı: ' + targetPath, path: targetPath });
        }

        const stat = fs.statSync(targetPath);
        if (!stat.isDirectory()) {
            return res.status(400).json({ error: 'Bu bir klasör değil', path: targetPath });
        }

        const entries = fs.readdirSync(targetPath, { withFileTypes: true });
        const items = [];
        let imageCount = 0;

        for (const entry of entries) {
            if (entry.isDirectory()) {
                // Skip hidden/system folders
                if (entry.name.startsWith('.') || entry.name.startsWith('$') || entry.name === 'System Volume Information') continue;

                items.push({
                    name: entry.name,
                    path: path.join(targetPath, entry.name),
                    type: 'folder'
                });
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'].includes(ext)) {
                    imageCount++;
                }
            }
        }

        // Sort folders alphabetically
        items.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

        // Parent path - handle UNC root correctly
        let parent = null;
        if (isUNC) {
            const parts = targetPath.split('\\').filter(Boolean);
            // \\server\share = 2 parts, don't go higher than share root
            if (parts.length > 2) {
                parent = '\\\\' + parts.slice(0, parts.length - 1).join('\\');
            }
            // If at share root (\\server\share), parent goes back to drive list
            // parent stays null
        } else {
            const parentPath = path.dirname(targetPath);
            parent = parentPath !== targetPath ? parentPath : null;
        }

        res.json({
            currentPath: targetPath,
            items,
            parent,
            imageCount
        });

    } catch (err) {
        console.error('Browse folders error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getSettings,
    updateSettings,
    uploadLogo,
    uploadMiddleware: upload.single('logo'),
    getDbSettings,
    updateDbSettings,
    getFirms,
    switchDbConfig,
    getFirmPeriods,
    browseFolders
};

