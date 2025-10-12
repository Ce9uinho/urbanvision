import { useState, useEffect, useCallback } from 'react';
import { debounce } from '../utils/debounce.ts';
import type { AddressSuggestion } from '../types.ts';

const PROXY_URL = 'https://corsproxy.io/?';
const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search?format=json&countrycodes=pt&q=';

export default function useAddressSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 3) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const fullUrl = `${PROXY_URL}${encodeURIComponent(NOMINATIM_API_URL + searchQuery)}`;
        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch address suggestions.');
        }
        const data: AddressSuggestion[] = await response.json();
        
        // Filter out duplicate suggestions
        const seen = new Set();
        const uniqueSuggestions = data.filter(item => {
            const duplicate = seen.has(item.display_name);
            seen.add(item.display_name);
            return !duplicate;
        });

        setSuggestions(uniqueSuggestions);
      } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  return { suggestions, loading, error };
}