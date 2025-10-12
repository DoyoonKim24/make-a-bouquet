import { use, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { Dropdown } from "../components/Dropdown";
import { useFilters } from "../hooks/useFilters";

export default function Home() {
  const { filters, loading, error } = useFilters();
  const flowerOptions = filters ? filters.flowers : [];
  const colorOptions = filters ? filters.colors : [];
  const occasionOptions = filters ? filters.occasions : [];

  const [selectedFilters, setSelectedFilters] = useState<{
    flowers: string[];
    colors: string[];
    occasions: string[];
  }>({
    flowers: [],
    colors: [],
    occasions: []
  });

  const [bouquets, setBouquets] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleCreateBouquet = async () => {
    setSearchLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (selectedFilters.flowers.length > 0) {
        params.append('flowers', selectedFilters.flowers.join(','));
      }
      if (selectedFilters.colors.length > 0) {
        params.append('colors', selectedFilters.colors.join(','));
      }
      if (selectedFilters.occasions.length > 0) {
        params.append('occasions', selectedFilters.occasions.join(','));
      }

      const response = await fetch(`http://localhost:8080/bouquets/search?${params}`);
      const data = await response.json();
      
      setBouquets(data);
      console.log('Found bouquets:', data);
    } catch (error) {
      console.error('Error searching bouquets:', error);
    } finally {
      setSearchLoading(false);
    }
  };


  return (
    <div className="p-16">
      <h1>Make-a-Bouquet</h1>
      <div className="flex gap-4 border border-gray-300 rounded-full">
        <div className="flex w-full">
          <Dropdown
            placeholder="Flower(s)"
            options={flowerOptions}
            rounded="left"
            selected={selectedFilters.flowers}
            setSelected={(value : string | string[]) => setSelectedFilters(prev => ({ 
              ...prev, 
              flowers: Array.isArray(value) ? value : (prev.flowers.includes(value) ? prev.flowers : [...prev.flowers, value])
            }))}
          />
          <hr className="border border-gray-300 h-full" />
          <Dropdown
            placeholder="Colour(s)"
            options={colorOptions}
            selected={selectedFilters.colors}
            setSelected={(value : string | string[]) => setSelectedFilters(prev => ({ 
              ...prev, 
              colors: Array.isArray(value) ? value : (prev.colors.includes(value) ? prev.colors : [...prev.colors, value])
            }))}
          />
          <hr className="border border-gray-300 h-full" />
          <Dropdown
            placeholder="Occasion(s)"
            options={occasionOptions}
            rounded="right"
            selected={selectedFilters.occasions}
            setSelected={(value : string | string[]) => setSelectedFilters(prev => ({ 
              ...prev, 
              occasions: Array.isArray(value) ? value : (prev.occasions.includes(value) ? prev.occasions : [...prev.occasions, value])
            }))}
          />
        </div>
        <button 
          className="bg-blue-500 text-white rounded-full px-4 py-2 whitespace-nowrap flex-shrink-0 hover:bg-blue-600 disabled:opacity-50"
          onClick={handleCreateBouquet}
          disabled={searchLoading}
        >
          {searchLoading ? 'Searching...' : 'Create Bouquet'}
        </button>
      </div>
      
      {/* Display results */}
      {bouquets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Found {bouquets.length} bouquets:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bouquets.map((bouquet: any) => (
              <div key={bouquet._id} className="border rounded-lg p-4">
                {bouquet.imageUrl && (
                  <img src={bouquet.imageUrl} alt="Bouquet" className="w-full h-48 object-cover rounded mb-2" />
                )}
                <p><strong>Flowers:</strong> {bouquet.flowers?.map((f: any) => f.name).join(', ')}</p>
                <p><strong>Colors:</strong> {bouquet.colors?.map((c: any) => c.name).join(', ')}</p>
                <p><strong>Occasion:</strong> {bouquet.occasion}</p>
                {bouquet.aiAnalysis && (
                  <p><strong>Confidence:</strong> {(bouquet.aiAnalysis.confidence * 100).toFixed(1)}%</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
