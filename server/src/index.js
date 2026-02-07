// Polyfill for AbortSignal.any which is missing in older Node versions < 20.3
if (typeof AbortSignal !== 'undefined' && !AbortSignal.any) {
    AbortSignal.any = (signals) => {
        const controller = new AbortController();
        // If any signal is already aborted, abort immediately
        for (const signal of signals) {
            if (signal.aborted) {
                controller.abort(signal.reason);
                return controller.signal;
            }
        }
        // Listener to abort the controller when any signal triggers
        const onAbort = (event) => {
            controller.abort(event.target.reason);
            // Cleanup listeners
            for (const signal of signals) {
                signal.removeEventListener('abort', onAbort);
            }
        };
        // Add listeners
        for (const signal of signals) {
            signal.addEventListener('abort', onAbort);
        }
        return controller.signal;
    };
}

const express = require('express');
const cors = require('cors');
const http = require('http'); // HTTP Server for Socket.IO
const { Server } = require("socket.io"); // Socket.IO
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app); // Wrap Express with HTTP Server

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins (mobile app)
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files like uploaded logos

// Socket.IO Connection Event
io.on('connection', (socket) => {
    console.log('🔌 Yeni bir kullanıcı bağlandı:', socket.id);
    socket.on('disconnect', () => {
        console.log('🔌 Kullanıcı ayrıldı:', socket.id);
    });
});

// Middleware to inject io instance into req
app.use((req, res, next) => {
    req.io = io;
    next();
});

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

// Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   ✅ Logo Go Wings API Çalışıyor!    ║
    ║   ⚡ Socket.IO Aktif (Canlı Veri)    ║
    ╚════════════════════════════════════════╝
    
    🌐 API: http://localhost:${PORT}/api
    🔌 Socket: http://localhost:${PORT}
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
