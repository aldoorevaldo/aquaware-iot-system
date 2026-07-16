import { useState, useEffect, useRef } from 'react';
import { LogOut, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StatusOrb from '../components/StatusOrb';
import SensorCharts from '../components/SensorCharts';
import DataTable from '../components/DataTable';
import KPICards from '../components/KPICards';

export default function Dashboard({ session }) {
  const [history, setHistory] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const ws = useRef(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    if (!session?.access_token) return;
    const token = session.access_token;

    // Fetch initial history
    fetch('http://localhost:8000/api/history?limit=30', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) handleLogout();
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
          if (data.length > 0) setLatestData(data[data.length - 1]);
        }
      })
      .catch(console.error);

    let isMounted = true;

    // Setup WebSocket
    const connectWs = () => {
      ws.current = new WebSocket(`ws://localhost:8000/ws?token=${token}`);
      
      ws.current.onopen = () => setWsConnected(true);
      
      ws.current.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const newRecord = {
          ts: payload.ts,
          ...payload.readings,
          prediction: payload.ml.prediction,
          probability: payload.ml.probability,
          rule_based: payload.rule_based.layak_rule_based ? 1 : 0,
          reasons: payload.rule_based.reasons || []
        };

        setLatestData(newRecord);
        setHistory(prev => {
          const updated = [...prev, newRecord];
          if (updated.length > 50) updated.shift();
          return updated;
        });
      };

      ws.current.onclose = () => {
        if (!isMounted) return;
        setWsConnected(false);
        setTimeout(connectWs, 3000); // Reconnect
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      if (ws.current) ws.current.close();
    };
  }, [session]);

  return (
    <div className="animate-fade-in">
      <header style={{
        background: 'rgba(11, 17, 33, 0.8)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)', padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 50
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AquaAware
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Real-Time Water Monitoring Dashboard</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontSize: '12px', fontWeight: '500', padding: '6px 14px', borderRadius: '99px',
            background: wsConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${wsConnected ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-glass)'}`,
            color: wsConnected ? '#34d399' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: wsConnected ? '#10b981' : '#ef4444',
              boxShadow: wsConnected ? '0 0 8px #10b981' : 'none'
            }}></div>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </div>

          <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 60px' }}>
        {latestData ? (
          <>
            <StatusOrb
              status={latestData.prediction === 1 ? 1 : 0}
              ruleBased={{ reasons: latestData.reasons }}
            />
            <KPICards data={latestData} />
          </>
        ) : (
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
            <Activity size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Menunggu data sensor pertama masuk...</p>
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Real-time Analytics</h2>
          <SensorCharts data={history} />
        </div>

        <DataTable data={history} session={session} />
      </main>
    </div>
  );
}
