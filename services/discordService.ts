
import { DiscordUser, PlayerStats } from '../types';

/**
 * Obtiene los ajustes actuales y valida la URL para el botón.
 */
const getDiscordConfig = () => {
  const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
  
  let appUrl = '';
  if (s.customAppUrl && s.customAppUrl.trim() !== '') {
    appUrl = s.customAppUrl.trim();
  } else {
    appUrl = window.location.origin + window.location.pathname;
  }

  // Discord requiere que la URL del botón sea absoluta y comience por http/https
  if (appUrl && !appUrl.startsWith('http')) {
    appUrl = 'https://' + appUrl;
  }
  
  return {
    appUrl,
    clientId: s.discordClientId || null
  };
};

export const sendDamageToDiscord = async (
  webhookUrl: string, 
  data: { playerName: string, guild: string, damageValue: number, screenshotUrl?: string, discordUser: DiscordUser }
) => {
  if (!webhookUrl) return;

  const config = getDiscordConfig();

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

  const payload: any = {
    embeds: [embed],
    components: [
      {
        type: 1, 
        components: [
          {
            type: 2, 
            style: 5, 
            label: "Ver Historial Completo",
            url: config.appUrl
          }
        ]
      }
    ]
  };

  // Importante: El application_id es necesario para que aparezcan los botones
  if (config.clientId) {
    payload.application_id = config.clientId;
  }

  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(payload));
    
    if (data.screenshotUrl) {
      const base64Data = data.screenshotUrl.split(',')[1];
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
      formData.append('file', new Blob([array], { type: 'image/png' }), 'damage.png');
    }

    await fetch(webhookUrl, { method: 'POST', body: formData });
  } catch (error) { 
    console.error("Error enviando reporte individual:", error); 
  }
};

export const sendRankingToDiscord = async (webhookUrl: string, stats: PlayerStats[]) => {
  if (!webhookUrl || stats.length === 0) return;

  const config = getDiscordConfig();

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

  const payload: any = {
    embeds: [embed],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "Registra tu daño", // Etiqueta limpia sin emojis para máxima compatibilidad
            url: config.appUrl
          }
        ]
      }
    ]
  };

  // Necesario para botones en webhooks de aplicaciones
  if (config.clientId) {
    payload.application_id = config.clientId;
  }

  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify(payload));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en respuesta de Discord:", errorText);
    }
  } catch (error) { 
    console.error("Error crítico enviando ranking:", error); 
  }
};
