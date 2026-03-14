'use client';
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, doc,
  setDoc, updateDoc, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function WhitelistPage() {
  const [entries,   setEntries]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [bulkMode,  setBulkMode]  = useState(false);
  const [form,      setForm]      = useState({ email: '', name: '', role: 'professor', dept: '' });
  const [bulkText,  setBulkText]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Live whitelist listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'whitelist'), snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = e.email?.toLowerCase().includes(q) || e.name?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || e.status === filter || (!e.status && filter === 'active');
    return matchSearch && matchFilter;
  });

  // Add single entry
  const handleAdd = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email) { showToast('Email is required.', 'error'); return; }
    if (!email.endsWith('@neu.edu.ph')) {
      showToast('Only @neu.edu.ph emails can be whitelisted.', 'error'); return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'whitelist', email), {
        email,
        name:      form.name.trim() || '',
        role:      form.role,
        dept:      form.dept.trim() || '',
        status:    'active',
        addedAt:   serverTimestamp(),
      });
      showToast(`${email} has been whitelisted.`);
      setForm({ email: '', name: '', role: 'professor', dept: '' });
      setShowForm(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
    setSaving(false);
  };

  // Bulk add — one email per line, optional comma-separated name
  const handleBulk = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    setSaving(true);
    let added = 0, skipped = 0;
    for (const line of lines) {
      const [rawEmail, rawName] = line.split(',').map(s => s.trim());
      const email = rawEmail.toLowerCase();
      if (!email.endsWith('@neu.edu.ph')) { skipped++; continue; }
      try {
        await setDoc(doc(db, 'whitelist', email), {
          email, name: rawName || '', role: 'professor',
          dept: '', status: 'active', addedAt: serverTimestamp(),
        }, { merge: true });
        added++;
      } catch (_) { skipped++; }
    }
    showToast(`Added ${added} email${added !== 1 ? 's' : ''}${skipped ? `, skipped ${skipped} invalid` : ''}.`);
    setBulkText('');
    setBulkMode(false);
    setSaving(false);
  };

  const revokeEntry = async (email) => {
    await updateDoc(doc(db, 'whitelist', email), { status: 'revoked' });
    showToast(`Access revoked for ${email}.`, 'error');
  };

  const restoreEntry = async (email) => {
    await updateDoc(doc(db, 'whitelist', email), { status: 'active' });
    showToast(`Access restored for ${email}.`);
  };

  const deleteEntry = async (email) => {
    if (!confirm(`Permanently remove ${email} from the whitelist?`)) return;
    await deleteDoc(doc(db, 'whitelist', email));
    showToast(`${email} removed from whitelist.`, 'error');
  };

  const active  = entries.filter(e => !e.status || e.status === 'active').length;
  const revoked = entries.filter(e => e.status === 'revoked').length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div>
      {toast && (
        <div className="slide-up" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          display: 'flex', alignItems: 'center', gap: 10, background: 'white',
          padding: '14px 20px', borderRadius: 14, maxWidth: 380,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontSize: 14, fontWeight: 500,
          borderLeft: `4px solid ${toast.type === 'error' ? '#dc2626' : '#1a6b42'}` }}>
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span style={{ color: '#374151' }}>{toast.msg}</span>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          ['Total Whitelisted', entries.length, '📋', '#1a6b42', '#e8f5ee'],
          ['Active Access',     active,         '✅', '#1a6b42', '#e8f5ee'],
          ['Revoked',           revoked,        '🚫', '#dc2626', '#fef2f2'],
        ].map(([label, val, icon, color, bg]) => (
          <div key={label} style={{ flex: '1 1 140px', background: 'white', borderRadius: 16,
            padding: '18px 20px', border: '1px solid #f3f4f6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {icon}
              </div>
              <div>
                <div className="font-display" style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #f3f4f6',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f3f4f6',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search email or name…"
              style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9,
                paddingBottom: 9, borderRadius: 10, border: '1.5px solid #e5e7eb',
                fontSize: 13, outline: 'none', background: '#f9fafb', color: '#374151', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'active', 'revoked'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${filter === f ? '#1a6b42' : '#e5e7eb'}`,
                  background: filter === f ? '#1a6b42' : 'transparent',
                  color: filter === f ? 'white' : '#6b7280',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button onClick={() => { setBulkMode(true); setShowForm(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: '1.5px solid #e5e7eb', color: '#374151', background: 'white',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              📋 Bulk Add
            </button>
            <button onClick={() => { setShowForm(true); setBulkMode(false); }}
              className="btn-neu"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
                borderRadius: 10, fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              + Add Email
            </button>
          </div>
        </div>

        {/* Add single form */}
        {showForm && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
            background: '#f9fafb' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 14 }}>Add to Whitelist</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@neu.edu.ph *"
                style={{ flex: '2 1 200px', padding: '10px 12px', borderRadius: 9,
                  border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
                  background: 'white', fontFamily: 'inherit', color: '#374151' }} />
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Full name (optional)"
                style={{ flex: '2 1 180px', padding: '10px 12px', borderRadius: 9,
                  border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
                  background: 'white', fontFamily: 'inherit', color: '#374151' }} />
              <input value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                placeholder="Department (optional)"
                style={{ flex: '1 1 140px', padding: '10px 12px', borderRadius: 9,
                  border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
                  background: 'white', fontFamily: 'inherit', color: '#374151' }} />
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                style={{ flex: '1 1 120px', padding: '10px 12px', borderRadius: 9,
                  border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
                  background: 'white', fontFamily: 'inherit', color: '#374151' }}>
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAdd} disabled={saving} className="btn-neu"
                style={{ padding: '10px 24px', borderRadius: 9, fontSize: 13, fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : '✅ Add to Whitelist'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '10px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                  border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280',
                  cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bulk add form */}
        {bulkMode && (
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: 6 }}>Bulk Add Emails</p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, lineHeight: 1.6 }}>
              One email per line. Optionally add a name after a comma.<br/>
              <span style={{ fontFamily: 'monospace', color: '#374151' }}>
                jdelacruz@neu.edu.ph, Juan Dela Cruz
              </span>
            </p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
              placeholder={"jdelacruz@neu.edu.ph, Juan Dela Cruz\nsantos@neu.edu.ph\nreyes@neu.edu.ph, Maria Reyes"}
              rows={6}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10,
                border: '1.5px solid #e5e7eb', fontSize: 13, outline: 'none',
                background: 'white', fontFamily: 'monospace', color: '#374151',
                resize: 'vertical', lineHeight: 1.7 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={handleBulk} disabled={saving || !bulkText.trim()} className="btn-neu"
                style={{ padding: '10px 24px', borderRadius: 9, fontSize: 13, fontFamily: 'inherit' }}>
                {saving ? 'Adding…' : `📋 Add All`}
              </button>
              <button onClick={() => setBulkMode(false)}
                style={{ padding: '10px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                  border: '1.5px solid #e5e7eb', background: 'white', color: '#6b7280',
                  cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                {['Email', 'Name', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left',
                    fontSize: 11, fontWeight: 700, color: '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                    {entries.length === 0
                      ? '📭 No emails whitelisted yet. Click "Add Email" to get started.'
                      : '🔍 No results match your search.'}
                  </td>
                </tr>
              ) : filtered.map(e => {
                const isRevoked = e.status === 'revoked';
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f9fafb',
                    background: isRevoked ? '#fffbfb' : 'white',
                    transition: 'background 0.1s' }}
                    onMouseOver={ev => ev.currentTarget.style.background = isRevoked ? '#fff5f5' : '#f9fafb'}
                    onMouseOut={ev => ev.currentTarget.style.background = isRevoked ? '#fffbfb' : 'white'}>

                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600,
                        color: isRevoked ? '#9ca3af' : '#1f2937',
                        textDecoration: isRevoked ? 'line-through' : 'none' }}>
                        {e.email}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', color: '#374151' }}>{e.name || '—'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: e.role === 'admin' ? '#fdf8e8' : '#f3f4f6',
                        color: e.role === 'admin' ? '#92720f' : '#6b7280' }}>
                        {e.role || 'professor'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', color: '#9ca3af' }}>{e.dept || '—'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                        background: isRevoked ? '#fef2f2' : '#e8f5ee',
                        color: isRevoked ? '#dc2626' : '#1a6b42' }}>
                        {isRevoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isRevoked ? (
                          <button onClick={() => restoreEntry(e.email)}
                            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                              border: '1.5px solid #1a6b42', color: '#1a6b42', background: 'transparent',
                              cursor: 'pointer', fontFamily: 'inherit' }}>
                            Restore
                          </button>
                        ) : (
                          <button onClick={() => revokeEntry(e.email)}
                            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                              border: '1.5px solid #f59e0b', color: '#b45309', background: 'transparent',
                              cursor: 'pointer', fontFamily: 'inherit' }}>
                            Revoke
                          </button>
                        )}
                        <button onClick={() => deleteEntry(e.email)}
                          style={{ padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                            border: '1.5px solid #fee2e2', color: '#dc2626', background: 'transparent',
                            cursor: 'pointer', fontFamily: 'inherit' }}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
