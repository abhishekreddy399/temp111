const axios = require('axios');

const COMPLAINT_SERVICE_URL = process.env.COMPLAINT_SERVICE_URL || 'http://complaint-service:5002';

// GET /api/admin/complaints
exports.getAllComplaints = async (req, res, next) => {
    try {
        const response = await axios.get(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/admin/complaints`, {
            params: req.query,
            timeout: 10000,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        next(error);
    }
};

// PATCH /api/admin/complaints/:id/status
exports.updateStatus = async (req, res, next) => {
    try {
        const response = await axios.patch(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/admin/${req.params.id}/status`, req.body, {
            timeout: 10000,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        next(error);
    }
};

// PATCH /api/admin/complaints/:id/assign
exports.assignDepartment = async (req, res, next) => {
    try {
        const response = await axios.patch(`${COMPLAINT_SERVICE_URL}/api/complaints/internal/admin/${req.params.id}/assign`, req.body, {
            timeout: 10000,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        next(error);
    }
};
