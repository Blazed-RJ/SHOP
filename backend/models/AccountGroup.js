
import mongoose from 'mongoose';

const accountGroupSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    parentGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountGroup',
        default: null
    },
    nature: {
        type: String,
        enum: ['Assets', 'Liabilities', 'Income', 'Expenses'],
        required: true
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for easier hierarchy traversal
accountGroupSchema.index({ parentGroup: 1 });

const AccountGroup = mongoose.model('AccountGroup', accountGroupSchema);
export default AccountGroup;
