import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('bb_token') || null);
  const [donorId, setDonorId] = useState(localStorage.getItem('bb_donorId') || null);
  const [loading, setLoading] = useState(true);

  // Hydrate user from token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.setToken(token);
    api.getMe()
      .then(({ user: u, donorId: dId }) => {
        setUser(u);
        setDonorId(dId || null);
      })
      .catch(() => {
        // Token invalid
        setToken(null);
        setUser(null);
        setDonorId(null);
        localStorage.removeItem('bb_token');
        localStorage.removeItem('bb_donorId');
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (phone, password, role) => {
    const result = await api.login(phone, password, role);
    localStorage.setItem('bb_token', result.token);
    if (result.donorId) localStorage.setItem('bb_donorId', result.donorId);
    api.setToken(result.token);
    setUser(result.user);
    setToken(result.token);
    setDonorId(result.donorId || null);
    return result;
  }, []);

  const signupStaff = useCallback(async (data) => {
    const result = await api.signupStaff(data);
    localStorage.setItem('bb_token', result.token);
    api.setToken(result.token);
    setUser(result.user);
    setToken(result.token);
    return result;
  }, []);

  const signupDonor = useCallback(async (data) => {
    const result = await api.signupDonor(data);
    localStorage.setItem('bb_token', result.token);
    if (result.donor?._id) localStorage.setItem('bb_donorId', result.donor._id);
    api.setToken(result.token);
    setUser(result.user);
    setToken(result.token);
    setDonorId(result.donor?._id || null);
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bb_token');
    localStorage.removeItem('bb_donorId');
    api.setToken(null);
    setUser(null);
    setToken(null);
    setDonorId(null);
  }, []);

  const isVerifiedStaff = user?.role === 'staff' && user?.verificationStatus === 'verified';
  const isPendingStaff = user?.role === 'staff' && user?.verificationStatus === 'pending';
  const isDonor = user?.role === 'donor';

  return (
    <AuthContext.Provider value={{
      user, token, donorId, loading,
      login, logout, signupStaff, signupDonor,
      isVerifiedStaff, isPendingStaff, isDonor,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
