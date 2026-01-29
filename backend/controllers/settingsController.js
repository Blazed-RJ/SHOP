import Settings from '../models/Settings.js';
import QRCode from 'qrcode';

// @desc    Get settings
// @route   GET /api/settings
// @access  Private/Admin
export const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findById('shop_settings');

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({ _id: 'shop_settings' });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findById('shop_settings');

        if (!settings) {
            settings = await Settings.create({ _id: 'shop_settings', ...req.body });
        } else {
            Object.assign(settings, req.body);

            // Update image paths if uploaded
            if (req.files) {
                if (req.files.logo) {
                    settings.logo = `/uploads/${req.files.logo[0].filename}`;
                }
                if (req.files.digitalSignature) {
                    settings.digitalSignature = `/uploads/${req.files.digitalSignature[0].filename}`;
                }
                if (req.files.letterhead) {
                    settings.letterhead = `/uploads/${req.files.letterhead[0].filename}`;
                }
                if (req.files.profilePicture) {
                    settings.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
                }
            }

            await settings.save();
        }

        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Generate UPI QR code
// @route   POST /api/settings/generate-qr
// @access  Private/Admin
export const generateUPIQR = async (req, res) => {
    try {
        const { upiId, amount, name } = req.body;

        if (!upiId) {
            return res.status(400).json({ message: 'UPI ID is required' });
        }

        // UPI payment URL format
        let upiUrl = `upi://pay?pa=${upiId}`;
        if (name) upiUrl += `&pn=${encodeURIComponent(name)}`;
        if (amount) upiUrl += `&am=${amount}`;
        upiUrl += '&cu=INR';

        // Generate QR code as base64 data URL
        const qrCode = await QRCode.toDataURL(upiUrl);

        res.json({ qrCode, upiUrl });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload user avatar
// @route   POST /api/settings/avatar
// @access  Private
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Update user's avatar path
        req.user.avatar = `/uploads/${req.file.filename}`;
        await req.user.save();

        res.json({ avatar: req.user.avatar });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
