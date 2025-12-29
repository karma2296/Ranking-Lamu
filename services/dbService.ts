
import { DamageRecord, PlayerStats } from '../types';

const STORAGE_KEY = 'lamu_guild_records_cloud_v4';
const RESET_KEY = 'lamu_last_reset_timestamp';
let lastCloudError: string | null = null;

export const getLastError = () => lastCloudError;

const getSupabaseConfig = () => {
  const settingsStr = localStorage.getItem('lamu_settings');
  if (!settingsStr) return null;
  try {
    const settings = JSON.parse(settingsStr);
    if (settings.supabaseUrl && settings.supabaseKey) {
      return {
        url: settings.supabaseUrl.trim().replace(/\/$/, ''),
        key: settings.supabaseKey.trim()
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const isCloudConnected = async (): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config) {
    lastCloudError = "No hay configuración guardada.";
    return false;
  }
  try {
    const response = await fetch(`${config.url}/rest/v1/damage_records?select=id&limit=1`, {
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`
      }
    });
    
    if (response.ok) {
      lastCloudError = null;
      return true;
    } else {
      const err = await response.json();
      // Error específico de Supabase cuando se usa la clave service_role
      if (err.message && err.message.includes("secret API key")) {
        lastCloudError = "⚠️ ERROR: Estás usando la clave 'service_role'. Debes usar la clave 'anon' (public) en el panel de Supabase -> API Settings.";
      } else {
        lastCloudError = err.message || `Error ${response.status}: ${response.statusText}`;
      }
      return false;
    }
  } catch (e: any) {
    lastCloudError = e.message || "Error de red: Verifica la URL de Supabase.";
    return false;
  }
};

export const getRecords = async (): Promise<DamageRecord[]> => {
  const config = getSupabaseConfig();
  if (config) {
    try {
      const response = await fetch(`${config.url}/rest/v1/damage_records?select=*&order=timestamp.desc`, {
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.map((r: any) => ({
          id: r.id,
          playerName: r.player_name,
          guild: r.guild,
          damageValue: r.damage_value,
          timestamp: r.timestamp,
          screenshotUrl: r.screenshot_url
        }));
      }
    } catch (e) { console.error(e); }
  }
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecord = async (record: Omit<DamageRecord, 'id' | 'timestamp'>): Promise<DamageRecord> => {
  const timestamp = Date.now();
  const config = getSupabaseConfig();
  const id = crypto.randomUUID();
  if (config) {
    try {
      const response = await fetch(`${config.url}/rest/v1/damage_records`, {
        method: 'POST',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: id,
          player_name: record.playerName,
          guild: record.guild,
          // Fixed: Access record.damageValue correctly instead of undefined record.damage_value
          damage_value: record.damageValue,
          timestamp: timestamp,
          screenshot_url: record.screenshotUrl
        })
      });
      if (response.ok) {
        const result = await response.json();
        const r = result[0];
        // Ensure we map snake_case response back to camelCase frontend interface
        return {
          id: r.id,
          playerName: r.player_name,
          guild: r.guild,
          damageValue: r.damage_value,
          timestamp: r.timestamp,
          screenshotUrl: r.screenshot_url
        };
      }
    } catch (e) { console.error(e); }
  }
  const records = await getRecords();
  const newRecord: DamageRecord = { ...record, id, timestamp };
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
};

export const deleteRecord = async (id: string): Promise<void> => {
  const config = getSupabaseConfig();
  if (config) {
    try {
      await fetch(`${config.url}/rest/v1/damage_records?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`
        }
      });
    } catch (e) { console.error(e); }
  }
  const records = await getRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const clearAllData = async (): Promise<void> => {
  const config = getSupabaseConfig();
  if (config) {
    try {
      await fetch(`${config.url}/rest/v1/damage_records?id=neq.0`, {
        method: 'DELETE',
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`
        }
      });
    } catch (e) { console.error(e); }
  }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(RESET_KEY, Date.now().toString());
};

export const checkAndPerformAutoReset = async (): Promise<boolean> => {
  const lastResetDone = parseInt(localStorage.getItem(RESET_KEY) || '0');
  const now = new Date();
  const lastMonday = new Date(now);
  const day = now.getUTCDay();
  const diff = (day === 0 ? 6 : day - 1);
  lastMonday.setUTCDate(now.getUTCDate() - diff);
  lastMonday.setUTCHours(17, 0, 0, 0);
  if (now.getTime() < lastMonday.getTime()) {
    lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);
  }
  const threshold = lastMonday.getTime();
  if (lastResetDone < threshold) {
    await clearAllData();
    localStorage.setItem(RESET_KEY, threshold.toString());
    return true;
  }
  return false;
};

export const getPlayerStats = async (): Promise<PlayerStats[]> => {
  const records = await getRecords();
  const statsMap = new Map<string, PlayerStats>();
  records.forEach(record => {
    const key = `${record.playerName}`;
    const existing = statsMap.get(key);
    if (existing) {
      existing.maxDamage = Math.max(existing.maxDamage, record.damageValue);
      existing.totalEntries += 1;
      existing.lastUpdated = Math.max(existing.lastUpdated, record.timestamp);
    } else {
      statsMap.set(key, {
        playerName: record.playerName,
        guild: record.guild,
        maxDamage: record.damageValue,
        totalEntries: 1,
        lastUpdated: record.timestamp
      });
    }
  });
  return Array.from(statsMap.values())
    .sort((a, b) => b.maxDamage - a.maxDamage)
    .map((stat, index) => ({ ...stat, rank: index + 1 }));
};

