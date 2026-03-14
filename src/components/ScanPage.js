'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth }      from '../context/AuthContext';
import { logRoomEntry } from '../lib/logRoom';
import { useLogs }      from '../hooks/useLogs';

const fmt     = (d) => d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
const fmtDate = (d) => d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

export default function ScanPage() {
  const { user }         = useAuth();
  const { logs: myLogs } = useLogs({ emailFilter: user?.email });

  const [mode,         setMode]         = useState('camera');
  const [manualId,     setManualId]     = useState('');
  const [success,      setSuccess]      = useState(null);
  const [toast,        setToast]        = useState(null);
  const [scannerReady, setScannerReady] = useState(false);
  const [scanning,     setScanning]     = useState(false);
  const html5QrRef = useRef(null);

  const todayStr  = fmtDate(new Date());
  const todayLogs = myLogs.filter(l => l.date === todayStr);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLog = async (roomId) => {
    const clean = roomId?.trim().toUpperCase();
    if (!clean) { showToast('No room ID detected.', 'error'); return; }
    try {
      const entry = await logRoomEntry({ profName: user.name, profEmail: user.email, roomId: clean });
      if (html5QrRef.current) {
        try { await html5QrRef.current.stop(); } catch (_) {}
      }
      setSuccess(entry);
      setManualId('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    if (mode !== 'camera' || success) return;
    let scanner;
    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-reader');
        html5QrRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          async (decodedText) => {
            setScanning(true);
            await handleLog(decodedText);
            setScanning(false);
          },
          () => {}
        );
        setScannerReady(true);
      } catch (err) {
        showToast('Camera not available. Use manual entry below.', 'error');
        setMode('manual');
      }
    };
    startScanner();
    return () => {
  if (scanner) {
    scanner.isScanning ? scanner.stop().catch(() => {}) : null;
  }
};
  }, [mode, success]);

  const resetPage = () => {
    setSuccess(null);
    setMode('camera');
    setScannerReady(false);
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {!success ? (
        <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>

          <div style={{ padding: '28px 32px 24px', textAlign: 'center',
            background: 'linear-gradient(135deg, #0a4a2e, #1a6b42)' }}>
            <h2 className="font-display" style={{ fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 4 }}>
              Scan Lab QR Code
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              Point your camera at the room QR code
            </p>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
            {[['camera','📷  Camera Scan'],['manual','⌨️  Manual Entry']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '14px', fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  background: mode === m ? 'white' : '#f9fafb',
                  color: mode === m ? '#1a6b42' : '#9ca3af',
                  borderBottom: mode === m ? '2px solid #1a6b42' : '2px solid transparent' }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: 28 }}>
            {mode === 'camera' && (
              <>
                <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden',
                  background: '#0d1117', marginBottom: 20 }}>
                  <div id="qr-reader" style={{ width: '100%' }} />
                  {!scannerReady && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: '#0d1117', gap: 12, minHeight: 280 }}>
                      <div className="spinner" />
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Starting camera…</p>
                    </div>
                  )}
                  {scanning && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex',
                      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.75)', gap: 12 }}>
                      <div className="spinner" style={{ borderTopColor: '#f0c84a' }} />
                      <p style={{ color: '#f0c84a', fontSize: 14, fontWeight: 600 }}>Processing…</p>
                    </div>
                  )}
                </div>
                <p style={{ textAlign:'center', fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
                  Allow camera access when your browser asks
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>or enter manually</span>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={manualId} onChange={e => setManualId(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleLog(manualId)}
                placeholder="Enter Room ID (e.g. CL-101)"
                style={{ flex: 1, padding: '12px 16px', borderRadius: 12,
                  border: '1.5px solid #e5e7eb', fontSize: 14, color: '#374151',
                  background: '#f9fafb', outline: 'none', fontFamily: 'monospace' }} />
              <button onClick={() => handleLog(manualId)}
                className="btn-neu" style={{ padding: '12px 20px', borderRadius: 12, fontSize: 14 }}>
                Log
              </button>
            </div>
          </div>
        </div>

      ) : (
        <div className="slide-up">
          <div style={{ borderRadius: 24, padding: '40px 36px', textAlign: 'center',
            background: 'linear-gradient(135deg, #0a4a2e, #1a6b42)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position:'absolute', bottom:-60, right:-60, width:200, height:200,
              borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
            <div className="scale-in" style={{ width:76, height:76, borderRadius:'50%',
              background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 20px', color:'white' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="font-display" style={{ fontSize:26, fontWeight:700, color:'white', marginBottom:8 }}>
              Check-in Successful!
            </h2>
            <p style={{ color:'rgba(255,255,255,0.65)', fontSize:14, lineHeight:1.6, marginBottom:24 }}>
              Thank you for using Room <strong style={{ color:'#f0c84a' }}>{success.roomId}</strong>.<br/>
              Your session has been recorded.
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:32, marginBottom:28,
              padding:'16px 20px', borderRadius:14,
              background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)' }}>
              {[['Room', success.roomId],['Started', fmt(success.startTime)],['Ends', fmt(success.endTime)]].map(([label,val]) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em',
                    color:'rgba(255,255,255,0.4)', marginBottom:4 }}>{label}</div>
                  <div className="font-mono" style={{ fontWeight:600, color:'white', fontSize:15 }}>{val}</div>
                </div>
              ))}
            </div>
            <button onClick={resetPage}
              style={{ background:'white', color:'#0a4a2e', fontWeight:700, fontSize:14,
                padding:'13px 32px', borderRadius:12, border:'none', cursor:'pointer',
                boxShadow:'0 4px 12px rgba(0,0,0,0.15)', fontFamily:'inherit' }}>
              Scan Another Room
            </button>
          </div>

          {todayLogs.length > 0 && (
            <div style={{ marginTop:16, background:'white', borderRadius:20,
              overflow:'hidden', border:'1px solid #f3f4f6', boxShadow:'0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ padding:'16px 24px', borderBottom:'1px solid #f3f4f6' }}>
                <h3 className="font-display" style={{ fontWeight:700, color:'#1f2937' }}>My Sessions Today</h3>
              </div>
              {todayLogs.map(l => (
                <div key={l.id} style={{ display:'flex', alignItems:'center', padding:'12px 24px',
                  borderBottom:'1px solid #f9fafb' }}>
                  <div style={{ flex:1 }}>
                    <div className="font-mono" style={{ fontWeight:600, fontSize:14, color:'#1a6b42' }}>{l.roomId}</div>
                    <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{l.startTime} – {l.endTime}</div>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20,
                    background: l.status === 'active' ? '#e8f5ee' : '#f3f4f6',
                    color:      l.status === 'active' ? '#1a6b42' : '#6b7280' }}>{l.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Toast({ msg, type }) {
  return (
    <div className="slide-up" style={{ position:'fixed', bottom:24, right:24, zIndex:50,
      display:'flex', alignItems:'center', gap:12, background:'white',
      padding:'14px 20px', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
      fontSize:14, fontWeight:500, maxWidth:340,
      borderLeft:`4px solid ${type === 'error' ? '#dc2626' : '#1a6b42'}` }}>
      <span>{type === 'error' ? '⚠️' : '✅'}</span>
      <span style={{ color:'#374151' }}>{msg}</span>
    </div>
  );
}