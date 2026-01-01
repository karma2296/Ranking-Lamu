// @ts-nocheck
/**
 * ARCHIVO DE SINCRONIZACIÓN DE ROLES - LAMU
 * Este archivo se ejecuta automáticamente cada hora.
 */

export default async function handler(req, res) {
  // 1. Verificación de Seguridad
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  // En producción, protegemos la URL para que solo Vercel pueda llamarla
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Acceso denegado' });
    }
  }

  try {
    const { SUPABASE_URL, SUPABASE_KEY, DISCORD_BOT_TOKEN, GUILD_ID, ROLE_THRESHOLDS } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_KEY || !DISCORD_BOT_TOKEN || !GUILD_ID) {
      return res.status(500).json({ error: "Faltan variables en Vercel Settings" });
    }

    // Configuración de rangos (ordenados de mayor a menor)
    const thresholds = JSON.parse(ROLE_THRESHOLDS || '[]').sort((a, b) => b.min - a.min);

    // 2. Obtener datos de daño desde Supabase
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/damage_records?select=*`, {
      headers: { 
        'apikey': SUPABASE_KEY, 
        'Authorization': `Bearer ${SUPABASE_KEY}` 
      }
    });
    
    if (!dbRes.ok) throw new Error("Error conectando a Supabase");
    const records = await dbRes.json();

    // 3. Calcular daño real por cada usuario
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

    // 4. Sincronizar con Discord
    const log = [];
    for (const [discordId, totalDamage] of statsMap.entries()) {
      const targetRole = thresholds.find(t => totalDamage >= t.min);
      const allRoleIds = thresholds.map(t => t.id);

      // Obtener datos del miembro en el servidor
      const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
        headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
      });

      if (memberRes.ok) {
        const memberData = await memberRes.json();
        const currentRoles = memberData.roles || [];

        // ASIGNAR ROL NUEVO (si corresponde y no lo tiene)
        if (targetRole && !currentRoles.includes(targetRole.id)) {
          await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${targetRole.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
          });
        }

        // QUITAR ROLES ANTIGUOS
        for (const roleId of allRoleIds) {
          if ((!targetRole || roleId !== targetRole.id) && currentRoles.includes(roleId)) {
            await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bot ${DISCORD_BOT_TOKEN}` }
            });
          }
        }
        log.push({ user: discordId, dmg: totalDamage });
      }
    }

    return res.status(200).json({ success: true, processed: log.length });

  } catch (error) {
    console.error("Error en el bot:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
