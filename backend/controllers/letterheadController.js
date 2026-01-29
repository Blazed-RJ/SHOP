import Letterhead from '../models/Letterhead.js';
import Settings from '../models/Settings.js';

// Helper: Generate Letterhead Number (LH-YYYY-001)
const generateLetterheadNumber = async () => {
    const today = new Date();
    const year = today.getFullYear();

    const lastDoc = await Letterhead.findOne({
        letterheadNo: { $regex: `LH-${year}-` }
    }).sort({ createdAt: -1 });

    if (lastDoc) {
        const lastNum = parseInt(lastDoc.letterheadNo.split('-')[2]);
        return `LH-${year}-${String(lastNum + 1).padStart(3, '0')}`;
    }
    return `LH-${year}-001`;
};

// @desc    Create new letterhead
// @route   POST /api/letterheads
// @access  Private
export const createLetterhead = async (req, res) => {
    try {
        const { recipient, subject, content, status } = req.body;

        const letterheadNo = await generateLetterheadNumber();

        // Snapshot current settings
        const settings = await Settings.findOne({ _id: 'shop_settings' });
        const configSnapshot = settings ? {
            ...settings.letterheadConfig,
            brandColor: settings.brandColor,
            logo: settings.logo
        } : {};

        const letterhead = await Letterhead.create({
            letterheadNo,
            recipient,
            subject,
            content,
            status: status || 'Draft',
            configSnapshot,
            createdBy: req.user._id
        });

        res.status(201).json(letterhead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all letterheads
// @route   GET /api/letterheads
// @access  Private
export const getLetterheads = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query = {
                $or: [
                    { subject: { $regex: search, $options: 'i' } },
                    { 'recipient.name': { $regex: search, $options: 'i' } },
                    { letterheadNo: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const letterheads = await Letterhead.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name');

        res.json(letterheads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get letterhead by ID
// @route   GET /api/letterheads/:id
// @access  Private
export const getLetterheadById = async (req, res) => {
    try {
        const letterhead = await Letterhead.findById(req.params.id)
            .populate('createdBy', 'name');

        if (!letterhead) {
            return res.status(404).json({ message: 'Letterhead not found' });
        }

        res.json(letterhead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update letterhead
// @route   PUT /api/letterheads/:id
// @access  Private
export const updateLetterhead = async (req, res) => {
    try {
        const { recipient, subject, content, status } = req.body;

        const letterhead = await Letterhead.findById(req.params.id);
        if (!letterhead) {
            return res.status(404).json({ message: 'Letterhead not found' });
        }

        letterhead.recipient = recipient || letterhead.recipient;
        letterhead.subject = subject || letterhead.subject;
        letterhead.content = content || letterhead.content;
        letterhead.status = status || letterhead.status;

        const updatedLetterhead = await letterhead.save();
        res.json(updatedLetterhead);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete letterhead
// @route   DELETE /api/letterheads/:id
// @access  Private
export const deleteLetterhead = async (req, res) => {
    try {
        const letterhead = await Letterhead.findById(req.params.id);
        if (!letterhead) {
            return res.status(404).json({ message: 'Letterhead not found' });
        }

        await Letterhead.deleteOne({ _id: letterhead._id });
        res.json({ message: 'Letterhead deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
