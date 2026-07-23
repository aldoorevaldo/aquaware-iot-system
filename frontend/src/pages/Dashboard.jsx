import { useState, useEffect, useRef } from 'react';
import { LogOut, Activity, Bell, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase.js';
import StatusOrb from '../components/StatusOrb';
import SensorCharts from '../components/SensorCharts';
import DataTable from '../components/DataTable';
import KPICards from '../components/KPICards';

export default function Dashboard({ session }) {
  const [history, setHistory] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [latestData, setLatestData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const ws = useRef(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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

        // Smart Notification Logic
        if (newRecord.prediction === 0 || newRecord.rule_based === 0) {
          const reasonText = newRecord.reasons && newRecord.reasons.length > 0 
            ? newRecord.reasons[0] 
            : 'Terdeteksi anomali pada kualitas air (Prediksi ML: Tidak Layak)';
          
          setAlerts(prev => {
            // Avoid duplicate alerts within the same second
            if (prev.length > 0 && prev[0].ts === newRecord.ts) return prev;
            const newAlert = { id: Date.now(), ts: newRecord.ts, message: reasonText };
            return [newAlert, ...prev].slice(0, 15); // Simpan 15 notifikasi terakhir
          });
        }
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
          
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', cursor: 'pointer', color: 'var(--text-muted)' }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell size={18} />
              {alerts.length > 0 && (
                <div style={{ position: 'absolute', top: '0', right: '0', width: '10px', height: '10px', background: 'var(--neon-red)', borderRadius: '50%', border: '2px solid #0b1121' }}></div>
              )}
            </button>

            {/* Dropdown Notifikasi */}
            {showNotifications && (
              <div className="glass-panel animate-fade-in" style={{ 
                position: 'absolute', top: '48px', right: '0', width: '320px', 
                padding: '0', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                maxHeight: '400px', overflowY: 'auto'
              }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', margin: 0, fontWeight: '600' }}>Notifikasi Cerdas</h3>
                  {alerts.length > 0 && (
                    <button onClick={() => setAlerts([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <Trash2 size={12} /> Bersihkan
                    </button>
                  )}
                </div>
                <div style={{ padding: '8px' }}>
                  {alerts.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Kondisi air terpantau aman. Belum ada peringatan.
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <div key={alert.id} style={{ 
                        padding: '12px', background: 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid var(--neon-red)' 
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {new Date(alert.ts).toLocaleTimeString()}
                        </div>
                        <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.4' }}>
                          {alert.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
