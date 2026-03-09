const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// @route   POST api/complaints
// @desc    Create a new complaint
// @access  Private (Citizen)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'citizen' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only citizens can report issues' });
        }

        const { title, description, category, location, image } = req.body;

        const newComplaint = new Complaint({
            title,
            description,
            category,
            location,
            citizenId: req.user.id,
            reportImage: image || null
        });

        const complaint = await newComplaint.save();
        res.json({ success: true, complaint });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/complaints
// @desc    Get all complaints (Filter based on role)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        let complaints;

        if (req.user.role === 'admin') {
            // Admins see everything
            complaints = await Complaint.find()
                .populate('citizenId', ['firstName', 'lastName'])
                .populate('officerId', ['firstName', 'lastName'])
                .sort({ createdAt: -1 });

        } else if (req.user.role === 'officer') {
            // Officers see pending (live) tasks AND their own active/resolved tasks
            complaints = await Complaint.find({
                $or: [
                    { status: 'Pending' },
                    { officerId: req.user.id }
                ]
            })
            .populate('citizenId', ['firstName', 'lastName'])
            .sort({ createdAt: -1 });

        } else {
            // Citizens only see their own complaints
            complaints = await Complaint.find({ citizenId: req.user.id })
            .sort({ createdAt: -1 });
        }

        res.json({ success: true, complaints });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/complaints/:id/accept
// @desc    Officer accepts a pending complaint task
// @access  Private (Officer)
router.put('/:id/accept', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ error: 'Only officers can accept tasks' });
        }

        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
        if (complaint.status !== 'Pending') return res.status(400).json({ error: 'Task is already accepted or resolved' });

        // Update state
        complaint.status = 'Active';
        complaint.officerId = req.user.id;
        
        await complaint.save();
        res.json({ success: true, message: 'Task accepted successfully', complaint });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/complaints/:id/resolve
// @desc    Officer submits proof and resolves the task
// @access  Private (Officer)
router.put('/:id/resolve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'officer') {
            return res.status(403).json({ error: 'Only officers can resolve tasks' });
        }

        const { proofImage, resolutionNote } = req.body;
        
        let complaint = await Complaint.findById(req.params.id);

        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
        if (complaint.officerId.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized for this task' });
        if (complaint.status !== 'Active') return res.status(400).json({ error: 'Task must be active to be resolved' });

        // Update complaint
        complaint.status = 'Resolved';
        complaint.proofImage = proofImage || null;
        // In reality we'd save resolution note to DB, skipping here for schema simplicity
        
        await complaint.save();

        // ** REWARD SYSTEM **
        // Add bounty to officer's earnings
        const officer = await User.findById(req.user.id);
        officer.earnings += complaint.bounty;
        await officer.save();

        res.json({ 
            success: true, 
            message: 'Task resolved! Bounty added to your earnings.', 
            complaint,
            newEarnings: officer.earnings
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
