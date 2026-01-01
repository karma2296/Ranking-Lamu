import { DiscordUser } from '../types';

export const sendDamageToDiscord = async (
  webhookUrl: string, 
  data: { playerName: string, guild: string, damageValue: number, screenshotUrl?: string, discordUser: DiscordUser }
) => {
  if (!webhookUrl) return;

  const embed = {
    title: "⚔️ ¡NUEVO REPORTE DE DAÑO!",
    description: `El guerrero **${data.playerName}** ha registrado un nuevo ataque.\nRegistrado por: <@${data.discordUser.id}>`,
    color: data.guild === 'Principal' ? 0x6366f1 : 0xf59e0b,
    fields: [
      { 
        name: "👤 Usuario Discord", 
        value: `\`${data.discordUser.username}\``, 
        inline: true 
      },
      { 
        name: "🏢 Gremio", 
        value: `\`${data.guild}\``, 
        inline: true 
      },
      { 
        name: "💥 Daño de Ticket", 
        value: `**${data.damageValue.toLocaleString()}**`, 
        inline: false 
      }
    ],
    image: data.screenshotUrl ? { url: 'attachment://screenshot.png' } : undefined,
    footer: {
      text: "Lamu Guild System • Skullgirls Mobile",
      icon_url: data.discordUser.avatar
    },
    timestamp: new Date().toISOString()
  };

  try {
    const formData = new FormData();
    formData.append('payload_json', JSON.stringify({ embeds: [embed] }));
    
    if (data.screenshotUrl) {
      // Convertir base64 a blob
      const base64Data = data.screenshotUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      formData.append('file', blob, 'screenshot.png');
    }

    const response = await fetch(webhookUrl, { 
      method: 'POST', 
      body: formData 
    });

    if (!response.ok) {
      console.error("Error enviando Webhook:", await response.text());
    }
  } catch (error) { 
    console.error("Error en sendDamageToDiscord:", error); 
  }
};