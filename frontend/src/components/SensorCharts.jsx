import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
      <ChartCard title="Tren Keyakinan ML (Layak Minum)" dataKey="probPercent" stroke="#f59e0b" unit="%" fullWidth />
      <ChartCard title="Tingkat pH" dataKey="ph" stroke="var(--neon-cyan)" unit="0-14" />
      <ChartCard title="Kekeruhan (Turbidity)" dataKey="Turbidity" stroke="var(--neon-blue)" unit="NTU" />
      <ChartCard title="Konduktivitas" dataKey="Conductivity" stroke="var(--neon-green)" unit="μS/cm" />
      <ChartCard title="Sulfate" dataKey="Sulfate" stroke="#a855f7" unit="mg/L" />
    </div>
  );
}
