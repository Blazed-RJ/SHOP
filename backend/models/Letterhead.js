import mongoose from 'mongoose';

const letterheadSchema = mongoose.Schema({
    letterheadNo: {
        type: String,
        required: true,
        unique: true
    },
    recipient: {
        name: { type: String, default: '' },
        address: { type: String, default: '' },
        email: { type: String, default: '' }
    },
    subject: {
        type: String,
        required: true
    },
    content: {
        type: String, // HTML content
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Draft', 'Final'],
        default: 'Draft'
    },
    // Configuration Snapshot (Stores the settings used when this letter was created/finalized)
    configSnapshot: {
        marginTop: Number,
        marginBottom: Number,
        marginLeft: Number,
        marginRight: Number,
        logoPosition: String,
        watermarkText: String,
        watermarkOpacity: Number,
        fontFamily: String,
        showBorder: Boolean,
        borderColor: String,
        brandColor: String, // From general settings
        logo: String        // From general settings
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

const Letterhead = mongoose.model('Letterhead', letterheadSchema);
export default Letterhead;
