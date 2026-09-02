require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const corsOptions = {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/analytics/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'analytics-service',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/analytics', require('./routes/analytics'));

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `Analytics Service: Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`\n📊 CivicSense Analytics Service running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
});
