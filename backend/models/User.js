import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true }, // Logic: Link Google & Manual accounts via email
    password: {
        type: String,
        required: function () { return !this.googleId; } // Password required mainly if googleId is not present
    },
    googleId: { type: String, unique: true, sparse: true }, // Add googleId
    authProvider: { type: String, default: 'local' },
    role: {
        type: String,
        enum: ['Admin', 'Accountant', 'Salesman'],
        default: 'Admin'
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    shopCode: { type: String }, // Used during registration to verify intent
    avatar: { type: String }, // Path to local image
    otp: { type: String },
    otpExpires: { type: Date },
    trustedDevices: [{ type: String }], // Array of trusted device IDs
}, {
    timestamps: true // Will use server time (IST via env)
});

// Password Hash Middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) { // Skip if password is missing (Google auth)
        next();
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Password Verification Method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
