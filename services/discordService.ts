
export const sendDamageToDiscord = async (
  webhookUrl: string, 
  data: { playerName: string, guild: string, damageValue: number, screenshotUrl?: string }
) => {
  if (!webhookUrl) return;

  const guildLabel = data.guild === 'Principal' ? '🛡️ Lamu I (Principal)' : '⚔️ Lamu II (Secundario)';

  const embed = {
    title: "⚔️ ¡Nuevo Récord de Daño Registrado!",
    color: data.guild === 'Principal' ? 0x6366f1 : 0xf59e0b,
    fields: [
      {
        name: "Jugador",
        value: `**${data.playerName}**`,
        inline: true
      },
      {
        name: "División",
        value: guildLabel,
        inline: true
      },
      {
        name: "Daño Total",
        value: `\`${data.damageValue.toLocaleString()}\``,
        inline: false
      }
    ],
    footer: {
      text: "Validado por Lamu-AI System"
    },
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed]
      })
    });
  } catch (error) {
    console.error("Error enviando a Discord:", error);
  }
};
