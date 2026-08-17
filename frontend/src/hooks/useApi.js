import { useState, useCallback } from 'react';
import api from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (apiFunc, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFunc(...args);
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      setError(err.message || 'An unexpected error occurred');
      throw err;
    }
  }, []);

  return { loading, error, request, api };
};

export default useApi;
