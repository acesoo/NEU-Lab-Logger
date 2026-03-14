'use client';
import { useState } from 'react';
import { useLogs }        from '../hooks/useLogs';
import { checkOutRoom }   from '../lib/logRoom';

export default function LogsPage() {
  const { logs, loading } = useLogs();
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleForceCheckout = async (log) => {
    if (!confirm(`Force check out ${log.profName} from ${log.roomId}?`)) return;
    try {
      await checkOutRoom(log.id);
      showToast(`${log.profName} checked out of ${log.roomId}.`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered = logs.filter(l => {
    const q     = search.toLowerCase();
    const match = l.profName.toLowerCase().includes(q)  ||
                  l.roomId.toLowerCase().includes(q)    ||
                  l.profEmail.toLowerCase().includes(q);
    const statusMatch = filter === 'all' || l.status === filter;
    return match && statusMatch;
  });

  const exportCSV = () => {
    const header = 'Professor,Email,Room,Date,Check-In,Check-Out,Status';
    const rows   = filtered.map(l =>
      `${l.profName},${l.profEmail},${l.roomId},${l.date},${l.startTime},${l.checkedOut || '—'},${l.status}`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'neu_lab_logs.csv'; a.click();
  };

  if (loading) return <Spinner />;

  const activeCount = logs.filter(l => l.status === 'active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toast && (
        <div className="slide-up" style={{ position:'fixed', bottom:24, right:24, zIndex:999,
          display:'flex', alignItems:'center', gap:10, background:'white',
          padding:'14px 20px', borderRadius:14, maxWidth:360,
          boxShadow:'0 8px 32px rgba(0,0,0,0.15)', fontSize:14, fontWeight:500,
          borderLeft:`4px solid ${toast.type === 'error' ? '#dc2626' : '#1a6b42'}` }}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span style={{ color:'#374151' }}>{toast.msg}</span>
        </div>
      )}

      {/* Active sessions banner */}
      {activeCount > 0 && (
        <div style={{ padding:'14px 20px', borderRadius:14, display:'flex', alignItems:'center', gap:10,
          background:'#e8f5ee', border:'1.5px solid rgba(26,107,66,0.25)' }}>
          <span className="pulse" style={{ width:10, height:10, borderRadius:'50%',
            background:'#1a6b42', display:'inline-block', flexShrink:0 }} />
          <span style={{ fontSize:14, fontWeight:600, color:'#1a6b42' }}>
            {activeCount} room{activeCount !== 1 ? 's' : ''} currently occupied
          </span>
          <span style={{ fontSize:13, color:'#6b7280' }}>· You can force check out any active session below</span>
        </div>
      )}

      <div style={{ background:'white', borderRadius:20, border:'1px solid #f3f4f6',
        boxShadow:'0 4px 16px rgba(0,0,0,0.06)', overflow:'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #f3f4f6',
          display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div>
            <h3 className="font-display" style={{ fontWeight:700, color:'#1f2937' }}>Laboratory Logs</h3>
            <p style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{filtered.length} records</p>
          </div>
          <div style={{ position:'relative', flex:'1 1 200px', marginLeft:'auto' }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
              color:'#9ca3af', fontSize:14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search professor, room, email…"
              style={{ width:'100%', paddingLeft:34, paddingRight:12, paddingTop:9, paddingBottom:9,
                borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, outline:'none',
                background:'#f9fafb', color:'#374151', fontFamily:'inherit' }} />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {['all','active','checked-out'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'7px 13px', borderRadius:20, fontSize:12, fontWeight:600,
                  border:`1.5px solid ${filter===f ? '#1a6b42' : '#e5e7eb'}`,
                  background: filter===f ? '#1a6b42' : 'transparent',
                  color: filter===f ? 'white' : '#6b7280',
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.12s', whiteSpace:'nowrap' }}>
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Checked Out'}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px',
              borderRadius:10, border:'1.5px solid #e5e7eb', fontSize:13, fontWeight:600,
              color:'#374151', background:'white', cursor:'pointer', fontFamily:'inherit',
              whiteSpace:'nowrap' }}>
            ⬇ Export CSV
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ borderBottom:'2px solid #f3f4f6' }}>
                {['Professor','Room','Date','Check-In','Check-Out','Status','Action'].map(h => (
                  <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:11,
                    fontWeight:700, color:'#9ca3af', textTransform:'uppercase',
                    letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'48px', textAlign:'center', color:'#9ca3af' }}>
                  No records found
                </td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} style={{ borderBottom:'1px solid #f9fafb', transition:'background 0.1s' }}
                  onMouseOver={e => e.currentTarget.style.background='#f9fafb'}
                  onMouseOut={e => e.currentTarget.style.background='white'}>
                  <td style={{ padding:'12px 20px' }}>
                    <div style={{ fontWeight:600, color:'#1f2937' }}>{l.profName}</div>
                    <div style={{ fontSize:11, color:'#9ca3af' }}>{l.profEmail}</div>
                  </td>
                  <td style={{ padding:'12px 20px' }}>
                    <span className="font-mono" style={{ fontWeight:700, fontSize:13, color:'#1a6b42' }}>
                      {l.roomId}
                    </span>
                  </td>
                  <td style={{ padding:'12px 20px', color:'#6b7280', fontSize:12, whiteSpace:'nowrap' }}>{l.date}</td>
                  <td style={{ padding:'12px 20px' }}>
                    <span className="font-mono" style={{ fontSize:13, color:'#374151' }}>{l.startTime}</span>
                  </td>
                  <td style={{ padding:'12px 20px' }}>
                    {l.checkedOut
                      ? <span className="font-mono" style={{ fontSize:13, color:'#374151' }}>{l.checkedOut}</span>
                      : <span style={{ fontSize:12, color:'#9ca3af' }}>—</span>}
                  </td>
                  <td style={{ padding:'12px 20px' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
                      background: l.status === 'active' ? '#e8f5ee' : '#f3f4f6',
                      color:      l.status === 'active' ? '#1a6b42' : '#6b7280',
                      whiteSpace:'nowrap' }}>
                      {l.status === 'active' ? '🟢 Active' : '⚪ Checked Out'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 20px' }}>
                    {l.status === 'active' && (
                      <button onClick={() => handleForceCheckout(l)}
                        style={{ fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:8,
                          border:'1.5px solid #dc2626', color:'#dc2626', background:'#fef2f2',
                          cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                          transition:'all 0.12s' }}
                        onMouseOver={e => e.currentTarget.style.background='#fee2e2'}
                        onMouseOut={e => e.currentTarget.style.background='#fef2f2'}>
                        Force Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:240 }}>
      <div className="spinner" />
    </div>
  );
}
