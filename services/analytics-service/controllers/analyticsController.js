const axios = require('axios');

const COMPLAINT_SERVICE_URL = process.env.COMPLAINT_SERVICE_URL || 'http://complaint-service:5002';

// ─── GET /api/analytics/issues-by-type ───────────────────────────────────────
exports.issuesByType = async (req, res, next) => {
    try {
        const response = await axios.get(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/analytics/raw-data`, { timeout: 10000 });
        const data = response.data.data.issuesByType || [];

        const colorMap = {
            Pothole: '#ef4444',
            Garbage: '#f97316',
            Drainage: '#3b82f6',
            Streetlight: '#eab308',
            'Water Leakage': '#06b6d4',
            'Tree Fall': '#22c55e',
            'Illegal Parking': '#8b5cf6',
            Other: '#94a3b8',
        };

        const result = data.map((d) => ({ ...d, color: colorMap[d.type] || '#94a3b8' }));
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/status-breakdown ─────────────────────────────────────
exports.statusBreakdown = async (req, res, next) => {
    try {
        const response = await axios.get(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/analytics/raw-data`, { timeout: 10000 });
        const data = response.data.data.statusBreakdown || [];

        const colorMap = {
            Resolved: '#22c55e',
            'In Progress': '#8b5cf6',
            Assigned: '#3b82f6',
            Submitted: '#f59e0b',
        };

        const result = data.map((d) => ({ ...d, color: colorMap[d.name] || '#94a3b8' }));
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/hotspots ─────────────────────────────────────────────
exports.hotspots = async (req, res, next) => {
    try {
        const response = await axios.get(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/analytics/raw-data`, { timeout: 10000 });
        res.json({ success: true, data: response.data.data.hotspots || [] });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/monthly ─────────────────────────────────────────────
exports.monthly = async (req, res, next) => {
    try {
        const response = await axios.get(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/analytics/raw-data`, { timeout: 10000 });
        const data = response.data.data.monthly || [];

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const result = data.map((d) => ({
            month: monthNames[d._id.month - 1],
            complaints: d.complaints,
            resolved: d.resolved,
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/analytics/summary ──────────────────────────────────────────────
exports.summary = async (req, res, next) => {
    try {
        const response = await axios.get(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/analytics/raw-data`, { timeout: 10000 });
        res.json({ success: true, data: response.data.data.summary || {} });
    } catch (error) {
        next(error);
    }
};
