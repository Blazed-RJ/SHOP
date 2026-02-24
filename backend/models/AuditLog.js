import mongoose from 'mongoose';

const auditLogSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'CREATE_BULK', 'DELETE_BULK']
    },
    target: {
        type: String,
        required: true // e.g., 'Invoice', 'Product', 'Settings'
    },
    targetId: {
        type: String // specific ID of the modified item
    },
    details: {
        type: Object // Previous/New values or metadata
    },
    ipAddress: {
        type: String
    },
    device: {
        type: String
    }
}, {
    timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
