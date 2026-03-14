import {
  collection, addDoc, doc, getDoc, getDocs,
  updateDoc, query, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Check in to a room — enforces room lock and block check
export async function logRoomEntry({ profName, profEmail, roomId }) {
  // 1. Check professor is not blocked
  const userSnap = await getDoc(doc(db, 'users', profEmail));
  if (!userSnap.exists()) throw new Error('User account not found. Contact the administrator.');
  if (userSnap.data().isBlocked) throw new Error('Your account has been blocked. Please contact the ICT Administrator.');

  // 2. Check room is not already in use
  const activeQ  = query(
    collection(db, 'logs'),
    where('roomId', '==', roomId),
    where('status', '==', 'active')
  );
  const activeSnap = await getDocs(activeQ);
  if (!activeSnap.empty) {
    const occupant = activeSnap.docs[0].data();
    throw new Error(`Room ${roomId} is currently occupied by ${occupant.profName}. Please wait for them to check out.`);
  }

  // 3. Write log — no endTime
  const now    = new Date();
  const docRef = await addDoc(collection(db, 'logs'), {
    profName,
    profEmail,
    roomId,
    timestamp: serverTimestamp(),
    status:    'active',
  });

  return { id: docRef.id, profName, profEmail, roomId, startTime: now, status: 'active' };
}

// Check out — can be called by professor (own session) or admin (any session)
export async function checkOutRoom(logId) {
  await updateDoc(doc(db, 'logs', logId), {
    status:     'checked-out',
    checkedOut: serverTimestamp(),
  });
}
