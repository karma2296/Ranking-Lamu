
import { DiscordUser, PlayerStats } from '../types';

const getDiscordConfig = () => {
  const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
  let appUrl = s.customAppUrl && s.customAppUrl.trim() !== '' ? s.customAppUrl.trim() : window.location.origin + window.location.pathname;
  if (appUrl && !appUrl.startsWith('http')) appUrl = 'https://' + appUrl;
  return { appUrl, clientId: s.discordClientId || null };
};

export const sendApplicationToDiscord = async (
  webhookUrl: string, 
  data: { guildName: string, playerName: string, level: number, screenshotUrl: string }
) => {
  if (!webhookUrl) return;

  const embed = {
    title: "📩 NUEVA SOLICITUD DE RECLUTAMIENTO",
    description: `Un nuevo guerrero desea unirse a nuestras filas.`,
    color: data.guildName === 'Lamu' ? 0x0ea5e9 : 0x2563eb,
    fields: [
      { name: "🏰 Gremio", value: `**${data.guildName}**`, inline: true },
      { name: "👤 Jugador", value: `**${data.playerName}**`, inline: true },
      { name: "⭐ Nivel", value: `\`${data.level}\``, inline: true }
    ],
    footer: { text: "M&G Recruitment System • Blue Rose" },
    timestamp: new Date().toISOString()
  };

  const payload: any = { embeds: [embed] };

  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(payload));
    const base64Data = data.screenshotUrl.split(',')[1];
    const binary = atob(base64Data);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    formData.append('file', new Blob([array], { type: 'image/png' }), 'audicion.png');

    await fetch(webhookUrl, { method: 'POST', body: formData });
  } catch (error) { console.error("Error enviando reclutamiento:", error); }
};

export const sendDamageToDiscord = async (
  webhookUrl: string, 
  data: { playerName: string, guild: string, damageValue: number, screenshotUrl?: string, discordUser: DiscordUser }
) => {
  if (!webhookUrl) return;
  const config = getDiscordConfig();
  const embed = {
    title: "🌹 PERFORMANCE LOG: BLUE ROSE",
    description: `La vocalista **${data.playerName}** ha dejado su marca.\n\n👤 **Staff/User:** <@${data.discordUser.id}>`,
    color: 0x0ea5e9,
    fields: [
      { name: "🎵 Verse Score", value: `\`${data.damageValue.toLocaleString()}\``, inline: true },
      { name: "🕒 On Air", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
    ],
    footer: { text: "Ado Revolution • Blue Ranking System" },
    timestamp: new Date().toISOString()
  };
  const payload: any = { embeds: [embed] };
  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(payload));
    if (data.screenshotUrl) {
      const base64Data = data.screenshotUrl.split(',')[1];
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      formData.append('file', new Blob([array], { type: 'image/png' }), 'performance.png');
    }
    await fetch(webhookUrl, { method: 'POST', body: formData });
  } catch (error) { console.error(error); }
};

export const sendRankingToDiscord = async (webhookUrl: string, stats: PlayerStats[]) => {
  if (!webhookUrl || stats.length === 0) return;
  const config = getDiscordConfig();
  let table = "```py\nPOS | VOCALIST        | TOTAL SCORE\n----|-----------------|----------------\n";
  stats.slice(0, 15).forEach((p, i) => {
    const rank = (i + 1).toString().padStart(2, '0').padEnd(3);
    const name = p.playerName.substring(0, 15).padEnd(15);
    const damage = p.accumulatedTotal.toLocaleString().padStart(14);
    table += `${rank} | ${name} | ${damage}\n`;
  });
  table += "```";
  const embed = {
    title: "🏆 TOP CHARTS: BLUE ROSE REVOLUTION",
    description: `Estado actual del ranking:\n${table}`,
    color: 0x0369a1,
    footer: { text: "Actualización Automática • M&G System" },
    timestamp: new Date().toISOString()
  };
  const payload: any = { embeds: [embed] };
  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(payload));
    await fetch(webhookUrl, { method: 'POST', body: formData });
  } catch (error) { console.error(error); }
};
