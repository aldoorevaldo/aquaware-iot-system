import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

export default function SensorCharts({ data }) {
  // data is an array of readings. Recharts works well with array of objects.
  // We'll format the timestamp to just time for XAxis
  const chartData = data.map(d => {
    const date = new Date(d.ts);
    return {
      ...d,
      probPercent: d.probability ? d.probability * 100 : 0,
      timeLabel: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: '#fff' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</p>
          <p style={{ color: payload[0].color, fontWeight: 'bold' }}>{`${payload[0].name}: ${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  const ChartCard = ({ title, dataKey, stroke, unit, fullWidth }) => (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: '300px', display: 'flex', flexDirection: 'column', gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <h3 style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '500' }}>
        {title} <span style={{ fontSize: '12px', opacity: 0.6 }}>({unit})</span>
      </h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="timeLabel" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} />
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} domain={dataKey === 'probPercent' ? [0, 100] : ['auto', 'auto']} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={stroke} 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: stroke, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // 1. Calculate Root Causes
  const anomalyCounts = {};
  data.forEach(d => {
    if (d.reasons && d.reasons.length > 0) {
      d.reasons.forEach(r => {
        const param = r.split(' ')[0]; // First word is the parameter
        anomalyCounts[param] = (anomalyCounts[param] || 0) + 1;
      });
    }
  });
  const rootCauseData = Object.keys(anomalyCounts).map(key => ({
    name: key,
    count: anomalyCounts[key]
  })).sort((a, b) => b.count - a.count); // sort descending

  const barColors = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16'];

  // 2. Calculate Radar Chart Data (Current State vs Threshold)
  const latest = data.length > 0 ? data[data.length - 1] : null;
  let radarData = [];
  if (latest) {
    // Normalization: (Value / WHO Limit) * 100
    radarData = [
      { subject: 'pH', value: (latest.ph / 8.5) * 100, fullMark: 150 },
      { subject: 'Turbidity', value: (latest.Turbidity / 5.0) * 100, fullMark: 150 },
      { subject: 'Sulfate', value: (latest.Sulfate / 250.0) * 100, fullMark: 150 },
      { subject: 'Chloramines', value: (latest.Chloramines / 4.0) * 100, fullMark: 150 },
      { subject: 'Trihalomethanes', value: (latest.Trihalomethanes / 80.0) * 100, fullMark: 150 },
    ];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Root Cause Chart */}
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '4px', fontWeight: '600' }}>
            Distribusi Akar Masalah <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: '400' }}>(Frekuensi Anomali)</span>
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>Menganalisis parameter yang paling sering melanggar standar WHO hari ini.</p>
          <div style={{ flex: 1, minHeight: 0 }}>
            {rootCauseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rootCauseData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.8)" fontSize={11} />
                  <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="count" name="Jumlah Anomali" radius={[0, 4, 4, 0]}>
                    {rootCauseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Belum ada anomali terdeteksi
              </div>
            )}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '4px', fontWeight: '600' }}>
            Keseimbangan Parameter <span style={{ fontSize: '12px', opacity: 0.6, fontWeight: '400' }}>(Terkini)</span>
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--neon-cyan)', marginBottom: '12px' }}>*Garis merah 100% adalah ambang batas maksimal standar WHO</p>
          <div style={{ flex: 1, minHeight: 0 }}>
            {latest ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.8)', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                  <Radar name="Batas Bahaya (100%)" dataKey={() => 100} stroke="var(--neon-red)" strokeWidth={1} fill="transparent" strokeDasharray="3 3" />
                  <Radar name="Nilai Saat Ini (%)" dataKey="value" stroke="var(--neon-cyan)" strokeWidth={2} fill="var(--neon-cyan)" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Menunggu data
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Line Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <ChartCard title="Tren Keyakinan ML (Layak Minum)" dataKey="probPercent" stroke="#f59e0b" unit="%" fullWidth />
        <ChartCard title="Tingkat pH" dataKey="ph" stroke="var(--neon-cyan)" unit="0-14" />
        <ChartCard title="Kekeruhan (Turbidity)" dataKey="Turbidity" stroke="var(--neon-blue)" unit="NTU" />
        <ChartCard title="Konduktivitas" dataKey="Conductivity" stroke="var(--neon-green)" unit="μS/cm" />
        <ChartCard title="Sulfate" dataKey="Sulfate" stroke="#a855f7" unit="mg/L" />
      </div>

    </div>
  );
}
