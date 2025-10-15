import { use, useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { Dropdown } from "../components/Dropdown";
import { useFilters } from "../hooks/useFilters";
import flower1 from '../../public/images/flower1.png';
import flower2 from '../../public/images/flower2.png';
import flower3 from '../../public/images/flower3.png';
import flower4 from '../../public/images/flower4.png';

export default function Home() {
  const { filters } = useFilters();
  
  // Transform flower objects to dropdown options
  const flowerOptions = filters ? filters.flowers : [];
  const colorOptions = filters ? filters.colors : [];
  const occasionOptions = filters ? filters.occasions : [];
  const seasonOptions = ["Spring", "Summer", "Fall", "Winter"];

  const [selectedFilters, setSelectedFilters] = useState<{
    flowers: string[];
    colors: string[];
    occasions: string[];
    seasons: string[];
  }>({
    flowers: [],
    colors: [],
    occasions: [],
    seasons: []
  });

  const [bouquets, setBouquets] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [focusedBouquet, setFocusedBouquet] = useState(null);

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
      if (selectedFilters.seasons.length > 0) {
        params.append('seasons', selectedFilters.seasons.join(','));
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

  const handleBouquetClick = (bouquet: any) => {
    setFocusedBouquet(bouquet);
  }


  return (
    <div className="w-full h-screen flex flex-col justify-start items-center pt-40">
      <div className="max-w-[1056px] flex flex-col justify-center z-10 gap-2">
        <h1> Make-a-Bouquet </h1>
        <p className="text-lg text-cocoa mb-14"> Create your own custom bouquet by selecting your favorite flowers, colors, occasions, and seasons. </p>
        <div className="flex border border-wine border-2 rounded-full bg-white">
          <div className="flex flex-1 min-w-0 items-center">
            <div className="flex-1 min-w-0">
              <Dropdown
                placeholder="All Flowers"
                options={flowerOptions}
                rounded="left"
                imageUsed={true}
                selected={selectedFilters.flowers}
                setSelected={(value : string | string[]) => setSelectedFilters(prev => ({ 
                  ...prev, 
                  flowers: Array.isArray(value) ? value : (prev.flowers.includes(value) ? prev.flowers : [...prev.flowers, value])
                }))}
              />
            </div>
            <hr className="border border-cocoa h-6" />
            <div className="flex-1 min-w-0">
              <Dropdown
                placeholder="All Colours"
                options={colorOptions}
                selected={selectedFilters.colors}
                setSelected={(value : string | string[]) => setSelectedFilters(prev => ({ 
                  ...prev, 
                  colors: Array.isArray(value) ? value : (prev.colors.includes(value) ? prev.colors : [...prev.colors, value])
                }))}
              />
            </div>
            <hr className="border border-cocoa h-6" />
            <div className="flex-1 min-w-0">
              <Dropdown
                placeholder="All Occasions"
                options={occasionOptions}
                selected={selectedFilters.occasions}
                setSelected={(value : string | string[]) => setSelectedFilters(prev => ({ 
                  ...prev, 
                  occasions: Array.isArray(value) ? value : (prev.occasions.includes(value) ? prev.occasions : [...prev.occasions, value])
                }))}
              />
            </div>
            <hr className="border border-cocoa h-6" />
            <div className="flex-1 min-w-0">
              <Dropdown
                placeholder="All Seasons"
                options={seasonOptions}
                selected={selectedFilters.seasons}
                setSelected={(value : string | string[]) => setSelectedFilters(prev => ({ 
                  ...prev, 
                  seasons: Array.isArray(value) ? value : (prev.seasons.includes(value) ? prev.seasons : [...prev.seasons, value])
                }))}
              />
            </div>
          </div>
          <button 
            className="bg-[#AF3838] font-sweet font-semibold text-base text-white border-wine border-2 rounded-full px-6 py-3 m-2 whitespace-nowrap flex-shrink-0 disabled:opacity-50"
            onClick={handleCreateBouquet}
            disabled={searchLoading}
          >
            {searchLoading ? 'Searching...' : 'Create Bouquet'}
          </button>
        </div>
        
        {/* Display results */}
        {bouquets.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            <h2 className="text-xl font-bold">Found {bouquets.length} bouquets:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bouquets.map((bouquet: any) => (
                <div onClick={() => handleBouquetClick(bouquet)} key={bouquet._id} className="border rounded-lg p-4">
                  {(bouquet.thumbnailUrl || bouquet.imageUrl) && (
                    <img 
                      src={bouquet.thumbnailUrl || bouquet.imageUrl} 
                      alt="Bouquet" 
                      className="aspect-square w-full object-cover rounded mb-2"
                      loading="lazy"
                    />
                  )}
                  <p><strong>Flowers:</strong> {bouquet.flowers?.map((f: any) => f.name).join(', ')}</p>
                  <p><strong>Colors:</strong> {bouquet.colors?.map((c: any) => c.name).join(', ')}</p>
                  <p><strong>Occasion:</strong> {bouquet.occasion?.join(', ')}</p>
                  <p><strong>Seasons:</strong> {bouquet.seasons?.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {focusedBouquet && (
        <>
          <div className="fixed w-[30%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg border rounded-lg p-4 z-20">
            <img 
              src={focusedBouquet.imageUrl} 
              alt="Bouquet" 
              className=" w-full object-cover rounded mb-2"
              loading="lazy"
            />
            <p><strong>Flowers:</strong> {focusedBouquet.flowers?.map((f: any) => f.name).join(', ')}</p>
            <p><strong>Colors:</strong> {focusedBouquet.colors?.map((c: any) => c.name).join(', ')}</p>
            <p><strong>Occasion:</strong> {focusedBouquet.occasion?.join(', ')}</p>
            <p><strong>Seasons:</strong> {focusedBouquet.seasons?.join(', ')}</p>
          </div>
          <div className="w-screen h-screen fixed top-0 left-0 bg-black/20 z-10" onClick={() => setFocusedBouquet(null)} />
        </>
      )}
      <img 
        src={flower1} 
        alt="flower1" 
        className="fixed w-auto h-[70%] left-0 bottom-0" 
      />
      <img 
        src={flower2} 
        alt="flower2" 
        className="fixed w-auto h-[30%] right-1/2 -bottom-8" 
      />
      <img 
        src={flower3} 
        alt="flower3" 
        className="fixed w-auto h-[60%] right-8 bottom-0" 
      />
      <img 
        src={flower4} 
        alt="flower4" 
        className="fixed w-auto h-[20%] right-0 top-1/6" 
      />
    </div>
  );
}
