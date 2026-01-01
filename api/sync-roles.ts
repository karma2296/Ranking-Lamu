// @ts-nocheck
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (req.headers['authorization'] !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  }

  try {
    const { SUPABASE_URL, SUPABASE_KEY, DISCORD_BOT_TOKEN, GUILD_ID, ROLE_THRESHOLDS } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_KEY || !DISCORD_BOT_TOKEN || !GUILD_ID) {
      throw new Error("Variables de entorno faltantes en Vercel");
    }

    const thresholds = JSON.parse(ROLE_THRESHOLDS || '[]').sort((a, b) => b.min - a.min);

    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/damage_records?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    
    if (!dbRes.ok) throw new Error("Fallo al conectar con Supabase");
    const records = await dbRes.json();

    const statsMap = new Map();
    const userIds = [...new Set(records.map(r => r.discord_id).filter(Boolean))];

    userIds.forEach(uid => {
      const userRecords = records
        .filter(r => r.discord_id === uid)
        .sort((a, b) => a.timestamp - b.timestamp);
        
      const initial = userRecords.find(r => r.record_type === 'INITIAL') || userRecords[0];
      const initialTotal = parseInt(initial.total_damage || 0);
      const incrementalSum = userRecords
        .filter(r => r.timestamp > initial.timestamp)
        .reduce((acc, r) => acc + parseInt(r.ticket_damage || 0), 0);
      
      statsMap.set(uid, initialTotal + incrementalSum);
    });

    for (const [discordId, totalDamage] of statsMap.entries()) {
      const targetRole = thresholds.find(t => totalDamage >= t.min);
      const allRoleIds = thresholds.map(t => t.id);

      const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
      });

      if (memberRes.ok) {
        const memberData = await memberRes.json();
        const currentRoles = memberData.roles || [];

        if (targetRole && !currentRoles.includes(targetRole.id)) {
          await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${targetRole.id}`, {
            method: 'PUT', headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
          });
        }

        for (const roleId of allRoleIds) {
          if ((!targetRole || roleId !== targetRole.id) && currentRoles.includes(roleId)) {
            await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`, {
              method: 'DELETE', headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
            });
          }
        }
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
