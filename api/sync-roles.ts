
import { PlayerStats } from '../types';

// Configuración de tipos internos para la API
interface RoleThreshold {
  min: number;
  id: string;
}

export default async function handler(req: any, res: any) {
  // 1. Verificación de seguridad (Solo CRON o Auth manual)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_KEY;
    const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    const GUILD_ID = process.env.GUILD_ID;
    
    // Parsear umbrales desde variable de entorno
    // Ejemplo: [{"min": 1000000, "id": "12345"}, {"min": 500000, "id": "67890"}]
    const thresholds: RoleThreshold[] = JSON.parse(process.env.ROLE_THRESHOLDS || '[]')
      .sort((a: RoleThreshold, b: RoleThreshold) => b.min - a.min);

    if (!SUPABASE_URL || !SUPABASE_KEY || !BOT_TOKEN || !GUILD_ID) {
      throw new Error("Variables de entorno incompletas");
    }

    // 2. Obtener registros de Supabase
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/damage_records?select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const records = await dbRes.json();

    // 3. Calcular Stats (Lógica idéntica a getPlayerStats pero en servidor)
    const statsMap = new Map<string, number>();
    const userIds = Array.from(new Set(records.map((r: any) => r.discord_id).filter(Boolean)));

    userIds.forEach(uid => {
      const userRecords = records.filter((r: any) => r.discord_id === uid).sort((a: any, b: any) => a.timestamp - b.timestamp);
      const initial = userRecords.find((r: any) => r.record_type === 'INITIAL') || userRecords[0];
      const initialTotal = parseInt(initial.total_damage || 0);
      const incrementalSum = userRecords
        .filter((r: any) => r.timestamp > initial.timestamp)
        .reduce((acc: number, r: any) => acc + parseInt(r.ticket_damage || 0), 0);
      
      statsMap.set(uid as string, initialTotal + incrementalSum);
    });

    // 4. Sincronizar con Discord
    const results = [];
    for (const [discordId, totalDamage] of statsMap.entries()) {
      // Determinar qué rol le corresponde
      const targetRole = thresholds.find(t => totalDamage >= t.min);
      const allRoleIds = thresholds.map(t => t.id);

      if (targetRole) {
        // Obtener miembros actuales para no saturar la API si ya tiene el rol
        const memberRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}`, {
          headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
        });

        if (memberRes.ok) {
          const memberData = await memberRes.json();
          const currentRoles: string[] = memberData.roles;

          // Si no tiene el rol objetivo, añadirlo
          if (!currentRoles.includes(targetRole.id)) {
            await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${targetRole.id}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
            });
          }

          // Quitar otros roles de la misma categoría que no sean el objetivo
          for (const roleId of allRoleIds) {
            if (roleId !== targetRole.id && currentRoles.includes(roleId)) {
              await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bot ${BOT_TOKEN}` }
              });
            }
          }
          results.push({ user: discordId, damage: totalDamage, role: targetRole.id });
        }
      }
    }

    return res.status(200).json({ success: true, processed: results.length, details: results });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
