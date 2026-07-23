import { Activity, Thermometer, Zap, Droplet, AlertTriangle, Beaker, FlaskConical, Target } from 'lucide-react';

export default function KPICards({ data }) {
  if (!data) return null;

  const Card = ({ title, value, unit, icon: Icon, color, alert }) => (
    <div className={`glass-panel animate-fade-in ${alert ? 'pulse-danger' : ''}`} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderTop: `2px solid ${color}`, position: 'relative' }}>
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
      {alert && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--neon-red)' }}>
          <AlertTriangle size={18} />
        </div>
      )}
    </div>
  );

  const SecondaryMetric = ({ title, value, unit, isWarning }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 16px', background: isWarning ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.03)',
      borderRadius: '8px', borderLeft: `3px solid ${isWarning ? 'var(--neon-red)' : 'var(--neon-cyan)'}`
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '15px', fontWeight: '600', color: isWarning ? 'var(--neon-red)' : '#fff' }}>
          {typeof value === 'number' ? value.toFixed(2) : value}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{unit}</span>
      </div>
    </div>
  );

  // Evaluasi warna Primary
  const isPhWarning = data.ph < 6.5 || data.ph > 8.5;
  const isTurbidityWarning = data.Turbidity > 5.0;
  
  const getPhColor = (ph) => !isPhWarning ? 'var(--neon-green)' : 'var(--neon-red)';
  const getTurbidityColor = (t) => !isTurbidityWarning ? 'var(--neon-blue)' : 'var(--neon-red)';
  const getConfidenceColor = (p) => p >= 0.5 ? 'var(--neon-cyan)' : 'var(--neon-red)';

  // Evaluasi Warning Secondary
  const isSulfateWarning = data.Sulfate > 250;
  const isChloraminesWarning = data.Chloramines > 4.0;
  const isTrihalomethanesWarning = data.Trihalomethanes > 80;

  return (
    <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. PRIMARY CARDS (Top Row) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <Card title="Keyakinan Sistem (ML)" value={data.probability * 100} unit="%" icon={Activity} color={getConfidenceColor(data.probability)} />
        <Card title="Kadar pH Terkini" value={data.ph} unit="" icon={Droplet} color={getPhColor(data.ph)} alert={isPhWarning} />
        <Card title="Kekeruhan (Turbidity)" value={data.Turbidity} unit="NTU" icon={Thermometer} color={getTurbidityColor(data.Turbidity)} alert={isTurbidityWarning} />
        <Card title="Konduktivitas" value={data.Conductivity} unit="μS/cm" icon={Zap} color="var(--neon-purple)" />
      </div>

      {/* 2. SECONDARY PARAMETERS (Compact Grid) */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Beaker size={18} color="var(--neon-cyan)" />
          <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Detail Kandungan Kimia</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <SecondaryMetric title="Sulfate (Sulfat)" value={data.Sulfate} unit="mg/L" isWarning={isSulfateWarning} />
          <SecondaryMetric title="Chloramines (Kloramin)" value={data.Chloramines} unit="mg/L" isWarning={isChloraminesWarning} />
          <SecondaryMetric title="Trihalomethanes" value={data.Trihalomethanes} unit="µg/L" isWarning={isTrihalomethanesWarning} />
          <SecondaryMetric title="Hardness (Kekerasan)" value={data.Hardness} unit="mg/L" isWarning={false} />
          <SecondaryMetric title="Solids (Padatan Terlarut)" value={data.Solids} unit="ppm" isWarning={false} />
          <SecondaryMetric title="Organic Carbon" value={data.Organic_carbon} unit="ppm" isWarning={false} />
        </div>
      </div>
      
    </div>
  );
}
