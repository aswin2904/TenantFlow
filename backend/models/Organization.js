const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER'],
      default: 'DEVELOPER',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [memberSchema],
    plan: { type: String, enum: ['FREE', 'PRO', 'ENTERPRISE'], default: 'FREE' },
  },
  { timestamps: true }
);

organizationSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Organization', organizationSchema);