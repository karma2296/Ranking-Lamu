
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
  // Si no hay nube, cargamos lo local (que ahora será ligero)
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

export const saveRecord = async (record: Omit<DamageRecord, 'id' | 'timestamp'>): Promise<DamageRecord> => {
  const timestamp = Date.now();
  const config = getSupabaseConfig();
  const id = crypto.randomUUID();
  const newRecord = { ...record, id, timestamp };
  
  if (config?.supabaseUrl && config?.supabaseKey) {
    const fullPayload = {
      id,
      player_name: record.playerName,
      guild: record.guild,
      damage_value: record.damageValue,
      timestamp,
      screenshot_url: record.screenshotUrl, // En la nube SÍ guardamos la imagen
      discord_id: record.discordUser?.id,
      discord_username: record.discordUser?.username,
      discord_avatar: record.discordUser?.avatar
    };

    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/damage_records`, {
        method: 'POST',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(fullPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Manejo de columnas faltantes si no se han creado en Supabase
        if (errorData.code === '42703') {
           await fetch(`${config.supabaseUrl}/rest/v1/damage_records`, {
            method: 'POST',
            headers: { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id, player_name: record.playerName, guild: record.guild, 
                damage_value: record.damageValue, timestamp, screenshot_url: record.screenshotUrl
            })
          });
        }
      }
    } catch (e: any) { 
      console.error("Error subiendo a la nube:", e);
    }
  }
  
  // GUARDADO LOCAL (BACKUP): 
  // IMPORTANTE: Eliminamos la imagen antes de guardar en LocalStorage para no agotar la cuota de 5MB
  const { screenshotUrl, ...localBackupRecord } = newRecord;
  
  try {
    const records = await getRecords();
    // Filtramos registros viejos que puedan tener imágenes pesadas para limpiar el storage
    const cleanedRecords = records.map(({ screenshotUrl: _, ...r }) => r);
    cleanedRecords.unshift(localBackupRecord);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedRecords.slice(0, 50)));
  } catch (e) {
    // Si sigue dando error de cuota, vaciamos el backup local por seguridad
    console.warn("LocalStorage lleno, limpiando historial local...");
    localStorage.setItem(STORAGE_KEY, JSON.stringify([localBackupRecord]));
  }

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
