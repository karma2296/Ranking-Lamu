
import { DamageRecord, PlayerStats } from '../types';

const STORAGE_KEY = 'lamu_guild_records_cloud_v4';
const RESET_KEY = 'lamu_last_reset_timestamp';

export const getRecords = async (): Promise<DamageRecord[]> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecord = async (record: Omit<DamageRecord, 'id' | 'timestamp'>): Promise<DamageRecord> => {
  const records = await getRecords();
  const newRecord: DamageRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };
  
  records.push(newRecord);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return newRecord;
};

export const deleteRecord = async (id: string): Promise<void> => {
  const records = await getRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const clearAllData = async (): Promise<void> => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(RESET_KEY, Date.now().toString());
};

/**
 * Calcula el último lunes a las 14:00 ART (17:00 UTC)
 */
export const getLastResetThreshold = (): number => {
  const now = new Date();
  const lastMonday = new Date(now);
  
  // Ajustamos al lunes más cercano (0 = Domingo, 1 = Lunes...)
  const day = now.getUTCDay();
  const diff = (day === 0 ? 6 : day - 1);
  lastMonday.setUTCDate(now.getUTCDate() - diff);
  
  // Fijamos a las 17:00 UTC (14:00 ART)
  lastMonday.setUTCHours(17, 0, 0, 0);
  
  // Si hoy es lunes pero aún no son las 17:00 UTC, el reset fue el lunes anterior
  if (now.getTime() < lastMonday.getTime()) {
    lastMonday.setUTCDate(lastMonday.getUTCDate() - 7);
  }
  
  return lastMonday.getTime();
};

export const checkAndPerformAutoReset = async (): Promise<boolean> => {
  const lastResetDone = parseInt(localStorage.getItem(RESET_KEY) || '0');
  const threshold = getLastResetThreshold();
  
  if (lastResetDone < threshold) {
    console.log("Detectado cambio de semana competitiva. Reiniciando ranking...");
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
