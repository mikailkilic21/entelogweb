const fs = require('fs');
const path = require('path');

// Default image directory on the SQL Server machine
// This is local to entelog_api.exe since it runs on the same machine
const DEFAULT_IMAGE_DIR = 'C:\\Users\\Administrator\\Desktop\\resim_indir';
const SUPPORTED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];

// Content type mapping
const CONTENT_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif'
};

// In-memory index: stockCode (uppercase) -> full file path
let imageIndex = new Map();
let lastIndexTime = 0;
const INDEX_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get the image directory path
 * Checks db-config.json for custom path, falls back to default
 */
const getImageDir = () => {
    try {
        const { getConfig } = require('../config/db');
        const config = getConfig();
        return config.imageDir || DEFAULT_IMAGE_DIR;
    } catch {
        return DEFAULT_IMAGE_DIR;
    }
};

/**
 * Build the image index by scanning all subdirectories
 * Maps stock codes to file paths for fast lookup
 */
const buildIndex = () => {
    const imageDir = getImageDir();
    const newIndex = new Map();

    if (!fs.existsSync(imageDir)) {
        console.error(`❌ Resim dizini bulunamadı: ${imageDir}`);
        imageIndex = newIndex;
        lastIndexTime = Date.now();
        return;
    }

    try {
        const entries = fs.readdirSync(imageDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile()) {
                // Root level images
                const ext = path.extname(entry.name).toLowerCase();
                if (SUPPORTED_EXT.includes(ext)) {
                    const code = path.basename(entry.name, ext).toUpperCase();
                    newIndex.set(code, path.join(imageDir, entry.name));
                }
            } else if (entry.isDirectory()) {
                // Subdirectory (groups of 1000)
                const subDir = path.join(imageDir, entry.name);
                try {
                    const subFiles = fs.readdirSync(subDir, { withFileTypes: true });
                    for (const file of subFiles) {
                        if (file.isFile()) {
                            const ext = path.extname(file.name).toLowerCase();
                            if (SUPPORTED_EXT.includes(ext)) {
                                const code = path.basename(file.name, ext).toUpperCase();
                                newIndex.set(code, path.join(subDir, file.name));
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`⚠️ Alt klasör okunamadı: ${subDir}`);
                }
            }
        }

        imageIndex = newIndex;
        lastIndexTime = Date.now();
        console.log(`📸 Resim indexi güncellendi: ${imageIndex.size} resim bulundu`);

    } catch (err) {
        console.error('❌ Resim dizini tarama hatası:', err.message);
    }
};

/**
 * Ensure the index is fresh
 */
const ensureIndex = () => {
    if (Date.now() - lastIndexTime > INDEX_TTL || imageIndex.size === 0) {
        buildIndex();
    }
};

/**
 * Find an image path by stock code
 */
const findImage = (stockCode) => {
    ensureIndex();
    return imageIndex.get(stockCode.toUpperCase()) || null;
};

/**
 * GET /api/products/image/:stockCode
 * Serves the product image file
 */
exports.getProductImage = (req, res) => {
    try {
        const { stockCode } = req.params;

        if (!stockCode) {
            return res.status(400).json({ error: 'Stock code required' });
        }

        // Sanitize to prevent directory traversal
        const sanitized = stockCode.replace(/[\\\/\.]/g, '');
        const imagePath = findImage(sanitized);

        if (!imagePath || !fs.existsSync(imagePath)) {
            return res.status(404).json({ error: 'Image not found', stockCode: sanitized });
        }

        const ext = path.extname(imagePath).toLowerCase();
        const contentType = CONTENT_TYPES[ext] || 'image/jpeg';

        res.set({
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // 24 hours
            'X-Stock-Code': sanitized
        });

        const stream = fs.createReadStream(imagePath);
        stream.on('error', (err) => {
            if (!res.headersSent) {
                res.status(500).json({ error: 'Read error' });
            }
        });
        stream.pipe(res);

    } catch (err) {
        console.error('❌ getProductImage Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/products/image-check/:stockCode
 * Quick JSON check if image exists
 */
exports.checkProductImage = (req, res) => {
    try {
        const { stockCode } = req.params;
        const sanitized = stockCode.replace(/[\\\/\.]/g, '');
        const imagePath = findImage(sanitized);

        res.json({ exists: !!imagePath, stockCode: sanitized });
    } catch {
        res.json({ exists: false, stockCode: req.params.stockCode });
    }
};

/**
 * GET /api/products/image/clear-cache
 * Force re-scan the image directory
 */
exports.clearImageCache = (req, res) => {
    lastIndexTime = 0;
    buildIndex();
    res.json({
        message: 'Image cache refreshed',
        totalImages: imageIndex.size,
        imageDir: getImageDir()
    });
};
