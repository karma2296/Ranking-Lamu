
import { DiscordUser, PlayerStats } from '../types';

export const sendDamageToDiscord = async (
  webhookUrl: string, 
  data: { playerName: string, guild: string, damageValue: number, screenshotUrl?: string, discordUser: DiscordUser }
) => {
  if (!webhookUrl) return;

  const embed = {
    title: "⚔️ REPORTE DE ASALTO: LOCKED 'N' LOADED",
    description: `El guerrero **${data.playerName}** ha golpeado al boss.\n\n👤 **Piloto:** <@${data.discordUser.id}>`,
    color: 0x10b981,
    fields: [
      { name: "💥 Daño de Ticket", value: `\`${data.damageValue.toLocaleString()}\``, inline: true },
      { name: "🕒 Registro", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
    ],
    footer: { text: "Sistema Táctico Locked 'N' Loaded" },
    timestamp: new Date().toISOString()
  };

  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify({ embeds: [embed] }));
    if (data.screenshotUrl) {
      const base64Data = data.screenshotUrl.split(',')[1];
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      formData.append('file', new Blob([array], { type: 'image/png' }), 'damage.png');
    }
    await fetch(webhookUrl, { method: 'POST', body: formData });
  } catch (error) { console.error("Error enviando reporte individual:", error); }
};

export const sendRankingToDiscord = async (webhookUrl: string, stats: PlayerStats[]) => {
  if (!webhookUrl || stats.length === 0) return;

  // Formato tabla profesional alineada
  let table = "```py\n";
  table += "POS | GUERRERO        | DAÑO ACUMULADO\n";
  table += "----|-----------------|----------------\n";
  stats.slice(0, 15).forEach((p, i) => {
    const rank = (i + 1).toString().padStart(2, '0').padEnd(3);
    const name = p.playerName.substring(0, 15).padEnd(15);
    const damage = p.accumulatedTotal.toLocaleString().padStart(14);
    table += `${rank} | ${name} | ${damage}\n`;
  });
  table += "```";

  const embed = {
    title: "🏆 RANKING GLOBAL: LOCKED 'N' LOADED",
    description: `Actualización del estado de la incursión:\n${table}`,
    color: 0x3b82f6,
    fields: [
      { name: "👑 Líder Actual", value: `🥇 **${stats[0].playerName}** con **${stats[0].accumulatedTotal.toLocaleString()}**`, inline: false }
    ],
    footer: { text: "Actualización automática • Wind Season" },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) { console.error("Error enviando ranking:", error); }
};
