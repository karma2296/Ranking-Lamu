
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
  totalDamage: number; // El total que aparece en pantalla
  ticketDamage: number; // El daño de la batalla individual
  timestamp: number;
  screenshotUrl?: string;
  discordUser?: DiscordUser;
}

export interface PlayerStats {
  playerName: string;
  guild: 'Principal' | 'Secundario';
  accumulatedTotal: number; // Suma lógica: Inicial + Incrementales
  maxDailyTicket: number; // El ticket más alto hoy
  totalEntries: number;
  lastUpdated: number;
  discordUser?: DiscordUser;
  topTickets: number[]; // Las 5 mejores marcas individuales
}

export interface AppSettings {
  discordWebhook: string;
  discordRankingWebhook: string; // Nuevo campo para canal de ranking
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