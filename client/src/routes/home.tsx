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
        <button className="bg-blue-500 text-white rounded-full px-4 py-2 whitespace-nowrap flex-shrink-0">
          Create Bouquet
        </button>
      </div>
    </div>
  );
}
