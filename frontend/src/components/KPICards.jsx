import { Activity, Thermometer, Zap, Droplet } from 'lucide-react';

export default function KPICards({ data }) {
  if (!data) return null;

  const Card = ({ title, value, unit, icon: Icon, color }) => (
    <div className="glass-panel animate-fade-in" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderTop: `2px solid ${color}` }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${color}22`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>{typeof value === 'number' ? value.toFixed(2) : value}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{unit}</span>
        </div>
      </div>
    </div>
  );

  // Evaluasi warna berdasarkan ambang batas sederhana
  const getPhColor = (ph) => (ph >= 6.5 && ph <= 8.5) ? 'var(--neon-green)' : 'var(--neon-red)';
  const getTurbidityColor = (t) => t <= 5.0 ? 'var(--neon-blue)' : 'var(--neon-red)';
  const getConfidenceColor = (p) => p >= 0.5 ? 'var(--neon-cyan)' : 'var(--neon-red)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
      <Card title="Keyakinan Sistem (ML)" value={data.probability * 100} unit="%" icon={Activity} color={getConfidenceColor(data.probability)} />
      <Card title="Kadar pH Terkini" value={data.ph} unit="" icon={Droplet} color={getPhColor(data.ph)} />
      <Card title="Kekeruhan (Turbidity)" value={data.Turbidity} unit="NTU" icon={Thermometer} color={getTurbidityColor(data.Turbidity)} />
      <Card title="Konduktivitas" value={data.Conductivity} unit="μS/cm" icon={Zap} color="var(--neon-purple)" />
    </div>
  );
}
