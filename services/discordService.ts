
import { DiscordUser } from '../types';

export const sendDamageToDiscord = async (
  webhookUrl: string, 
  data: { playerName: string, guild: string, damageValue: number, screenshotUrl?: string, discordUser?: DiscordUser }
) => {
  if (!webhookUrl) return;

  const guildLabel = data.guild === 'Principal' ? '🛡️ Lamu I (Principal)' : '⚔️ Lamu II (Secundario)';
  const userMention = data.discordUser ? `<@${data.discordUser.id}>` : 'Invitado';

  const embed = {
    title: "⚔️ ¡Nuevo Récord de Daño!",
    description: `Reportado por ${userMention}`,
    color: data.guild === 'Principal' ? 0x6366f1 : 0xf59e0b,
    fields: [
      { name: "Guerrero", value: `**${data.playerName}**`, inline: true },
      { name: "División", value: guildLabel, inline: true },
      { name: "Daño", value: `\`${data.damageValue.toLocaleString()}\``, inline: false }
    ],
    footer: { text: "Sistema de Ranking Lamu v2" },
    timestamp: new Date().toISOString()
  };

  if (data.screenshotUrl) {
    // Nota: Las URLs base64 no funcionan directamente en embeds de Discord Webhooks.
    // Solo enviamos el texto si no es una URL pública.
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error("Error enviando a Discord:", error);
  }
};
