const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files like uploaded logos

// Routes
app.use('/api', apiRoutes);

// Error Handling (Must be last)
app.use(errorHandler);

// Connect to Database and start server
connectDB().then(() => {
    console.log('✅ Veritabanı bağlantısı başarılı');
}).catch(err => {
    console.error('❌ Veritabanı bağlantı hatası (Sunucu yine de başlatılıyor):', err.message);
});

const server = app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   ✅ Logo Go Wings API Çalışıyor!    ║
    ╚════════════════════════════════════════╝
    
    🌐 Test: http://localhost:${PORT}/api/test
    📦 Fişler: http://localhost:${PORT}/api/invoices
    📊 İstatistikler: http://localhost:${PORT}/api/stats
    `);
});

server.on('error', (e) => {
    console.error('❌ Server Başlatma Hatası:', e);
    // If port is in use, exit so we know it failed
    if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} kullanımda!`);
        process.exit(1);
    }
});
