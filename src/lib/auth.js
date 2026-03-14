import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, provider } from './firebase';

const ALLOWED_DOMAIN = '@neu.edu.ph';

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const { email, displayName, photoURL } = result.user;

  // 1. Enforce NEU domain
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    await signOut(auth);
    throw new Error(`Access denied. Only @neu.edu.ph accounts are accepted.`);
  }

  // 2. Check users collection — must exist AND have status: active
  let userSnap;
  try {
    userSnap = await getDoc(doc(db, 'users', email));
  } catch (err) {
    await signOut(auth);
    throw new Error(`Could not verify your account. Check your internet connection and try again.`);
  }

  if (!userSnap.exists()) {
    await signOut(auth);
    throw new Error(`Access denied. Your account (${email}) is not registered in the system. Please contact your ICT administrator to request access.`);
  }

  const userData = userSnap.data();

  if (userData.status === 'revoked') {
    await signOut(auth);
    throw new Error(`Access denied. Your account access has been revoked. Please contact your ICT administrator.`);
  }

  if (userData.isBlocked) {
    await signOut(auth);
    throw new Error(`Your account has been blocked. Please contact your ICT administrator.`);
  }

  return {
    email,
    name:      displayName || userData.name,
    role:      userData.role      || 'professor',
    isBlocked: userData.isBlocked || false,
    dept:      userData.dept      || '',
    photo:     photoURL || null,
  };
}

export async function logOut() {
  await signOut(auth);
}
