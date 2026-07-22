import { Download } from 'lucide-react';

export default function DataTable({ data, session }) {
  const handleExport = async () => {
    if (!session?.access_token) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${API_URL}/api/export`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to export');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aquaware_report.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Gagal mengekspor data.');
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Riwayat Kualitas Air</h3>
        <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '13px' }}>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>Waktu</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>pH</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>Turbidity</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>Conductivity</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>Sulfate</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>Status ML</th>
              <th style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>Rule-Based</th>
            </tr>
          </thead>
          <tbody>
            {data.slice().reverse().map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: 'background 0.2s', fontSize: '14px' }}>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                  {new Date(row.ts).toLocaleTimeString('id-ID')}
                </td>
                <td style={{ padding: '12px 16px' }}>{row.ph?.toFixed(2) || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{row.Turbidity?.toFixed(2) || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{row.Conductivity?.toFixed(2) || '-'}</td>
                <td style={{ padding: '12px 16px' }}>{row.Sulfate?.toFixed(2) || '-'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                    background: row.prediction === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: row.prediction === 1 ? '#34d399' : '#fca5a5'
                  }}>
                    {row.prediction === 1 ? 'Layak' : 'Tidak Layak'} ({(row.probability * 100).toFixed(1)}%)
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                    background: row.rule_based === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: row.rule_based === 1 ? '#34d399' : '#fca5a5'
                  }}>
                    {row.rule_based === 1 ? 'Aman' : 'Peringatan'}
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Menunggu data sensor masuk...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
