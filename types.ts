
export interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
}

export type RecordType = 'INITIAL' | 'INCREMENTAL';

export interface DamageRecord {
  id: string;
  playerName: string;
  guild: 'Principal' | 'Secundario';
  recordType: RecordType;
  totalDamage: number;
  ticketDamage: number;
  timestamp: number;
  screenshotUrl?: string;
  discordUser?: DiscordUser;
}

export interface PlayerStats {
  playerName: string;
  guild: 'Principal' | 'Secundario';
  accumulatedTotal: number;
  maxDailyTicket: number;
  totalEntries: number;
  lastUpdated: number;
  discordUser?: DiscordUser;
  topTickets: number[];
}

export interface AppSettings {
  discordWebhook: string;
  discordRankingWebhook: string; 
  recruitmentWebhook?: string;
  lamuG1Open?: boolean;
  lamuG2Open?: boolean;
  customAppUrl?: string; 
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
  SETTINGS = 'SETTINGS',
  JOIN = 'JOIN'
}
