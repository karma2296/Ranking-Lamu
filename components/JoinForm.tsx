
import React, { useState, useRef, useEffect } from 'react';
import { sendApplicationToDiscord } from '../services/discordService';
import { AppSettings } from '../types';

const JoinForm: React.FC = () => {
  const [guild, setGuild] = useState<'Lamu' | 'Lamu II' | null>(null);
  const [ign, setIgn] = useState('');
  const [level, setLevel] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('lamu_settings') || '{}');
    setSettings(s);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guild || !ign || !level || !previewUrl) return alert("Por favor completa todos los campos y sube tu captura.");
    
    setIsSending(true);
    setStatus("Enviando audición...");

    try {
      const webhook = settings?.recruitmentWebhook || settings?.discordWebhook;
      
      if (!webhook) throw new Error("Sistema de reclutamiento no configurado.");

      await sendApplicationToDiscord(webhook, {
        guildName: guild,
        playerName: ign,
        level: parseInt(level),
        screenshotUrl: previewUrl
      });

      setStatus("✓ SOLICITUD ENVIADA");
      setIgn('');
      setLevel('');
      setPreviewUrl(null);
      setGuild(null);
    } catch (err: any) {
      alert(err.message);
      setStatus("Error al enviar");
    } finally {
      setIsSending(false);
    }
  };

  if (status === "✓ SOLICITUD ENVIADA") {
    return (
      <div className="max-w-xl mx-auto py-20 text-center animate-in zoom-in duration-500">
        <h2 className="text-4xl font-black text-sky-400 ado-title italic mb-4">¡Audición Recibida!</h2>
        <p className="text-white font-bold uppercase tracking-widest text-xs">El Staff revisará tu perfil pronto. Mantente atento.</p>
        <button onClick={() => setStatus(null)} className="mt-8 text-sky-600 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">Enviar otra solicitud</button>
      </div>
    );
  }

  const isG1Open = settings?.lamuG1Open !== false;
  const isG2Open = settings?.lamuG2Open !== false;

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-in fade-in">
      <div className="bg-sky-950/40 rounded-[3rem] p-10 border-2 border-sky-400/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-black text-white ado-title italic drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">Unirse al Gremio</h2>
          <p className="text-sky-400/60 font-black text-[9px] uppercase tracking-[0.5em] mt-2 italic">Formulario de Reclutamiento M&G</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10">
          {/* BOTÓN LAMU G1 */}
          <button 
            type="button"
            disabled={!isG1Open}
            onClick={() => setGuild('Lamu')}
            className={`relative h-48 rounded-[2.5rem] overflow-hidden border-2 transition-all group ${!isG1Open ? 'opacity-40 grayscale pointer-events-none' : ''} ${guild === 'Lamu' ? 'border-sky-400 scale-[1.05] shadow-[0_0_30px_rgba(14,165,233,0.5)]' : 'border-sky-900/30'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
              style={{backgroundImage: `url('https://media.discordapp.net/attachments/1449825309011480647/1458604572011663462/image0.jpg?ex=69603edd&is=695eed5d&hm=3f69acc6217b2f7bfdb359eea1ab1734105899fbcbf2e2b3d24e047acfded048&=&format=webp&width=958&height=431')`}}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${guild === 'Lamu' ? 'from-sky-950 via-sky-950/40' : 'from-black via-black/20'} to-transparent`} />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
              <span className={`text-xs font-black uppercase tracking-[0.3em] ${!isG1Open ? 'text-rose-500' : 'text-white'}`}>
                {isG1Open ? 'Lamu (G1)' : 'SIN CUPOS'}
              </span>
              <span className="text-[7px] text-sky-400/60 font-black uppercase mt-1 tracking-widest">Main Stage</span>
            </div>
          </button>

          {/* BOTÓN LAMU G2 */}
          <button 
            type="button"
            disabled={!isG2Open}
            onClick={() => setGuild('Lamu II')}
            className={`relative h-48 rounded-[2.5rem] overflow-hidden border-2 transition-all group ${!isG2Open ? 'opacity-40 grayscale pointer-events-none' : ''} ${guild === 'Lamu II' ? 'border-blue-400 scale-[1.05] shadow-[0_0_30px_rgba(37,99,235,0.5)]' : 'border-sky-900/30'}`}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
              style={{backgroundImage: `url('https://media.discordapp.net/attachments/1449825309011480647/1458608389318901810/1000065430.jpg?ex=6960426b&is=695ef0eb&hm=e63742e1bb0251214ce4a233f42e545c69bff80762f371ad3e0de32b7619b5ae&=&format=webp&width=958&height=431')`}}
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${guild === 'Lamu II' ? 'from-blue-950 via-blue-950/40' : 'from-black via-black/20'} to-transparent`} />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
              <span className={`text-xs font-black uppercase tracking-[0.3em] ${!isG2Open ? 'text-rose-500' : 'text-white'}`}>
                {isG2Open ? 'Lamu II (G2)' : 'SIN CUPOS'}
              </span>
              <span className="text-[7px] text-blue-400/60 font-black uppercase mt-1 tracking-widest">Rising Stars</span>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-sky-700 uppercase tracking-widest ml-2">Nombre en el Juego (IGN)</label>
              <input type="text" value={ign} onChange={e => setIgn(e.target.value)} placeholder="TU NICKNAME" className="w-full bg-black/40 border border-sky-900/30 rounded-2xl px-6 py-4 text-white font-black uppercase text-sm outline-none focus:border-sky-500/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-sky-700 uppercase tracking-widest ml-2">Nivel de Cuenta</label>
              <input type="number" value={level} onChange={e => setLevel(e.target.value)} placeholder="70" className="w-full bg-black/40 border border-sky-900/30 rounded-2xl px-6 py-4 text-white font-mono text-sm outline-none focus:border-sky-500/50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-sky-700 uppercase tracking-widest ml-2">Captura de Pantalla (Perfil/Colección)</label>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-sky-900/30 rounded-[2rem] py-12 text-center bg-black/20 hover:border-sky-400 transition-colors cursor-pointer overflow-hidden relative">
              <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept="image/*" />
              {previewUrl ? <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : null}
              <div className="relative z-10">
                <span className="text-3xl">📸</span>
                <p className="text-sky-800 text-[9px] font-black uppercase mt-4">Adjuntar prueba de nivel</p>
              </div>
            </div>
          </div>

          <button disabled={isSending || !guild} className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-20 disabled:grayscale py-6 rounded-3xl text-sky-950 font-black uppercase tracking-widest shadow-[0_0_40px_rgba(14,165,233,0.2)] transition-all active:scale-95">
            {isSending ? 'Enviando...' : 'POSTULAR AL GREMIO'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinForm;
