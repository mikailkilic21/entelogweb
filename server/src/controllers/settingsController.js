const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { sql, getPool } = require('../config/db');

const DB_PATH = path.join(__dirname, '../../data/company-db.json');

// Ensure data directory calls
if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../public/uploads');
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
const DB_CONFIG_PATH = path.join(__dirname, '../config/db-config.json');

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

module.exports = {
    getSettings,
    updateSettings,
    uploadLogo,
    uploadMiddleware: upload.single('logo'),
    getDbSettings,
    updateDbSettings
};
