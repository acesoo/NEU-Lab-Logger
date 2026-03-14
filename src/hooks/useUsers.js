import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleBlock = async (email, currentStatus) => {
    await updateDoc(doc(db, 'users', email), { isBlocked: !currentStatus });
    // No local state update needed — onSnapshot fires automatically
  };

  return { users, loading, toggleBlock };
}
