import { Droplet, AlertTriangle } from 'lucide-react';

export default function StatusOrb({ status, ruleBased }) {
  // status: 1 = ok, 0 = bad
  const isOk = status === 1;
  const pulseClass = isOk ? 'pulse-ok' : 'pulse-bad';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '32px', padding: '32px', marginBottom: '32px' }} className="glass-panel animate-fade-in">
      <div 
        style={{
          width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '32px', fontWeight: '700',
          background: isOk ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
          boxShadow: isOk ? '0 0 40px rgba(16, 185, 129, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.4)' : '0 0 40px rgba(239, 68, 68, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.4)',
          animation: `${pulseClass} ${isOk ? '2.5s' : '2s'} infinite alternate`
        }}
      >
        <Droplet size={36} fill="currentColor" strokeWidth={0} />
      </div>

      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: '36px', marginBottom: '8px', color: isOk ? 'var(--neon-green)' : 'var(--neon-red)' }}>
          {isOk ? 'LAYAK MINUM' : 'TIDAK LAYAK'}
        </h2>
        {ruleBased && ruleBased.reasons && ruleBased.reasons.length > 0 ? (
          <>
            <ul style={{ color: 'var(--text-muted)', fontSize: '15px', listStylePosition: 'inside', marginBottom: '16px' }}>
              {ruleBased.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
            {!isOk && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--neon-red)', padding: '16px', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ color: 'var(--neon-red)', marginBottom: '8px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} /> Rekomendasi Tindakan:
                </h4>
                <ul style={{ color: '#fca5a5', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
                  {ruleBased.reasons.map((r, i) => {
                    let rec = "Lakukan pemeriksaan lebih lanjut.";
                    if (r.toLowerCase().includes("ph terlalu rendah")) rec = "Tambahkan senyawa basa (seperti kapur/kalsium karbonat) untuk menaikkan pH.";
                    else if (r.toLowerCase().includes("ph terlalu tinggi")) rec = "Tambahkan senyawa asam (seperti tawas) untuk menetralkan pH.";
                    else if (r.toLowerCase().includes("turbidity")) rec = "Air terlalu keruh. Lakukan penyaringan (filtrasi) dan pengendapan.";
                    else if (r.toLowerCase().includes("sulfate")) rec = "Kadar sulfat tinggi. Pertimbangkan proses Reverse Osmosis (RO) atau distilasi.";
                    else if (r.toLowerCase().includes("chloramines")) rec = "Gunakan filter karbon aktif atau proses deklorinasi.";
                    else if (r.toLowerCase().includes("trihalomethanes")) rec = "Tingkatkan aerasi udara pada penampungan air atau gunakan filter karbon.";
                    else if (r.toLowerCase().includes("conductivity")) rec = "Konduktivitas tinggi berarti banyak mineral terlarut. Lakukan demineralisasi jika perlu.";
                    return <li key={i}>{rec}</li>;
                  })}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            {isOk ? 'Kualitas air berada dalam standar yang aman.' : 'Terdeteksi anomali pada kualitas air dari pembacaan sensor.'}
          </p>
        )}
      </div>
    </div>
  );
}
