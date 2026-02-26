/**
 * Supabase Entity Service Layer
 * Drop-in replacement for base44.entities.* calls
 * 
 * Provides the same API surface as Base44 SDK:
 *   - .list()           → SELECT * (with optional ordering)
 *   - .filter(criteria)  → SELECT * WHERE ...
 *   - .get(id)           → SELECT * WHERE id = ...
 *   - .create(data)      → INSERT
 *   - .update(id, data)  → UPDATE WHERE id = ...
 *   - .delete(id)        → DELETE WHERE id = ...
 *   - .bulkCreate(items) → INSERT multiple rows
 */

import { supabase } from '@/lib/supabaseClient';

// ─── Generic Entity Factory ──────────────────────────────────
function createEntity(tableName, options = {}) {
  const { defaultOrder = 'created_at', defaultDirection = 'desc' } = options;

  return {
    /**
     * List all rows, optionally with ordering
     */
    async list(opts = {}) {
      const { order = defaultOrder, ascending = false, limit } = opts;
      let query = supabase.from(tableName).select('*');
      
      if (order) {
        query = query.order(order, { ascending });
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    /**
     * Filter rows by criteria object
     * Supports: { key: value } for equality, { key: [val1, val2] } for IN
     * 
     * Backward compatible with Base44 positional args:
     *   .filter(criteria, '-created_date', 1000)
     *   .filter(criteria)  // uses defaults
     *   .filter(criteria, { order, ascending, limit })  // new style
     */
    async filter(criteria = {}, optsOrOrder, limitArg) {
      let order = defaultOrder;
      let ascending = false;
      let limit;

      if (typeof optsOrOrder === 'string') {
        // Base44-style: .filter(criteria, '-created_date', 1000)
        const desc = optsOrOrder.startsWith('-');
        order = desc ? optsOrOrder.substring(1) : optsOrOrder;
        ascending = !desc;
        limit = limitArg;
      } else if (optsOrOrder && typeof optsOrOrder === 'object') {
        // New style: .filter(criteria, { order, ascending, limit })
        order = optsOrOrder.order || defaultOrder;
        ascending = optsOrOrder.ascending || false;
        limit = optsOrOrder.limit;
      }
      let query = supabase.from(tableName).select('*');

      for (const [key, value] of Object.entries(criteria)) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (value === null) {
          query = query.is(key, null);
        } else if (typeof value === 'boolean') {
          query = query.eq(key, value);
        } else {
          query = query.eq(key, value);
        }
      }

      if (order) {
        query = query.order(order, { ascending });
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    /**
     * Get a single row by ID
     */
    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Create a new row
     */
    async create(rowData) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(rowData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Update a row by ID
     */
    async update(id, updates) {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /**
     * Delete a row by ID
     */
    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    },

    /**
     * Bulk create multiple rows
     */
    async bulkCreate(items) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(items)
        .select();
      if (error) throw error;
      return data || [];
    },
  };
}

// ─── Entity Instances ────────────────────────────────────────

export const ElectricityProvider = createEntity('electricity_providers', {
  defaultOrder: 'name',
  defaultDirection: 'asc',
});

export const ElectricityPlan = createEntity('electricity_plans', {
  defaultOrder: 'rate_per_kwh',
  defaultDirection: 'asc',
});

export const Article = createEntity('articles', {
  defaultOrder: 'created_date',
  defaultDirection: 'desc',
});

export const CustomBusinessQuote = createEntity('custom_business_quotes', {
  defaultOrder: 'created_date',
  defaultDirection: 'desc',
});

export const ChatbotConversation = createEntity('chatbot_conversations', {
  defaultOrder: 'created_at',
  defaultDirection: 'desc',
});

export const Profile = createEntity('profiles', {
  defaultOrder: 'created_at',
  defaultDirection: 'desc',
});
