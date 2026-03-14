'use client';
import { useState, useEffect, useRef } from 'react';

const ROOMS = [
  { id: 'M-101', name: 'Computer Lab 1' },
  { id: 'M-102', name: 'Computer Lab 2' },
  { id: 'M-103', name: 'Computer Lab 3' },
  { id: 'M-104', name: 'Computer Lab 4' },
  { id: 'M-105', name: 'Computer Lab 5' },
  { id: 'M-106', name: 'Computer Lab 6' },
];

// Renders a single QR code using a canvas via the qrcodejs library
function QRCanvas({ value, size = 200 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    ref.current.innerHTML = '';

    // Dynamically load qrcodejs from CDN — pure browser JS, no build step needed
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      if (!ref.current) return;
      ref.current.innerHTML = '';
      new window.QRCode(ref.current, {
        text:           value,
        width:          size,
        height:         size,
        colorDark:      '#0a4a2e',
        colorLight:     '#ffffff',
        correctLevel:   window.QRCode.CorrectLevel.H,
      });
    };
    // If already loaded, use it directly
    if (window.QRCode) {
      script.onload();
      return;
    }
    document.head.appendChild(script);
  }, [value, size]);

  return (
    <div ref={ref}
      style={{ width: size, height: size, display: 'flex',
        alignItems: 'center', justifyContent: 'center' }} />
  );
}

export default function QRGenerator() {
  const [selected,   setSelected]   = useState([]);
  const [generated,  setGenerated]  = useState([]);
  const [customRoom, setCustomRoom] = useState('');
  const [customName, setCustomName] = useState('');

  const toggleRoom = (id) => setSelected(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
  const selectAll  = () => setSelected(ROOMS.map(r => r.id));
  const clearAll   = () => setSelected([]);

  const allRooms = [
    ...ROOMS,
    // any custom rooms the user added that aren't in the default list
    ...generated.filter(g => !ROOMS.find(r => r.id === g.id)),
  ];

  const addCustom = () => {
    const id   = customRoom.trim().toUpperCase();
    const name = customName.trim() || id;
    if (!id) return;
    if (!selected.includes(id)) setSelected(p => [...p, id]);
    // Store custom name for display
    if (!ROOMS.find(r => r.id === id)) {
      setGenerated(p => [...p.filter(g => g.id !== id), { id, name }]);
    }
    setCustomRoom('');
    setCustomName('');
  };

  const generate = () => {
    if (selected.length === 0) return;
    const items = selected.map(id => {
      const known  = ROOMS.find(r => r.id === id);
      const custom = generated.find(g => g.id === id);
      return { id, name: known?.name || custom?.name || id };
    });
    setGenerated(items);
  };

  const downloadOne = (id) => {
    // Find the canvas inside the card and export it
    const container = document.getElementById(`qr-card-${id}`);
    if (!container) return;
    const canvas = container.querySelector('canvas');
    if (!canvas) return;

    // Create a larger canvas with branding
    const out   = document.createElement('canvas');
    const PAD   = 32;
    out.width   = canvas.width  + PAD * 2;
    out.height  = canvas.height + PAD * 2 + 80;
    const ctx   = out.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    // Border
    ctx.strokeStyle = '#0a4a2e';
    ctx.lineWidth   = 3;
    ctx.roundRect(4, 4, out.width - 8, out.height - 8, 16);
    ctx.stroke();

    // Room ID text
    ctx.fillStyle  = '#0a4a2e';
    ctx.font       = 'bold 22px monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(id, out.width / 2, PAD + 20);

    // Room name
    ctx.fillStyle = '#6b7280';
    ctx.font      = '13px sans-serif';
    const room    = ROOMS.find(r => r.id === id);
    ctx.fillText(room?.name || id, out.width / 2, PAD + 40);

    // QR code
    ctx.drawImage(canvas, PAD, PAD + 50);

    // Footer
    ctx.fillStyle = '#9ca3af';
    ctx.font      = '11px sans-serif';
    ctx.fillText('Scan to log room usage · NEU Lab Logger', out.width / 2, out.height - 12);

    const a      = document.createElement('a');
    a.href       = out.toDataURL('image/png');
    a.download   = `QR-${id}.png`;
    a.click();
  };

  const printAll = () => {
    // Collect all canvases and build a print window
    const cards = generated.map(item => {
      const container = document.getElementById(`qr-card-${item.id}`);
      const canvas    = container?.querySelector('canvas');
      if (!canvas) return '';
      return `
        <div style="width:240px;padding:20px;margin:12px;border:2px solid #0a4a2e;
          border-radius:14px;text-align:center;display:inline-block;
          font-family:Georgia,serif;break-inside:avoid;background:white;vertical-align:top;">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">
            New Era University
          </div>
          <div style="font-size:20px;font-weight:800;color:#0a4a2e;margin-bottom:2px;">${item.id}</div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:12px;">${item.name}</div>
          <img src="${canvas.toDataURL()}" style="width:180px;height:180px;" />
          <div style="margin-top:12px;font-size:11px;color:#9ca3af;line-height:1.5;">
            Scan to log room usage<br/>
            <strong style="color:#0a4a2e;">NEU Lab Logger</strong>
          </div>
        </div>`;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>NEU QR Codes</title>
      <style>
        body{margin:20px;background:white;}
        @media print{.no-print{display:none!important}}
      </style></head><body>
      <div class="no-print" style="margin-bottom:20px;text-align:center;">
        <button onclick="window.print()" style="padding:12px 28px;background:#0a4a2e;color:white;
          border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">
          🖨️ Print QR Codes
        </button>
      </div>
      <div style="text-align:center;">${cards}</div>
    </body></html>`);
    win.document.close();
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── LEFT: selector ── */}
      <div style={{ flex: '1 1 300px', background: 'white', borderRadius: 20,
        border: '1px solid #f3f4f6', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="font-display" style={{ fontWeight: 700, color: '#1f2937', fontSize: 16 }}>Select Rooms</h3>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{selected.length} selected</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={selectAll} style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px',
              borderRadius: 7, border: '1.5px solid #1a6b42', color: '#1a6b42',
              background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>All</button>
            <button onClick={clearAll} style={{ fontSize: 12, fontWeight: 600, padding: '5px 10px',
              borderRadius: 7, border: '1.5px solid #e5e7eb', color: '#6b7280',
              background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>Clear</button>
          </div>
        </div>

        <div style={{ padding: '10px 14px', maxHeight: 340, overflowY: 'auto' }}>
          {ROOMS.map(room => {
            const on = selected.includes(room.id);
            return (
              <button key={room.id} onClick={() => toggleRoom(room.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 10px', borderRadius: 9, marginBottom: 3, border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.12s',
                  background: on ? '#e8f5ee' : 'transparent' }}>
                <div style={{ width: 19, height: 19, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${on ? '#1a6b42' : '#d1d5db'}`,
                  background: on ? '#1a6b42' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: on ? '#1a6b42' : '#374151' }}>{room.id}</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{room.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom room */}
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid #f3f4f6' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase',
            letterSpacing: '0.06em', marginBottom: 8 }}>Add Custom Room</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input value={customRoom} onChange={e => setCustomRoom(e.target.value.toUpperCase())}
              placeholder="M-115" style={{ flex: 1, padding: '8px 10px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'monospace',
                fontWeight: 700, outline: 'none', color: '#1a6b42', background: '#f9fafb' }} />
            <input value={customName} onChange={e => setCustomName(e.target.value)}
              placeholder="Lab name" style={{ flex: 2, padding: '8px 10px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit',
                outline: 'none', color: '#374151', background: '#f9fafb' }} />
          </div>
          <button onClick={addCustom} disabled={!customRoom.trim()}
            style={{ width: '100%', padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: '1.5px dashed #1a6b42', color: '#1a6b42', background: 'transparent',
              cursor: customRoom.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', opacity: customRoom.trim() ? 1 : 0.5 }}>
            + Add to selection
          </button>
        </div>

        <div style={{ padding: '0 14px 16px' }}>
          <button onClick={generate} disabled={selected.length === 0}
            className="btn-neu"
            style={{ width: '100%', padding: '13px', borderRadius: 11, fontSize: 14,
              fontFamily: 'inherit', opacity: selected.length === 0 ? 0.5 : 1 }}>
            🔳 Generate {selected.length > 0 ? selected.length : ''} QR Code{selected.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* ── RIGHT: QR cards ── */}
      <div style={{ flex: '2 1 400px' }}>
        {generated.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 20, border: '2px dashed #e5e7eb',
            padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔳</div>
            <h3 className="font-display" style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>
              No QR Codes Yet
            </h3>
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6 }}>
              Select rooms on the left and click<br />
              <strong style={{ color: '#1a6b42' }}>Generate QR Codes</strong> to create them.
            </p>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', borderRadius: 16, padding: '14px 18px',
              border: '1px solid #f3f4f6', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <span className="font-display" style={{ fontWeight: 700, color: '#1f2937', fontSize: 15 }}>
                  {generated.length} QR Code{generated.length !== 1 ? 's' : ''} Ready
                </span>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Scan with any QR reader to verify</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={printAll}
                  className="btn-neu"
                  style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6 }}>
                  🖨️ Print All
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
              {generated.map(item => (
                <div key={item.id} id={`qr-card-${item.id}`}
                  style={{ background: 'white', borderRadius: 18, overflow: 'hidden',
                    border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s', textAlign: 'center' }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'}>

                  <div style={{ padding: '14px 14px 4px' }}>
                    <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase',
                      letterSpacing: '0.08em', marginBottom: 2 }}>New Era University</div>
                    <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, color: '#0a4a2e' }}>
                      {item.id}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>{item.name}</div>
                  </div>

                  {/* QR rendered via qrcodejs into a canvas */}
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '0 14px' }}>
                    <QRCanvas value={item.id} size={160} />
                  </div>

                  <div style={{ padding: '8px 14px 6px' }}>
                    <p style={{ fontSize: 10, color: '#9ca3af', marginBottom: 10, lineHeight: 1.4 }}>
                      Scan to log room usage
                    </p>
                    <button onClick={() => downloadOne(item.id)}
                      style={{ width: '100%', padding: '8px', borderRadius: 9, fontSize: 12,
                        fontWeight: 600, border: '1.5px solid #e5e7eb', color: '#374151',
                        background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit',
                        marginBottom: 8, transition: 'all 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#e8f5ee'}
                      onMouseOut={e => e.currentTarget.style.background = '#f9fafb'}>
                      ⬇ Download PNG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
