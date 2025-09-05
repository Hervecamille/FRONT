import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, unique: true, index: true },
  isRevoked: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['USER','ADMIN'], default: 'USER' },
  refreshTokens: { type: [RefreshTokenSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
