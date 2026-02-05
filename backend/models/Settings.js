import mongoose from 'mongoose';

const settingsSchema = mongoose.Schema({
    // Link settings to a specific user/account
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    // General Settings
    shopName: {
        type: String,
        default: 'My Mobile Shop'
    },
    tagline: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    website: {
        type: String,
        default: ''
    },
    whatsappNumber: {
        type: String,
        default: ''
    },
    gstNumber: {
        type: String,
        default: ''
    },
    // Banking Details
    bankName: {
        type: String,
        default: ''
    },
    accountNumber: {
        type: String,
        default: ''
    },
    ifscCode: {
        type: String,
        default: ''
    },
    upiId: {
        type: String,
        default: ''
    },
    // Appearance
    brandColor: {
        type: String,
        default: '#3b82f6' // Blue
    },
    logo: {
        type: String, // Path to logo image
        default: ''
    },
    digitalSignature: {
        type: String, // Path to signature image
        default: null
    },
    letterhead: {
        type: String, // Path to letterhead image
        default: null
    },
    // Invoice Settings
    invoicePrefix: {
        type: String,
        default: 'INV'
    },
    invoiceFooterText: {
        type: String,
        default: 'Thank You for Your Business!'
    },
    termsAndConditions: {
        type: String,
        default: ''
    },
    authSignLabel: {
        type: String,
        default: 'Authorized Signatory'
    },
    primaryTextColor: {
        type: String,
        default: '#2563EB'
    },
    themeColor: {
        type: String,
        default: '#2563EB'
    },
    loginCardTextColor: {
        type: String,
        default: '#FFFFFF'
    },
    profilePicture: {
        type: String,
        default: ''
    },
    roleBadge: {
        type: String,
        default: 'ADMIN'
    },
    // Invoice Layout & Template Settings
    invoiceTemplate: {
        templateId: {
            type: String,
            enum: [
                'modern', 'modern-v2', 'modern-v3', 'modern-v4', 'modern-v5',
                'classic', 'classic-v2', 'classic-v3', 'classic-v4', 'classic-v5',
                'minimal', 'minimal-v2', 'minimal-v3', 'minimal-v4', 'minimal-v5',
                'custom'
            ],
            default: 'modern'
        },
        customTemplateContent: {
            type: String,
            default: '' // HTML content for custom templates
        },
        fieldVisibility: {
            shippingAddress: { type: Boolean, default: false },
            taxBreakdown: { type: Boolean, default: true },
            signature: { type: Boolean, default: true },
            footer: { type: Boolean, default: true },
            bankDetails: { type: Boolean, default: true },
            qrCode: { type: Boolean, default: true },
            qrText: { type: Boolean, default: true },
            terms: { type: Boolean, default: true }
        },
        fieldOrder: {
            type: [String],
            default: ['header', 'billTo', 'items', 'payment', 'signature', 'footer']
        },
        accentColorOverride: { type: String, default: null } // Optional override for template specific color
    },
    // Footer Styling
    footerFontSize: {
        type: Number,
        default: 12
    },
    footerFontFamily: {
        type: String,
        default: 'serif'
    },
    footerAlignment: {
        type: String,
        enum: ['left', 'center', 'right'],
        default: 'center'
    },
    // Letterhead Configuration (Master Template)
    letterheadConfig: {
        marginTop: { type: Number, default: 20 }, // mm
        marginBottom: { type: Number, default: 20 }, // mm
        marginLeft: { type: Number, default: 20 }, // mm
        marginRight: { type: Number, default: 20 }, // mm
        logoPosition: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
        watermarkText: { type: String, default: '' },
        watermarkOpacity: { type: Number, default: 0.1 },
        watermarkSize: { type: Number, default: 100 }, // px
        fontFamily: { type: String, default: 'Inter' },
        showBorder: { type: Boolean, default: false },
        borderColor: { type: String, default: '#000000' }
    },
    bankBranch: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
