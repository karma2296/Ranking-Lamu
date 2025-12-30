
import { DiscordUser } from '../types';

export const sendDamageToDiscord = async (
  webhookUrl: string, 
  data: { playerName: string, guild: string, damageValue: number, screenshotUrl?: string, discordUser: DiscordUser }
) => {
  if (!webhookUrl) return;

  const guildLabel = data.guild === 'Principal' ? '🛡️ Lamu I (Principal)' : '⚔️ Lamu II (Secundario)';
  const userMention = `<@${data.discordUser.id}>`;

  const embed = {
    title: "⚔️ ¡Nuevo Récord de Daño!",
    description: `Reportado por ${userMention}`,
    color: data.guild === 'Principal' ? 0x6366f1 : 0xf59e0b,
    fields: [
      { name: "Guerrero", value: `**${data.playerName}**`, inline: true },
      { name: "División", value: guildLabel, inline: true },
      { name: "Daño", value: `\`${data.damageValue.toLocaleString()}\``, inline: false }
    ],
    image: { url: 'attachment://screenshot.png' },
    footer: { text: "Sistema de Ranking Lamu v2" },
    timestamp: new Date().toISOString()
  };

  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify({ embeds: [embed] }));

    if (data.screenshotUrl) {
      const response = await fetch(data.screenshotUrl);
      const blob = await response.blob();
      formData.append('file', blob, 'screenshot.png');
    }

    await fetch(webhookUrl, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error("Error enviando a Discord:", error);
  }
};
