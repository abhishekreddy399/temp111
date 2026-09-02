const express = require('express');
const router = express.Router();
const {
    createComplaint,
    getComplaint,
    upvoteComplaint,
    getNearbyComplaints,
    reportComplaint,
    escalateComplaint,
    getEscalatedComplaints,
    internalGetAllComplaints,
    internalUpdateStatus,
    internalAssignDepartment,
    internalGetAnalyticsData,
} = require('../controllers/complaintController');
const { protect, adminOnly, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Internal Service-to-Service routes (for Admin Service & Analytics Service)
router.get('/internal/admin/complaints', internalGetAllComplaints);
router.patch('/internal/admin/:id/status', internalUpdateStatus);
router.patch('/internal/admin/:id/assign', internalAssignDepartment);
router.get('/internal/analytics/raw-data', internalGetAnalyticsData);

// Complaint Escalation Routes
router.post('/report', protect, upload.single('image'), reportComplaint);
router.put('/escalate/:id', protect, escalateComplaint);
router.get('/admin/escalated', protect, adminOnly, getEscalatedComplaints);

// Public routes
router.get('/nearby', getNearbyComplaints);
router.get('/:complaintId', getComplaint);
router.post('/:complaintId/upvote', upvoteComplaint);

// Legacy/Standard Create — optional auth
router.post('/', optionalAuth, upload.single('image'), createComplaint);

module.exports = router;
