import { useState, useCallback } from 'react';
import { ApiResponse, API_BASE_URL } from '@/types/api';

// Generic API hook for Flask/Django integration
export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      setData(result.data);
      return { data: result.data, success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return { data: null as T, success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((endpoint: string) => 
    request(endpoint, { method: 'GET' }), [request]);

  const post = useCallback((endpoint: string, body: unknown) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) }), [request]);

  const put = useCallback((endpoint: string, body: unknown) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) }), [request]);

  const del = useCallback((endpoint: string) =>
    request(endpoint, { method: 'DELETE' }), [request]);

  return { data, loading, error, get, post, put, del, setData };
}
