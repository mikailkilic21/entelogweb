const errorHandler = (err, req, res, next) => {
    // Log the full error for server admins
    console.error(`❌ [SERVER ERROR] ${req.method} ${req.url}:`, err);

    // Determine status code (default 500)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Force JSON response
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Sunucu hatası oluştu',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Show stack in dev only
        errorType: err.name || 'Server Error'
    });
};

module.exports = errorHandler;
