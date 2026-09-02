const Complaint = require('../models/Complaint');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const { generateComplaintId, getPriorityFromType, buildTimeline } = require('../utils/generateId');
const { reverseGeocode } = require('../utils/geocode');
const { sendAcknowledgmentEmail, sendResolutionEmail } = require('../utils/emailService');

const STATUSES = ['Submitted', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Escalated'];

// ─── Helper: Upload buffer to Cloudinary ─────────────────────────────────────
const uploadToCloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'civicsense', resource_type: 'image', quality: 'auto' },
            (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });

// ─── POST /api/complaints ─────────────────────────────────────────────────────
exports.createComplaint = async (req, res, next) => {
    try {
        const { issueType, description, latitude, longitude, reporterEmail } = req.body;

        if (!issueType || !description || !latitude || !longitude) {
            return res.status(400).json({ success: false, message: 'Issue type, description, and location are required' });
        }

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        // ── Duplicate detection (same type within 100m, not yet resolved) ──
        const DUPLICATE_RADIUS_METERS = 100;
        const existing = await Complaint.findOne({
            issueType,
            status: { $ne: 'Resolved' },
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: DUPLICATE_RADIUS_METERS,
                },
            },
        });

        if (existing) {
            existing.upvotes += 1;
            await existing.save();
            return res.status(200).json({
                success: true,
                isDuplicate: true,
                message: 'A similar issue already exists nearby. We have upvoted it for you.',
                complaint: existing,
            });
        }

        const { address, area, city } = await reverseGeocode(lng, lat);

        let imageUrl = null, imagePublicId = null;
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.buffer);
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } catch (imgErr) {
                console.error('Cloudinary upload failed:', imgErr.message);
            }
        }

        const complaintId = generateComplaintId();
        const priority = getPriorityFromType(issueType);
        const timeline = buildTimeline('Submitted');

        const complaint = await Complaint.create({
            complaintId,
            title: req.body.title || `${issueType} in ${area || 'locality'}`,
            issueType,
            description,
            imageUrl,
            imagePublicId,
            location: { type: 'Point', coordinates: [lng, lat] },
            address,
            area: area || 'Unknown Area',
            city: city || 'Mumbai',
            priority,
            status: 'Submitted',
            timeline,
            reporterEmail: reporterEmail || null,
            createdBy: req.user?._id || req.user?.id || null,
            reportedBy: req.user?._id || req.user?.id || null,
        });

        if (reporterEmail) {
            sendAcknowledgmentEmail({ to: reporterEmail, complaintId, issueType, area, city }).catch(() => { });
        }

        res.status(201).json({
            success: true,
            isDuplicate: false,
            message: 'Complaint submitted successfully',
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/complaints/report ─────────────────────────────────────────────
exports.reportComplaint = async (req, res, next) => {
    try {
        const { title, issueType, description, latitude, longitude, reporterEmail } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required' });
        }

        const cleanTitle = title.trim();
        const cleanType = (issueType || 'Other').trim();

        let complaint = await Complaint.findOne({
            title: { $regex: new RegExp(`^${cleanTitle}$`, 'i') },
            issueType: cleanType
        });

        if (complaint) {
            if (complaint.reportCount >= 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum reporting limit reached for this issue (3 times).',
                });
            }
            complaint.reportCount += 1;

            if (complaint.reportCount === 3) {
                complaint.status = 'Escalated';
                complaint.escalated = true;
                if (complaint.timeline) {
                    complaint.timeline.push({
                        step: 'Escalated',
                        date: new Date(),
                        done: true
                    });
                }
            }

            await complaint.save();
            return res.status(200).json({
                success: true,
                message: complaint.reportCount === 3
                    ? 'Issue report count increased and ESCALATED!'
                    : 'Issue report count increased.',
                complaint,
            });
        }

        const lat = parseFloat(latitude) || 31.3264;
        const lng = parseFloat(longitude) || 75.5760;
        const { address, area, city } = await reverseGeocode(lng, lat);

        let imageUrl = null, imagePublicId = null;
        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.buffer);
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } catch (imgErr) {
                console.error('Cloudinary upload failed:', imgErr.message);
            }
        }

        const complaintId = generateComplaintId();
        const priority = getPriorityFromType(cleanType);
        const timeline = buildTimeline('Submitted');

        complaint = await Complaint.create({
            complaintId,
            title,
            issueType: cleanType,
            description,
            imageUrl,
            imagePublicId,
            location: { type: 'Point', coordinates: [lng, lat] },
            address,
            area: area || 'Unknown Area',
            city: city || 'Mumbai',
            priority,
            status: 'Pending',
            timeline,
            reporterEmail: reporterEmail || req.user?.email,
            reportedBy: req.user?._id || req.user?.id || null,
            createdBy: req.user?._id || req.user?.id || null,
            reportCount: 1,
        });

        res.status(201).json({
            success: true,
            message: 'Complaint reported successfully',
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// ─── PUT /api/complaints/escalate/:id ────────────────────────────────────────
exports.escalateComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        if (complaint.reportCount < 3) {
            return res.status(400).json({
                success: false,
                message: 'Complaint can only be escalated after 3 repeated reports.',
            });
        }

        complaint.status = 'Escalated';
        complaint.escalated = true;

        if (complaint.timeline) {
            complaint.timeline.push({ step: 'Escalated', date: new Date(), done: true });
        }

        await complaint.save();

        res.status(200).json({
            success: true,
            message: 'Complaint escalated successfully',
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/admin/escalated ──────────────────────────────────────
exports.getEscalatedComplaints = async (req, res, next) => {
    try {
        const complaints = await Complaint.find({ escalated: true })
            .populate('reportedBy', 'name email')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            count: complaints.length,
            complaints,
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/:complaintId ─────────────────────────────────────────
exports.getComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOne({ complaintId: req.params.complaintId })
            .populate('createdBy', 'name email')
            .populate('reportedBy', 'name email');

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found. Please check the ID and try again.' });
        }

        res.json({ success: true, complaint });
    } catch (error) {
        next(error);
    }
};

// ─── POST /api/complaints/:complaintId/upvote ─────────────────────────────────
exports.upvoteComplaint = async (req, res, next) => {
    try {
        const complaint = await Complaint.findOneAndUpdate(
            { complaintId: req.params.complaintId },
            { $inc: { upvotes: 1 } },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({ success: true, upvotes: complaint.upvotes, message: 'Upvoted successfully' });
    } catch (error) {
        next(error);
    }
};

// ─── GET /api/complaints/nearby ───────────────────────────────────────────────
exports.getNearbyComplaints = async (req, res, next) => {
    try {
        const { lat, lng, radius = 500, status } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng are required' });
        }

        const filter = {
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius),
                },
            },
        };
        if (status) filter.status = status;

        const complaints = await Complaint.find(filter).limit(20);
        res.json({ success: true, count: complaints.length, complaints });
    } catch (error) {
        next(error);
    }
};

// ═════════════════════════════════════════════════════════════════════════════
// INTERNAL SERVICE-TO-SERVICE ENDPOINTS (Admin & Analytics Services)
// ═════════════════════════════════════════════════════════════════════════════

// Internal: GET /api/complaints/internal/admin/complaints
exports.internalGetAllComplaints = async (req, res, next) => {
    try {
        const { status, priority, search, sort = '-createdAt', page = 1, limit = 100 } = req.query;

        const filter = {};
        if (status && status !== 'All') filter.status = status;
        if (priority && priority !== 'All') filter.priority = priority;
        if (search) {
            filter.$or = [
                { complaintId: { $regex: search, $options: 'i' } },
                { issueType: { $regex: search, $options: 'i' } },
                { area: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Complaint.countDocuments(filter);
        const complaints = await Complaint.find(filter)
            .sort(sort)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate('reportedBy', 'name email');

        const stats = await Complaint.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const statsMap = {};
        stats.forEach(({ _id, count }) => { statsMap[_id] = count; });

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            stats: {
                total,
                pending: (statsMap['Submitted'] || 0) + (statsMap['Pending'] || 0),
                assigned: statsMap['Assigned'] || 0,
                inProgress: statsMap['In Progress'] || 0,
                resolved: statsMap['Resolved'] || 0,
                escalated: statsMap['Escalated'] || 0,
                highPriority: await Complaint.countDocuments({ priority: 'High' }),
            },
            complaints,
        });
    } catch (error) {
        next(error);
    }
};

// Internal: PATCH /api/complaints/internal/admin/:id/status
exports.internalUpdateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!STATUSES.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${STATUSES.join(', ')}` });
        }

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        const statusIdx = STATUSES.indexOf(status);
        const updatedTimeline = STATUSES.map((step, i) => ({
            step,
            date: i <= statusIdx ? (complaint.timeline[i]?.date || new Date()) : null,
            done: i <= statusIdx,
        }));

        complaint.status = status;
        complaint.timeline = updatedTimeline;

        let emailSent = false;
        if (status === 'Resolved' && complaint.reporterEmail && !complaint.emailNotified) {
            emailSent = await sendResolutionEmail({
                to: complaint.reporterEmail,
                complaintId: complaint.complaintId,
                issueType: complaint.issueType,
                area: complaint.area,
                city: complaint.city,
                department: complaint.assignedDepartment,
            });
            if (emailSent) complaint.emailNotified = true;
        }

        await complaint.save();

        res.json({
            success: true,
            message: `Status updated to "${status}"${emailSent ? ' — Resolution email sent to citizen' : ''}`,
            complaint,
            emailSent,
        });
    } catch (error) {
        next(error);
    }
};

// Internal: PATCH /api/complaints/internal/admin/:id/assign
exports.internalAssignDepartment = async (req, res, next) => {
    try {
        const { department } = req.body;
        if (!department) {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }

        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            {
                assignedDepartment: department,
                status: 'Assigned',
                $set: {
                    'timeline.0.done': true,
                    'timeline.0.date': new Date(),
                    'timeline.1.done': true,
                    'timeline.1.date': new Date(),
                },
            },
            { new: true }
        );

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        res.json({
            success: true,
            message: `Assigned to ${department}`,
            complaint,
        });
    } catch (error) {
        next(error);
    }
};

// Internal: GET /api/complaints/internal/analytics/raw-data
exports.internalGetAnalyticsData = async (req, res, next) => {
    try {
        const typeAggregation = await Complaint.aggregate([
            { $group: { _id: '$issueType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, type: '$_id', count: 1 } },
        ]);

        const statusAggregation = await Complaint.aggregate([
            { $group: { _id: '$status', value: { $sum: 1 } } },
            { $project: { _id: 0, name: '$_id', value: 1 } },
        ]);

        const hotspotsAggregation = await Complaint.aggregate([
            {
                $group: {
                    _id: '$area',
                    complaints: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $ne: ['$status', 'Resolved'] }, 1, 0] } },
                },
            },
            { $sort: { complaints: -1 } },
            { $limit: 10 },
            { $project: { _id: 0, area: '$_id', complaints: 1, resolved: 1, pending: 1 } },
        ]);

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyAggregation = await Complaint.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    complaints: { $sum: 1 },
                    resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        const [total, resolved, highPriority, areas] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: 'Resolved' }),
            Complaint.countDocuments({ priority: 'High' }),
            Complaint.distinct('area'),
        ]);

        const avgResolution = await Complaint.aggregate([
            { $match: { status: 'Resolved' } },
            {
                $project: {
                    days: {
                        $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24],
                    },
                },
            },
            { $group: { _id: null, avg: { $avg: '$days' } } },
        ]);

        res.json({
            success: true,
            data: {
                issuesByType: typeAggregation,
                statusBreakdown: statusAggregation,
                hotspots: hotspotsAggregation,
                monthly: monthlyAggregation,
                summary: {
                    totalComplaints: total,
                    resolvedIssues: resolved,
                    avgResolutionDays: avgResolution[0]?.avg?.toFixed(1) || 0,
                    areasCovered: areas.length,
                    highPriority,
                    resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0,
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
