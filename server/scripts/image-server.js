/**
 * Entelog Product Image Server
 * ============================
 * Bu script SQL Server'ın çalıştığı makinede çalışır.
 * Stok resimlerini HTTP üzerinden servis eder.
 * 
 * Kullanım:
 *   node image-server.js
 * 
 * Veya özel port ve klasör ile:
 *   node image-server.js --port 3002 --dir "C:\Users\Administrator\Desktop\resim_indir"
 * 
 * Bu scripti her firmada SQL Server makinesine kopyalayıp çalıştırmanız yeterli.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// --- Configuration ---
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : defaultVal;
};

const PORT = parseInt(getArg('port', '3002'));
const IMAGE_DIR = getArg('dir', 'C:\\Users\\Administrator\\Desktop\\resim_indir');
const SUPPORTED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'];

// --- Image Cache ---
const imageCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Content type mapping
const CONTENT_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif'
};

/**
 * Pre-scan all subdirectories and build an index of stock code -> file path
 */
const buildImageIndex = () => {
    console.log(`📂 Resim dizini taranıyor: ${IMAGE_DIR}`);
    imageCache.clear();

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error(`❌ Dizin bulunamadı: ${IMAGE_DIR}`);
        return;
    }

    let totalImages = 0;

    // Scan root directory
    const rootFiles = fs.readdirSync(IMAGE_DIR, { withFileTypes: true });

    for (const entry of rootFiles) {
        if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (SUPPORTED_EXT.includes(ext)) {
                const stockCode = path.basename(entry.name, ext);
                imageCache.set(stockCode.toUpperCase(), path.join(IMAGE_DIR, entry.name));
                totalImages++;
            }
        } else if (entry.isDirectory()) {
            // Scan subdirectory
            const subDir = path.join(IMAGE_DIR, entry.name);
            try {
                const subFiles = fs.readdirSync(subDir, { withFileTypes: true });
                for (const subEntry of subFiles) {
                    if (subEntry.isFile()) {
                        const ext = path.extname(subEntry.name).toLowerCase();
                        if (SUPPORTED_EXT.includes(ext)) {
                            const stockCode = path.basename(subEntry.name, ext);
                            imageCache.set(stockCode.toUpperCase(), path.join(subDir, subEntry.name));
                            totalImages++;
                        }
                    }
                }
            } catch (e) {
                console.warn(`⚠️ Alt klasör okunamadı: ${subDir} - ${e.message}`);
            }
        }
    }

    console.log(`✅ ${totalImages} resim indexlendi (${imageCache.size} benzersiz stok kodu)`);
};

/**
 * Find image path for a stock code
 */
const findImage = (stockCode) => {
    const key = stockCode.toUpperCase();
    return imageCache.get(key) || null;
};

// --- HTTP Server ---
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsed = url.parse(req.url, true);
    const pathname = decodeURIComponent(parsed.pathname);

    // GET /image/:stockCode - Serve the image
    if (pathname.startsWith('/image/')) {
        const stockCode = pathname.replace('/image/', '').trim();

        if (!stockCode) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Stock code required' }));
            return;
        }

        const imagePath = findImage(stockCode);

        if (!imagePath || !fs.existsSync(imagePath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Image not found', stockCode }));
            return;
        }

        const ext = path.extname(imagePath).toLowerCase();
        const contentType = CONTENT_TYPES[ext] || 'image/jpeg';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400' // 24 hour cache
        });

        fs.createReadStream(imagePath).pipe(res);
        return;
    }

    // GET /check/:stockCode - Check if image exists
    if (pathname.startsWith('/check/')) {
        const stockCode = pathname.replace('/check/', '').trim();
        const imagePath = findImage(stockCode);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ exists: !!imagePath, stockCode }));
        return;
    }

    // GET /refresh - Re-scan image directory
    if (pathname === '/refresh') {
        buildImageIndex();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Index refreshed', totalImages: imageCache.size }));
        return;
    }

    // GET /stats - Show server stats
    if (pathname === '/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            imageDir: IMAGE_DIR,
            totalImages: imageCache.size,
            port: PORT
        }));
        return;
    }

    // GET / - Health check
    if (pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            service: 'Entelog Image Server',
            status: 'OK',
            images: imageCache.size
        }));
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

// --- Start ---
buildImageIndex();

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ╔══════════════════════════════════════════╗
    ║   📸 Entelog Image Server Çalışıyor!    ║
    ╚══════════════════════════════════════════╝
    
    🌐 Adres: http://0.0.0.0:${PORT}
    📂 Dizin: ${IMAGE_DIR}
    📊 Toplam Resim: ${imageCache.size}
    
    Endpoints:
      GET /image/{stockCode}  → Resim getir
      GET /check/{stockCode}  → Resim var mı kontrol
      GET /refresh            → Dizini yeniden tara
      GET /stats              → Sunucu durumu
    `);
});

// Refresh index every 30 minutes
setInterval(() => {
    console.log('🔄 Resim indexi yenileniyor...');
    buildImageIndex();
}, 30 * 60 * 1000);

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} kullanımda! Farklı port deneyin: node image-server.js --port 3003`);
    } else {
        console.error('❌ Sunucu hatası:', e.message);
    }
    process.exit(1);
});
