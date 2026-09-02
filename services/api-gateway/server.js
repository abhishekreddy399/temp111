require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

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

// Health check endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Downstream Microservice URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:5001';
const COMPLAINT_SERVICE_URL = process.env.COMPLAINT_SERVICE_URL || 'http://complaint-service:5002';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://admin-service:5003';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:5004';

// Proxy routes
app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
}));

app.use('/api/complaints', createProxyMiddleware({
    target: COMPLAINT_SERVICE_URL,
    changeOrigin: true,
}));

app.use('/api/admin', createProxyMiddleware({
    target: ADMIN_SERVICE_URL,
    changeOrigin: true,
}));

app.use('/api/analytics', createProxyMiddleware({
    target: ANALYTICS_SERVICE_URL,
    changeOrigin: true,
}));

// Fallback 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: `API Gateway: Route ${req.method} ${req.originalUrl} not found` });
});

// Proxy error handler
app.use((err, req, res, next) => {
    console.error('API Gateway Proxy Error:', err.message);
    res.status(502).json({
        success: false,
        message: 'Bad Gateway: Microservice communication failure',
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 CivicSense API Gateway running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Auth Service: ${AUTH_SERVICE_URL}`);
    console.log(`   Complaint Service: ${COMPLAINT_SERVICE_URL}`);
    console.log(`   Admin Service: ${ADMIN_SERVICE_URL}`);
    console.log(`   Analytics Service: ${ANALYTICS_SERVICE_URL}\n`);
});
