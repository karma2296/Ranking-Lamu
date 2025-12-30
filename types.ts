
export interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
}

export interface DamageRecord {
  id: string;
  playerName: string;
  guild: 'Principal' | 'Secundario';
  damageValue: number;
  timestamp: number;
  screenshotUrl?: string;
  discordUser?: DiscordUser;
}

export interface PlayerStats {
  playerName: string;
  guild: 'Principal' | 'Secundario';
  maxDamage: number;
  totalEntries: number;
  lastUpdated: number;
  rank?: number;
  discordUser?: DiscordUser;
}

export interface AppSettings {
  discordWebhook: string;
  supabaseUrl: string;
  supabaseKey: string;
  guildName: string;
  adminPassword?: string;
  discordClientId?: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  ADD_ENTRY = 'ADD_ENTRY',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}
