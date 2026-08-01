import { Droplet, AlertTriangle } from 'lucide-react';

export default function StatusOrb({ mlStatus, ruleBasedStatus, reasons }) {
  const isMlOk = mlStatus === 1;
  const isRbOk = ruleBasedStatus === 1;
  const isOverallOk = isMlOk && isRbOk; // Aman HANYA jika KEDUANYA bilang aman
  
  const pulseClass = isOverallOk ? 'pulse-ok' : 'pulse-bad';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '32px', marginBottom: '32px' }} className="glass-panel animate-fade-in">
      <div 
        style={{
          width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '32px', fontWeight: '700',
          background: isOverallOk ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
          boxShadow: isOverallOk ? '0 0 40px rgba(16, 185, 129, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.4)' : '0 0 40px rgba(239, 68, 68, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.4)',
          animation: `${pulseClass} ${isOverallOk ? '2.5s' : '2s'} infinite alternate`
        }}
      >
        <Droplet size={36} fill="currentColor" strokeWidth={0} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ 
            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase',
            background: isMlOk ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            color: isMlOk ? '#10b981' : '#ef4444', 
            border: `1px solid ${isMlOk ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            AI Model: {isMlOk ? 'Aman' : 'Anomali'}
          </span>
          <span style={{ 
            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase',
            background: isRbOk ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            color: isRbOk ? '#10b981' : '#ef4444', 
            border: `1px solid ${isRbOk ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            Aturan WHO: {isRbOk ? 'Sesuai Standar' : 'Pelanggaran'}
          </span>
        </div>

        <h2 style={{ fontSize: '36px', marginBottom: '8px', color: isOverallOk ? 'var(--neon-green)' : 'var(--neon-red)' }}>
          {isOverallOk ? 'LAYAK MINUM' : 'TIDAK LAYAK'}
        </h2>
        
        {!isOverallOk ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--neon-red)', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
            <h4 style={{ color: 'var(--neon-red)', marginBottom: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Peringatan Sistem (Context-Aware):
            </h4>
            
            {reasons && reasons.length > 0 ? (
              <ul style={{ color: '#fca5a5', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
                {reasons.map((r, i) => {
                  let rec = "Lakukan pemeriksaan lebih lanjut.";
                  if (r.toLowerCase().includes("ph terlalu rendah")) rec = "Tambahkan senyawa basa (seperti kapur/kalsium karbonat) untuk menaikkan pH.";
                  else if (r.toLowerCase().includes("ph terlalu tinggi")) rec = "Tambahkan senyawa asam (seperti tawas) untuk menetralkan pH.";
                  else if (r.toLowerCase().includes("turbidity")) rec = "Air terlalu keruh. Lakukan penyaringan (filtrasi) dan pengendapan.";
                  else if (r.toLowerCase().includes("sulfate")) rec = "Kadar sulfat tinggi. Pertimbangkan proses Reverse Osmosis (RO) atau distilasi.";
                  else if (r.toLowerCase().includes("chloramines")) rec = "Gunakan filter karbon aktif atau proses deklorinasi.";
                  else if (r.toLowerCase().includes("trihalomethanes")) rec = "Tingkatkan aerasi udara pada penampungan air atau gunakan filter karbon.";
                  else if (r.toLowerCase().includes("conductivity")) rec = "Konduktivitas tinggi berarti banyak mineral terlarut. Lakukan demineralisasi jika perlu.";
                  return <li key={i}><strong>{r.split(' terlalu')[0].split(' melebihi')[0]}:</strong> {rec}</li>;
                })}
              </ul>
            ) : (
              <p style={{ color: '#fca5a5', fontSize: '14px', margin: 0 }}>
                Sistem AI mendeteksi pola anomali beracun tersembunyi meskipun parameter kimia tunggal terlihat wajar. Hentikan distribusi air sementara dan lakukan uji lab.
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Kualitas air tervalidasi aman oleh kecerdasan buatan dan standar WHO.
          </p>
        )}
      </div>
    </div>
  );
}
