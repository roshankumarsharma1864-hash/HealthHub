// Low-level LocalStorage Relational DB driver for HEALTH HUB
// Exposes Promise-based async methods and simulates API network latency

const LATENCY = 300; // 300ms simulated network lag

export const KEYS = {
  USERS: 'healthhub_users',
  PATIENTS: 'healthhub_patients',
  DOCTORS: 'healthhub_doctors',
  APPOINTMENTS: 'healthhub_appointments',
  WARDS: 'healthhub_wards',
  BILLS: 'healthhub_bills',
  MEDICINES: 'healthhub_medicines',
  PRESCRIPTIONS: 'healthhub_prescriptions',
  LAB_REPORTS: 'healthhub_labReports',
  ACTIVITY_LOG: 'healthhub_activityLog',
  SETTINGS: 'healthhub_settings',
  DEPARTMENTS: 'healthhub_departments',
  EMERGENCY: 'healthhub_emergency',
  MESSAGES: 'healthhub_messages',
  NOTIFICATIONS: 'healthhub_notifications',
  CALENDAR_EVENTS: 'healthhub_calendar_events'
};

const delay = (ms = LATENCY) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  // Read all records in a collection
  async getAll(key) {
    await delay();
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  },

  // Read a single record by ID
  async getById(key, id) {
    await delay();
    const records = await this.getAll(key);
    return records.find(r => r.id === id) || null;
  },

  // Create a new record
  async create(key, record) {
    await delay();
    const records = await this.getAll(key);
    const newRecord = {
      id: window.crypto?.randomUUID() || Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      ...record
    };
    records.push(newRecord);
    localStorage.setItem(key, JSON.stringify(records));
    
    // Log activity unless it's logging the activity itself
    if (key !== KEYS.ACTIVITY_LOG) {
      await this.logActivity(
        record.userId || 'system', 
        'CREATE', 
        key.replace('healthhub_', ''), 
        `Created record with ID ${newRecord.id}`
      );
    }
    
    return newRecord;
  },

  // Update an existing record
  async update(key, id, updates) {
    await delay();
    const records = await this.getAll(key);
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error(`Record with ID ${id} not found in ${key}`);
    }
    
    const updatedRecord = {
      ...records[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    records[index] = updatedRecord;
    localStorage.setItem(key, JSON.stringify(records));
    
    if (key !== KEYS.ACTIVITY_LOG) {
      await this.logActivity(
        updates.userId || 'system', 
        'UPDATE', 
        key.replace('healthhub_', ''), 
        `Updated record with ID ${id}`
      );
    }
    
    return updatedRecord;
  },

  // Delete a record
  async delete(key, id, userId = 'system') {
    await delay();
    const records = await this.getAll(key);
    const filtered = records.filter(r => r.id !== id);
    
    if (records.length === filtered.length) {
      throw new Error(`Record with ID ${id} not found in ${key}`);
    }
    
    localStorage.setItem(key, JSON.stringify(filtered));
    
    if (key !== KEYS.ACTIVITY_LOG) {
      await this.logActivity(
        userId, 
        'DELETE', 
        key.replace('healthhub_', ''), 
        `Deleted record with ID ${id}`
      );
    }
    
    return true;
  },

  // Special helper to write raw collection arrays (e.g. seeding, imports, transactions)
  async saveAllRaw(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  },

  // Activity logging helper
  async logActivity(userId, action, entity, details) {
    const log = {
      userId,
      action,
      entity,
      details,
      timestamp: new Date().toISOString()
    };
    
    const records = localStorage.getItem(KEYS.ACTIVITY_LOG) 
      ? JSON.parse(localStorage.getItem(KEYS.ACTIVITY_LOG)) 
      : [];
      
    records.unshift({
      id: window.crypto?.randomUUID() || Math.random().toString(36).substring(2, 11),
      ...log
    });
    
    // Limit log size to 100 entries to prevent localStorage bloat
    localStorage.setItem(KEYS.ACTIVITY_LOG, JSON.stringify(records.slice(0, 100)));
  }
};
