const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Analysis = require('../models/Analysis');

// In-memory fallback database for offline development or when MONGODB_URI is unreachable
const memoryStore = {
  users: [],
  analyses: []
};

// Seed default demo user in memory store for instant testing
(async () => {
  const salt = await bcrypt.genSalt(10);
  const demoHash = await bcrypt.hash('TrustShield2026!', salt);
  memoryStore.users.push({
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Demo Security Analyst',
    email: 'demo.analyst@trustshield.io',
    passwordHash: demoHash,
    role: 'security_officer',
    createdAt: new Date()
  });
})();

const isConnected = () => mongoose.connection.readyState === 1;

const storageService = {
  isDatabaseConnected() {
    return isConnected();
  },

  async findUserByEmail(email) {
    const normalized = email.toLowerCase().trim();
    if (isConnected()) {
      return await User.findOne({ email: normalized });
    }
    return memoryStore.users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async findUserById(id) {
    if (isConnected()) {
      return await User.findById(id).select('-passwordHash');
    }
    const user = memoryStore.users.find((u) => u._id.toString() === id.toString());
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  async createUser({ name, email, passwordHash, role = 'user' }) {
    const normalized = email.toLowerCase().trim();
    if (isConnected()) {
      return await User.create({ name, email: normalized, passwordHash, role });
    }
    const newUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      name,
      email: normalized,
      passwordHash,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.users.push(newUser);
    return newUser;
  },

  async createAnalysis({ userId, originalLength, threatScore, threatType, piiEntitiesCount, processingTimeMs }) {
    if (isConnected()) {
      return await Analysis.create({
        userId,
        originalLength,
        threatScore,
        threatType,
        piiEntitiesCount,
        processingTimeMs
      });
    }

    const record = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: userId.toString(),
      originalLength,
      threatScore,
      threatType,
      piiEntitiesCount,
      processingTimeMs,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    memoryStore.analyses.push(record);
    return record;
  },

  async getUserScans(userId) {
    if (isConnected()) {
      return await Analysis.find({ userId }).sort({ createdAt: 1 }).lean();
    }
    return memoryStore.analyses
      .filter((a) => a.userId.toString() === userId.toString())
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async getUserHistory(userId, skip = 0, limit = 20) {
    if (isConnected()) {
      const [items, total] = await Promise.all([
        Analysis.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Analysis.countDocuments({ userId })
      ]);
      return { items, total };
    }

    const userScans = memoryStore.analyses
      .filter((a) => a.userId.toString() === userId.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = userScans.length;
    const items = userScans.slice(skip, skip + limit);
    return { items, total };
  }
};

module.exports = storageService;
