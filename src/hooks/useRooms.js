'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

// All lab rooms — extend this list as needed
const ALL_ROOMS = ['M-101','M-102','M-103','M-104','M-105','M-106'];

export function useRooms() {
  const [occupancy, setOccupancy] = useState({}); // { roomId: { logId, profName, profEmail, startTime } | null }
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // Listen to all currently active logs in real-time
    const q = query(collection(db, 'logs'), where('status', '==', 'active'));

    const unsub = onSnapshot(q, snap => {
      const occ = {};
      snap.docs.forEach(d => {
        const data = d.data();
        const ts   = data.timestamp;
        const time = ts
          ? (ts.toDate ? ts.toDate() : new Date(ts))
              .toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
          : '—';
        occ[data.roomId] = { logId: d.id, profName: data.profName, profEmail: data.profEmail, startTime: time };
      });
      setOccupancy(occ);
      setLoading(false);
    });

    return unsub;
  }, []);

  const rooms = ALL_ROOMS.map(id => ({
    id,
    occupied: !!occupancy[id],
    occupant: occupancy[id] || null,
  }));

  return { rooms, loading };
}
