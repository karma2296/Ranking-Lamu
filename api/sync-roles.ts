
// Archivo independiente para evitar errores de compilación en Vercel
interface RoleThreshold {
  min: number;
  id: string;
}

export default async function handler(req: any, res: any) {
  // 1. Verificación de seguridad básica
  // En Vercel Cron, se puede usar la variable CRON_SECRET que Vercel envía automáticamente
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;
  
  if (process.env.NODE_ENV === 'production') {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const GUILD_ID = process.env.GUILD_ID;
    
    // Parsear umbrales: [{"min": 1000000, "id": "123"}, {"min": 500000, "id": "456"}]
    const thresholds: RoleThreshold[] = JSON.parse(process.env.ROLE_THRESHOLDS || '[]')
      .sort((a: any, b: any) => b.min - a.min);

    if (!SUPABASE_URL || !SUPABASE_KEY || !BOT_TOKEN || !GUILD_ID) {
      return res.status(500).json({ error: "Faltan variables de entorno en Vercel" });
    }

    // 2. Obtener datos de Supabase
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/damage_records?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    
    if (!dbRes.ok) throw new Error("Error al conectar con Supabase");
    const records = await dbRes.json();

    // 3. Procesar ranking
    const statsMap = new Map<string, number>();
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
      
      statsMap.set(uid as string, initialTotal + incrementalSum);
    });

    // 4. Actualizar en Discord
    const log = [];
    for (const [discordId, totalDamage] of statsMap.entries()) {
      const targetRole = thresholds.find(t => totalDamage >= t.min);
      const allRoleIds = thresholds.map(t => t.id);

      const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
        headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
      });

      if (memberRes.ok) {
        const memberData = await memberRes.json();
        const currentRoles: string[] = memberData.roles;

        // Añadir rol si corresponde
        if (targetRole && !currentRoles.includes(targetRole.id)) {
          await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${targetRole.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
          });
        }

        // Quitar roles viejos
        for (const roleId of allRoleIds) {
          if ((!targetRole || roleId !== targetRole.id) && currentRoles.includes(roleId)) {
            await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
            });
          }
        }
        log.push({ id: discordId, dmg: totalDamage, role: targetRole?.id || 'none' });
      }
    }

    return res.status(200).json({ success: true, processed: log.length, summary: log });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
