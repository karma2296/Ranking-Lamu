
export interface DamageRecord {
  id: string;
  playerName: string;
  guild: 'Principal' | 'Secundario';
  damageValue: number;
  timestamp: number;
  screenshotUrl?: string;
}

export interface PlayerStats {
  playerName: string;
  guild: 'Principal' | 'Secundario';
  maxDamage: number;
  totalEntries: number;
  lastUpdated: number;
  rank?: number;
}

export interface AppSettings {
  discordWebhook: string;
  supabaseUrl: string;
  supabaseKey: string;
  guildName: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  ADD_ENTRY = 'ADD_ENTRY',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}
