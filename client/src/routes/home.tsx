import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { Dropdown } from "../components/Dropdown";
import { useFilters } from "../hooks/useFilters";
import flower1 from '../images/flower1.png';
import flower2 from '../images/flower2.png';
import flower3 from '../images/flower3.png';
import flower4 from '../images/flower4.png';

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

  const [bouquets, setBouquets] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [focusedBouquet, setFocusedBouquet] = useState<any | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleCreateBouquet = async () => {
    setSearchLoading(true);
    setHasSearched(true);
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

      const API_BASE_URL = "https://make-a-bouquet.onrender.com";
      const response = await fetch(`${API_BASE_URL}/bouquets/search?${params}`);
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

  const handleNextBouquet = () => {
    if (!focusedBouquet || bouquets.length === 0) return;
    
    setImageLoading(true);
    const currentIndex = bouquets.findIndex((bouquet: any) => bouquet._id === focusedBouquet._id);
    const nextIndex = (currentIndex + 1) % bouquets.length; // Loop back to first if at end
    setFocusedBouquet(bouquets[nextIndex]);
  }

  const handlePrevBouquet = () => {
    if (!focusedBouquet || bouquets.length === 0) return;
    
    setImageLoading(true);
    const currentIndex = bouquets.findIndex((bouquet: any) => bouquet._id === focusedBouquet._id);
    const prevIndex = currentIndex === 0 ? bouquets.length - 1 : currentIndex - 1; // Loop to last if at beginning
    setFocusedBouquet(bouquets[prevIndex]);
  }


  return (
    <div className="w-full h-screen flex flex-col justify-start items-center pt-40 px-4 sm:px-8 lg:px-16">
      <div className="max-w-[1056px] w-full flex flex-col justify-center z-10 gap-2">
        <h1> Make-a-Bouquet </h1>
        <p className="text-lg text-cocoa mb-14"> Create your own custom bouquet by selecting your favorite flowers, colors, occasions, and seasons. </p>
        
        {/* Desktop search bar */}
        <div className="hidden md:flex border border-wine border-2 rounded-full bg-white w-full min-w-0">
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

        {/* Mobile search bar */}
        <div className="md:hidden border border-wine border-2 rounded-lg bg-white w-full min-w-0 p-4 flex flex-col gap-4">
          <div className="flex flex-col flex-1 sm:grid sm:grid-cols-2 gap-2 min-w-0 w-full items-center">
            <div className="flex-1 min-w-0 border-gray-300 border-1 rounded-lg w-full">
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
            <div className="flex-1 min-w-0 border-gray-300 border-1 rounded-lg w-full">
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
            <div className="flex-1 min-w-0 border-gray-300 border-1 rounded-lg w-full">
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
            <div className="flex-1 min-w-0 border-gray-300 border-1 rounded-lg w-full">
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
            className="bg-[#AF3838] font-sweet font-semibold text-base text-white border-wine border-2 rounded-full px-6 py-3 w-full whitespace-nowrap flex-shrink-0 disabled:opacity-50"
            onClick={handleCreateBouquet}
            disabled={searchLoading}
          >
            {searchLoading ? 'Searching...' : 'Create Bouquet'}
          </button>
        </div>
        
        {/* No results found message */}
        {hasSearched && bouquets.length === 0 && !searchLoading && (
          <div className="mt-8 flex flex-col items-center text-center p-8 rounded-lg">
            <h3 className="text-lg font-semibold text-wine mb-2">No results found</h3>
            <p className="text-wine mb-4">
              We couldn't find any bouquets matching your current filters.
            </p>
            <p className="text-sm text-wine">
              Try using less strict filters to see more options.
            </p>
          </div>
        )}
        
        {/* Display results */}
        {bouquets.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Found {bouquets.length} bouquets:</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {bouquets.map((bouquet: any) => (
                <div onClick={() => handleBouquetClick(bouquet)} key={bouquet._id} 
                  className="border-wine border-1 rounded-lg p-2 md:p-4 bg-[#FFFDFD] hover:bg-[#FFEDED] cursor-pointer transition"
                >
                  {(bouquet.thumbnailUrl || bouquet.imageUrl) && (
                    <img 
                      src={bouquet.thumbnailUrl || bouquet.imageUrl} 
                      alt="Bouquet" 
                      className="aspect-square w-full object-cover rounded mb-2"
                      loading="lazy"
                    />
                  )}
                  <p><strong>Flowers:</strong> {bouquet.flowers?.map((f: any) => f.name).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {focusedBouquet && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-20" 
            onClick={() => setFocusedBouquet(null)}
          />
          <div className="fixed inset-0 flex flex-col sm:flex-row justify-center items-center gap-4 z-30 pointer-events-none">
            <div 
              className="hidden sm:flex cursor-pointer bg-white hover:bg-gray-100 p-2 rounded-full w-14 h-14 items-center justify-center border-2 border-wine text-wine pointer-events-auto" 
              onClick={handlePrevBouquet}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </div>
            <div className="w-[80%] sm:w-[50%] lg:w-[35%] flex flex-col bg-white shadow-lg border-2 border-wine rounded-lg p-4 pointer-events-auto">
              <div className="relative w-full h-full mb-2" >
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-300 animate-pulse rounded flex items-center justify-center">
                    <div className="text-gray-500 text-sm">Loading...</div>
                  </div>
                )}
                <img 
                  src={focusedBouquet.imageUrl} 
                  alt="Bouquet" 
                  className={`w-full max-h-[70vh] object-cover rounded ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                  style={{ aspectRatio: 'clamp(3/8, auto, 8/3)' }}
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                  loading="lazy"
                />
              </div>
              <p><strong>Flowers:</strong> {focusedBouquet.flowers?.map((f: any) => f.name).join(', ')}</p>
              <p><strong>Colors:</strong> {focusedBouquet.colors?.map((c: any) => c.name).join(', ')}</p>
              <p><strong>Occasion:</strong> {focusedBouquet.occasion?.join(', ')}</p>
              <p><strong>Seasons:</strong> {focusedBouquet.seasons?.join(', ')}</p>
            </div>
            <div 
              className="hidden sm:flex cursor-pointer bg-white hover:bg-gray-100 p-2 rounded-full w-14 h-14 flex items-center justify-center border-2 border-wine text-wine pointer-events-auto" 
              onClick={handleNextBouquet}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </div>
            <div className="flex sm:hidden gap-8">
              <div 
                className="flex cursor-pointer bg-white hover:bg-gray-100 p-2 rounded-full w-14 h-14 flex items-center justify-center border-2 border-wine text-wine pointer-events-auto" 
                onClick={handleNextBouquet}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </div>
              <div 
                className="flex cursor-pointer bg-white hover:bg-gray-100 p-2 rounded-full w-14 h-14 flex items-center justify-center border-2 border-wine text-wine pointer-events-auto" 
                onClick={handleNextBouquet}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </div>
          </div>
        </>
      )}
      <img 
        src={flower1} 
        alt="flower1" 
        className="fixed w-auto h-[70%] left-0 bottom-0 pointer-events-none select-none" 
      />
      <img 
        src={flower2} 
        alt="flower2" 
        className="fixed w-auto h-[30%] right-1/2 -bottom-8 pointer-events-none select-none" 
      />
      <img 
        src={flower3} 
        alt="flower3" 
        className="fixed w-auto h-[60%] right-8 bottom-0 pointer-events-none select-none" 
      />
      <img 
        src={flower4} 
        alt="flower4" 
        className="fixed w-auto h-[20%] right-0 top-1/6 pointer-events-none select-none" 
      />
    </div>
  );
}
