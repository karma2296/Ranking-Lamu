
export default async function handler(req: any, res: any) {
  // Verificación de seguridad para Vercel Cron
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  // En producción, si no hay clave secreta, rechazamos
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  }

  try {
    const { SUPABASE_URL, SUPABASE_KEY, DISCORD_BOT_TOKEN, GUILD_ID, ROLE_THRESHOLDS } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_KEY || !DISCORD_BOT_TOKEN || !GUILD_ID) {
      return res.status(500).json({ error: "Faltan variables de entorno" });
    }

    const thresholds = JSON.parse(ROLE_THRESHOLDS || '[]').sort((a: any, b: any) => b.min - a.min);

    // 1. Obtener registros de Supabase
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/damage_records?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    
    if (!dbRes.ok) throw new Error("Error Supabase");
    const records = await dbRes.json();

    // 2. Calcular daños acumulados por usuario
    const statsMap = new Map();
    const userIds = Array.from(new Set(records.map((r: any) => r.discord_id).filter(Boolean)));

    userIds.forEach(uid => {
      const userRecords = records
        .filter((r: any) => r.discord_id === uid)
        .sort((a: any, b: any) => a.timestamp - b.timestamp);
        
      const initial = userRecords.find((r: any) => r.record_type === 'INITIAL') || userRecords[0];
      const initialTotal = parseInt(initial.total_damage || 0);
      const incrementalSum = userRecords
        .filter((r: any) => r.timestamp > initial.timestamp)
        .reduce((acc: number, r: any) => acc + parseInt(r.ticket_damage || 0), 0);
      
      statsMap.set(uid, initialTotal + incrementalSum);
    });

    // 3. Actualizar Roles en Discord
    const results = [];
    for (const [discordId, totalDamage] of statsMap.entries()) {
      const targetRole = thresholds.find((t: any) => totalDamage >= t.min);
      const allRoleIds = thresholds.map((t: any) => t.id);

      const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
      });

      if (memberRes.ok) {
        const memberData = await memberRes.json();
        const currentRoles = memberData.roles || [];

        // Poner el rol que le toca
        if (targetRole && !currentRoles.includes(targetRole.id)) {
          await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${targetRole.id}`, {
            method: 'PUT', headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
          });
        }

        // Quitar los otros roles de rango que ya no le tocan
        for (const roleId of allRoleIds) {
          if ((!targetRole || roleId !== targetRole.id) && currentRoles.includes(roleId)) {
            await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`, {
              method: 'DELETE', headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
            });
          }
        }
        results.push({ id: discordId, damage: totalDamage });
      }
    }

    return res.status(200).json({ success: true, updated: results.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
