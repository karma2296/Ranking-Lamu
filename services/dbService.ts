
import { DamageRecord, PlayerStats } from '../types';

const STORAGE_KEY = 'lamu_guild_records_cloud_v4';
const RESET_KEY = 'lamu_last_reset_timestamp';

const getSupabaseConfig = () => {
  const settingsStr = localStorage.getItem('lamu_settings');
  if (!settingsStr) return null;
  try {
    const settings = JSON.parse(settingsStr);
    if (settings.supabaseUrl && settings.supabaseKey) {
      return {
        url: settings.supabaseUrl.replace(/\/$/, ''),
        key: settings.supabaseKey
      };
    }
  } catch (e) {
    return null;
  }
  return null;
};

// Función para verificar si la conexión a la nube es exitosa
export const isCloudConnected = async (): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config) return false;
  try {
    const response = await fetch(`${config.url}/rest/v1/damage_records?select=id&limit=1`, {
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`
      }
    });
    return response.ok;
  } catch (e) {
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
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error de Supabase:", errorData);
        throw new Error('Supabase Error');
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) return [];

      return data.map((r: any) => ({
        id: r.id,
        playerName: r.player_name,
        guild: r.guild,
        damageValue: r.damage_value,
        timestamp: r.timestamp,
        screenshotUrl: r.screenshot_url
      }));
    } catch (e) {
      console.error("Fallo conexión a la nube, usando almacenamiento local temporal:", e);
    }
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
          id: id, // Enviamos el ID generado por nosotros para evitar problemas de RLS
          player_name: record.playerName,
          guild: record.guild,
          damage_value: record.damageValue,
          timestamp: timestamp,
          screenshot_url: record.screenshotUrl
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result[0];
      } else {
        const errorText = await response.text();
        console.error("Supabase rechazó el guardado:", errorText);
      }
    } catch (e) {
      console.error("Error crítico guardando en la nube:", e);
    }
  }

  // Fallback a LocalStorage
  const records = await getRecords();
  const newRecord: DamageRecord = {
    ...record,
    id,
    timestamp,
  };
  
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

export const getLastResetThreshold = (): number => {
  const now = new Date();
  const lastMonday = new Date(now);
  const day = now.getUTCDay();
  const diff = (day === 0 ? 6 : day - 1);
  lastMonday.setUTCDate(now.getUTCDate() - diff);
  lastMonday.setUTCHours(17, 0, 0, 0);
  if (now.getTime() < lastMonday.getTime()) {
    lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);
  }
  return lastMonday.getTime();
};

export const checkAndPerformAutoReset = async (): Promise<boolean> => {
  const lastResetDone = parseInt(localStorage.getItem(RESET_KEY) || '0');
  const threshold = getLastResetThreshold();
  
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
      existing.guild = record.guild;
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
