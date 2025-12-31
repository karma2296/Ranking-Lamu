
import { DamageRecord, PlayerStats, RecordType } from '../types';

const STORAGE_KEY = 'lamu_guild_records_cloud_v5';

const getSupabaseConfig = () => {
  const settingsStr = localStorage.getItem('lamu_settings');
  if (!settingsStr) return null;
  try { return JSON.parse(settingsStr); } catch (e) { return null; }
};

export const isCloudConnected = async (): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config?.supabaseUrl || !config?.supabaseKey) return false;
  return true; 
};

// Nueva función para saber si el usuario ya empezó su temporada
export const hasUserStartedSeason = async (discordId: string): Promise<boolean> => {
  const config = getSupabaseConfig();
  if (!config?.supabaseUrl || !config?.supabaseKey) return false;
  try {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/damage_records?discord_id=eq.${discordId}&select=id&limit=1`,
      { headers: { 'apikey': config.supabaseKey, 'Authorization': `Bearer ${config.supabaseKey}` } }
    );
    if (response.ok) {
      const data = await response.json();
      return data.length > 0;
    }
  } catch (e) {}
  return false;
};

export const getRankingRecords = async (): Promise<DamageRecord[]> => {
  const config = getSupabaseConfig();
  if (config?.supabaseUrl && config?.supabaseKey) {
    try {
      const columns = 'id,player_name,guild,record_type,total_damage,ticket_damage,timestamp,discord_id,discord_username,discord_avatar';
      const response = await fetch(`${config.supabaseUrl}/rest/v1/damage_records?select=${columns}&order=timestamp.desc`, {
        headers: { 
          'apikey': config.supabaseKey, 
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.map((r: any) => ({
          id: r.id,
          playerName: r.player_name,
          guild: r.guild,
          recordType: r.record_type as RecordType,
          totalDamage: parseInt(r.total_damage || 0),
          ticketDamage: parseInt(r.ticket_damage || 0),
          timestamp: r.timestamp,
          discordUser: r.discord_id ? { id: r.discord_id, username: r.discord_username, avatar: r.discord_avatar } : undefined
        }));
      }
    } catch (e) { console.error(e); }
  }
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

export const getRecords = async (): Promise<DamageRecord[]> => {
  const config = getSupabaseConfig();
  if (config?.supabaseUrl && config?.supabaseKey) {
    try {
      const response = await fetch(`${config.supabaseUrl}/rest/v1/damage_records?select=*&order=timestamp.desc&limit=20`, {
        headers: { 
          'apikey': config.supabaseKey, 
          'Authorization': `Bearer ${config.supabaseKey}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.map((r: any) => ({
          id: r.id,
          playerName: r.player_name,
          guild: r.guild,
          recordType: r.record_type as RecordType,
          totalDamage: parseInt(r.total_damage || 0),
          ticketDamage: parseInt(r.ticket_damage || 0),
          timestamp: r.timestamp,
          screenshotUrl: r.screenshot_url,
          discordUser: r.discord_id ? { id: r.discord_id, username: r.discord_username, avatar: r.discord_avatar } : undefined
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
  const newRecord = { ...record, id, timestamp } as DamageRecord;
  
  if (config?.supabaseUrl && config?.supabaseKey) {
    const payload = {
      id,
      player_name: record.playerName,
      guild: record.guild,
      record_type: record.recordType,
      total_damage: record.totalDamage,
      ticket_damage: record.ticketDamage,
      timestamp,
      screenshot_url: record.screenshotUrl,
      discord_id: record.discordUser?.id,
      discord_username: record.discordUser?.username,
      discord_avatar: record.discordUser?.avatar
    };

    const response = await fetch(`${config.supabaseUrl}/rest/v1/damage_records`, {
      method: 'POST',
      headers: {
        'apikey': config.supabaseKey,
        'Authorization': `Bearer ${config.supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`Error Supabase (${response.status}): ${errorMsg}`);
    }
  }
  
  const { screenshotUrl, ...light } = newRecord;
  const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  history.unshift(light);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));

  return newRecord;
};

export const getPlayerStats = async (): Promise<PlayerStats[]> => {
  const records = await getRankingRecords();
  const statsMap = new Map<string, PlayerStats>();
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const userIds = Array.from(new Set(records.map(r => r.discordUser?.id).filter(Boolean)));

  userIds.forEach(uid => {
    const userRecords = records.filter(r => r.discordUser?.id === uid).sort((a, b) => a.timestamp - b.timestamp);
    if (userRecords.length === 0) return;

    const initial = userRecords.find(r => r.recordType === 'INITIAL') || userRecords[0];
    const initialTotal = initial.totalDamage || 0;
    
    const incrementalTickets = userRecords.filter(r => r.timestamp > initial.timestamp);
    const totalTicketsSum = incrementalTickets.reduce((acc, r) => acc + (r.ticketDamage || 0), 0);
    
    const dailyTickets = userRecords.filter(r => (now - r.timestamp) < ONE_DAY);
    const maxDaily = dailyTickets.length > 0 ? Math.max(...dailyTickets.map(r => r.ticketDamage || 0)) : 0;

    const last = userRecords[userRecords.length - 1];

    statsMap.set(uid as string, {
      playerName: last.playerName,
      guild: last.guild,
      accumulatedTotal: initialTotal + totalTicketsSum,
      maxDailyTicket: maxDaily,
      totalEntries: userRecords.length,
      lastUpdated: last.timestamp,
      discordUser: last.discordUser
    });
  });

  return Array.from(statsMap.values()).sort((a, b) => b.accumulatedTotal - a.accumulatedTotal);
};

export const clearAllData = async () => {
  const config = getSupabaseConfig();
  if (config?.supabaseUrl && config?.supabaseKey) {
    try {
      await fetch(`${config.supabaseUrl}/rest/v1/damage_records?id=neq.00000000-0000-0000-0000-000000000000`, {
        method: 'DELETE',
        headers: {
          'apikey': config.supabaseKey,
          'Authorization': `Bearer ${config.supabaseKey}`
        }
      });
    } catch (e) { console.error(e); }
  }
  localStorage.removeItem(STORAGE_KEY);
};

export const checkAndPerformAutoReset = async () => {};
export const deleteRecord = async (id: string) => {};
