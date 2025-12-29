
import { DamageRecord, PlayerStats } from '../types';

const STORAGE_KEY = 'lamu_guild_records_cloud_v4';
const RESET_KEY = 'lamu_last_reset_timestamp';

const getSupabaseConfig = () => {
  const settingsStr = localStorage.getItem('lamu_settings');
  if (!settingsStr) return null;
  const settings = JSON.parse(settingsStr);
  if (settings.supabaseUrl && settings.supabaseKey) {
    return {
      url: settings.supabaseUrl.replace(/\/$/, ''),
      key: settings.supabaseKey
    };
  }
  return null;
};

export const getRecords = async (): Promise<DamageRecord[]> => {
  const config = getSupabaseConfig();
  
  if (config) {
    try {
      const response = await fetch(`${config.url}/rest/v1/damage_records?select=*`, {
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`
        }
      });
      if (!response.ok) throw new Error('Error fetching from Supabase');
      const data = await response.json();
      return data.map((r: any) => ({
        id: r.id,
        playerName: r.player_name,
        guild: r.guild,
        damageValue: r.damage_value,
        timestamp: r.timestamp,
        screenshotUrl: r.screenshot_url
      }));
    } catch (e) {
      console.error("Fallo Supabase, usando local:", e);
    }
  }

  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecord = async (record: Omit<DamageRecord, 'id' | 'timestamp'>): Promise<DamageRecord> => {
  const timestamp = Date.now();
  const config = getSupabaseConfig();

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
      }
    } catch (e) {
      console.error("Error guardando en Supabase:", e);
    }
  }

  // Fallback a LocalStorage si no hay Supabase o falla
  const records = await getRecords();
  const newRecord: DamageRecord = {
    ...record,
    id: crypto.randomUUID(),
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
      // Nota: Para borrar todo en Supabase vía REST sin filtros hay que tener cuidado.
      // Aquí borramos todos los registros.
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
