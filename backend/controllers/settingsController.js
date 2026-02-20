import Settings from '../models/Settings.js';
import QRCode from 'qrcode';

// @desc    Get settings
// @route   GET /api/settings
// @access  Private/Admin (Staff can view)
export const getSettings = async (req, res) => {
    try {
        // Staff should see Owner's settings
        let settings = await Settings.findOne({ user: req.user.ownerId });

        // Create default settings if none exist
        if (!settings) {
            settings = await Settings.create({ user: req.user.ownerId });
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
        console.log('updateSettings called with body:', req.body);
        console.log('updateSettings files:', req.files);

        // Admin only, so ownerId === _id usually
        let settings = await Settings.findOne({ user: req.user.ownerId });

        if (!settings) {
            settings = await Settings.create({ user: req.user.ownerId, ...req.body });
        } else {
            // Handle invoiceTemplate merge manually to avoid overwriting nested defaults
            if (req.body.invoiceTemplate) {
                const { invoiceTemplate } = req.body;

                // Ensure invoiceTemplate object exists
                if (!settings.invoiceTemplate) {
                    settings.invoiceTemplate = {};
                }

                // 1. Update primitive fields directly
                if (invoiceTemplate.templateId) settings.invoiceTemplate.templateId = invoiceTemplate.templateId;
                if (invoiceTemplate.customTemplateContent !== undefined) settings.invoiceTemplate.customTemplateContent = invoiceTemplate.customTemplateContent;
                if (invoiceTemplate.accentColorOverride !== undefined) settings.invoiceTemplate.accentColorOverride = invoiceTemplate.accentColorOverride;

                // 2. Update fieldOrder (arrays are usually replaced)
                if (invoiceTemplate.fieldOrder) settings.invoiceTemplate.fieldOrder = invoiceTemplate.fieldOrder;

                // 3. Deep merge fieldVisibility
                if (invoiceTemplate.fieldVisibility) {
                    if (!settings.invoiceTemplate.fieldVisibility) {
                        settings.invoiceTemplate.fieldVisibility = {};
                    }

                    for (const [key, value] of Object.entries(invoiceTemplate.fieldVisibility)) {
                        settings.invoiceTemplate.fieldVisibility[key] = value;
                    }
                }

                // 4. Update customHtmlTemplates
                if (invoiceTemplate.customHtmlTemplates) {
                    settings.invoiceTemplate.customHtmlTemplates = invoiceTemplate.customHtmlTemplates;
                }

                // Remove invoiceTemplate from req.body to prevent Object.assign from overwriting it again
                delete req.body.invoiceTemplate;
            }

            // Handle letterheadConfig deep merge manually so individual margin fields
            // don't get reset to Mongoose schema defaults by Object.assign
            if (req.body.letterheadConfig) {
                const { letterheadConfig } = req.body;

                if (!settings.letterheadConfig) {
                    settings.letterheadConfig = {};
                }

                // Merge each field individually into the existing subdocument
                for (const [key, value] of Object.entries(letterheadConfig)) {
                    settings.letterheadConfig[key] = value;
                }

                // Mark the subdocument as modified so Mongoose persists changes
                settings.markModified('letterheadConfig');

                delete req.body.letterheadConfig;
            }

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
