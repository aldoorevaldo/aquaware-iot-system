import { useState, useEffect, useRef } from 'react';
import { LogOut, Activity, Play, Square } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import StatusOrb from '../components/StatusOrb';
import SensorCharts from '../components/SensorCharts';
import DataTable from '../components/DataTable';
import KPICards from '../components/KPICards';

export default function Dashboard({ session }) {
  const [history, setHistory] = useState([]);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const ws = useRef(null);
  const lastMessageTime = useRef(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSimulate = async () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = session?.access_token;
    if (!token) return;

    try {
      if (simulating) {
        await fetch(`${API_URL}/api/simulate/stop`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setSimulating(false);
      } else {
        const res = await fetch(`${API_URL}/api/simulate?count=50&interval=5`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'started' || data.status === 'already_running') {
          setSimulating(true);
        }
      }
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  // Heartbeat checker for device connection
  useEffect(() => {
    const checker = setInterval(() => {
      if (Date.now() - lastMessageTime.current > 8000) {
        setDeviceConnected(false);
        setSimulating(false);
      } else {
        setDeviceConnected(true);
      }
    }, 1000);
    return () => clearInterval(checker);
  }, []);

  useEffect(() => {
    if (!session?.access_token) return;
    const token = session.access_token;
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Fetch initial history
    fetch(`${API_URL}/api/history?limit=30`, {
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
      const wsUrl = API_URL.replace(/^http/, 'ws');
      ws.current = new WebSocket(`${wsUrl}/ws?token=${token}`);
      
      ws.current.onmessage = (event) => {
        lastMessageTime.current = Date.now();
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
        setDeviceConnected(false);
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
            background: deviceConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${deviceConnected ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-glass)'}`,
            color: deviceConnected ? '#34d399' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: deviceConnected ? '#10b981' : '#ef4444',
              boxShadow: deviceConnected ? '0 0 8px #10b981' : 'none',
              transition: 'all 0.3s ease'
            }}></div>
            {deviceConnected ? 'Sensor Connected' : 'Sensor Disconnected'}
          </div>

          <button
            onClick={handleSimulate}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '12px', fontWeight: '600', padding: '8px 16px', borderRadius: '99px',
              border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
              background: simulating
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              boxShadow: simulating
                ? '0 0 12px rgba(239, 68, 68, 0.3)'
                : '0 0 12px rgba(16, 185, 129, 0.3)',
            }}
          >
            {simulating ? <Square size={14} /> : <Play size={14} />}
            {simulating ? 'Hentikan Simulasi' : 'Mulai Simulasi'}
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 60px' }}>
        {latestData ? (
          <>
            <StatusOrb
              mlStatus={latestData.prediction}
              ruleBasedStatus={latestData.rule_based}
              reasons={latestData.reasons}
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
