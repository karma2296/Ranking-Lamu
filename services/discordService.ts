
import { DiscordUser, PlayerStats } from '../types';

const getAppUrl = () => {
  // Intentamos obtener la URL manual desde los ajustes guardados
  const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
  if (s.customAppUrl && s.customAppUrl.trim() !== '') {
    return s.customAppUrl;
  }
  // Si no hay manual, usamos la actual del navegador
  return window.location.origin + window.location.pathname;
};

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

  const components = [
    {
      type: 1, 
      components: [
        {
          type: 2, 
          style: 5, 
          label: "Ver Historial Completo",
          url: getAppUrl()
        }
      ]
    }
  ];

  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify({ embeds: [embed], components }));
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

  // Botón para ir a la web (Ranking actualizado a "Registra tu daño")
  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 5,
          label: "Registra tu daño",
          url: getAppUrl(),
          emoji: { name: "⚔️" }
        }
      ]
    }
  ];

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed], components })
    });
  } catch (error) { console.error("Error enviando ranking:", error); }
};
