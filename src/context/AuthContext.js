'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', firebaseUser.email));

        if (!userSnap.exists()) {
          setUser(null);
          setLoading(false);
          return;
        }

        const userData = userSnap.data();

        if (userData.isBlocked || userData.status === 'revoked') {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser({
          uid:   firebaseUser.uid,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL || null,
          ...userData,
        });
      } catch (err) {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
