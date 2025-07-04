import { useState, useEffect } from 'react';
import type { User } from '../types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate auth check
    const checkAuth = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would check for stored auth tokens
        // and validate them with the backend

        // For now, simulate no user logged in
        setUser(null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication error');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    user,
    loading,
    error,
  };
};

export default useAuth;
