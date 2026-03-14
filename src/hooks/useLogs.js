'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const fmt     = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
};
const fmtDate = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function useLogs({ emailFilter } = {}) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    if (emailFilter) {
      q = query(collection(db, 'logs'), where('profEmail', '==', emailFilter), orderBy('timestamp', 'desc'));
    }

    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => {
        const data = d.data();
        const ts   = data.timestamp;
        const co   = data.checkedOut;
        return {
          id:          d.id,
          profName:    data.profName  || '',
          profEmail:   data.profEmail || '',
          roomId:      data.roomId    || '',
          status:      data.status    || 'active',
          date:        fmtDate(ts),
          startTime:   fmt(ts),
          checkedOut:  co ? fmt(co) : null,
          rawTimestamp: ts,
        };
      }));
      setLoading(false);
    });

    return unsub;
  }, [emailFilter]);

  return { logs, loading };
}
