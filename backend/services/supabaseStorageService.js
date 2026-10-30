const { supabaseAdmin, isConfigured } = require('../config/supabase');

/**
 * Supabase Storage Service
 * Handles data persistence to Supabase PostgreSQL with strict RLS / Service Role handling.
 */
const supabaseStorageService = {
  isAvailable() {
    return isConfigured && !!supabaseAdmin;
  },

  async findUserByEmail(email) {
    if (!this.isAvailable()) return null;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password_hash, role, created_at, updated_at')
      .ilike('email', email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('[Supabase Error] findUserByEmail failed:', error.message);
      throw error;
    }

    if (!data) return null;

    return {
      _id: data.id,
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.password_hash,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async findUserById(id) {
    if (!this.isAvailable()) return null;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[Supabase Error] findUserById failed:', error.message);
      throw error;
    }

    if (!data) return null;

    return {
      _id: data.id,
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async createUser({ name, email, passwordHash, role = 'user' }) {
    if (!this.isAvailable()) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email: email.trim().toLowerCase(),
        password_hash: passwordHash,
        role
      })
      .select('id, name, email, role, created_at, updated_at')
      .single();

    if (error) {
      console.error('[Supabase Error] createUser failed:', error.message);
      throw error;
    }

    return {
      _id: data.id,
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async createAnalysis({
    userId,
    originalLength,
    threatScore,
    threatType,
    piiEntitiesCount,
    processingTimeMs
  }) {
    if (!this.isAvailable()) {
      throw new Error('Supabase client is not configured.');
    }

    const { data, error } = await supabaseAdmin
      .from('analyses')
      .insert({
        user_id: userId,
        original_length: originalLength,
        threat_score: threatScore,
        threat_type: threatType,
        pii_entities_count: piiEntitiesCount,
        processing_time_ms: processingTimeMs
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase Error] createAnalysis failed:', error.message);
      throw error;
    }

    return {
      _id: data.id,
      id: data.id,
      userId: data.user_id,
      originalLength: data.original_length,
      threatScore: data.threat_score,
      threatType: data.threat_type,
      piiEntitiesCount: data.pii_entities_count,
      processingTimeMs: data.processing_time_ms,
      createdAt: data.created_at
    };
  },

  async getUserScans(userId) {
    if (!this.isAvailable()) return [];

    const { data, error } = await supabaseAdmin
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase Error] getUserScans failed:', error.message);
      throw error;
    }

    return (data || []).map((row) => ({
      _id: row.id,
      id: row.id,
      userId: row.user_id,
      originalLength: row.original_length,
      threatScore: row.threat_score,
      threatType: row.threat_type,
      piiEntitiesCount: row.pii_entities_count,
      processingTimeMs: row.processing_time_ms,
      createdAt: row.created_at
    }));
  },

  async getUserHistory(userId, skip = 0, limit = 20) {
    if (!this.isAvailable()) return { items: [], total: 0 };

    const { data, count, error } = await supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('[Supabase Error] getUserHistory failed:', error.message);
      throw error;
    }

    const items = (data || []).map((row) => ({
      _id: row.id,
      id: row.id,
      userId: row.user_id,
      originalLength: row.original_length,
      threatScore: row.threat_score,
      threatType: row.threat_type,
      piiEntitiesCount: row.pii_entities_count,
      processingTimeMs: row.processing_time_ms,
      createdAt: row.created_at
    }));

    return { items, total: count || 0 };
  }
};

module.exports = supabaseStorageService;
