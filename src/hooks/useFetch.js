import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useFetch = (url, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    params = {},
    autoFetch = true,
    onSuccess = null,
    onError = null,
  } = options;

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(autoFetch);

  const execute = useCallback(
    async (overrideOptions = {}) => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('auth_token');
        const config = {
          method: overrideOptions.method || method,
          url: overrideOptions.url || url,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
            ...(overrideOptions.headers || {}),
          },
          params: { ...params, ...(overrideOptions.params || {}) },
          timeout: 15000,
        };
        if (overrideOptions.body || body) {
          config.data = overrideOptions.body || body;
        }
        const response = await axios(config);
        setData(response.data);
        if (onSuccess) onSuccess(response.data);
        return { success: true, data: response.data };
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          'Error en la solicitud.';
        setError(message);
        if (onError) onError(err);
        return { success: false, error: message, originalError: err };
      } finally {
        setLoading(false);
      }
    },
    [url, method, headers, body, params, onSuccess, onError]
  );

  useEffect(() => {
    if (autoFetch && url) {
      execute();
    }
  }, [url, autoFetch, execute]);

  return { data, error, loading, execute, setData };
};

export default useFetch;
