import { useState, useEffect } from 'react';

export function useFilters() {
  const [filters, setFilters] = useState({
    flowers: [],
    colors: [],
    occasions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/filters');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setFilters(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching filters:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  return { filters, loading, error, refetch: () => fetchFilters() };
}
