const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const supabaseStorageService = require('./supabaseStorageService');
const { isConfigured: isSupabaseConfigured } = require('../config/supabase');

// In-memory fallback store for offline development when Supabase cloud is unreachable
const memoryStore = {
  users: [],
  analyses: []
};

// Seed default demo user in memory store for instant local testing
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

const isNetworkError = (err) =>
  err &&
  (err.message?.includes('fetch failed') ||
   err.message?.includes('ENOTFOUND') ||
   err.message?.includes('ECONNREFUSED') ||
   err.details?.includes('ENOTFOUND'));

const storageService = {
  getActiveStorageType() {
    if (supabaseStorageService.isAvailable()) return 'Supabase PostgreSQL';
    return 'In-Memory Store (Dev Fallback)';
  },

  async findUserByEmail(email) {
    const normalized = email.toLowerCase().trim();

    // 1. Primary Cloud Database: Supabase
    if (supabaseStorageService.isAvailable()) {
      try {
        return await supabaseStorageService.findUserByEmail(normalized);
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        console.warn('[Storage] Supabase network unavailable. Falling back to local memory store.');
      }
    }

    // 2. Dev Fallback: Memory Store
    return memoryStore.users.find((u) => u.email.toLowerCase() === normalized) || null;
  },

  async findUserById(id) {
    // 1. Primary Cloud Database: Supabase
    if (supabaseStorageService.isAvailable()) {
      try {
        return await supabaseStorageService.findUserById(id);
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        console.warn('[Storage] Supabase network unavailable. Falling back to local memory store.');
      }
    }

    // 2. Dev Fallback: Memory Store
    const user = memoryStore.users.find((u) => (u._id || u.id).toString() === id.toString());
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  async createUser({ name, email, passwordHash, role = 'user' }) {
    const normalized = email.toLowerCase().trim();

    // 1. Primary Cloud Database: Supabase
    if (supabaseStorageService.isAvailable()) {
      try {
        return await supabaseStorageService.createUser({ name, email: normalized, passwordHash, role });
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        console.warn('[Storage] Supabase network unavailable. Falling back to local memory store.');
      }
    }

    // 2. Dev Fallback: Memory Store
    const newId = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
    const newUser = {
      _id: newId,
      id: newId,
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
    // 1. Primary Cloud Database: Supabase
    if (supabaseStorageService.isAvailable()) {
      try {
        return await supabaseStorageService.createAnalysis({
          userId,
          originalLength,
          threatScore,
          threatType,
          piiEntitiesCount,
          processingTimeMs
        });
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        console.warn('[Storage] Supabase network unavailable. Falling back to local memory store.');
      }
    }

    // 2. Dev Fallback: Memory Store
    const newId = crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(36).substring(2) + Date.now().toString(36));
    const record = {
      _id: newId,
      id: newId,
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
    // 1. Primary Cloud Database: Supabase
    if (supabaseStorageService.isAvailable()) {
      try {
        return await supabaseStorageService.getUserScans(userId);
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        console.warn('[Storage] Supabase network unavailable. Falling back to local memory store.');
      }
    }

    // 2. Dev Fallback: Memory Store
    return memoryStore.analyses
      .filter((a) => (a.userId || '').toString() === userId.toString())
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  },

  async getUserHistory(userId, skip = 0, limit = 20) {
    // 1. Primary Cloud Database: Supabase
    if (supabaseStorageService.isAvailable()) {
      try {
        return await supabaseStorageService.getUserHistory(userId, skip, limit);
      } catch (err) {
        if (!isNetworkError(err)) throw err;
        console.warn('[Storage] Supabase network unavailable. Falling back to local memory store.');
      }
    }

    // 2. Dev Fallback: Memory Store
    const userScans = memoryStore.analyses
      .filter((a) => (a.userId || '').toString() === userId.toString())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = userScans.length;
    const items = userScans.slice(skip, skip + limit);
    return { items, total };
  }
};

module.exports = storageService;
