const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const supabaseStorageService = require('./supabaseStorageService');
const { isConfigured: isSupabaseConfigured } = require('../config/supabase');

// In-memory fallback database for offline development or when cloud keys are not yet configured
const memoryStore = {
  users: [],
  analyses: []
};

// Seed default demo user in memory store for instant testing
(async () => {
  const salt = await bcrypt.genSalt(10);
  const demoHash = await bcrypt.hash('TrustShield2026!', salt);
  memoryStore.users.push({
    _id: 'd3b07384-d113-4f9e-9d8a-6b8c9d0e1f2a',
    id: 'd3b07384-d113-4f9e-9d8a-6b8c9d0e1f2a',
    name: 'Demo Security Analyst',
    email: 'demo.analyst@trustshield.io',
    passwordHash: demoHash,
    role: 'security_officer',
    createdAt: new Date()
  });
})();

const isMongoConnected = () => mongoose.connection.readyState === 1;

const storageService = {
  getActiveStorageType() {
    if (supabaseStorageService.isAvailable()) return 'Supabase PostgreSQL';
    if (isMongoConnected()) return 'MongoDB';
    return 'In-Memory Store (Dev Fallback)';
  },

  async findUserByEmail(email) {
    const normalized = email.toLowerCase().trim();

    // 1. Try Supabase
    if (supabaseStorageService.isAvailable()) {
      return await supabaseStorageService.findUserByEmail(normalized);
    }

    // 2. Try MongoDB
    if (isMongoConnected()) {
      return await User.findOne({ email: normalized });
    }

    // 3. Fallback Memory Store
    return memoryStore.users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async findUserById(id) {
    // 1. Try Supabase
    if (supabaseStorageService.isAvailable()) {
      return await supabaseStorageService.findUserById(id);
    }

    // 2. Try MongoDB
    if (isMongoConnected()) {
      return await User.findById(id).select('-passwordHash');
    }

    // 3. Fallback Memory Store
    const user = memoryStore.users.find((u) => (u._id || u.id).toString() === id.toString());
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  async createUser({ name, email, passwordHash, role = 'user' }) {
    const normalized = email.toLowerCase().trim();

    // 1. Try Supabase
    if (supabaseStorageService.isAvailable()) {
      return await supabaseStorageService.createUser({ name, email: normalized, passwordHash, role });
    }

    // 2. Try MongoDB
    if (isMongoConnected()) {
      return await User.create({ name, email: normalized, passwordHash, role });
    }

    // 3. Fallback Memory Store
    const newUser = {
      _id: (Math.random().toString(36).substring(2) + Date.now().toString(36)),
      id: (Math.random().toString(36).substring(2) + Date.now().toString(36)),
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

  async createAnalysis({
    userId,
    originalLength,
    threatScore,
    threatType,
    piiEntitiesCount,
    processingTimeMs
  }) {
    // 1. Try Supabase
    if (supabaseStorageService.isAvailable()) {
      return await supabaseStorageService.createAnalysis({
        userId,
        originalLength,
        threatScore,
        threatType,
        piiEntitiesCount,
        processingTimeMs
      });
    }

    // 2. Try MongoDB
    if (isMongoConnected()) {
      return await Analysis.create({
        userId,
        originalLength,
        threatScore,
        threatType,
        piiEntitiesCount,
        processingTimeMs
      });
    }

    // 3. Fallback Memory Store
    const record = {
      _id: (Math.random().toString(36).substring(2) + Date.now().toString(36)),
      id: (Math.random().toString(36).substring(2) + Date.now().toString(36)),
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
    // 1. Try Supabase
    if (supabaseStorageService.isAvailable()) {
      return await supabaseStorageService.getUserScans(userId);
    }

    // 2. Try MongoDB
    if (isMongoConnected()) {
      return await Analysis.find({ userId }).sort({ createdAt: 1 }).lean();
    }

    // 3. Fallback Memory Store
    return memoryStore.analyses
      .filter((a) => (a.userId || '').toString() === userId.toString())
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async getUserHistory(userId, skip = 0, limit = 20) {
    // 1. Try Supabase
    if (supabaseStorageService.isAvailable()) {
      return await supabaseStorageService.getUserHistory(userId, skip, limit);
    }

    // 2. Try MongoDB
    if (isMongoConnected()) {
      const [items, total] = await Promise.all([
        Analysis.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Analysis.countDocuments({ userId })
      ]);
      return { items, total };
    }

    // 3. Fallback Memory Store
    const userScans = memoryStore.analyses
      .filter((a) => (a.userId || '').toString() === userId.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = userScans.length;
    const items = userScans.slice(skip, skip + limit);
    return { items, total };
  }
};

module.exports = storageService;
