
import { useState, useEffect, useCallback } from 'react';
import { debounce } from '../utils/debounce.ts';
import type { AddressSuggestion } from '../types.ts';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search?format=json&q=';

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
        const response = await fetch(`${NOMINATIM_API}${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch address suggestions.');
        }
        const data: AddressSuggestion[] = await response.json();
        setSuggestions(data);
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
