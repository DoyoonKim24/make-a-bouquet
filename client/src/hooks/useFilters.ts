import { useState, useEffect } from 'react';

interface Filters {
  flowers: string[];
  colors: string[];
  occasions: string[];
}

interface UseFiltersReturn {
  filters: Filters | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<Filters | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/filters');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: Filters = await response.json();
      setFilters(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching filters:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  return { filters, loading, error, refetch: fetchFilters };
}
