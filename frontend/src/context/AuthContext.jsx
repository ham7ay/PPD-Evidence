import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        try {
          const { user } = await api.me();
          setUserData(user);
        } catch {
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refresh = async () => {
    try {
      const { user } = await api.me();
      setUserData(user);
    } catch {}
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user: userData,
        isAdmin: userData?.role === 'admin',
        loading,
        refresh,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
