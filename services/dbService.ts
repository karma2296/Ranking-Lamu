
import { DamageRecord, PlayerStats } from '../types';

const STORAGE_KEY = 'lamu_guild_records_cloud_v4';
const RESET_KEY = 'lamu_last_reset_timestamp';

const getSupabaseConfig = () => {
  const settingsStr = localStorage.getItem('lamu_settings');
  if (!settingsStr) return null;
  try {
    return JSON.parse(settingsStr);
  } catch (e) { return null; }
};

export const isCloudConnected = async (): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config?.supabaseUrl || !config?.supabaseKey) return false;
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1/damage_records?select=id&limit=1`, {
      headers: { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}` }
    });
    return response.ok;
  } catch (e) { return false; }
};

export const getRecords = async (): Promise<DamageRecord[]> => {
  const config = getSupabaseConfig();
  if (config?.supabaseUrl && config?.supabaseKey) {
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/damage_records?select=*&order=timestamp.desc`, {
        headers: { 
          'apikey': config.supabaseKey, 
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Range': '0-99'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.map((r: any) => ({
          id: r.id,
          playerName: r.player_name,
          guild: r.guild,
          damageValue: parseInt(r.damage_value),
          timestamp: r.timestamp,
          screenshotUrl: r.screenshot_url,
          discordUser: r.discord_id ? {
            id: r.discord_id,
            username: r.discord_username,
            avatar: r.discord_avatar
          } : undefined
        }));
      }
    } catch (e) { console.error(e); }
  }
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

export const saveRecord = async (record: Omit<DamageRecord, 'id' | 'timestamp'>): Promise<DamageRecord> => {
  const timestamp = Date.now();
  const config = getSupabaseConfig();
  const id = crypto.randomUUID();
  
  if (config?.supabaseUrl && config?.supabaseKey) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/damage_records`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id,
          player_name: record.playerName,
          guild: record.guild,
          damage_value: record.damageValue,
          timestamp,
          screenshot_url: record.screenshotUrl,
          discord_id: record.discordUser?.id,
          discord_username: record.discordUser?.username,
          discord_avatar: record.discordUser?.avatar
        })
      });
    } catch (e) { console.error(e); }
  }
  
  const records = await getRecords();
  const newRecord = { ...record, id, timestamp };
  records.unshift(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 100)));
  return newRecord;
};

export const deleteRecord = async (id: string): Promise<void> => {
  const config = getSupabaseConfig();
  if (config?.supabaseUrl && config?.supabaseKey) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/damage_records?id=eq.${id}`, {
        method: 'DELETE',
        headers: { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}` }
      });
    } catch (e) { console.error(e); }
  }
  const records = await getRecords();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.filter(r => r.id !== id)));
};

export const clearAllData = async (): Promise<void> => {
  const config = getSupabaseConfig();
  if (config?.supabaseUrl && config?.supabaseKey) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/damage_records?id=neq.00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}` }
      });
    } catch (e) { console.error(e); }
  }
  localStorage.removeItem(STORAGE_KEY);
};

export const checkAndPerformAutoReset = async (): Promise<void> => {
  const lastResetDone = parseInt(localStorage.getItem(RESET_KEY) || '0');
  const now = Date.now();
  if (lastResetDone > 0 && now - lastResetDone > 604800000) { 
    await clearAllData();
    localStorage.setItem(RESET_KEY, now.toString());
  } else if (lastResetDone === 0) {
    localStorage.setItem(RESET_KEY, now.toString());
  }
};

export const getPlayerStats = async (): Promise<PlayerStats[]> => {
  const records = await getRecords();
  const statsMap = new Map<string, PlayerStats>();
  records.forEach(r => {
    const existing = statsMap.get(r.playerName);
    if (existing) {
      if (r.damageValue > existing.maxDamage) {
        existing.maxDamage = r.damageValue;
        existing.discordUser = r.discordUser;
      }
      existing.totalEntries += 1;
      existing.lastUpdated = Math.max(existing.lastUpdated, r.timestamp);
    } else {
      statsMap.set(r.playerName, {
        playerName: r.playerName,
        guild: r.guild,
        maxDamage: r.damageValue,
        totalEntries: 1,
        lastUpdated: r.timestamp,
        discordUser: r.discordUser
      });
    }
  });
  return Array.from(statsMap.values()).sort((a, b) => b.maxDamage - a.maxDamage);
};
